import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getServiceSocket, 
  addUnifiedEventListener, 
  removeUnifiedEventListener,
  clearEventListeners,
  getEventListenerCount
} from '@/utils/unifiedWebSocketManager'
import unifiedHttpClient from '@/utils/unifiedHttpClient'

// 新增：全局单例管理，确保事件监听器只注册一次
let globalEventListenersRegistered = false
let globalMessageHistory = new Map<string, number>()
const GLOBAL_MESSAGE_DEDUP_INTERVAL = 2000

// 全局安全的ElMessage函数
const globalSafeElMessage = (type: 'success' | 'info' | 'warning' | 'error', message: string) => {
  const messageKey = `${type}_${message}`
  const now = Date.now()
  const lastTime = globalMessageHistory.get(messageKey) || 0
  
  if (now - lastTime > GLOBAL_MESSAGE_DEDUP_INTERVAL) {
    ElMessage[type](message)
    globalMessageHistory.set(messageKey, now)
    console.log(`📢 [全局] 显示消息: ${type} - ${message}`)
  } else {
    console.log(`⏭️ [全局] 跳过重复消息: ${type} - ${message}`)
  }
}

// 清理全局消息历史
const cleanupGlobalMessageHistory = () => {
  const now = Date.now()
  const expiredKeys: string[] = []
  
  globalMessageHistory.forEach((timestamp, key) => {
    if (now - timestamp > GLOBAL_MESSAGE_DEDUP_INTERVAL * 2) {
      expiredKeys.push(key)
    }
  })
  
  expiredKeys.forEach(key => {
    globalMessageHistory.delete(key)
  })
  
  if (expiredKeys.length > 0) {
    console.log(`🧹 [全局] 清理了 ${expiredKeys.length} 条过期消息历史`)
  }
}

// 定期清理全局消息历史
setInterval(cleanupGlobalMessageHistory, 10000)

export interface BacktestProgress {
  progress: number
  message: string
  status: 'success' | 'exception' | 'warning'
}

export interface BacktestResult {
  id: number
  strategy_id: string
  stock_code: string
  start_date: string
  end_date: string
  initial_capital: number
  final_capital: number
  total_return: number
  annual_return: number
  sharpe_ratio: number
  sortino_ratio: number
  max_drawdown: number
  win_rate: number
  beta: number
  profit_factor: number
  expectancy: number
  volatility: number
  calmar_ratio: number
  information_ratio: number
  var_95: number
  cvar_95: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  status: string
  parameters: any
  portfolio_history: any[]
  ai_analysis_report: string
  sentiment_score: number
  created_at: string
  updated_at: string
}

export interface TradeRecord {
  id: number
  backtest_result_id: number
  stock_code: string
  trade_date: string
  trade_type: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  commission: number
  reason: string
  signal_strength: number
  position_before: number
  position_after: number
  cash_before: number
  cash_after: number
  created_at: string
}

