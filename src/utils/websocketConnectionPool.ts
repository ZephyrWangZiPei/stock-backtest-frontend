import { reactive, ref, computed } from 'vue'
import { unifiedWebSocketManager, type WebSocketConfig } from './unifiedWebSocketManager'
import { websocketEventBus } from './websocketEventBus'

export interface ConnectionPoolConfig {
  maxConnections: number
  maxReconnectAttempts: number
  reconnectDelay: number
  healthCheckInterval: number
  priorityNamespaces: string[]
}

export interface NamespaceConfig {
  namespace: string
  priority: number
  required: boolean
  autoReconnect: boolean
  maxRetries: number
  retryDelay: number
  healthCheck: boolean
}

export interface ConnectionMetrics {
  namespace: string
  connected: boolean
  connectTime?: Date
  disconnectTime?: Date
  reconnectCount: number
  errorCount: number
  messageCount: number
  latency: number
  lastPing?: Date
  health: 'healthy' | 'degraded' | 'unhealthy'
}

class WebSocketConnectionPool {
  private config: ConnectionPoolConfig
  private namespaceConfigs = new Map<string, NamespaceConfig>()
  private metrics = reactive<Map<string, ConnectionMetrics>>(new Map())
  private connectionQueue: string[] = []
  private isProcessingQueue = false
  private healthCheckTimer?: NodeJS.Timeout
  private reconnectTimers = new Map<string, NodeJS.Timeout>()
  
  // 状态统计
  private stats = reactive({
    totalConnections: 0,
    activeConnections: 0,
    pendingConnections: 0,
    failedConnections: 0,
    averageLatency: 0,
    healthyConnections: 0
  })

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: 10,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      healthCheckInterval: 30000,
      priorityNamespaces: ['/data_collection', '/backtest', '/ai_analysis'],
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    console.log('🏊‍♂️ Initializing WebSocket Connection Pool...')
    
    // 注册默认命名空间配置
    this.registerDefaultNamespaces()
    
    // 启动健康检查
    this.startHealthCheck()
    
