import { io, Socket } from 'socket.io-client'
import { ElMessage } from 'element-plus'

// WebSocket连接配置
const WEBSOCKET_CONFIG = {
  baseUrl: 'http://127.0.0.1:5000',
  namespaces: {
    dataCollection: '/data_collection',
    aiAnalysis: '/ai_analysis',
    newsAnalysis: '/news_analysis',
    backtest: '/backtest',
    scheduler: '/scheduler'
  },
  options: {
    transports: ['websocket', 'polling'],
    timeout: 30000,
    reconnection: true,
    reconnectionAttempts: 15, // 增加重连次数
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000, // 增加最大重连延时
    maxReconnectionAttempts: 15,
    forceNew: false,
    autoConnect: true,
    // 增强心跳检测
    pingTimeout: 60000,
    pingInterval: 25000,
    // 连接稳定性配置
    upgrade: true,
    rememberUpgrade: true,
    rejectUnauthorized: false,
    // 新增：连接超时和重试配置
    connectTimeout: 20000,
    // 新增：网络质量检测
    networkQualityCheck: true
  }
}

// 全局状态管理
const sockets = new Map<string, Socket>()
const connectionStatus = new Map<string, boolean>()
const reconnectionStatus = new Map<string, boolean>()
const connectionQuality = new Map<string, { lastPing: number; pingCount: number; avgPingTime: number; failedPings: number }>()
const heartbeatTimers = new Map<string, NodeJS.Timeout>()
const eventListeners = new Map<string, Function[]>()

// 页面状态
let isPageVisible = true
let isPageActive = true
let isOnline = true

// 网络监控状态
const networkMonitor = {
  networkQuality: 'good' as 'good' | 'poor' | 'disconnected',
  consecutiveFailures: 0,
  maxConsecutiveFailures: 3
}

// 活动监控状态
const activityMonitor = {
  isActive: true,
  lastActivity: Date.now(),
  activityTimeout: 300000 // 5分钟无活动视为非活动
}

// 防抖和重连控制
let reconnectDebounceTimer: NodeJS.Timeout | null = null
let lastReconnectTime = 0
const MIN_RECONNECT_INTERVAL = 5000 // 最小重连间隔5秒
const RECONNECT_DEBOUNCE_DELAY = 1000 // 重连防抖延迟1秒
let isInitialized = false // 防止重复初始化

// 初始化所有WebSocket连接
export const initEnhancedWebSockets = () => {
  // 防止重复初始化
  if (isInitialized) {
    console.log('🚀 增强WebSocket管理器：已经初始化，跳过重复初始化')
    return
  }
  
  console.log('🚀 增强WebSocket管理器：初始化所有连接...')
  isInitialized = true
  
  // 初始化网络监控
  initNetworkMonitoring()
  
  // 初始化页面活动监控
  initActivityMonitoring()
  
  // 初始化所有命名空间的连接
  Object.entries(WEBSOCKET_CONFIG.namespaces).forEach(([service, namespace]) => {
    initServiceSocket(service, namespace)
  })
  
  // 启动全局心跳检测
  startGlobalHeartbeat()
  
  // 启动连接质量监控
  startConnectionQualityMonitoring()
}

// 初始化网络监控
const initNetworkMonitoring = () => {
  // 监听网络状态变化
  window.addEventListener('online', () => {
    console.log('🌐 网络连接恢复')
    isOnline = true
    networkMonitor.networkQuality = 'good'
    networkMonitor.consecutiveFailures = 0
    
    // 网络恢复后检查连接状态
    setTimeout(() => {
      checkAndReconnectDisconnectedServices()
    }, 1000)
  })
  
  window.addEventListener('offline', () => {
    console.log('🌐 网络连接断开')
    isOnline = false
    networkMonitor.networkQuality = 'disconnected'
    
    // 网络断开时暂停心跳检测
    pauseAllHeartbeats()
  })
  
  // 监听网络质量变化
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', () => {
        const effectiveType = connection.effectiveType
        const downlink = connection.downlink
        
        console.log(`🌐 网络质量变化: ${effectiveType}, 下行速度: ${downlink}Mbps`)
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
          networkMonitor.networkQuality = 'poor'
          // 网络质量差时增加重连延迟
          adjustReconnectionStrategy('poor')
        } else {
          networkMonitor.networkQuality = 'good'
          adjustReconnectionStrategy('good')
        }
      })
    }
  }
}

