import { ref, reactive, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

export interface WebSocketEvent {
  id: string
  namespace: string
  event: string
  data: any
  timestamp: Date
  type: 'info' | 'success' | 'warning' | 'error'
  processed: boolean
}

export interface EventSubscriber {
  id: string
  namespace?: string
  handler: (event: WebSocketEvent) => void
}

export interface ConnectionInfo {
  namespace: string
  connected: boolean
  lastConnected?: Date
  lastDisconnected?: Date
  reconnectCount: number
  errorCount: number
  messageCount: number
}

class WebSocketEventBus {
  private subscribers: Map<string, EventSubscriber> = new Map()
  private eventHistory: WebSocketEvent[] = []
  private connections: Map<string, ConnectionInfo> = new Map()
  private eventQueue: WebSocketEvent[] = []
  private stats = {
    totalEvents: 0,
    totalSubscribers: 0,
    activeConnections: 0
  }

  subscribe(subscriber: EventSubscriber): () => void {
    this.subscribers.set(subscriber.id, subscriber)
    this.stats.totalSubscribers = this.subscribers.size
    
    // 返回取消订阅函数
    return () => {
      this.unsubscribe(subscriber.id)
    }
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId)
    this.stats.totalSubscribers = this.subscribers.size
  }

  emit(namespace: string, event: string, data: any, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const wsEvent: WebSocketEvent = {
      id: this.generateEventId(),
      namespace,
      event,
      data,
      timestamp: new Date(),
      type,
      processed: false
    }

    this.addToHistory(wsEvent)
    this.distributeEvent(wsEvent)
    this.stats.totalEvents++
  }

  private distributeEvent(wsEvent: WebSocketEvent): void {
    this.subscribers.forEach(subscriber => {
      if (!subscriber.namespace || subscriber.namespace === wsEvent.namespace) {
        try {
          subscriber.handler(wsEvent)
        } catch (error) {
          console.error(`Error in event subscriber ${subscriber.id}:`, error)
        }
      }
    })
    wsEvent.processed = true
  }

  private addToHistory(event: WebSocketEvent): void {
    this.eventHistory.push(event)
    // 保持历史记录在合理范围内
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500)
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 公共方法
  getEventHistory(namespace?: string): WebSocketEvent[] {
    if (namespace) {
      return this.eventHistory.filter(evt => evt.namespace === namespace)
    }
    return [...this.eventHistory]
  }

  getConnectionInfo(namespace?: string): ConnectionInfo | ConnectionInfo[] | null {
    if (namespace) {
      return this.connections.get(namespace) || null
    }
    return Array.from(this.connections.values())
  }

  getStats() {
    return {
      ...this.stats,
      activeConnections: this.connections.size
    }
  }

  clearHistory(): void {
    this.eventHistory = []
  }

  reset(): void {
    this.subscribers.clear()
    this.eventHistory = []
    this.connections.clear()
    this.eventQueue = []
    this.stats = {
      totalEvents: 0,
      totalSubscribers: 0,
      activeConnections: 0
    }
  }
}

// 导出单例实例
export const websocketEventBus = new WebSocketEventBus() 