    // 订阅连接事件
    this.subscribeToConnectionEvents()
  }

  // 注册默认命名空间配置
  private registerDefaultNamespaces(): void {
    const defaultNamespaces: NamespaceConfig[] = [
      {
        namespace: '/data_collection',
        priority: 1,
        required: true,
        autoReconnect: true,
        maxRetries: 10,
        retryDelay: 2000,
        healthCheck: true
      },
      {
        namespace: '/backtest',
        priority: 2,
        required: true,
        autoReconnect: true,
        maxRetries: 5,
        retryDelay: 3000,
        healthCheck: true
      },
      {
        namespace: '/ai_analysis',
        priority: 3,
        required: true,
        autoReconnect: true,
        maxRetries: 5,
        retryDelay: 3000,
        healthCheck: true
      },
      {
        namespace: '/scheduler',
        priority: 4,
        required: false,
        autoReconnect: true,
        maxRetries: 3,
        retryDelay: 5000,
        healthCheck: true
      },
      {
        namespace: '/news_analysis',
        priority: 5,
        required: false,
        autoReconnect: true,
        maxRetries: 3,
        retryDelay: 5000,
        healthCheck: false
      }
    ]

    defaultNamespaces.forEach(config => {
      this.namespaceConfigs.set(config.namespace, config)
      this.initializeMetrics(config.namespace)
    })
  }

  // 初始化指标
  private initializeMetrics(namespace: string): void {
    this.metrics.set(namespace, {
      namespace,
      connected: false,
      reconnectCount: 0,
      errorCount: 0,
      messageCount: 0,
      latency: 0,
      health: 'unhealthy'
    })
  }

  // 订阅连接事件
  private subscribeToConnectionEvents(): void {
    websocketEventBus.subscribe({
      id: 'connection_pool_subscriber',
      handler: (event) => {
        const metrics = this.metrics.get(event.namespace)
        if (!metrics) return

        switch (event.event) {
          case 'connect':
            metrics.connected = true
            metrics.connectTime = new Date()
            metrics.health = 'healthy'
            this.updateStats()
            break

          case 'disconnect':
            metrics.connected = false
            metrics.disconnectTime = new Date()
            metrics.health = 'unhealthy'
            this.scheduleReconnect(event.namespace)
            this.updateStats()
            break

          case 'connect_error':
            metrics.errorCount++
            metrics.health = 'unhealthy'
            this.scheduleReconnect(event.namespace)
            this.updateStats()
            break

          case 'reconnect':
            metrics.reconnectCount++
            metrics.connected = true
            metrics.connectTime = new Date()
            metrics.health = 'healthy'
            this.updateStats()
            break

          default:
            if (event.event.includes('progress') || event.event.includes('completed')) {
              metrics.messageCount++
            }
            break
        }
      }
    })
  }

  // 连接到命名空间
  async connectToNamespace(namespace: string, options?: WebSocketConfig['options']): Promise<void> {
    const config = this.namespaceConfigs.get(namespace)
    if (!config) {
      throw new Error(`Namespace ${namespace} not registered`)
    }

    if (this.stats.activeConnections >= this.config.maxConnections) {
      console.warn(`⚠️ Connection pool full, queueing ${namespace}`)
      this.addToQueue(namespace)
      return
    }

    try {
      const startTime = Date.now()
      await unifiedWebSocketManager.connect(namespace, undefined, {
        reconnectionAttempts: config.maxRetries,
        reconnectionDelay: config.retryDelay,
        ...options
      })
      
      // 计算延迟
      const latency = Date.now() - startTime
      const metrics = this.metrics.get(namespace)
      if (metrics) {
        metrics.latency = latency
      }

      console.log(`✅ Connected to ${namespace} (${latency}ms)`)
    } catch (error) {
      console.error(`❌ Failed to connect to ${namespace}:`, error)
      
      const metrics = this.metrics.get(namespace)
      if (metrics) {
        metrics.errorCount++
        metrics.health = 'unhealthy'
      }

      if (config.autoReconnect) {
        this.scheduleReconnect(namespace)
      }

      throw error
    }
  }

  // 批量连接
  async connectAll(): Promise<void> {
    console.log('🚀 Connecting to all registered namespaces...')
    
    // 按优先级排序
    const sortedNamespaces = Array.from(this.namespaceConfigs.values())
      .sort((a, b) => a.priority - b.priority)

    const promises = sortedNamespaces.map(config => 
      this.connectToNamespace(config.namespace).catch(error => {
        console.error(`Failed to connect to ${config.namespace}:`, error)
        return null
      })
    )

    await Promise.allSettled(promises)
    this.processQueue()
  }

  // 智能重连
  private scheduleReconnect(namespace: string): void {
    const config = this.namespaceConfigs.get(namespace)
    if (!config || !config.autoReconnect) return

    const metrics = this.metrics.get(namespace)
    if (!metrics) return

    // 如果已经有重连定时器，清除它
    if (this.reconnectTimers.has(namespace)) {
      clearTimeout(this.reconnectTimers.get(namespace)!)
    }

    // 检查重连次数限制
    if (metrics.reconnectCount >= config.maxRetries) {
      console.error(`❌ Max reconnect attempts reached for ${namespace}`)
      metrics.health = 'unhealthy'
      return
    }

    // 计算重连延迟（指数退避）
    const baseDelay = config.retryDelay
    const backoffMultiplier = Math.min(Math.pow(2, metrics.reconnectCount), 8)
    const delay = baseDelay * backoffMultiplier

    console.log(`🔄 Scheduling reconnect for ${namespace} in ${delay}ms`)

    const timer = setTimeout(async () => {
      try {
        await this.connectToNamespace(namespace)
      } catch (error) {
        console.error(`❌ Reconnect failed for ${namespace}:`, error)
      }
    }, delay)

    this.reconnectTimers.set(namespace, timer)
  }

  // 添加到连接队列
  private addToQueue(namespace: string): void {
    if (!this.connectionQueue.includes(namespace)) {
      this.connectionQueue.push(namespace)
      this.stats.pendingConnections = this.connectionQueue.length
    }
  }

  // 处理连接队列
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.connectionQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.connectionQueue.length > 0 && this.stats.activeConnections < this.config.maxConnections) {
      const namespace = this.connectionQueue.shift()!
      
      try {
        await this.connectToNamespace(namespace)
      } catch (error) {
        console.error(`❌ Failed to connect queued namespace ${namespace}:`, error)
      }
    }

    this.stats.pendingConnections = this.connectionQueue.length
    this.isProcessingQueue = false
  }

  // 启动健康检查
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }

  // 执行健康检查
  private async performHealthCheck(): Promise<void> {
    console.log('🔍 Performing health check...')

    for (const [namespace, config] of this.namespaceConfigs) {
      if (!config.healthCheck) continue

      const metrics = this.metrics.get(namespace)
      if (!metrics) continue

      const isConnected = unifiedWebSocketManager.isConnected(namespace)
      
      if (!isConnected && config.required) {
        console.warn(`⚠️ Required namespace ${namespace} is disconnected`)
        metrics.health = 'unhealthy'
        
        if (config.autoReconnect) {
          this.scheduleReconnect(namespace)
        }
      } else if (isConnected) {
        // 执行ping检查
        try {
          const startTime = Date.now()
          unifiedWebSocketManager.emit(namespace, 'ping', { timestamp: startTime })
          
          // 等待pong响应来计算延迟
          // 这里简化处理，实际应该监听pong事件
          metrics.lastPing = new Date()
        } catch (error) {
          console.error(`❌ Health check failed for ${namespace}:`, error)
          metrics.health = 'degraded'
        }
      }
    }

    this.updateStats()
  }

  // 更新统计信息
  private updateStats(): void {
    const metricsArray = Array.from(this.metrics.values())
    
    this.stats.totalConnections = metricsArray.length
    this.stats.activeConnections = metricsArray.filter(m => m.connected).length
    this.stats.failedConnections = metricsArray.filter(m => m.errorCount > 0).length
    this.stats.healthyConnections = metricsArray.filter(m => m.health === 'healthy').length
    
    const connectedMetrics = metricsArray.filter(m => m.connected && m.latency > 0)
    this.stats.averageLatency = connectedMetrics.length > 0 
      ? connectedMetrics.reduce((sum, m) => sum + m.latency, 0) / connectedMetrics.length 
      : 0
  }

  // 公共API

  // 注册命名空间配置
  registerNamespace(config: NamespaceConfig): void {
    this.namespaceConfigs.set(config.namespace, config)
    this.initializeMetrics(config.namespace)
  }

  // 获取连接指标
  getMetrics(namespace?: string): ConnectionMetrics | ConnectionMetrics[] | null {
    if (namespace) {
      return this.metrics.get(namespace) || null
    }
    return Array.from(this.metrics.values())
  }

  // 获取统计信息
  getStats() {
    return { ...this.stats }
  }

  // 获取健康状态
  getHealthStatus(): Record<string, 'healthy' | 'degraded' | 'unhealthy'> {
    const status: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {}
    
    this.metrics.forEach((metrics, namespace) => {
      status[namespace] = metrics.health
    })
    
    return status
  }

  // 强制重连
  async forceReconnect(namespace: string): Promise<void> {
    console.log(`🔄 Force reconnecting ${namespace}...`)
    
    // 清除现有定时器
    if (this.reconnectTimers.has(namespace)) {
      clearTimeout(this.reconnectTimers.get(namespace)!)
      this.reconnectTimers.delete(namespace)
    }

    // 断开连接
    unifiedWebSocketManager.disconnect(namespace)
    
    // 重置指标
    const metrics = this.metrics.get(namespace)
    if (metrics) {
      metrics.reconnectCount = 0
      metrics.errorCount = 0
    }

    // 立即重连
    await this.connectToNamespace(namespace)
  }

  // 断开连接
  disconnect(namespace: string): void {
    unifiedWebSocketManager.disconnect(namespace)
    
    const metrics = this.metrics.get(namespace)
    if (metrics) {
      metrics.connected = false
      metrics.disconnectTime = new Date()
      metrics.health = 'unhealthy'
    }

    // 清除重连定时器
    if (this.reconnectTimers.has(namespace)) {
      clearTimeout(this.reconnectTimers.get(namespace)!)
      this.reconnectTimers.delete(namespace)
    }

    this.updateStats()
  }

  // 断开所有连接
  disconnectAll(): void {
    console.log('🔌 Disconnecting all connections...')
    
    this.namespaceConfigs.forEach((_, namespace) => {
      this.disconnect(namespace)
    })
    
    this.connectionQueue = []
    this.stats.pendingConnections = 0
  }

  // 销毁连接池
  destroy(): void {
    console.log('🔥 Destroying WebSocket Connection Pool...')
    
    // 清除健康检查定时器
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    // 清除所有重连定时器
    this.reconnectTimers.forEach(timer => clearTimeout(timer))
    this.reconnectTimers.clear()

    // 断开所有连接
    this.disconnectAll()

    // 清除配置和指标
    this.namespaceConfigs.clear()
    this.metrics.clear()
  }
}

// 创建并导出单例实例
export const websocketConnectionPool = new WebSocketConnectionPool()

// 默认导出
export default websocketConnectionPool 