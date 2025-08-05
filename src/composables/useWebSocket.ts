import { reactive } from 'vue'
import unifiedWebSocketManager from '@/utils/unifiedWebSocketManager'

export const useWebSocket = () => {
  // 连接状态
  const connectionStatus = reactive({
    dataCollection: false,
    aiAnalysis: false,
    newsAnalysis: false,
    backtest: false, // 启用回测服务连接状态
    scheduler: false
  })

  // 检查连接状态
  const checkConnectionStatus = () => {
    const status = unifiedWebSocketManager.getUnifiedConnectionStatus()
    Object.assign(connectionStatus, status)
  }

  // 处理连接状态更新
  const handleConnectionStatus = (service: string, connected: boolean) => {
    console.log(`🔗 WebSocket连接状态更新: ${service} = ${connected}`)
    connectionStatus[service as keyof typeof connectionStatus] = connected
  }

  // 初始化WebSocket连接
  const initWebSockets = () => {
    console.log('🚀 初始化WebSocket连接...')
    
    // 初始化WebSocket连接
    unifiedWebSocketManager.initEnhancedWebSockets()
    
    // 监听连接状态
    unifiedWebSocketManager.addUnifiedEventListener('dataCollectionConnected', (connected: boolean) => {
      console.log('📡 添加dataCollection连接状态监听器')
      handleConnectionStatus('dataCollection', connected)
    })
    
    unifiedWebSocketManager.addUnifiedEventListener('aiAnalysisConnected', (connected: boolean) => {
      console.log('📡 添加aiAnalysis连接状态监听器')
      handleConnectionStatus('aiAnalysis', connected)
    })
    
    unifiedWebSocketManager.addUnifiedEventListener('newsAnalysisConnected', (connected: boolean) => {
      console.log('📡 添加newsAnalysis连接状态监听器')
      handleConnectionStatus('newsAnalysis', connected)
    })
    
    unifiedWebSocketManager.addUnifiedEventListener('backtestConnected', (connected: boolean) => {
      console.log('📡 添加backtest连接状态监听器')
      handleConnectionStatus('backtest', connected)
    })
    
    unifiedWebSocketManager.addUnifiedEventListener('schedulerConnected', (connected: boolean) => {
      console.log('📡 添加scheduler连接状态监听器')
      handleConnectionStatus('scheduler', connected)
    })
    
    console.log('✅ WebSocket连接初始化完成')
  }

  // 清理WebSocket连接
  const cleanupWebSockets = () => {
    // 清理事件监听器
    unifiedWebSocketManager.removeUnifiedEventListener('dataCollectionConnected', handleConnectionStatus)
    unifiedWebSocketManager.removeUnifiedEventListener('aiAnalysisConnected', handleConnectionStatus)
    unifiedWebSocketManager.removeUnifiedEventListener('newsAnalysisConnected', handleConnectionStatus)
    unifiedWebSocketManager.removeUnifiedEventListener('backtestConnected', handleConnectionStatus)
    unifiedWebSocketManager.removeUnifiedEventListener('schedulerConnected', handleConnectionStatus)
  }

  // 添加任务事件监听器
  const addTaskEventListeners = (handlers: {
    taskUpdate?: (data: any) => void
    scheduledTasksUpdate?: (data: any) => void
    scheduledTaskEvent?: (data: any) => void
  }) => {
    console.log('📡 添加任务事件监听器...')
    
    if (handlers.taskUpdate) {
      // 监听所有任务相关事件
      const taskEvents = [
        'task_started', 'task_progress', 'task_completed', 'task_failed',
        'task_progress_detailed', 'task_connected', 'task_batch_start',
        'task_batch_complete', 'task_cleanup', 'task_error'
      ]
      
      taskEvents.forEach(event => {
        unifiedWebSocketManager.addUnifiedEventListener(event, handlers.taskUpdate!)
        console.log(`📡 添加事件监听器: ${event}`)
      })
    }
    
    if (handlers.scheduledTasksUpdate) {
      unifiedWebSocketManager.addUnifiedEventListener('scheduled_jobs', handlers.scheduledTasksUpdate)
    }
    
    if (handlers.scheduledTaskEvent) {
      const scheduledEvents = [
        'scheduled_job_created', 'scheduled_job_deleted', 
        'scheduled_job_paused', 'scheduled_job_resumed'
      ]
      
      scheduledEvents.forEach(event => {
        unifiedWebSocketManager.addUnifiedEventListener(event, handlers.scheduledTaskEvent!)
      })
    }
    
    console.log('✅ 任务事件监听器已设置')
  }

  // 移除任务事件监听器
  const removeTaskEventListeners = (handlers: {
    taskUpdate?: (data: any) => void
    scheduledTasksUpdate?: (data: any) => void
    scheduledTaskEvent?: (data: any) => void
  }) => {
    if (handlers.taskUpdate) {
      unifiedWebSocketManager.removeUnifiedEventListener('task_started', handlers.taskUpdate)
      unifiedWebSocketManager.removeUnifiedEventListener('task_progress', handlers.taskUpdate)
      unifiedWebSocketManager.removeUnifiedEventListener('task_completed', handlers.taskUpdate)
      unifiedWebSocketManager.removeUnifiedEventListener('task_failed', handlers.taskUpdate)
    }
    
    if (handlers.scheduledTasksUpdate) {
      unifiedWebSocketManager.removeUnifiedEventListener('scheduled_jobs', handlers.scheduledTasksUpdate)
    }
    
    if (handlers.scheduledTaskEvent) {
      unifiedWebSocketManager.removeUnifiedEventListener('scheduled_job_created', handlers.scheduledTaskEvent)
      unifiedWebSocketManager.removeUnifiedEventListener('scheduled_job_deleted', handlers.scheduledTaskEvent)
      unifiedWebSocketManager.removeUnifiedEventListener('scheduled_job_paused', handlers.scheduledTaskEvent)
      unifiedWebSocketManager.removeUnifiedEventListener('scheduled_job_resumed', handlers.scheduledTaskEvent)
    }
  }

  return {
    connectionStatus,
    checkConnectionStatus,
    handleConnectionStatus,
    initWebSockets,
    cleanupWebSockets,
    addTaskEventListeners,
    removeTaskEventListeners
  }
} 
