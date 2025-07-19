/**
 * WebSocket组合式函数
 * 提供WebSocket连接管理和事件处理功能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { ElMessage } from 'element-plus'

/**
 * WebSocket配置选项
 */
export interface WebSocketOptions {
  /** WebSocket URL */
  url: string
  /** 连接路径 */
  path?: string
  /** 传输方式 */
  transports?: string[]
  /** 重连尝试次数 */
  reconnectionAttempts?: number
  /** 重连延迟时间 */
  reconnectionDelay?: number
  /** 最大重连延迟时间 */
  reconnectionDelayMax?: number
  /** 命名空间 */
  namespace?: string
  /** 自动连接 */
  autoConnect?: boolean
}

/**
 * WebSocket事件处理器
 */
export interface WebSocketEventHandlers {
  /** 连接成功回调 */
  onConnect?: (socket: Socket) => void
  /** 连接断开回调 */
  onDisconnect?: (reason: string) => void
  /** 连接错误回调 */
  onConnectError?: (error: any) => void
  /** 重连成功回调 */
  onReconnect?: (attemptNumber: number) => void
  /** 重连尝试回调 */
  onReconnectAttempt?: (attemptNumber: number) => void
  /** 重连错误回调 */
  onReconnectError?: (error: any) => void
  /** 重连失败回调 */
  onReconnectFailed?: () => void
}

/**
 * 使用WebSocket
 * @param options WebSocket配置选项
 * @param eventHandlers 事件处理器
 * @returns WebSocket相关状态和方法
 */
