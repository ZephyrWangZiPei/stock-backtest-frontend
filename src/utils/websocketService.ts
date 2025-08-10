import { io, Socket } from 'socket.io-client'
import { ref, reactive } from 'vue'

// WebSocket 连接状态
export interface ConnectionStatus {
  connected: boolean
  connecting: boolean
  error: string | null
  lastConnected: Date | null
  reconnectAttempts: number
}

// WebSocket 消息类型
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  namespace: string
}

// 任务状态更新
export interface TaskUpdate {
  taskId: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  progress: number
  message?: string
  timestamp: number
}

// 回测进度更新
export interface BacktestProgress {
  taskId: string
  stage: string
  progress: number
  currentDate: string
  processedDays: number
  totalDays: number
  currentValue: number
  logs: Array<{
    time: string
    level: 'info' | 'warn' | 'error'
    message: string
  }>
}

// 数据收集状态
export interface DataCollectionStatus {
  isCollecting: boolean
  activeTasks: number
  completedToday: number
  errors: number
  lastUpdate: Date | null
}

class WebSocketService {
  private sockets: Map<string, Socket> = new Map()
  private connectionStatuses: Map<string, ConnectionStatus> = new Map()
  private eventHandlers: Map<string, Map<string, Function[]>> = new Map()
  
  // 响应式状态
  public globalStatus = reactive<{
    totalConnections: number
    activeConnections: number
    errors: string[]
  }>({
    totalConnections: 0,
    activeConnections: 0,
    errors: []
  })

  // 任务状态
  public taskUpdates = ref<TaskUpdate[]>([])
  public backtestProgress = ref<BacktestProgress | null>(null)
  public dataCollectionStatus = reactive<DataCollectionStatus>({
    isCollecting: false,
    activeTasks: 0,
    completedToday: 0,
    errors: 0,
    lastUpdate: null
  })

  constructor() {
    this.initializeNamespaces()
  }

  private initializeNamespaces() {
    const namespaces = [
      '/backtest',
      '/data_collection', 
      '/ai_analysis',
      '/news_analysis',
      '/scheduler'
    ]

    namespaces.forEach(namespace => {
      this.connectionStatuses.set(namespace, {
        connected: false,
        connecting: false,
        error: null,
        lastConnected: null,
        reconnectAttempts: 0
      })
      this.eventHandlers.set(namespace, new Map())
    })
  }

  async connect(namespace: string, url?: string): Promise<void> {
    const baseUrl = url || 'http://localhost:5000'
    const socketUrl = `${baseUrl}${namespace}`
    
    // 如果已经连接，直接返回
    if (this.sockets.has(namespace) && this.sockets.get(namespace)?.connected) {
      return Promise.resolve()
    }

    // 如果正在连接，等待连接完成
    const status = this.connectionStatuses.get(namespace)
    if (status?.connecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (status.connected) {
            resolve()
          } else if (status.error) {
            reject(new Error(status.error))
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
      })
    }

    // 开始连接
    if (status) {
      status.connecting = true
      status.error = null
    }

