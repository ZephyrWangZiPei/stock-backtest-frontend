export interface Task {
  id: string
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'paused' | 'failed'
  progress: number
  startTime: string
  endTime?: string
  processed: number
  total: number
  description?: string
}

export interface TaskProgress {
  taskId: string
  progress: number
  processed: number
  total: number
  status: Task['status']
  message?: string
}

export interface TaskResult {
  taskId: string
  success: boolean
  result?: any
  error?: string
  duration: number
} 