// 初始化页面活动监控
const initActivityMonitoring = () => {
  const updateActivity = () => {
    activityMonitor.lastActivity = Date.now()
    activityMonitor.isActive = true
  }
  
  // 监听用户活动
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true })
  })
  
  // 定期检查活动状态
  setInterval(() => {
    const timeSinceLastActivity = Date.now() - activityMonitor.lastActivity
    const wasActive = activityMonitor.isActive
    
    if (timeSinceLastActivity > activityMonitor.activityTimeout) {
      activityMonitor.isActive = false
      if (wasActive) {
        console.log('😴 页面进入非活动状态，暂停心跳检测')
        pauseAllHeartbeats()
      }
    } else {
      activityMonitor.isActive = false
      if (!wasActive) {
        console.log('😊 页面恢复活动状态，恢复心跳检测')
        resumeAllHeartbeats()
      }
    }
  }, 30000) // 30秒检查一次
}

// 调整重连策略
const adjustReconnectionStrategy = (quality: 'good' | 'poor') => {
  Object.entries(WEBSOCKET_CONFIG.namespaces).forEach(([service, namespace]) => {
    const socket = sockets.get(service)
    if (socket) {
      if (quality === 'poor') {
        // 网络质量差时使用更保守的重连策略
        socket.io.reconnectionDelay(2000)
        socket.io.reconnectionDelayMax(30000)
      } else {
        // 网络质量好时使用更积极的重连策略
        socket.io.reconnectionDelay(1000)
        socket.io.reconnectionDelayMax(15000)
      }
    }
  })
}