    const socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    this.sockets.set(namespace, socket)
    this.globalStatus.totalConnections++

    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`✅ WebSocket 连接成功: ${namespace}`)
        if (status) {
          status.connected = true
          status.connecting = false
          status.lastConnected = new Date()
          status.reconnectAttempts = 0
        }
        this.globalStatus.activeConnections++
        this.setupNamespaceHandlers(namespace, socket)
        resolve()
      })

      socket.on('connect_error', (error) => {
        console.error(`❌ WebSocket 连接失败: ${namespace}`, error)
        if (status) {
          status.connected = false
          status.connecting = false
          status.error = error.message
          status.reconnectAttempts++
        }
        this.globalStatus.errors.push(`${namespace}: ${error.message}`)
        reject(error)
      })

      socket.on('disconnect', (reason) => {
        console.log(`🔌 WebSocket 断开连接: ${namespace} - ${reason}`)
        if (status) {
          status.connected = false
          status.connecting = false
        }
        this.globalStatus.activeConnections--
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 WebSocket 重连成功: ${namespace} (尝试 ${attemptNumber})`)
        if (status) {
          status.connected = true
          status.connecting = false
          status.error = null
        }
        this.globalStatus.activeConnections++
      })

      socket.on('reconnect_error', (error) => {
        console.error(`🔄 WebSocket 重连失败: ${namespace}`, error)
        if (status) {
          status.error = error.message
        }
      })
    })
  }

  private setupNamespaceHandlers(namespace: string, socket: Socket) {
    // 通用事件处理
    socket.on('error', (data) => {
      console.error(`WebSocket 错误 [${namespace}]:`, data)
      this.globalStatus.errors.push(`${namespace}: ${data.message || '未知错误'}`)
    })

    // 命名空间特定处理
    switch (namespace) {
      case '/backtest':
        this.setupBacktestHandlers(socket)
        break
      case '/data_collection':
        this.setupDataCollectionHandlers(socket)
        break
      case '/ai_analysis':
        this.setupAIAnalysisHandlers(socket)
        break
      case '/news_analysis':
        this.setupNewsAnalysisHandlers(socket)
        break
      case '/scheduler':
        this.setupSchedulerHandlers(socket)
        break
    }
  }

  private setupBacktestHandlers(socket: Socket) {
    socket.on('backtest_progress', (data: BacktestProgress) => {
      console.log('📊 回测进度更新:', data)
      this.backtestProgress.value = data
    })

    socket.on('backtest_completed', (data) => {
      console.log('✅ 回测完成:', data)
      this.backtestProgress.value = null
    })

    socket.on('backtest_error', (data) => {
      console.error('❌ 回测错误:', data)
      this.globalStatus.errors.push(`回测错误: ${data.error}`)
    })
  }

  private setupDataCollectionHandlers(socket: Socket) {
    socket.on('task_update', (data: TaskUpdate) => {
      console.log('📋 任务状态更新:', data)
      this.taskUpdates.value.push(data)
      
      // 更新数据收集状态
      if (data.status === 'running') {
        this.dataCollectionStatus.isCollecting = true
        this.dataCollectionStatus.activeTasks++
      } else if (data.status === 'completed') {
        this.dataCollectionStatus.completedToday++
        this.dataCollectionStatus.activeTasks = Math.max(0, this.dataCollectionStatus.activeTasks - 1)
        if (this.dataCollectionStatus.activeTasks === 0) {
          this.dataCollectionStatus.isCollecting = false
        }
      } else if (data.status === 'failed') {
        this.dataCollectionStatus.errors++
        this.dataCollectionStatus.activeTasks = Math.max(0, this.dataCollectionStatus.activeTasks - 1)
      }
      
      this.dataCollectionStatus.lastUpdate = new Date()
    })

    socket.on('data_collection_status', (data: DataCollectionStatus) => {
      console.log('📊 数据收集状态更新:', data)
      Object.assign(this.dataCollectionStatus, data)
    })
  }

  private setupAIAnalysisHandlers(socket: Socket) {
    socket.on('ai_analysis_progress', (data) => {
      console.log('🤖 AI分析进度:', data)
    })

    socket.on('ai_analysis_completed', (data) => {
      console.log('✅ AI分析完成:', data)
    })
  }

  private setupNewsAnalysisHandlers(socket: Socket) {
    socket.on('news_analysis_progress', (data) => {
      console.log('📰 新闻分析进度:', data)
    })

    socket.on('news_analysis_completed', (data) => {
      console.log('✅ 新闻分析完成:', data)
    })
  }

  private setupSchedulerHandlers(socket: Socket) {
    socket.on('scheduler_update', (data) => {
      console.log('⏰ 调度器更新:', data)
    })
  }

  // 事件监听
  on(namespace: string, event: string, handler: Function): void {
    const socket = this.sockets.get(namespace)
    if (!socket) {
      console.warn(`Socket for namespace ${namespace} not found`)
      return
    }
    
    const handlers = this.eventHandlers.get(namespace)
    if (!handlers) return

    if (!handlers.has(event)) {
      handlers.set(event, [])
    }

    handlers.get(event)?.push(handler)
    socket.on(event, handler as any)
  }

  // 移除事件监听
  off(namespace: string, event: string, handler?: Function): void {
    const socket = this.sockets.get(namespace)
    if (!socket) return

    if (handler) {
      socket.off(event, handler as any)
    } else {
      socket.off(event)
    }

    const handlers = this.eventHandlers.get(namespace)
    if (handlers && handlers.has(event)) {
      if (handler) {
        const eventHandlers = handlers.get(event) || []
        const index = eventHandlers.indexOf(handler)
        if (index > -1) {
          eventHandlers.splice(index, 1)
        }
      } else {
        handlers.delete(event)
      }
    }
  }

  // 发送消息
  emit(namespace: string, event: string, data?: any): void {
    const socket = this.sockets.get(namespace)
    if (socket && socket.connected) {
      socket.emit(event, data)
    } else {
      console.warn(`Cannot emit to ${namespace}: socket not connected`)
    }
  }

  // 获取连接状态
  getConnectionStatus(namespace: string): ConnectionStatus | null {
    return this.connectionStatuses.get(namespace) || null
  }

  // 获取所有连接状态
  getAllConnectionStatuses(): Map<string, ConnectionStatus> {
    return this.connectionStatuses
  }

  // 断开连接
  disconnect(namespace: string): void {
    const socket = this.sockets.get(namespace)
    if (socket) {
      socket.disconnect()
      this.sockets.delete(namespace)
      this.globalStatus.activeConnections--
    }
  }

  // 断开所有连接
  disconnectAll(): void {
    this.sockets.forEach((socket, namespace) => {
      this.disconnect(namespace)
    })
  }

  // 清理错误
  clearErrors(): void {
    this.globalStatus.errors = []
  }

  // 清理任务更新
  clearTaskUpdates(): void {
    this.taskUpdates.value = []
  }
}

// 创建并导出单例实例
export const websocketService = new WebSocketService()

// 默认导出
export default websocketService 