import { ref, reactive } from 'vue'

export interface MessageQueue {
  namespace: string
  messages: QueuedMessage[]
  processing: boolean
  lastProcessed: Date
  batchSize: number
  flushInterval: number
}

export interface QueuedMessage {
  id: string
  event: string
  data: any
  timestamp: Date
  priority: 'low' | 'normal' | 'high' | 'critical'
  retries: number
  maxRetries: number
}

export interface PerformanceMetrics {
  totalMessages: number
  processedMessages: number
  queuedMessages: number
  droppedMessages: number
  averageProcessingTime: number
  peakQueueSize: number
  batchesProcessed: number
  lastFlushTime?: Date
}

export interface OptimizerConfig {
  maxQueueSize: number
  batchSize: number
  flushInterval: number
  maxRetries: number
  priorityWeights: Record<string, number>
  compressionEnabled: boolean
  deduplicationEnabled: boolean
  throttleEnabled: boolean
  throttleRate: number
}

class WebSocketPerformanceOptimizer {
  private queues = reactive<Map<string, MessageQueue>>(new Map())
  private metrics = reactive<PerformanceMetrics>({
    totalMessages: 0,
    processedMessages: 0,
    queuedMessages: 0,
    droppedMessages: 0,
    averageProcessingTime: 0,
    peakQueueSize: 0,
    batchesProcessed: 0
  })
  
  private config: OptimizerConfig
  private processingTimers = new Map<string, NodeJS.Timeout>()
  private processingTimes: number[] = []
  private messageDeduplication = new Map<string, Date>()
  private throttleCounters = new Map<string, { count: number; resetTime: Date }>()

