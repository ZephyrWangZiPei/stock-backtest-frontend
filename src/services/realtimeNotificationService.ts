import { ref, reactive } from 'vue'
import { ElNotification, ElMessage } from 'element-plus'
import { websocketEventBus, type WebSocketEvent } from '@/utils/websocketEventBus'

export interface NotificationRule {
  id: string
  name: string
  enabled: boolean
  conditions: {
    namespace?: string
    event?: string
    eventPattern?: RegExp
    dataFilter?: (data: any) => boolean
  }
  actions: {
    showNotification?: boolean
    showMessage?: boolean
    playSound?: boolean
    sendEmail?: boolean
    webhook?: string
  }
  settings: {
    priority: 'low' | 'normal' | 'high' | 'critical'
    duration?: number
    sound?: string
    template?: string
  }
}

export interface NotificationHistory {
  id: string
  ruleId: string
  event: WebSocketEvent
  timestamp: Date
  acknowledged: boolean
  dismissed: boolean
}

export interface NotificationStats {
  totalNotifications: number
  unacknowledged: number
  byPriority: Record<string, number>
  byRule: Record<string, number>
  lastNotification?: Date
}

class RealtimeNotificationService {
  private rules = reactive<Map<string, NotificationRule>>(new Map())
  private history = ref<NotificationHistory[]>([])
  private stats = reactive<NotificationStats>({
    totalNotifications: 0,
    unacknowledged: 0,
    byPriority: { low: 0, normal: 0, high: 0, critical: 0 },
    byRule: {},
    lastNotification: undefined
  })

  private subscriptions: (() => void)[] = []
  private soundEnabled = ref(true)
  private notificationsEnabled = ref(true)
  private maxHistorySize = 1000

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    console.log('🔔 Initializing RealtimeNotificationService...')
    
    // 注册默认规则
    this.registerDefaultRules()
    
    // 订阅WebSocket事件
    this.subscribeToEvents()
    