// 初始化单个服务的WebSocket连接
const initServiceSocket = (service: string, namespace: string) => {
  if (sockets.has(service)) {
    console.log(`🔗 增强WebSocket管理器：${service} 连接已存在，跳过初始化`)
    return
  }
  
  const socket = io(WEBSOCKET_CONFIG.baseUrl + namespace, {
    ...WEBSOCKET_CONFIG.options,
    path: '/socket.io'
  })
  
  sockets.set(service, socket)
  connectionStatus.set(service, false)
  reconnectionStatus.set(service, false)
  
  // 初始化连接质量监控
  connectionQuality.set(service, {
    lastPing: 0,
    pingCount: 0,
    failedPings: 0,
    avgPingTime: 0
  })
  
  // 连接事件处理
  socket.on('connect', () => {
    connectionStatus.set(service, true)
    reconnectionStatus.set(service, false)
    console.log(`🚀 增强WebSocket管理器：${service} 连接成功`)
    emitEvent(`${service}Connected`, true)
    
    // 重置连接质量统计
    const quality = connectionQuality.get(service)!
    quality.failedPings = 0
    quality.pingCount = 0
    
    // 启动服务特定心跳
    startServiceHeartbeat(service)
  })
  
  socket.on('disconnect', (reason) => {
    connectionStatus.set(service, false)
    console.log(`💔 增强WebSocket管理器：${service} 连接断开:`, reason)
    emitEvent(`${service}Connected`, false)
    
    // 停止心跳检测
    stopServiceHeartbeat(service)
    
    // 如果不是主动断开，尝试重连
    if (reason !== 'io client disconnect' && isPageVisible && isPageActive && isOnline) {
      console.log(`🔄 增强WebSocket管理器：${service} 尝试自动重连...`)
      reconnectionStatus.set(service, true)
    }
  })
  
  socket.on('connect_error', (error) => {
    console.error(`💥 增强WebSocket管理器：${service} 连接错误:`, error)
    connectionStatus.set(service, false)
    emitEvent(`${service}Connected`, false)
    
    // 停止心跳检测
    stopServiceHeartbeat(service)
    
    // 记录网络失败
    networkMonitor.consecutiveFailures++
    if (networkMonitor.consecutiveFailures >= networkMonitor.maxConsecutiveFailures) {
      networkMonitor.networkQuality = 'poor'
    }
  })
  
  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 增强WebSocket管理器：${service} 重连成功，第${attemptNumber}次尝试`)
    connectionStatus.set(service, true)
    reconnectionStatus.set(service, false)
    emitEvent(`${service}Connected`, true)
    
    // 重置网络失败计数
    networkMonitor.consecutiveFailures = 0
    
    // 重新启动心跳检测
    startServiceHeartbeat(service)
  })
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 增强WebSocket管理器：${service} 重连尝试，第${attemptNumber}次`)
  })
  
  socket.on('reconnect_error', (error) => {
    console.error(`💥 增强WebSocket管理器：${service} 重连失败:`, error)
    networkMonitor.consecutiveFailures++
  })
  
  socket.on('reconnect_failed', () => {
    console.error(`💥 增强WebSocket管理器：${service} 重连失败，已达到最大重试次数`)
    reconnectionStatus.set(service, false)
    networkMonitor.networkQuality = 'poor'
  })
  
  // 心跳响应处理
  socket.on('pong', (latency: number) => {
    const quality = connectionQuality.get(service)!
    quality.lastPing = Date.now()
    quality.pingCount++
    quality.avgPingTime = (quality.avgPingTime * (quality.pingCount - 1) + latency) / quality.pingCount
    
    console.log(`💓 增强WebSocket管理器：${service} 心跳响应，延时 ${latency}ms`)
  })
  
  // 根据服务类型设置特定事件监听
  setupServiceEvents(service, socket)
}

// 设置服务特定事件
const setupServiceEvents = (service: string, socket: Socket) => {
  const eventMappings = {
    dataCollection: [
      'connected', 'data_collection_status', 'data_collection_started',
      'data_collection_progress', 'data_collection_completed', 'data_collection_failed',
      'running_tasks', 'task_started', 'task_progress', 'task_completed', 'task_failed',
      'task_progress_detailed', 'task_started', 'task_connected', 'task_batch_start',
      'task_batch_complete', 'task_cleanup', 'task_completed', 'task_error'
    ],
    aiAnalysis: [
      'connected', 'ai_analysis_status', 'ai_analysis_started',
      'ai_analysis_progress', 'ai_analysis_completed', 'ai_analysis_failed',
      'running_tasks', 'task_started', 'task_progress', 'task_completed', 'task_failed'
    ],
    newsAnalysis: [
      'connected', 'news_analysis_status', 'news_analysis_started',
      'news_analysis_progress', 'news_analysis_completed', 'news_analysis_failed',
      'running_tasks', 'task_started', 'task_progress', 'task_completed', 'task_failed'
    ],
    backtest: [
      'connected', 'backtest_status', 'backtest_started', 'backtest_task_started',
      'backtest_progress', 'backtest_completed', 'backtest_failed', 'backtest_error',
      'running_tasks', 'task_started', 'task_progress', 'task_completed', 'task_failed',
      'available_strategies', 'available_stocks', 'strategy_parameters', 'stock_daily_data',
      'task_status', 'backtest_result', 'trade_event', 'backtest_task_started'
    ],
    scheduler: [
      'connected', 'scheduler_status', 'scheduled_jobs',
      'scheduled_job_created', 'scheduled_job_deleted', 'scheduled_job_paused', 'scheduled_job_resumed'
    ]
  }

  const events = eventMappings[service as keyof typeof eventMappings] || []
  
  events.forEach(event => {
    socket.on(event, (data) => {
      console.log(`📡 [${service}] 收到事件: ${event}`, data)
      
      // 发送统一事件
      emitEvent(event, data)
      
      // 发送服务特定事件
      emitEvent(`${service}Event`, { event, data })
    })
  })
  
  console.log(`🔗 [${service}] 已设置 ${events.length} 个事件监听器`)
}

