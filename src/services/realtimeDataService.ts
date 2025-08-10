import { ref, reactive } from 'vue'
import { websocketEventBus } from '@/utils/websocketEventBus'

export interface TaskStatus {
  id: string
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  message?: string
  start_time?: string
  end_time?: string
  result?: any
  error_message?: string
}

class RealtimeDataService {
  private tasks = reactive<Map<string, TaskStatus>>(new Map())
  private taskHistory = ref<TaskStatus[]>([])
  private subscribers = new Set<(tasks: TaskStatus[]) => void>()

  constructor() {
    this.setupWebSocketListeners()
  }

  private setupWebSocketListeners() {
    // 监听任务相关事件
    websocketEventBus.subscribe({
      id: 'realtime_data_service',
      handler: (event) => {
        this.handleWebSocketEvent(event)
      }
    })
  }

  private handleWebSocketEvent(event: any) {
    console.log(event);
    
    switch (event.event) {
      case 'task_started':
      case 'collection_started':
      case 'backtest_started':
      case 'analysis_started':
        this.updateTaskStatus(event.data, 'running')
        break
        
      case 'task_progress':
      case 'collection_progress':
      case 'backtest_progress':
      case 'analysis_progress':
        this.updateTaskProgress(event.data)
        break
        
      case 'task_progress_detailed':
        // 处理详细进度事件
        this.updateTaskDetailedProgress(event.data)
        break
        
      case 'task_completed':
      case 'collection_completed':
      case 'backtest_completed':
      case 'analysis_completed':
        this.updateTaskStatus(event.data, 'completed')
        break
        
      case 'task_failed':
      case 'collection_error':
      case 'backtest_error':
      case 'analysis_error':
        this.updateTaskStatus(event.data, 'failed')
        break
        
      case 'task_paused':
        this.updateTaskStatus(event.data, 'paused')
        break
    }
  }

  private updateTaskStatus(data: any, status: TaskStatus['status']) {
    const taskEnvelope = (data && data.task) ? data.task : data
    const taskId = taskEnvelope?.id || data?.task_id || data?.taskId
    if (!taskId) return

    const existingTask = this.tasks.get(taskId)
    const inferredType = (taskEnvelope?.data_type || taskEnvelope?.type) ? 'data_collection' : (existingTask?.type || 'unknown')
    const nameFromPayload = taskEnvelope?.name || taskEnvelope?.data_type || existingTask?.name || 'Unknown Task'

    const updatedTask: TaskStatus = {
      id: taskId,
      name: nameFromPayload,
      type: inferredType,
      status,
      progress: taskEnvelope?.progress ?? (status === 'completed' ? 100 : existingTask?.progress || 0),
      message: taskEnvelope?.message || data?.message || existingTask?.message,
      start_time: taskEnvelope?.start_time || existingTask?.start_time || new Date().toISOString(),
      end_time: (status === 'completed' || status === 'failed') ? (taskEnvelope?.end_time || new Date().toISOString()) : undefined,
      result: taskEnvelope?.result || existingTask?.result,
      error_message: taskEnvelope?.error || taskEnvelope?.error_message || data?.error || data?.error_message || existingTask?.error_message
    }

    this.tasks.set(taskId, updatedTask)
    
    // 如果任务完成或失败，添加到历史记录
    if (status === 'completed' || status === 'failed') {
      this.addToHistory(updatedTask)
    }

    this.notifySubscribers()
  }

  private updateTaskProgress(data: any) {
    // 支持两种格式：{ task: {...} } 或直接扁平 {...}
    const payload = (data && data.task) ? data.task : data
    const taskId = payload?.id || data?.task_id || data?.taskId
    if (!taskId) return

    const inferredType = (payload?.data_type || payload?.type) ? 'data_collection' : 'unknown'
    const existingTask = this.tasks.get(taskId)

    if (existingTask) {
      existingTask.progress = payload?.progress ?? existingTask.progress
      existingTask.message = payload?.message || existingTask.message
      existingTask.status = (payload?.status as TaskStatus['status']) || existingTask.status
      existingTask.start_time = payload?.start_time || existingTask.start_time
      existingTask.end_time = payload?.end_time || existingTask.end_time
      this.notifySubscribers()
    } else {
      const newTask: TaskStatus = {
        id: taskId,
        name: payload?.name || payload?.data_type || 'Unknown Task',
        type: inferredType,
        status: (payload?.status as TaskStatus['status']) || 'running',
        progress: payload?.progress || 0,
        message: payload?.message,
        start_time: payload?.start_time || new Date().toISOString(),
        end_time: payload?.end_time,
        result: payload?.result,
        error_message: payload?.error || payload?.error_message
      }
      this.tasks.set(taskId, newTask)
      this.notifySubscribers()
    }
  }

