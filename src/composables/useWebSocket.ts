import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { unifiedWebSocketManager } from '@/utils/unifiedWebSocketManager'

export interface ConnectionStatus {
  dataCollection: boolean
  aiAnalysis: boolean
  newsAnalysis: boolean
  backtest: boolean
  scheduler: boolean
}

export function useWebSocket() {
  const connectionStatus = reactive<ConnectionStatus>({
    dataCollection: false,
    aiAnalysis: false,
    newsAnalysis: false,
    backtest: false,
    scheduler: false
  })

  const getConnectionStatus = () => {
    // 简化连接状态检查
    const status = unifiedWebSocketManager.getConnectionStatus('/')
    return status === 'connected'
  }

  const initWebSocketConnections = async () => {
    try {
      // 初始化WebSocket连接
      await unifiedWebSocketManager.connect('/')
      
      // 设置连接状态监听
      unifiedWebSocketManager.on('/', 'connect', () => {
        connectionStatus.dataCollection = true
        connectionStatus.aiAnalysis = true
        connectionStatus.newsAnalysis = true
        connectionStatus.backtest = true
        connectionStatus.scheduler = true
      })

      unifiedWebSocketManager.on('/', 'disconnect', () => {
        connectionStatus.dataCollection = false
        connectionStatus.aiAnalysis = false
        connectionStatus.newsAnalysis = false
        connectionStatus.backtest = false
        connectionStatus.scheduler = false
      })
      
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }

  const setupTaskEventListeners = (handlers: {
    taskUpdate?: (data: any) => void
    scheduledTasksUpdate?: (data: any) => void
    scheduledTaskEvent?: (data: any) => void
  }) => {
    if (!handlers.taskUpdate) return

    // 设置任务相关事件监听
    const taskEvents = ['task_started', 'task_progress', 'task_completed', 'task_failed']
    
    taskEvents.forEach(event => {
      if (handlers.taskUpdate) {
        unifiedWebSocketManager.on('/', event, handlers.taskUpdate)
      }
    })

    // 设置调度任务监听
    if (handlers.scheduledTasksUpdate) {
      unifiedWebSocketManager.on('/', 'scheduled_jobs', handlers.scheduledTasksUpdate)
    }

    // 设置调度任务事件监听
    if (handlers.scheduledTaskEvent) {
      const scheduledEvents = ['scheduled_job_created', 'scheduled_job_deleted', 'scheduled_job_paused', 'scheduled_job_resumed']
      scheduledEvents.forEach(event => {
        unifiedWebSocketManager.on('/', event, handlers.scheduledTaskEvent!)
      })
    }
  }

  const removeTaskEventListeners = (handlers: {
    taskUpdate?: (data: any) => void
    scheduledTasksUpdate?: (data: any) => void
    scheduledTaskEvent?: (data: any) => void
  }) => {
    // 移除任务相关事件监听
    const taskEvents = ['task_started', 'task_progress', 'task_completed', 'task_failed']
    
    taskEvents.forEach(event => {
      if (handlers.taskUpdate) {
        unifiedWebSocketManager.off('/', event, handlers.taskUpdate)
      }
    })

    // 移除调度任务监听
    if (handlers.scheduledTasksUpdate) {
      unifiedWebSocketManager.off('/', 'scheduled_jobs', handlers.scheduledTasksUpdate)
    }

    // 移除调度任务事件监听
    if (handlers.scheduledTaskEvent) {
      const scheduledEvents = ['scheduled_job_created', 'scheduled_job_deleted', 'scheduled_job_paused', 'scheduled_job_resumed']
      scheduledEvents.forEach(event => {
        unifiedWebSocketManager.off('/', event, handlers.scheduledTaskEvent!)
      })
    }
  }

  const cleanup = () => {
    unifiedWebSocketManager.clearEventListeners('/')
  }

  return {
    connectionStatus,
    getConnectionStatus,
    initWebSocketConnections,
    setupTaskEventListeners,
    removeTaskEventListeners,
    cleanup
  }
} 