// 启动服务特定心跳检测
const startServiceHeartbeat = (service: string) => {
  stopServiceHeartbeat(service) // 先停止之前的定时器
  
  const timer = setInterval(() => {
    const socket = getServiceSocket(service)
    if (socket && getServiceConnectionStatus(service) && isPageVisible && isPageActive && isOnline) {
      // 发送心跳包
      const startTime = Date.now()
      socket.emit('ping', () => {
        const latency = Date.now() - startTime
        const quality = connectionQuality.get(service)!
        quality.lastPing = Date.now()
        quality.pingCount++
        quality.avgPingTime = (quality.avgPingTime * (quality.pingCount - 1) + latency) / quality.pingCount
        
        console.log(`💓 增强WebSocket管理器：${service} 心跳成功，延时 ${latency}ms`)
      })
      
      // 设置心跳超时
      setTimeout(() => {
        const quality = connectionQuality.get(service)!
        quality.failedPings++
        console.warn(`⚠️ 增强WebSocket管理器：${service} 心跳超时`)
        
        // 如果连续心跳失败，考虑重连
        if (quality.failedPings >= 3) {
          console.warn(`⚠️ 增强WebSocket管理器：${service} 连续心跳失败，考虑重连`)
          quality.failedPings = 0
          // 这里可以触发重连逻辑
        }
      }, 10000) // 10秒超时
    } else {
      stopServiceHeartbeat(service)
    }
  }, 30000) // 30秒发送一次心跳
  
  heartbeatTimers.set(service, timer)
}

// 停止服务特定心跳检测
const stopServiceHeartbeat = (service: string) => {
  const timer = heartbeatTimers.get(service)
  if (timer) {
    clearInterval(timer)
    heartbeatTimers.delete(service)
  }
}

// 暂停所有心跳检测
const pauseAllHeartbeats = () => {
  heartbeatTimers.forEach((timer, service) => {
    clearInterval(timer)
  })
  heartbeatTimers.clear()
  console.log('⏸️ 所有心跳检测已暂停')
}

// 恢复所有心跳检测
const resumeAllHeartbeats = () => {
  connectionStatus.forEach((connected, service) => {
    if (connected) {
      startServiceHeartbeat(service)
    }
  })
  console.log('▶️ 所有心跳检测已恢复')
}

// 启动全局心跳检测
const startGlobalHeartbeat = () => {
  setInterval(() => {
    if (!isPageVisible || !isPageActive || !isOnline) {
      return
    }
    
    // 检查所有连接状态
    const status = getUnifiedConnectionStatus()
    const disconnectedServices = Object.entries(status).filter(([_, connected]) => !connected)
    
    if (disconnectedServices.length > 0) {
      console.log('🔍 全局心跳检测：发现断开连接，尝试重连...', disconnectedServices.map(([service]) => service))
      reconnectEnhancedWebSockets()
    }
  }, 60000) // 每分钟检查一次
}

// 启动连接质量监控
const startConnectionQualityMonitoring = () => {
  setInterval(() => {
    connectionQuality.forEach((quality, service) => {
      if (quality.pingCount > 0) {
        console.log(`📊 ${service} 连接质量: 平均延迟 ${quality.avgPingTime.toFixed(2)}ms, 失败次数 ${quality.failedPings}`)
        
        // 如果平均延迟过高，考虑优化
        if (quality.avgPingTime > 1000) {
          console.warn(`⚠️ ${service} 连接延迟过高: ${quality.avgPingTime.toFixed(2)}ms`)
        }
      }
    })
  }, 300000) // 5分钟检查一次连接质量
}