export function useBacktestWebSocket() {
  // 状态
  const isConnected = ref(false)
  const isRunning = ref(false)
  const currentProgress = ref<BacktestProgress>({
    progress: 0,
    message: '',
    status: 'success'
  })
  const currentResult = ref<BacktestResult | null>(null)
  const currentTrades = ref<TradeRecord[]>([])
  const currentTaskId = ref<string | null>(null)
  
  // 新增：策略和股票列表
  const availableStrategies = ref<any[]>([])
  const availableStocks = ref<any[]>([])
  const loadingStrategies = ref(false)
  const loadingStocks = ref(false)

  // 防抖机制：避免频繁显示进度消息
  const lastProgressMessage = ref(0)
  const lastTaskStartedMessage = ref(0)
  const lastCompleteMessage = ref(0)
  const lastErrorMessage = ref(0)
  const PROGRESS_MESSAGE_INTERVAL = 5000 // 5秒内不重复显示相同进度的消息
  const TASK_MESSAGE_INTERVAL = 10000 // 10秒内不重复显示任务启动消息
  const COMPLETE_MESSAGE_INTERVAL = 3000 // 3秒内不重复显示完成消息
  const ERROR_MESSAGE_INTERVAL = 5000 // 5秒内不重复显示错误消息

  // 防止事件监听器重复注册
  const eventListenersRegistered = ref(false)
  
  // 新增：记录已注册的事件监听器，防止重复注册
  const registeredEventListeners = ref<Set<string>>(new Set())

  // 任务启动消息去重：记录已显示启动消息的任务ID
  const shownTaskStartMessages = ref<Set<string>>(new Set())

  // 新增：进度消息去重 - 记录最近显示的进度值
  const lastShownProgress = ref<number>(-1)

  // 新增：全局消息去重机制
  const messageHistory = ref<Map<string, number>>(new Map())
  const MESSAGE_DEDUP_INTERVAL = 2000 // 2秒内不重复显示相同消息

  // 新增：安全的ElMessage函数，带去重机制
  const safeElMessage = (type: 'success' | 'info' | 'warning' | 'error', message: string) => {
    // 使用全局消息去重机制
    globalSafeElMessage(type, message)
  }

  // 新增：清理过期的消息历史
  const cleanupMessageHistory = () => {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    messageHistory.value.forEach((timestamp, key) => {
      if (now - timestamp > MESSAGE_DEDUP_INTERVAL * 2) {
        expiredKeys.push(key)
      }
    })
    
    expiredKeys.forEach(key => {
      messageHistory.value.delete(key)
    })
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 清理了 ${expiredKeys.length} 条过期消息历史`)
    }
  }

  // 定期清理消息历史
  setInterval(cleanupMessageHistory, 10000)

  // 事件处理
  const handleConnect = () => {
    console.log('🔗 回测WebSocket连接成功')
    isConnected.value = true
  }

  const handleDisconnect = () => {
    console.log('🔌 回测WebSocket连接断开')
    isConnected.value = false
  }

  const handleProgress = (data: BacktestProgress) => {
    console.log('📊 回测进度更新:', data)
    
    // 检查是否是关键进度节点（只在特定进度点显示消息）
    const keyProgressPoints = [0, 25, 50, 75, 100]
    const previousProgress = currentProgress.value.progress
    const currentProgressValue = data.progress
    const now = Date.now()
    
    // 增强防抖：避免频繁显示相同进度的消息
    const shouldShowMessage = 
      (keyProgressPoints.includes(currentProgressValue) && 
       currentProgressValue !== lastShownProgress.value &&
       (now - lastProgressMessage.value > PROGRESS_MESSAGE_INTERVAL)) ||
      (currentProgressValue === 100 && previousProgress < 100) ||
      (data.status === 'exception' && previousProgress !== 0 && 
       (now - lastErrorMessage.value > ERROR_MESSAGE_INTERVAL))
    
    currentProgress.value = data
    isRunning.value = data.progress < 100
    
    // 只在关键节点显示消息
    if (shouldShowMessage) {
      if (currentProgressValue === 100) {
        lastProgressMessage.value = now
        lastShownProgress.value = currentProgressValue
        safeElMessage('success', '回测进度：100% - 即将完成')
      } else if (currentProgressValue > 0) {
        lastProgressMessage.value = now
        lastShownProgress.value = currentProgressValue
        safeElMessage('info', `回测进度：${currentProgressValue}%`)
      } else if (data.status === 'exception') {
        lastErrorMessage.value = now
        safeElMessage('error', `回测异常：${data.message}`)
      }
    }
  }

  const handleComplete = (data: { result: BacktestResult; trades: TradeRecord[] }) => {
    console.log('✅ 回测完成:', data)
    
    const now = Date.now()
    // 防抖：避免重复显示完成消息
    if (now - lastCompleteMessage.value > COMPLETE_MESSAGE_INTERVAL) {
      lastCompleteMessage.value = now
      safeElMessage('success', '🎉 回测完成！结果已生成')
    }
    
    currentResult.value = data.result
    currentTrades.value = data.trades || []
    currentProgress.value = {
      progress: 100,
      message: '回测完成',
      status: 'success'
    }
    isRunning.value = false
  }

  const handleError = (data: { error: string }) => {
    console.log('❌ 回测错误:', data)
    
    const now = Date.now()
    // 防抖：避免重复显示错误消息
    if (now - lastErrorMessage.value > ERROR_MESSAGE_INTERVAL) {
      lastErrorMessage.value = now
      safeElMessage('error', `❌ 回测失败: ${data.error}`)
    }
    
    currentProgress.value = {
      progress: 0,
      message: data.error,
      status: 'exception'
    }
    isRunning.value = false
  }

  const handleTradeEvent = (data: TradeRecord) => {
    console.log('💰 交易事件:', data)
    currentTrades.value.push(data)
    
    // 不显示交易事件消息，避免频繁弹窗
    // 只在控制台记录，用户可以通过交易记录表格查看
  }

  const handleTaskStarted = (data: { task_id: string }) => {
    console.log('🚀 回测任务开始:', data)
    
    const taskId = data.task_id
    const now = Date.now()
    
    // 检查是否已经为这个任务显示过启动消息
    if (shownTaskStartMessages.value.has(taskId)) {
      console.log(`⚠️ 任务 ${taskId} 的启动消息已显示过，跳过重复显示`)
      return
    }
    
    // 防抖：避免重复显示任务启动消息
    if (now - lastTaskStartedMessage.value > TASK_MESSAGE_INTERVAL) {
      lastTaskStartedMessage.value = now
      safeElMessage('success', '🚀 回测任务已启动，正在处理数据...')
      
      // 记录已显示启动消息的任务ID
      shownTaskStartMessages.value.add(taskId)
      
      // 清理过期的任务ID（保留最近10个）
      if (shownTaskStartMessages.value.size > 10) {
        const taskIds = Array.from(shownTaskStartMessages.value)
        shownTaskStartMessages.value = new Set(taskIds.slice(-10))
      }
    }
    
    currentTaskId.value = taskId
    isRunning.value = true
    currentProgress.value = {
      progress: 0,
      message: '回测任务已启动',
      status: 'success'
    }
  }

  // 新增：处理策略列表响应
  const handleStrategiesResponse = (data: any[]) => {
    console.log('收到策略列表:', data)
    availableStrategies.value = data
    loadingStrategies.value = false
  }

  // 新增：处理股票列表响应
  const handleStocksResponse = (data: any[]) => {
    console.log('收到股票列表:', data)
    availableStocks.value = data
    loadingStocks.value = false
  }

  // 开始回测
  const startBacktest = async (config: {
    strategy_id: string
    stock_code: string
    start_date: string
    end_date: string
    initial_capital: number
    parameters: any
  }) => {
    console.log('🚀 开始回测，配置:', config)
    
    try {
      const socket = getServiceSocket('backtest')
      if (!socket || !socket.connected) {
        console.error('❌ 回测WebSocket未连接')
        safeElMessage('error', '回测服务未连接，请检查连接状态')
        return
      }
      
      console.log('📡 发送start_backtest事件到后端...')
      socket.emit('start_backtest', config)
      
      // 新增：设置启动超时检查，但只在没有任务ID时才显示超时提示
      setTimeout(() => {
        if (!currentTaskId.value) {
          console.log('❌ 回测启动超时，显示超时提示')
          safeElMessage('warning', '回测启动超时，请检查后端服务状态')
        } else {
          console.log('✅ 检测到任务ID已存在，忽略超时提示')
        }
      }, 10000)
      
      console.log('📡 start_backtest事件已发送，等待响应...')
      
    } catch (error) {
      console.error('❌ 启动回测失败:', error)
      safeElMessage('error', '启动回测失败')
    }
  }

  const stopBacktest = () => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      safeElMessage('error', 'WebSocket连接未建立')
      return false
    }

    if (currentTaskId.value) {
      socket.emit('cancel_backtest', { task_id: currentTaskId.value })
      return true
    }
    return false
  }

  const getBacktestStatus = () => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      return false
    }

    socket.emit('get_backtest_status', {})
    return true
  }

  const getRunningTasks = () => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      return false
    }

    socket.emit('get_running_tasks', {})
    return true
  }

  const getAvailableStrategies = () => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      // 如果WebSocket未连接，尝试使用HTTP API
      return loadStrategiesViaHttp()
    }

    loadingStrategies.value = true
    socket.emit('get_available_strategies')
    return true
  }

  const getStrategyParameters = (strategyId: string) => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      return false
    }

    socket.emit('get_strategy_parameters', { strategy_id: strategyId })
    return true
  }

  const getAvailableStocks = () => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      // 如果WebSocket未连接，尝试使用HTTP API
      return loadStocksViaHttp()
    }

    loadingStocks.value = true
    socket.emit('get_available_stocks')
    return true
  }

  // 新增：通过HTTP API加载策略
  const loadStrategiesViaHttp = async () => {
    try {
      loadingStrategies.value = true
      const response = await unifiedHttpClient.backtest.getAvailableStrategies()
      availableStrategies.value = response.data || []
      return true
    } catch (error) {
      console.error('HTTP加载策略失败:', error)
      return false
    } finally {
      loadingStrategies.value = false
    }
  }

  // 新增：通过HTTP API加载股票
  const loadStocksViaHttp = async () => {
    try {
      loadingStocks.value = true
      const response = await unifiedHttpClient.backtest.getAvailableStocks()
      availableStocks.value = response.data || []
      return true
    } catch (error) {
      console.error('HTTP加载股票失败:', error)
      return false
    } finally {
      loadingStocks.value = false
    }
  }

  const getStockDailyData = (stockCode: string, startDate?: string, endDate?: string) => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      return false
    }

    socket.emit('get_stock_daily_data', {
      stock_code: stockCode,
      start_date: startDate,
      end_date: endDate
    })
    return true
  }

  // 加入任务房间
  const joinTaskRoom = (taskId: string) => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      return false
    }

    socket.emit('join_task_room', { task_id: taskId })
    return true
  }

  // 离开任务房间
  const leaveTaskRoom = (taskId: string) => {
    const socket = getServiceSocket('backtest')
    if (!socket || !isConnected.value) {
      return false
    }

    socket.emit('leave_task_room', { task_id: taskId })
    return true
  }

  // 重置状态
  const resetState = () => {
    currentProgress.value = {
      progress: 0,
      message: '',
      status: 'success'
    }
    currentResult.value = null
    currentTrades.value = []
    isRunning.value = false
    currentTaskId.value = null
    
    // 清理任务启动消息记录
    shownTaskStartMessages.value.clear()
    
    // 重置防抖时间戳
    lastProgressMessage.value = 0
    lastTaskStartedMessage.value = 0
    lastCompleteMessage.value = 0
    lastErrorMessage.value = 0
    
    // 新增：重置进度消息去重记录
    lastShownProgress.value = -1
    
    // 新增：清理消息历史
    messageHistory.value.clear()
    console.log('🧹 已清理消息历史')
  }

  // 新增：强制重置全局状态
  const forceResetGlobalState = () => {
    console.log('🔄 强制重置全局状态...')
    
    // 重置全局标志
    globalEventListenersRegistered = false
    
    // 清理全局消息历史
    globalMessageHistory.clear()
    
    // 重置本地状态
    eventListenersRegistered.value = false
    registeredEventListeners.value.clear()
    
    // 清理所有事件监听器
    forceCleanupEventListeners()
    
    console.log('🔄 全局状态重置完成')
  }

  // 主动检查连接状态
  const checkConnectionStatus = () => {
    const socket = getServiceSocket('backtest')
    if (socket) {
      const connected = socket.connected
      console.log('主动检查回测连接状态:', connected)
      isConnected.value = connected
      return connected
    }
    console.log('回测WebSocket未初始化')
    isConnected.value = false
    return false
  }

  // 手动重连回测服务
  const reconnectBacktest = () => {
    console.log('手动重连回测服务...')
    const socket = getServiceSocket('backtest')
    if (socket && !socket.connected) {
      socket.connect()
    }
  }

  // 新增：安全的事件监听器注册函数
  const safeAddEventListener = (event: string, handler: Function) => {
    const listenerKey = `${event}_${handler.name || 'anonymous'}`
    
    // 检查是否已经注册过这个监听器
    if (registeredEventListeners.value.has(listenerKey)) {
      console.log(`⚠️ 事件监听器 ${listenerKey} 已存在，跳过重复注册`)
      return
    }
    
    // 检查统一事件管理器中是否已存在相同的监听器
    const currentCount = getEventListenerCount(event)
    if (currentCount > 0) {
      console.log(`⚠️ 事件 ${event} 已有 ${currentCount} 个监听器，先清理再注册`)
      clearEventListeners(event)
    }
    
    // 注册监听器
    addUnifiedEventListener(event, handler)
    registeredEventListeners.value.add(listenerKey)
    console.log(`✅ 成功注册事件监听器: ${listenerKey}`)
  }

  // 新增：安全的事件监听器移除函数
  const safeRemoveEventListener = (event: string, handler: Function) => {
    const listenerKey = `${event}_${handler.name || 'anonymous'}`
    
    if (registeredEventListeners.value.has(listenerKey)) {
      removeUnifiedEventListener(event, handler)
      registeredEventListeners.value.delete(listenerKey)
      console.log(`✅ 成功移除事件监听器: ${listenerKey}`)
    }
  }

  // 新增：调试函数 - 检查事件监听器状态
  const debugEventListeners = () => {
    console.log('🔍 事件监听器状态检查:')
    const eventsToCheck = [
      'backtestConnected',
      'connected', 
      'backtest_progress',
      'backtest_completed',
      'backtest_error',
      'trade_event',
      'backtest_task_started',
      'backtest_started',
      'strategies_response',
      'stocks_response',
      'backtestEvent'
    ]
    
    eventsToCheck.forEach(event => {
      const count = getEventListenerCount(event)
      console.log(`  ${event}: ${count} 个监听器`)
    })
    
    console.log(`已注册记录数量: ${registeredEventListeners.value.size}`)
    console.log(`事件监听器注册标志: ${eventListenersRegistered.value}`)
  }

  // 新增：强制清理所有事件监听器
  const forceCleanupEventListeners = () => {
    console.log('🧹 强制清理所有事件监听器...')
    
    // 清理关键事件的所有监听器
    const eventsToClean = [
      'backtestConnected',
      'connected', 
      'backtest_progress',
      'backtest_completed',
      'backtest_error',
      'trade_event',
      'backtest_task_started',
      'backtest_started',
      'strategies_response',
      'stocks_response',
      'backtestEvent'
    ]
    
    eventsToClean.forEach(event => {
      const count = getEventListenerCount(event)
      if (count > 0) {
        console.log(`🧹 清理事件 ${event}，当前监听器数量: ${count}`)
        clearEventListeners(event)
      }
    })
    
    // 清理已注册的记录
    registeredEventListeners.value.clear()
    
    // 重置注册标志
    eventListenersRegistered.value = false
    
    console.log('🧹 事件监听器强制清理完成')
  }

  // 生命周期
  onMounted(() => {
    console.log('🔧 useBacktestWebSocket: 开始初始化事件监听器...')
    
    // 新增：使用全局单例模式，确保事件监听器只注册一次
    if (globalEventListenersRegistered) {
      console.log('⚠️ 全局事件监听器已注册，跳过重复注册')
      return
    }
    
    // 新增：在注册前先强制清理，确保没有残留的监听器
    forceCleanupEventListeners()
    
    // 防止重复注册事件监听器
    if (eventListenersRegistered.value) {
      console.log('⚠️ 事件监听器已注册，跳过重复注册')
      return
    }
    
    // 监听回测服务连接状态
    safeAddEventListener('backtestConnected', (connected: boolean) => {
      console.log('🔗 回测WebSocket连接状态变化:', connected)
      isConnected.value = connected
      if (connected) {
        handleConnect()
      } else {
        handleDisconnect()
      }
    })
    
    // 添加事件监听
    safeAddEventListener('connected', (data: any) => {
      console.log('🔗 收到connected事件:', data)
      handleConnect()
    })
    
    // 监听直接的回测事件
    safeAddEventListener('backtest_progress', (data: any) => {
      console.log('📊 收到backtest_progress事件:', data)
      handleProgress(data)
    })
    
    safeAddEventListener('backtest_completed', (data: any) => {
      console.log('✅ 收到backtest_completed事件:', data)
      handleComplete(data)
    })
    
    safeAddEventListener('backtest_error', (data: any) => {
      console.log('❌ 收到backtest_error事件:', data)
      handleError(data)
    })
    
    safeAddEventListener('trade_event', (data: any) => {
      console.log('💰 收到trade_event事件:', data)
      handleTradeEvent(data)
    })
    
    safeAddEventListener('backtest_task_started', (data: any) => {
      console.log('🚀 收到backtest_task_started事件:', data)
      handleTaskStarted(data)
    })
    
    safeAddEventListener('backtest_started', (data: any) => {
      console.log('🚀 收到backtest_started事件:', data)
      handleTaskStarted(data)
    })
    
    // 新增：监听策略和股票列表响应
    safeAddEventListener('strategies_response', (data: any) => {
      console.log('📋 收到strategies_response事件:', data)
      handleStrategiesResponse(data)
    })
    
    safeAddEventListener('stocks_response', (data: any) => {
      console.log('📈 收到stocks_response事件:', data)
      handleStocksResponse(data)
    })
    
    // 监听服务特定事件（作为备用）
    safeAddEventListener('backtestEvent', (eventData: { event: string; data: any }) => {
      console.log('🔄 收到backtestEvent事件:', eventData)
      const { event, data } = eventData
      switch (event) {
        case 'connected':
          handleConnect()
          break
        case 'backtest_progress':
          handleProgress(data)
          break
        case 'backtest_completed':
          handleComplete(data)
          break
        case 'backtest_error':
          handleError(data)
          break
        case 'trade_event':
          handleTradeEvent(data)
          break
        case 'backtest_task_started':
          handleTaskStarted(data)
          break
        case 'backtest_started':
          handleTaskStarted(data)
          break
        case 'strategies_response':
          handleStrategiesResponse(data)
          break
        case 'stocks_response':
          handleStocksResponse(data)
          break
      }
    })
    
    // 标记事件监听器已注册
    eventListenersRegistered.value = true
    globalEventListenersRegistered = true
    
    // 初始化时检查连接状态
    const socket = getServiceSocket('backtest')
    if (socket) {
      isConnected.value = socket.connected
      console.log('🔧 初始化时回测WebSocket连接状态:', socket.connected)
    } else {
      console.log('⚠️ 初始化时未找到回测WebSocket实例')
    }
    
    console.log('🔧 useBacktestWebSocket: 事件监听器初始化完成')
  })

  onUnmounted(() => {
    console.log('🔧 useBacktestWebSocket: 开始清理事件监听器...')
    
    // 移除事件监听
    safeRemoveEventListener('backtestConnected', () => {})
    safeRemoveEventListener('connected', handleConnect)
    safeRemoveEventListener('backtest_progress', handleProgress)
    safeRemoveEventListener('backtest_completed', handleComplete)
    safeRemoveEventListener('backtest_error', handleError)
    safeRemoveEventListener('trade_event', handleTradeEvent)
    safeRemoveEventListener('backtest_task_started', handleTaskStarted)
    safeRemoveEventListener('backtest_started', handleTaskStarted)
    safeRemoveEventListener('strategies_response', handleStrategiesResponse)
    safeRemoveEventListener('stocks_response', handleStocksResponse)
    safeRemoveEventListener('backtestEvent', () => {})
    
    // 重置事件监听器注册标志
    eventListenersRegistered.value = false
    
    // 清理注册记录
    registeredEventListeners.value.clear()
    
    // 强制清理所有事件监听器
    forceCleanupEventListeners()
    
    console.log('🔧 useBacktestWebSocket: 事件监听器清理完成')
  })

  return {
    // 状态
    isConnected,
    currentProgress,
    currentResult,
    currentTrades,
    isRunning,
    currentTaskId,
    availableStrategies,
    availableStocks,
    loadingStrategies,
    loadingStocks,

    // 方法
    startBacktest,
    stopBacktest,
    getBacktestStatus,
    getRunningTasks,
    getAvailableStrategies,
    getStrategyParameters,
    getAvailableStocks,
    getStockDailyData,
    joinTaskRoom,
    leaveTaskRoom,
    resetState,
    loadStrategiesViaHttp,
    loadStocksViaHttp,
    checkConnectionStatus,
    reconnectBacktest,
    debugEventListeners,
    forceResetGlobalState
  }
} 