    // 加载用户设置
    this.loadSettings()
  }

  // 注册默认通知规则
  private registerDefaultRules(): void {
    const defaultRules: NotificationRule[] = [
      {
        id: 'task_completed',
        name: '任务完成通知',
        enabled: true,
        conditions: {
          eventPattern: /_(completed|success)$/
        },
        actions: {
          showNotification: true,
          showMessage: false,
          playSound: true
        },
        settings: {
          priority: 'normal',
          duration: 4000,
          sound: 'success',
          template: '任务 "{taskName}" 已成功完成'
        }
      },
      {
        id: 'task_failed',
        name: '任务失败告警',
        enabled: true,
        conditions: {
          eventPattern: /_(failed|error)$/
        },
        actions: {
          showNotification: true,
          showMessage: true,
          playSound: true
        },
        settings: {
          priority: 'high',
          duration: 0, // 不自动关闭
          sound: 'error',
          template: '任务 "{taskName}" 执行失败: {error}'
        }
      },
      {
        id: 'connection_lost',
        name: '连接断开告警',
        enabled: true,
        conditions: {
          event: 'disconnect'
        },
        actions: {
          showNotification: true,
          showMessage: false,
          playSound: true
        },
        settings: {
          priority: 'critical',
          duration: 0,
          sound: 'warning',
          template: '{namespace} 连接已断开'
        }
      },
      {
        id: 'backtest_completed',
        name: '回测完成通知',
        enabled: true,
        conditions: {
          namespace: '/backtest',
          event: 'backtest_completed'
        },
        actions: {
          showNotification: true,
          showMessage: true,
          playSound: true
        },
        settings: {
          priority: 'high',
          duration: 6000,
          sound: 'success',
          template: '回测任务已完成，总收益率: {totalReturn}%'
        }
      },
      {
        id: 'ai_analysis_completed',
        name: 'AI分析完成通知',
        enabled: true,
        conditions: {
          namespace: '/ai_analysis',
          event: 'analysis_completed'
        },
        actions: {
          showNotification: true,
          showMessage: false,
          playSound: true
        },
        settings: {
          priority: 'normal',
          duration: 4000,
          sound: 'info',
          template: 'AI分析已完成，分析了 {stockCount} 只股票'
        }
      },
      {
        id: 'data_collection_progress',
        name: '数据采集进度通知',
        enabled: false, // 默认关闭，避免过多通知
        conditions: {
          namespace: '/data_collection',
          event: 'collection_progress',
          dataFilter: (data) => data.progress && data.progress % 25 === 0 // 每25%进度通知一次
        },
        actions: {
          showMessage: true,
          playSound: false
        },
        settings: {
          priority: 'low',
          duration: 2000,
          template: '数据采集进度: {progress}%'
        }
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
      this.stats.byRule[rule.id] = 0
    })
  }

  // 订阅WebSocket事件
  private subscribeToEvents(): void {
    this.subscriptions.push(
      websocketEventBus.subscribe({
        id: 'notification_service_subscriber',
        handler: (event) => this.processEvent(event)
      })
    )
  }

  // 处理WebSocket事件
  private processEvent(event: WebSocketEvent): void {
    if (!this.notificationsEnabled.value) return

    // 检查每个规则
    this.rules.forEach(rule => {
      if (!rule.enabled) return

      if (this.matchesRule(event, rule)) {
        this.triggerNotification(event, rule)
      }
    })
  }

  // 检查事件是否匹配规则
  private matchesRule(event: WebSocketEvent, rule: NotificationRule): boolean {
    const { conditions } = rule

    // 检查命名空间
    if (conditions.namespace && event.namespace !== conditions.namespace) {
      return false
    }

    // 检查具体事件
    if (conditions.event && event.event !== conditions.event) {
      return false
    }

    // 检查事件模式
    if (conditions.eventPattern && !conditions.eventPattern.test(event.event)) {
      return false
    }

    // 检查数据过滤器
    if (conditions.dataFilter && !conditions.dataFilter(event.data)) {
      return false
    }

    return true
  }

  // 触发通知
  private triggerNotification(event: WebSocketEvent, rule: NotificationRule): void {
    const { actions, settings } = rule

    // 生成通知内容
    const content = this.generateNotificationContent(event, rule)
    
    // 显示通知
    if (actions.showNotification) {
      this.showNotification(content, settings)
    }

    // 显示消息
    if (actions.showMessage) {
      this.showMessage(content, settings)
    }

    // 播放声音
    if (actions.playSound && this.soundEnabled.value) {
      this.playNotificationSound(settings.sound || 'default')
    }

    // 发送Webhook（如果配置）
    if (actions.webhook) {
      this.sendWebhook(actions.webhook, event, content)
    }

    // 添加到历史记录
    this.addToHistory(event, rule)

    // 更新统计
    this.updateStats(rule)
  }

  // 生成通知内容
  private generateNotificationContent(event: WebSocketEvent, rule: NotificationRule): {
    title: string
    message: string
  } {
    const { data } = event
    const template = rule.settings.template || '收到新事件: {event}'

    // 基础变量
    const variables: Record<string, any> = {
      event: event.event,
      namespace: this.getNamespaceDisplayName(event.namespace),
      timestamp: event.timestamp.toLocaleString(),
      taskName: data?.task_name || data?.name || event.event,
      progress: data?.progress || 0,
      error: data?.error || data?.message || '',
      totalReturn: data?.result?.total_return || data?.total_return || 0,
      stockCount: data?.result?.stock_count || data?.stock_count || 0,
      ...data
    }

    // 替换模板变量
    let message = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      message = message.replace(regex, String(value))
    })

    return {
      title: this.getEventTitle(event, rule),
      message
    }
  }

  // 获取事件标题
  private getEventTitle(event: WebSocketEvent, rule: NotificationRule): string {
    const namespace = this.getNamespaceDisplayName(event.namespace)
    
    switch (rule.settings.priority) {
      case 'critical':
        return `🚨 ${namespace} 严重告警`
      case 'high':
        return `⚠️ ${namespace} 重要通知`
      case 'normal':
        return `ℹ️ ${namespace} 通知`
      case 'low':
        return `📝 ${namespace} 信息`
      default:
        return `${namespace} 通知`
    }
  }

  // 获取命名空间显示名称
  private getNamespaceDisplayName(namespace: string): string {
    const names: Record<string, string> = {
      '/data_collection': '数据采集',
      '/backtest': '回测引擎',
      '/ai_analysis': 'AI分析',
      '/scheduler': '任务调度',
      '/news_analysis': '新闻分析'
    }
    return names[namespace] || namespace
  }

  // 显示Element Plus通知
  private showNotification(content: { title: string; message: string }, settings: NotificationRule['settings']): void {
    const type = this.getNotificationType(settings.priority)
    
    ElNotification({
      title: content.title,
      message: content.message,
      type,
      duration: settings.duration ?? 4000,
      position: 'top-right',
      showClose: true,
      dangerouslyUseHTMLString: false
    })
  }

  // 显示Element Plus消息
  private showMessage(content: { title: string; message: string }, settings: NotificationRule['settings']): void {
    const type = this.getNotificationType(settings.priority)
    
    ElMessage({
      message: content.message,
      type,
      duration: settings.duration ?? 3000,
      showClose: true
    })
  }

  // 获取通知类型
  private getNotificationType(priority: string): 'success' | 'warning' | 'error' | 'info' {
    switch (priority) {
      case 'critical':
      case 'high':
        return priority === 'critical' ? 'error' : 'warning'
      case 'normal':
        return 'success'
      case 'low':
        return 'info'
      default:
        return 'info'
    }
  }

  // 播放通知声音
  private playNotificationSound(sound: string): void {
    try {
      // 这里可以根据sound参数播放不同的声音
      // 简化实现，使用浏览器默认通知声音
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('', { silent: false })
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }

  // 发送Webhook
  private async sendWebhook(url: string, event: WebSocketEvent, content: { title: string; message: string }): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event,
          content,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send webhook:', error)
    }
  }

  // 添加到历史记录
  private addToHistory(event: WebSocketEvent, rule: NotificationRule): void {
    const notification: NotificationHistory = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      event,
      timestamp: new Date(),
      acknowledged: false,
      dismissed: false
    }

    this.history.value.push(notification)

    // 限制历史记录大小
    if (this.history.value.length > this.maxHistorySize) {
      this.history.value = this.history.value.slice(-this.maxHistorySize / 2)
    }
  }

  // 更新统计信息
  private updateStats(rule: NotificationRule): void {
    this.stats.totalNotifications++
    this.stats.unacknowledged++
    this.stats.byPriority[rule.settings.priority]++
    this.stats.byRule[rule.id] = (this.stats.byRule[rule.id] || 0) + 1
    this.stats.lastNotification = new Date()
  }

  // 加载用户设置
  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('notification_settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        this.soundEnabled.value = parsed.soundEnabled ?? true
        this.notificationsEnabled.value = parsed.notificationsEnabled ?? true
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error)
    }
  }

  // 保存用户设置
  private saveSettings(): void {
    try {
      const settings = {
        soundEnabled: this.soundEnabled.value,
        notificationsEnabled: this.notificationsEnabled.value
      }
      localStorage.setItem('notification_settings', JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save notification settings:', error)
    }
  }

  // 公共API

  // 添加通知规则
  addRule(rule: NotificationRule): void {
    this.rules.set(rule.id, rule)
    this.stats.byRule[rule.id] = 0
  }

  // 更新通知规则
  updateRule(ruleId: string, updates: Partial<NotificationRule>): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      Object.assign(rule, updates)
    }
  }

  // 删除通知规则
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
    delete this.stats.byRule[ruleId]
  }

  // 启用/禁用规则
  toggleRule(ruleId: string, enabled?: boolean): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = enabled ?? !rule.enabled
    }
  }

  // 获取所有规则
  getRules(): NotificationRule[] {
    return Array.from(this.rules.values())
  }

  // 获取历史记录
  getHistory(limit?: number): NotificationHistory[] {
    const history = this.history.value.slice().reverse()
    return limit ? history.slice(0, limit) : history
  }

  // 获取统计信息
  getStats(): NotificationStats {
    return { ...this.stats }
  }

  // 确认通知
  acknowledgeNotification(notificationId: string): void {
    const notification = this.history.value.find(n => n.id === notificationId)
    if (notification && !notification.acknowledged) {
      notification.acknowledged = true
      this.stats.unacknowledged = Math.max(0, this.stats.unacknowledged - 1)
    }
  }

  // 确认所有通知
  acknowledgeAll(): void {
    this.history.value.forEach(notification => {
      if (!notification.acknowledged) {
        notification.acknowledged = true
      }
    })
    this.stats.unacknowledged = 0
  }

  // 清除历史记录
  clearHistory(): void {
    this.history.value = []
    this.stats.unacknowledged = 0
  }

  // 启用/禁用通知
  toggleNotifications(enabled?: boolean): void {
    this.notificationsEnabled.value = enabled ?? !this.notificationsEnabled.value
    this.saveSettings()
  }

  // 启用/禁用声音
  toggleSound(enabled?: boolean): void {
    this.soundEnabled.value = enabled ?? !this.soundEnabled.value
    this.saveSettings()
  }

  // 测试通知
  testNotification(priority: NotificationRule['settings']['priority'] = 'normal'): void {
    const testEvent: WebSocketEvent = {
      id: 'test_' + Date.now(),
      namespace: '/test',
      event: 'test_notification',
      data: { message: '这是一个测试通知' },
      timestamp: new Date(),
      type: 'info',
      processed: true
    }

    const testRule: NotificationRule = {
      id: 'test_rule',
      name: '测试通知',
      enabled: true,
      conditions: {},
      actions: {
        showNotification: true,
        showMessage: true,
        playSound: true
      },
      settings: {
        priority,
        duration: 3000,
        template: '这是一个 {priority} 级别的测试通知'
      }
    }

    this.triggerNotification(testEvent, testRule)
  }

  // 销毁服务
  destroy(): void {
    console.log('🔥 Destroying RealtimeNotificationService...')
    
    // 取消所有订阅
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions = []
    
    // 清除数据
    this.rules.clear()
    this.history.value = []
  }
}

// 创建并导出单例实例
export const realtimeNotificationService = new RealtimeNotificationService()

// 默认导出
export default realtimeNotificationService 