// 检查并重连断开的服?
// 检查并重连断开连接的服务（已废弃，使用 performSmartReconnect 替代）
const checkAndReconnectDisconnectedServices = () => {
  console.log('⚠️ 使用已废弃的重连方法，建议使用 performSmartReconnect')
  performSmartReconnect()
}

// 断开所有WebSocket连接
export const disconnectEnhancedWebSockets = () => {
  console.log('🔌 增强WebSocket管理器：断开所有连接...')
  
  // 清理防抖定时器
  if (reconnectDebounceTimer) {
    clearTimeout(reconnectDebounceTimer)
    reconnectDebounceTimer = null
  }
  
  // 停止所有心跳检测
  heartbeatTimers.forEach((timer, service) => {
    clearInterval(timer)
  })
  heartbeatTimers.clear()
  
  // 断开所有连接
  sockets.forEach((socket, service) => {
    socket.disconnect()
    connectionStatus.set(service, false)
    reconnectionStatus.set(service, false)
  })
  
  sockets.clear()
  
  // 重置初始化状态
  isInitialized = false
}

// 手动重连所有服务
export const reconnectEnhancedWebSockets = () => {
  console.log('🔄 增强WebSocket管理器：手动重连所有服务...')
  
  // 检查是否有正在重连的服务
  const reconnectingServices = Array.from(reconnectionStatus.entries()).filter(([_, reconnecting]) => reconnecting)
  if (reconnectingServices.length > 0) {
    console.log('🔄 增强WebSocket管理器：有服务正在重连中，跳过手动重连')
    return
  }
  
  // 使用智能重连逻辑
  performSmartReconnect()
}

// 获取所有连接状态
export const getUnifiedConnectionStatus = () => {
  const status: Record<string, boolean> = {}
  connectionStatus.forEach((connected, service) => {
    status[service] = connected
  })
  return status
}

// 获取特定服务的连接状态
export const getServiceConnectionStatus = (service: string): boolean => {
  return connectionStatus.get(service) || false
}

// 获取重连状态
export const getReconnectionStatus = (service: string): boolean => {
  return reconnectionStatus.get(service) || false
}

// 获取WebSocket实例
export const getServiceSocket = (service: string): Socket | null => {
  return sockets.get(service) || null
}

// 获取连接质量信息
export const getConnectionQuality = (service: string) => {
  return connectionQuality.get(service)
}

// 获取网络状态信息
export const getNetworkStatus = () => {
  return {
    isOnline,
    quality: networkMonitor.networkQuality,
    consecutiveFailures: networkMonitor.consecutiveFailures
  }
}

// 获取页面活动状态
export const getActivityStatus = () => {
  return {
    isActive: activityMonitor.isActive,
    lastActivity: activityMonitor.lastActivity,
    timeSinceLastActivity: Date.now() - activityMonitor.lastActivity
  }
}

// 事件监听管理
export const addUnifiedEventListener = (event: string, listener: Function) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, [])
  }
  
  // 新增：检查是否已经存在相同的监听器
  const listeners = eventListeners.get(event)!
  const listenerExists = listeners.some(existingListener => {
    // 比较函数引用和函数名
    return existingListener === listener || 
           (existingListener.name && existingListener.name === listener.name) ||
           (existingListener.toString() === listener.toString())
  })
  
  if (listenerExists) {
    console.log(`⚠️ 事件监听器已存在，跳过重复添加: ${event}`)
    return
  }
  
  listeners.push(listener)
  console.log(`✅ 添加事件监听器: ${event}, 当前监听器数量: ${listeners.length}`)
}

export const removeUnifiedEventListener = (event: string, listener: Function) => {
  const listeners = eventListeners.get(event)
  if (listeners) {
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
      console.log(`✅ 移除事件监听器: ${event}, 剩余监听器数量: ${listeners.length}`)
    } else {
      console.log(`⚠️ 未找到要移除的事件监听器: ${event}`)
    }
  }
}

