import { io, Socket } from 'socket.io-client'
import { ElMessage } from 'element-plus'

export interface ScreeningProgress {
  status: 'initializing' | 'processing' | 'completed' | 'error' | 'cancelled'
  message: string
  progress: number
  total_stocks: number
  processed_stocks: number
  found_stocks: number
  results?: any[]
  summary?: any
}

export interface ScreeningConfig {
  type: 'comprehensive' | 'technical' | 'fundamental'
  min_score: number
  max_results: number
  config: any
}

export class ScreeningWebSocketManager {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval: NodeJS.Timeout | null = null
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.init()
  }

  private init() {
    this.socket = io('http://127.0.0.1:5000/screening', {
      transports: ['websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    })

    this.socket.on('connect', () => {
      console.log('🔗 筛选WebSocket连接成功')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected', { connected: true })
      ElMessage.success('筛选服务连接成功')
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 筛选WebSocket连接断开')
      this.isConnected = false
      this.emit('disconnected', { connected: false })
      ElMessage.warning('筛选服务连接断开')
    })

    this.socket.on('connect_error', (error) => {
      console.error('筛选WebSocket连接错误:', error)
      this.isConnected = false
      this.emit('connection_error', { error: error.message })
      ElMessage.error('筛选服务连接错误')
    })

    // 筛选相关事件
    this.socket.on('screening_started', (data) => {
      console.log('📊 筛选任务已开始', data)
      this.emit('screening_started', data)
      ElMessage.success('筛选任务已开始')
    })

    this.socket.on('screening_progress', (data: ScreeningProgress) => {
      console.log('📈 筛选进度', data)
      this.emit('screening_progress', data)
    })

    this.socket.on('screening_completed', (data) => {
      console.log('✅ 筛选任务完成', data)
      this.emit('screening_completed', data)
      ElMessage.success(`筛选完成，找到 ${data.found_stocks} 只股票`)
    })

    this.socket.on('screening_error', (data) => {
      console.error('❌ 筛选任务错误', data)
      this.emit('screening_error', data)
      ElMessage.error(`筛选失败: ${data.message}`)
    })

    this.socket.on('screening_cancelled', (data) => {
      console.log('⏹️ 筛选任务已取消:', data)
      this.emit('screening_cancelled', data)
      ElMessage.info('筛选任务已取消')
    })
  }

  // 开始筛选
  public startScreening(config: ScreeningConfig): void {
    if (!this.socket || !this.isConnected) {
      ElMessage.error('筛选服务未连接')
      return
    }

    console.log('🚀 开始筛选', config)
    this.socket.emit('start_screening', config)
  }

  // 取消筛选
  public cancelScreening(): void {
    if (!this.socket || !this.isConnected) {
      ElMessage.error('筛选服务未连接')
      return
    }

    console.log('⏹️ 取消筛选')
    this.socket.emit('cancel_screening', {})
  }

  // 添加事件监听器
  public addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  // 移除事件监听器
  public removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 触发事件
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件监听器执行错误[${event}]:`, error)
        }
      })
    }
  }

  // 重连
  public reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('已达到最大重连次数')
      return
    }

    this.reconnectAttempts++
    console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

  }

  // 断开连接
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
  }

  // 获取连接状态
  public getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// 创建单例实例
const screeningWebSocketManager = new ScreeningWebSocketManager()

export default screeningWebSocketManager 