export function useWebSocket(
  options: WebSocketOptions,
  eventHandlers: WebSocketEventHandlers = {}
) {
  const {
    url,
    path = '/socket.io/',
    transports = ['websocket', 'polling'],
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    reconnectionDelayMax = 5000,
    namespace,
    autoConnect = true
  } = options

  const {
    onConnect,
    onDisconnect,
    onConnectError,
    onReconnect,
    onReconnectAttempt,
    onReconnectError,
    onReconnectFailed
  } = eventHandlers

  // 响应式状态
  const socket = ref<any>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const isReconnecting = ref(false)
  const connectionError = ref<string | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(reconnectionAttempts)

  // 计算属性
  const canConnect = computed(() => !isConnected.value && !isConnecting.value)
  const canDisconnect = computed(() => isConnected.value && socket.value)
  const connectionStatus = computed(() => {
    if (isConnected.value) return 'connected'
    if (isConnecting.value) return 'connecting'
    if (isReconnecting.value) return 'reconnecting'
    if (connectionError.value) return 'error'
    return 'disconnected'
  })

  /**
   * 创建WebSocket连接
   */
  const createConnection = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }

    const socketOptions = {
      path,
      transports,
      reconnection: false, // 手动处理重连
      autoConnect: false
    }

    const fullUrl = namespace ? `${url}${namespace}` : url
    const newSocket = io(fullUrl, socketOptions)
    socket.value = newSocket

    // 设置事件监听器
    setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    if (!socket.value) return

    // 连接成功
    socket.value.on('connect', () => {
      console.log('[WebSocket] 连接成功')
      isConnected.value = true
      isConnecting.value = false
      isReconnecting.value = false
      connectionError.value = null
      reconnectAttempts.value = 0
      
      onConnect?.(socket.value!)
    })

    // 连接断开
    socket.value.on('disconnect', (reason: string) => {
      console.log('[WebSocket] 连接断开:', reason)
      isConnected.value = false
      isConnecting.value = false
      
      onDisconnect?.(reason)

      // 如果不是手动断开，尝试重连
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        scheduleReconnect()
      }
    })

    // 连接错误
    socket.value.on('connect_error', (error: any) => {
      console.error('[WebSocket] 连接错误:', error)
      isConnected.value = false
      isConnecting.value = false
      connectionError.value = error.message || '连接失败'
      
      onConnectError?.(error)

      // 尝试重连
      scheduleReconnect()
    })

    // 重连尝试
    socket.value.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`[WebSocket] 重连尝试 ${attemptNumber}/${maxReconnectAttempts.value}`)
      isReconnecting.value = true
      reconnectAttempts.value = attemptNumber
      
      onReconnectAttempt?.(attemptNumber)
    })

    // 重连成功
    socket.value.on('reconnect', (attemptNumber: number) => {
      console.log(`[WebSocket] 重连成功，尝试次数: ${attemptNumber}`)
      isConnected.value = true
      isReconnecting.value = false
      connectionError.value = null
      
      onReconnect?.(attemptNumber)
    })

    // 重连错误
    socket.value.on('reconnect_error', (error: any) => {
      console.error('[WebSocket] 重连错误:', error)
      connectionError.value = error.message || '重连失败'
      
      onReconnectError?.(error)
    })

    // 重连失败
    socket.value.on('reconnect_failed', () => {
      console.error('[WebSocket] 重连失败，已达到最大尝试次数')
      isReconnecting.value = false
      connectionError.value = '重连失败，请手动重试'
      
      onReconnectFailed?.()
      ElMessage.error('WebSocket连接失败，请检查网络连接')
    })
  }

  /**
   * 安排重连
   */
  const scheduleReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts.value) {
      console.error('[WebSocket] 重连失败，已达到最大尝试次数')
      return
    }

    const delay = Math.min(
      reconnectionDelay * Math.pow(2, reconnectAttempts.value),
      reconnectionDelayMax
    )

    setTimeout(() => {
      if (socket.value && !isConnected.value) {
        console.log(`[WebSocket] 开始重连，延迟: ${delay}ms`)
        socket.value.connect()
      }
    }, delay)
  }

  /**
   * 连接WebSocket
   */
  const connect = () => {
    if (!canConnect.value) {
      console.warn('[WebSocket] 无法连接：已连接或正在连接中')
      return
    }

    console.log('[WebSocket] 开始连接:', url)
    isConnecting.value = true
    connectionError.value = null

    if (!socket.value) {
      createConnection()
    }

    socket.value?.connect()
  }

  /**
   * 断开WebSocket连接
   */
  const disconnect = () => {
    if (!canDisconnect.value) {
      console.warn('[WebSocket] 无法断开：未连接')
      return
    }

    console.log('[WebSocket] 断开连接')
    socket.value?.disconnect()
  }

  /**
   * 强制重连
   */
  const forceReconnect = () => {
    console.log('[WebSocket] 强制重连')
    reconnectAttempts.value = 0
    connectionError.value = null
    
    if (socket.value) {
      socket.value.disconnect()
      setTimeout(() => {
        socket.value?.connect()
      }, 100)
    } else {
      connect()
    }
  }

  /**
   * 发送消息
   * @param event 事件名称
   * @param data 数据
   */
  const emit = (event: string, data?: any) => {
    if (!isConnected.value || !socket.value) {
      console.warn('[WebSocket] 无法发送消息：未连接')
      return false
    }

    socket.value.emit(event, data)
    return true
  }

  /**
   * 监听事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (!socket.value) {
      console.warn('[WebSocket] 无法监听事件：socket未初始化')
      return
    }

    socket.value.on(event, callback)
  }

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param callback 回调函数（可选）
   */
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (!socket.value) return

    if (callback) {
      socket.value.off(event, callback)
    } else {
      socket.value.off(event)
    }
  }

  /**
   * 销毁WebSocket连接
   */
  const destroy = () => {
    console.log('[WebSocket] 销毁连接')
    
    if (socket.value) {
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
    }

    isConnected.value = false
    isConnecting.value = false
    isReconnecting.value = false
    connectionError.value = null
    reconnectAttempts.value = 0
  }

  // 生命周期
  onMounted(() => {
    if (autoConnect) {
      connect()
    }
  })

  onUnmounted(() => {
    destroy()
  })

  return {
    // 状态
    socket: computed(() => socket.value),
    isConnected,
    isConnecting,
    isReconnecting,
    connectionError,
    reconnectAttempts,
    connectionStatus,
    canConnect,
    canDisconnect,

    // 方法
    connect,
    disconnect,
    forceReconnect,
    emit,
    on,
    off,
    destroy
  }
} 