// 新增：清理特定事件的所有监听器
export const clearEventListeners = (event: string) => {
  if (eventListeners.has(event)) {
    const count = eventListeners.get(event)!.length
    eventListeners.delete(event)
    console.log(`🧹 清理事件 ${event} 的所有监听器，共 ${count} 个`)
  }
}

// 新增：获取特定事件的监听器数量
export const getEventListenerCount = (event: string): number => {
  const listeners = eventListeners.get(event)
  return listeners ? listeners.length : 0
}

// 发送事件
const emitEvent = (event: string, data: any) => {
  console.log(`📤 发送事件 ${event}`, data)
  const listeners = eventListeners.get(event)
  if (listeners) {
    console.log(`📤 找到 ${listeners.length} 个监听器`)
    listeners.forEach((listener, index) => {
      try {
        console.log(`📤 执行监听器${index + 1}`)
        listener(data)
      } catch (error) {
        console.error(`事件监听器执行错误(${event}):`, error)
      }
    })
  } else {
    console.log(`📤 没有找到事件 ${event} 的监听器`)
  }
}

// 发送消息到特定服务
export const sendToService = (service: string, event: string, data?: any) => {
  const socket = getServiceSocket(service)
  if (socket && getServiceConnectionStatus(service)) {
    socket.emit(event, data)
    return true
  } else {
    console.warn(`⚠️ 增强WebSocket管理器：${service} 服务未连接，无法发送消息`)
    return false
  }
}

// 页面可见性变化处理
const handleVisibilityChange = () => {
  const wasVisible = isPageVisible
  isPageVisible = document.visibilityState === 'visible'
  
  console.log(`👁️ 页面可见性变化: ${wasVisible} -> ${isPageVisible}`)
  
  if (isPageVisible && !wasVisible) {
    console.log('👁️ 页面变为可见，智能检查WebSocket连接状态...')
    // 使用防抖机制，避免频繁重连
    scheduleSmartReconnect()
  } else if (!isPageVisible && wasVisible) {
    console.log('👁️ 页面变为隐藏，暂停心跳检测')
    pauseAllHeartbeats()
  }
}

// 页面焦点变化处理
const handleFocusChange = () => {
  const wasActive = isPageActive
  isPageActive = document.hasFocus()
  
  console.log(`🎯 页面焦点变化: ${wasActive} -> ${isPageActive}`)
  
  if (isPageActive && !wasActive) {
    console.log('🎯 页面获得焦点，智能检查WebSocket连接状态...')
    // 使用防抖机制，避免频繁重连
    scheduleSmartReconnect()
  }
}

// 智能重连调度（带防抖）
const scheduleSmartReconnect = () => {
  // 清除之前的防抖定时器
  if (reconnectDebounceTimer) {
    clearTimeout(reconnectDebounceTimer)
  }
  
  // 检查重连间隔
  const now = Date.now()
  if (now - lastReconnectTime < MIN_RECONNECT_INTERVAL) {
    console.log('⏰ 距离上次重连时间太短，跳过重连')
    return
  }
  
  // 设置防抖定时器
  reconnectDebounceTimer = setTimeout(() => {
    console.log('🔄 执行智能重连检查...')
    performSmartReconnect()
  }, RECONNECT_DEBOUNCE_DELAY)
}

// 执行智能重连
const performSmartReconnect = () => {
  const now = Date.now()
  lastReconnectTime = now
  
  // 检查网络状态
  if (!isOnline) {
    console.log('🌐 网络未连接，跳过重连')
    return
  }
  
  // 检查页面状态
  if (!isPageVisible || !isPageActive) {
    console.log('📱 页面不可见或无焦点，跳过重连')
    return
  }
  
  // 检查连接状态
  const status = getUnifiedConnectionStatus()
  const disconnectedServices = Object.entries(status).filter(([_, connected]) => !connected)
  
  if (disconnectedServices.length === 0) {
    console.log('✅ 所有服务连接正常，无需重连')
    return
  }
  
  console.log('🔍 发现断开连接的服务，执行智能重连:', disconnectedServices.map(([service]) => service))
  
  // 只重连断开连接的服务，而不是重新初始化所有连接
  disconnectedServices.forEach(([service]) => {
    reconnectService(service)
  })
}

