import { io, Socket } from 'socket.io-client'
import { ElMessage } from 'element-plus'

// WebSocket连接配置
const WEBSOCKET_CONFIG = {
  dataCollection: {
    url: 'http://127.0.0.1:5000',
    namespace: '/data_collection',
    options: {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    }
  },
  scheduler: {
    url: 'http://127.0.0.1:5000',
    namespace: '/scheduler',
    options: {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    }
  }
}

// 全局WebSocket实例
let dataCollectionSocket: Socket | null = null
let schedulerSocket: Socket | null = null

// 连接状态
let dataCollectionConnected = false
let schedulerConnected = false

// 事件监听器
const eventListeners: Map<string, Function[]> = new Map()

// 初始化WebSocket连接
export const initWebSockets = () => {
  console.log('全局WebSocket管理器：初始化连接...')
  
  // 数据采集WebSocket
  if (!dataCollectionSocket) {
    dataCollectionSocket = io(WEBSOCKET_CONFIG.dataCollection.url, {
      ...WEBSOCKET_CONFIG.dataCollection.options,
      path: '/socket.io'
    })
    
    dataCollectionSocket.on('connect', () => {
      dataCollectionConnected = true
      console.log('全局WebSocket管理器：数据采集连接成功')
      emitEvent('dataCollectionConnected', true)
    })
    
    dataCollectionSocket.on('disconnect', (reason) => {
      dataCollectionConnected = false
      console.log('全局WebSocket管理器：数据采集连接断开:', reason)
      emitEvent('dataCollectionConnected', false)
    })
    
    dataCollectionSocket.on('connect_error', (error) => {
      console.error('全局WebSocket管理器：数据采集连接错误:', error)
      dataCollectionConnected = false
      emitEvent('dataCollectionConnected', false)
    })
    
    dataCollectionSocket.on('reconnect', (attemptNumber) => {
      console.log(`全局WebSocket管理器：数据采集重连成功，第${attemptNumber}次尝试`)
      dataCollectionConnected = true
      emitEvent('dataCollectionConnected', true)
    })
    
    // 转发所有数据采集事件
    const dataCollectionEvents = [
      'connected', 'collection_status', 'collection_started', 
      'collection_complete', 'collection_error', 'database_stats'
    ]
    
    dataCollectionEvents.forEach(event => {
      dataCollectionSocket!.on(event, (data) => {
        emitEvent(event, data)
      })
    })
  }
  
  // 调度器WebSocket - 使用命名空间
  if (!schedulerSocket) {
    schedulerSocket = io(WEBSOCKET_CONFIG.scheduler.url + '/scheduler', {
      ...WEBSOCKET_CONFIG.scheduler.options,
      path: '/socket.io'
    })
    
    schedulerSocket.on('connect', () => {
      schedulerConnected = true
      console.log('全局WebSocket管理器：调度器连接成功')
      emitEvent('schedulerConnected', true)
    })
    
    schedulerSocket.on('disconnect', (reason) => {
      schedulerConnected = false
      console.log('全局WebSocket管理器：调度器连接断开:', reason)
      emitEvent('schedulerConnected', false)
    })
    
    schedulerSocket.on('connect_error', (error) => {
      console.error('全局WebSocket管理器：调度器连接错误', error)
      schedulerConnected = false
      emitEvent('schedulerConnected', false)
    })
    
    schedulerSocket.on('reconnect', (attemptNumber) => {
      console.log(`全局WebSocket管理器：调度器重连成功，第${attemptNumber}次尝试`)
      schedulerConnected = true
      emitEvent('schedulerConnected', true)
    })
    
    // 转发所有调度器事件
    const schedulerEvents = [
      'connected', 'scheduler_status', 'update_progress', 
      'update_complete', 'update_error', 'update_logs_response'
    ]
    
    schedulerEvents.forEach(event => {
      schedulerSocket!.on(event, (data) => {
        emitEvent(event, data)
      })
    })
  }
}

// 断开WebSocket连接
export const disconnectWebSockets = () => {
  console.log('全局WebSocket管理器：断开连接...')
  
  if (dataCollectionSocket) {
    dataCollectionSocket.disconnect()
    dataCollectionSocket = null
  }
  
  if (schedulerSocket) {
    schedulerSocket.disconnect()
    schedulerSocket = null
  }
  
  dataCollectionConnected = false
  schedulerConnected = false
}

// 手动重连
export const reconnectWebSockets = () => {
  console.log('全局WebSocket管理器：手动重连...')
  disconnectWebSockets()
  setTimeout(() => {
    initWebSockets()
  }, 1000)
}

// 获取连接状态
export const getConnectionStatus = () => {
  return {
    dataCollection: dataCollectionConnected,
    scheduler: schedulerConnected
  }
}

// 获取WebSocket实例
export const getDataCollectionSocket = () => dataCollectionSocket
export const getSchedulerSocket = () => schedulerSocket

// 事件监听管理
export const addEventListener = (event: string, listener: Function) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, [])
  }
  eventListeners.get(event)!.push(listener)
}

export const removeEventListener = (event: string, listener: Function) => {
  const listeners = eventListeners.get(event)
  if (listeners) {
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

// 发送事件
const emitEvent = (event: string, data: any) => {
  const listeners = eventListeners.get(event)
  if (listeners) {
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`事件监听器执行错误(${event}):`, error)
      }
    })
  }
}

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    console.log('页面变为可见，检查WebSocket连接状态...')
    const status = getConnectionStatus()
    if (!status.dataCollection || !status.scheduler) {
      console.log('检测到连接断开，尝试重连...')
      reconnectWebSockets()
    }
  }
}

// 页面加载完成时初始化
if (typeof window !== 'undefined') {
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 页面加载完成后初始化WebSocket
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebSockets)
  } else {
    initWebSockets()
  }
  
  // 页面卸载时清理
  window.addEventListener('beforeunload', disconnectWebSockets)
}

export default {
  initWebSockets,
  disconnectWebSockets,
  reconnectWebSockets,
  getConnectionStatus,
  getDataCollectionSocket,
  getSchedulerSocket,
  addEventListener,
  removeEventListener
} 