  private updateTaskDetailedProgress(data: any) {
    
    const taskId = data.task_id
    if (!taskId) return

    const existingTask = this.tasks.get(taskId)

    // 如无现有任务，创建占位任务，确保UI能即时显示
    if (!existingTask) {
      const placeholder: TaskStatus = {
        id: taskId,
        name: '数据采集',
        type: 'data_collection',
        status: 'running',
        progress: 0,
        message: data.message,
        start_time: new Date().toISOString()
      } as TaskStatus
      this.tasks.set(taskId, placeholder)
    }

    const current = data.current
    const total = data.total

    // 计算进度百分比
    let progress = 0
    if (typeof current === 'number' && typeof total === 'number' && total > 0) {
      progress = Math.round((current / total) * 100)
    } else {
      progress = data.progress ?? this.tasks.get(taskId)!.progress
    }

    const updatedTask: TaskStatus = {
      ...this.tasks.get(taskId)!,
      progress,
      message: data.message || this.tasks.get(taskId)!.message
    }

    // 附加详细计数信息，供界面显示
    ;(updatedTask as any).current_count = typeof current === 'number' ? current : (updatedTask as any)?.current_count
    ;(updatedTask as any).total_count = typeof total === 'number' ? total : (updatedTask as any)?.total_count
    if (typeof data.success_count === 'number') {
      ;(updatedTask as any).success_count = data.success_count
    }
    if (typeof data.error_count === 'number') {
      ;(updatedTask as any).error_count = data.error_count
    }

    this.tasks.set(taskId, updatedTask)
    this.notifySubscribers()
  }

  private addToHistory(task: TaskStatus) {
    this.taskHistory.value.push({ ...task })
    // 保持历史记录在合理范围内
    if (this.taskHistory.value.length > 500) {
      this.taskHistory.value = this.taskHistory.value.slice(-250)
    }
  }

  private notifySubscribers() {
    const currentTasks = Array.from(this.tasks.values())
    this.subscribers.forEach(callback => {
      try {
        callback(currentTasks)
      } catch (error) {
        console.error('Error in realtime data subscriber:', error)
      }
    })
  }

  // 公共方法
  getAllTasks(): TaskStatus[] {
    return Array.from(this.tasks.values())
  }

  getTasksByType(type: string): TaskStatus[] {
    return Array.from(this.tasks.values()).filter(task => task.type === type)
  }

  getTasksByStatus(status: TaskStatus['status']): TaskStatus[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status)
  }

  getRunningTasks(): TaskStatus[] {
    return this.getTasksByStatus('running')
  }

  getTaskHistory(): TaskStatus[] {
    return [...this.taskHistory.value]
  }

  getTask(taskId: string): TaskStatus | undefined {
    return this.tasks.get(taskId)
  }

  // 订阅任务状态变化
  subscribe(callback: (tasks: TaskStatus[]) => void): () => void {
    this.subscribers.add(callback)
    
    // 立即调用一次回调，提供当前状态
    callback(this.getAllTasks())
    
    // 返回取消订阅函数
    return () => {
      this.subscribers.delete(callback)
    }
  }

  // 手动添加任务（用于API调用后立即添加任务状态）
  addTask(task: Partial<TaskStatus>): void {
    if (!task.id) return
    
    const newTask: TaskStatus = {
      id: task.id,
      name: task.name || 'Unknown Task',
      type: task.type || 'unknown',
      status: task.status || 'pending',
      progress: task.progress || 0,
      message: task.message,
      start_time: task.start_time || new Date().toISOString(),
      end_time: task.end_time,
      result: task.result,
      error_message: task.error_message
    }

    this.tasks.set(newTask.id, newTask)
    this.notifySubscribers()
  }

  // 移除任务
  removeTask(taskId: string): void {
    this.tasks.delete(taskId)
    this.notifySubscribers()
  }

  // 清空所有任务
  clearTasks(): void {
    this.tasks.clear()
    this.notifySubscribers()
  }

  // 清空历史记录
  clearHistory(): void {
    this.taskHistory.value = []
  }
}

// 导出单例实例
export const realtimeDataService = new RealtimeDataService() 