// 重连单个服务
const reconnectService = (service: string) => {
  // 检查是否正在重连
  if (reconnectionStatus.get(service)) {
    console.log(`🔄 ${service} 正在重连中，跳过`)
    return
  }
  
  console.log(`🔄 重连服务: ${service}`)
  reconnectionStatus.set(service, true)
  
  // 断开现有连接
  const existingSocket = sockets.get(service)
  if (existingSocket) {
    existingSocket.disconnect()
    sockets.delete(service)
    connectionStatus.set(service, false)
  }
  
  // 重新初始化连接
  const namespace = WEBSOCKET_CONFIG.namespaces[service as keyof typeof WEBSOCKET_CONFIG.namespaces]
  if (namespace) {
    setTimeout(() => {
      initServiceSocket(service, namespace)
      reconnectionStatus.set(service, false)
    }, 1000)
  }
}

// 页面加载完成时初始化
if (typeof window !== 'undefined') {
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 监听页面焦点变化
  window.addEventListener('focus', handleFocusChange)
  window.addEventListener('blur', handleFocusChange)
  
  // 页面加载完成后初始化WebSocket
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedWebSockets)
  } else {
    initEnhancedWebSockets()
  }
  
  // 页面卸载时清理
  window.addEventListener('beforeunload', disconnectEnhancedWebSockets)
}

// 导出服务方法（保持与原有接口兼容）
export const dataCollectionService = {
  getStatus: () => sendToService('dataCollection', 'get_data_collection_status'),
  getRunningTasks: () => sendToService('dataCollection', 'get_running_tasks'),
  getTaskStatus: (taskId: string) => sendToService('dataCollection', 'get_task_status', { task_id: taskId }),
  startCollection: (data: any) => sendToService('dataCollection', 'start_collection_task', data),
  startBasicDataCollection: (data: any) => sendToService('dataCollection', 'collect_basic_data', data),
  startDailyDataCollection: (data: any) => sendToService('dataCollection', 'collect_daily_data', data),
  startNewsCollection: (data: any) => sendToService('dataCollection', 'collect_news', data),
  startFundamentalCollection: (data: any) => sendToService('dataCollection', 'collect_fundamental_data', data),
  startTechnicalCollection: (data: any) => sendToService('dataCollection', 'collect_technical_data', data)
}

export const aiAnalysisService = {
  getStatus: () => sendToService('aiAnalysis', 'get_ai_analysis_status'),
  getRunningTasks: () => sendToService('aiAnalysis', 'get_running_tasks'),
  getTaskStatus: (taskId: string) => sendToService('aiAnalysis', 'get_task_status', { task_id: taskId }),
  startAnalysis: (data: any) => sendToService('aiAnalysis', 'start_ai_analysis_task', data),
  startTechnicalAnalysis: (data: any) => sendToService('aiAnalysis', 'start_technical_analysis', data),
  startFundamentalAnalysis: (data: any) => sendToService('aiAnalysis', 'start_fundamental_analysis', data),
  startSentimentAnalysis: (data: any) => sendToService('aiAnalysis', 'start_sentiment_analysis', data),
  startRiskAnalysis: (data: any) => sendToService('aiAnalysis', 'start_risk_analysis', data),
  startTrendAnalysis: (data: any) => sendToService('aiAnalysis', 'start_trend_analysis', data),
  startInvestmentAdvice: (data: any) => sendToService('aiAnalysis', 'start_investment_advice', data),
  startComprehensiveAnalysis: (data: any) => sendToService('aiAnalysis', 'start_comprehensive_analysis', data),
  startPortfolioAnalysis: (data: any) => sendToService('aiAnalysis', 'start_portfolio_analysis', data),
  startMarketAnalysis: (data: any) => sendToService('aiAnalysis', 'start_market_analysis', data)
}