  constructor(config: Partial<OptimizerConfig> = {}) {
    this.config = {
      maxQueueSize: 1000,
      batchSize: 50,
      flushInterval: 100, // ms
      maxRetries: 3,
      priorityWeights: {
        critical: 4,
        high: 3,
        normal: 2,
        low: 1
      },
      compressionEnabled: true,
      deduplicationEnabled: true,
      throttleEnabled: true,
      throttleRate: 100, // messages per second
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    console.log('⚡ Initializing WebSocket Performance Optimizer...')
    
    // 启动清理定时器
    this.startCleanupTimer()
    
    // 启动指标更新定时器
    this.startMetricsUpdater()
  }

  // 添加消息到队列
  enqueue(namespace: string, event: string, data: any, priority: QueuedMessage['priority'] = 'normal'): void {
    this.metrics.totalMessages++

    // 检查限流
    if (this.config.throttleEnabled && this.isThrottled(namespace)) {
      this.metrics.droppedMessages++
      console.warn(`⚠️ Message throttled for ${namespace}`)
      return
    }

    // 检查去重
    if (this.config.deduplicationEnabled && this.isDuplicate(namespace, event, data)) {
      console.debug(`🔄 Duplicate message filtered for ${namespace}/${event}`)
      return
    }

    const message: QueuedMessage = {
      id: this.generateMessageId(),
      event,
      data: this.compressData(data),
      timestamp: new Date(),
      priority,
      retries: 0,
      maxRetries: this.config.maxRetries
    }

    // 获取或创建队列
    let queue = this.queues.get(namespace)
    if (!queue) {
      queue = {
        namespace,
        messages: [],
        processing: false,
        lastProcessed: new Date(),
        batchSize: this.config.batchSize,
        flushInterval: this.config.flushInterval
      }
      this.queues.set(namespace, queue)
    }

    // 检查队列大小限制
    if (queue.messages.length >= this.config.maxQueueSize) {
      // 移除最旧的低优先级消息
      this.evictLowPriorityMessages(queue)
      
      if (queue.messages.length >= this.config.maxQueueSize) {
        this.metrics.droppedMessages++
        console.warn(`⚠️ Queue full for ${namespace}, dropping message`)
        return
      }
    }

    // 添加消息到队列
    this.insertMessageByPriority(queue, message)
    this.metrics.queuedMessages++

    // 更新峰值队列大小
    if (queue.messages.length > this.metrics.peakQueueSize) {
      this.metrics.peakQueueSize = queue.messages.length
    }

    // 触发处理
    this.scheduleProcessing(namespace)
  }

  // 按优先级插入消息
  private insertMessageByPriority(queue: MessageQueue, message: QueuedMessage): void {
    const weight = this.config.priorityWeights[message.priority] || 1
    
    // 找到合适的插入位置
    let insertIndex = queue.messages.length
    for (let i = 0; i < queue.messages.length; i++) {
      const existingWeight = this.config.priorityWeights[queue.messages[i].priority] || 1
      if (weight > existingWeight) {
        insertIndex = i
        break
      }
    }
    
    queue.messages.splice(insertIndex, 0, message)
  }

  // 移除低优先级消息
  private evictLowPriorityMessages(queue: MessageQueue): void {
    const lowPriorityMessages = queue.messages.filter(m => m.priority === 'low')
    if (lowPriorityMessages.length > 0) {
      // 移除最旧的低优先级消息
      const toRemove = lowPriorityMessages.slice(0, Math.ceil(lowPriorityMessages.length / 2))
      toRemove.forEach(message => {
        const index = queue.messages.indexOf(message)
        if (index > -1) {
          queue.messages.splice(index, 1)
          this.metrics.droppedMessages++
        }
      })
    }
  }

  // 调度处理
  private scheduleProcessing(namespace: string): void {
    const queue = this.queues.get(namespace)
    if (!queue || queue.processing) return

    // 清除现有定时器
    if (this.processingTimers.has(namespace)) {
      clearTimeout(this.processingTimers.get(namespace)!)
    }

    // 设置新的处理定时器
    const timer = setTimeout(() => {
      this.processQueue(namespace)
    }, queue.flushInterval)

    this.processingTimers.set(namespace, timer)
  }

  // 处理队列
  private async processQueue(namespace: string): Promise<void> {
    const queue = this.queues.get(namespace)
    if (!queue || queue.processing || queue.messages.length === 0) {
      return
    }

    queue.processing = true
    const startTime = Date.now()

    try {
      // 获取批量消息
      const batchSize = Math.min(queue.batchSize, queue.messages.length)
      const batch = queue.messages.splice(0, batchSize)

      // 处理批量消息
      await this.processBatch(namespace, batch)

      // 更新指标
      this.metrics.processedMessages += batch.length
      this.metrics.queuedMessages -= batch.length
      this.metrics.batchesProcessed++
      
      // 记录处理时间
      const processingTime = Date.now() - startTime
      this.processingTimes.push(processingTime)
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-50)
      }
      
      // 更新平均处理时间
      this.metrics.averageProcessingTime = 
        this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length

      queue.lastProcessed = new Date()
      this.metrics.lastFlushTime = new Date()

      console.debug(`✅ Processed ${batch.length} messages for ${namespace} in ${processingTime}ms`)

    } catch (error) {
      console.error(`❌ Error processing queue for ${namespace}:`, error)
    } finally {
      queue.processing = false
      
      // 如果还有消息，继续处理
      if (queue.messages.length > 0) {
        this.scheduleProcessing(namespace)
      }
    }
  }

  // 处理批量消息
  private async processBatch(namespace: string, messages: QueuedMessage[]): Promise<void> {
    // 按事件类型分组
    const groupedMessages = this.groupMessagesByEvent(messages)

    // 并行处理不同事件类型
    const promises = Object.entries(groupedMessages).map(([event, eventMessages]) =>
      this.processEventBatch(namespace, event, eventMessages)
    )

    await Promise.allSettled(promises)
  }

  // 按事件类型分组消息
  private groupMessagesByEvent(messages: QueuedMessage[]): Record<string, QueuedMessage[]> {
    return messages.reduce((groups, message) => {
      if (!groups[message.event]) {
        groups[message.event] = []
      }
      groups[message.event].push(message)
      return groups
    }, {} as Record<string, QueuedMessage[]>)
  }

  // 处理事件批次
  private async processEventBatch(namespace: string, event: string, messages: QueuedMessage[]): Promise<void> {
    try {
      // 这里应该调用实际的事件处理器
      // 例如：websocketEventBus.emit() 或其他处理逻辑
      
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
      
      console.debug(`📦 Processed batch of ${messages.length} ${event} events for ${namespace}`)
    } catch (error) {
      console.error(`❌ Error processing event batch ${namespace}/${event}:`, error)
      
      // 重试失败的消息
      this.retryFailedMessages(namespace, messages)
    }
  }

  // 重试失败的消息
  private retryFailedMessages(namespace: string, messages: QueuedMessage[]): void {
    const queue = this.queues.get(namespace)
    if (!queue) return

    messages.forEach(message => {
      if (message.retries < message.maxRetries) {
        message.retries++
        this.insertMessageByPriority(queue, message)
        console.debug(`🔄 Retrying message ${message.id} (attempt ${message.retries})`)
      } else {
        this.metrics.droppedMessages++
        console.warn(`❌ Max retries exceeded for message ${message.id}`)
      }
    })

    // 重新调度处理
    if (queue.messages.length > 0) {
      this.scheduleProcessing(namespace)
    }
  }

  // 检查限流
  private isThrottled(namespace: string): boolean {
    if (!this.config.throttleEnabled) return false

    const now = new Date()
    let counter = this.throttleCounters.get(namespace)
    
    if (!counter || now.getTime() - counter.resetTime.getTime() > 1000) {
      // 重置计数器
      counter = { count: 0, resetTime: now }
      this.throttleCounters.set(namespace, counter)
    }

    counter.count++
    return counter.count > this.config.throttleRate
  }

  // 检查重复消息
  private isDuplicate(namespace: string, event: string, data: any): boolean {
    if (!this.config.deduplicationEnabled) return false

    const key = this.generateDeduplicationKey(namespace, event, data)
    const lastSeen = this.messageDeduplication.get(key)
    const now = new Date()

    if (lastSeen && now.getTime() - lastSeen.getTime() < 1000) {
      return true
    }

    this.messageDeduplication.set(key, now)
    return false
  }

  // 生成去重键
  private generateDeduplicationKey(namespace: string, event: string, data: any): string {
    const dataHash = this.simpleHash(JSON.stringify(data))
    return `${namespace}:${event}:${dataHash}`
  }

  // 简单哈希函数
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(36)
  }

  // 压缩数据
  private compressData(data: any): any {
    if (!this.config.compressionEnabled) return data

    // 简单的数据压缩：移除undefined值，压缩长字符串等
    if (typeof data === 'object' && data !== null) {
      const compressed: any = {}
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          compressed[key] = typeof value === 'string' && value.length > 100 
            ? value.substring(0, 100) + '...' 
            : value
        }
      })
      return compressed
    }

    return data
  }

  // 生成消息ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup()
    }, 60000) // 每分钟清理一次
  }

  // 清理过期数据
  private cleanup(): void {
    const now = new Date()
    const maxAge = 5 * 60 * 1000 // 5分钟

    // 清理去重缓存
    this.messageDeduplication.forEach((timestamp, key) => {
      if (now.getTime() - timestamp.getTime() > maxAge) {
        this.messageDeduplication.delete(key)
      }
    })

    // 清理限流计数器
    this.throttleCounters.forEach((counter, namespace) => {
      if (now.getTime() - counter.resetTime.getTime() > maxAge) {
        this.throttleCounters.delete(namespace)
      }
    })

    console.debug('🧹 Performed cleanup of expired data')
  }

  // 启动指标更新定时器
  private startMetricsUpdater(): void {
    setInterval(() => {
      this.updateQueuedMessages()
    }, 5000) // 每5秒更新一次
  }

  // 更新队列消息计数
  private updateQueuedMessages(): void {
    let totalQueued = 0
    this.queues.forEach(queue => {
      totalQueued += queue.messages.length
    })
    this.metrics.queuedMessages = totalQueued
  }

  // 公共API

  // 强制刷新队列
  async flush(namespace?: string): Promise<void> {
    if (namespace) {
      await this.processQueue(namespace)
    } else {
      const promises = Array.from(this.queues.keys()).map(ns => this.processQueue(ns))
      await Promise.allSettled(promises)
    }
  }

  // 获取队列状态
  getQueueStatus(namespace?: string): MessageQueue | MessageQueue[] | null {
    if (namespace) {
      return this.queues.get(namespace) || null
    }
    return Array.from(this.queues.values())
  }

  // 获取性能指标
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // 清空队列
  clearQueue(namespace: string): void {
    const queue = this.queues.get(namespace)
    if (queue) {
      this.metrics.droppedMessages += queue.messages.length
      queue.messages = []
      this.metrics.queuedMessages = 0
    }
  }

  // 清空所有队列
  clearAllQueues(): void {
    this.queues.forEach((queue, namespace) => {
      this.clearQueue(namespace)
    })
  }

  // 更新配置
  updateConfig(newConfig: Partial<OptimizerConfig>): void {
    Object.assign(this.config, newConfig)
    console.log('⚙️ Updated optimizer configuration')
  }

  // 获取配置
  getConfig(): OptimizerConfig {
    return { ...this.config }
  }

  // 重置指标
  resetMetrics(): void {
    Object.assign(this.metrics, {
      totalMessages: 0,
      processedMessages: 0,
      queuedMessages: 0,
      droppedMessages: 0,
      averageProcessingTime: 0,
      peakQueueSize: 0,
      batchesProcessed: 0,
      lastFlushTime: undefined
    })
    this.processingTimes = []
  }

  // 销毁优化器
  destroy(): void {
    console.log('🔥 Destroying WebSocket Performance Optimizer...')
    
    // 清除所有定时器
    this.processingTimers.forEach(timer => clearTimeout(timer))
    this.processingTimers.clear()
    
    // 清除所有队列
    this.clearAllQueues()
    this.queues.clear()
    
    // 清除缓存
    this.messageDeduplication.clear()
    this.throttleCounters.clear()
  }
}

// 创建并导出单例实例
export const websocketPerformanceOptimizer = new WebSocketPerformanceOptimizer()

// 默认导出
export default websocketPerformanceOptimizer 