export const newsAnalysisService = {
  getStatus: () => sendToService('newsAnalysis', 'get_news_analysis_status'),
  getRunningTasks: () => sendToService('newsAnalysis', 'get_running_tasks'),
  getTaskStatus: (taskId: string) => sendToService('newsAnalysis', 'get_task_status', { task_id: taskId }),
  startAnalysis: (data: any) => sendToService('newsAnalysis', 'start_news_analysis_task', data),
  startStockNewsAnalysis: (data: any) => sendToService('newsAnalysis', 'start_stock_news_analysis', data),
  startIndustryNewsAnalysis: (data: any) => sendToService('newsAnalysis', 'start_industry_news_analysis', data),
  startMarketNewsAnalysis: (data: any) => sendToService('newsAnalysis', 'start_market_news_analysis', data),
  startSentimentAnalysis: (data: any) => sendToService('newsAnalysis', 'start_sentiment_analysis', data),
  startKeywordExtraction: (data: any) => sendToService('newsAnalysis', 'start_keyword_extraction', data),
  startTrendAnalysis: (data: any) => sendToService('newsAnalysis', 'start_trend_analysis', data)
}

export const backtestService = {
  getStatus: () => sendToService('backtest', 'get_backtest_status'),
  getRunningTasks: () => sendToService('backtest', 'get_running_tasks'),
  getTaskStatus: (taskId: string) => sendToService('backtest', 'get_task_status', { task_id: taskId }),
  startBacktest: (data: any) => sendToService('backtest', 'start_backtest', data),
  stopBacktest: (taskId: string) => sendToService('backtest', 'cancel_backtest', { task_id: taskId }),
  getAvailableStrategies: () => sendToService('backtest', 'get_available_strategies'),
  getStrategyParameters: (strategyId: string) => sendToService('backtest', 'get_strategy_parameters', { strategy_id: strategyId }),
  getAvailableStocks: () => sendToService('backtest', 'get_available_stocks'),
  getStockDailyData: (stockCode: string, startDate?: string, endDate?: string) => sendToService('backtest', 'get_stock_daily_data', {
    stock_code: stockCode,
    start_date: startDate,
    end_date: endDate
  }),
  joinTaskRoom: (taskId: string) => sendToService('backtest', 'join_task_room', { task_id: taskId }),
  leaveTaskRoom: (taskId: string) => sendToService('backtest', 'leave_task_room', { task_id: taskId })
}

export const schedulerService = {
  getStatus: () => sendToService('scheduler', 'get_scheduler_status'),
  getRunningTasks: () => sendToService('scheduler', 'get_running_tasks'),
  getTaskStatus: (taskId: string) => sendToService('scheduler', 'get_task_status', { task_id: taskId }),
  startTask: (data: any) => sendToService('scheduler', 'start_task', data),
  stopTask: (taskId: string) => sendToService('scheduler', 'stop_task', { task_id: taskId }),
  getUpdateLogs: () => sendToService('scheduler', 'get_update_logs')
}

export default {
  initEnhancedWebSockets,
  disconnectEnhancedWebSockets,
  reconnectEnhancedWebSockets,
  getUnifiedConnectionStatus,
  getServiceConnectionStatus,
  getReconnectionStatus,
  getServiceSocket,
  getConnectionQuality,
  getNetworkStatus,
  getActivityStatus,
  addUnifiedEventListener,
  removeUnifiedEventListener,
  clearEventListeners,
  getEventListenerCount,
  sendToService,
  dataCollectionService,
  aiAnalysisService,
  newsAnalysisService,
  backtestService,
  schedulerService
} 
