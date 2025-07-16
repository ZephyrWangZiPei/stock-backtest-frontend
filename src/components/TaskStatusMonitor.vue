<template>
  <div class="task-monitor">
    <div class="monitor-header">
      <h4 class="monitor-title">任务状态监控</h4>
      <el-button
        :icon="isConnected ? Connection : Close"
        :type="isConnected ? 'success' : 'danger'"
        size="small"
        @click="toggleConnection"
      >
        {{ isConnected ? '已连接' : '未连接' }}
      </el-button>
    </div>

    <div class="task-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
        :class="getTaskStatusClass(task.status)"
      >
        <div class="task-info">
          <div class="task-name">{{ task.name }}</div>
          <div class="task-time">{{ formatTime(task.timestamp) }}</div>
        </div>
        
        <div class="task-status">
          <el-tag
            :type="getTaskTagType(task.status)"
            size="small"
          >
            {{ getTaskStatusText(task.status) }}
          </el-tag>
        </div>
      </div>
    </div>

    <div v-if="currentTask" class="current-task">
      <div class="task-progress">
        <div class="progress-header">
          <span class="progress-title">{{ currentTask.name }}</span>
          <span class="progress-percentage">{{ Math.round(currentTask.progress || 0) }}%</span>
        </div>
        <el-progress
          :percentage="Math.round(currentTask.progress || 0)"
          :color="getProgressColor(currentTask.progress || 0)"
          :show-text="false"
        />
        <div class="progress-message">{{ currentTask.message }}</div>
        <div v-if="currentTask.progress_detail" class="progress-detail">
          {{ currentTask.progress_detail }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Connection, Close } from '@element-plus/icons-vue'
import { Socket } from 'socket.io-client'
import { formatTime } from '@/utils/format'
import { createWebSocketManager, WebSocketManager } from '@/utils/websocketManager'
import { usePageWebSocket } from '@/utils/pageWebSocketManager'

interface TaskStatus {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'started' | 'rejected'
  timestamp: Date
  progress?: number
  message?: string
  progress_detail?: string
}

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'

const isConnected = ref(false)
const tasks = ref<TaskStatus[]>([])
const currentTask = ref<TaskStatus | null>(null)
let wsManager: WebSocketManager | null = null

// 页面WebSocket连接管理
const { pageManager, checkAndReconnect } = usePageWebSocket()

const connectWebSocket = () => {
  if (wsManager) {
    wsManager.disconnect()
  }

  wsManager = createWebSocketManager({
    url: `${VITE_API_BASE_URL}/scheduler`,
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    connectionName: 'task_monitor',
    onConnect: (socket) => {
      isConnected.value = true
      console.log('TaskStatusMonitor WebSocket connected')
    },
    onDisconnect: () => {
      isConnected.value = false
      console.log('TaskStatusMonitor WebSocket disconnected')
    }
  })

  const socket = wsManager.connect()

  // 监听后端推送的job_status事件
  socket.on('job_status', (data: any) => {
    console.log('Received job_status:', data)
    handleJobStatus(data)
  })

  // 监听后端推送的job_progress事件
  socket.on('job_progress', (data: any) => {
    console.log('Received job_progress:', data)
    handleJobProgress(data)
  })

  // 监听调度器状态更新
  socket.on('scheduler_status', (data: any) => {
    console.log('Received scheduler_status:', data)
    handleSchedulerUpdate(data)
  })
}

const disconnectWebSocket = () => {
  if (wsManager) {
    wsManager.disconnect()
    wsManager = null
    isConnected.value = false
  }
}

const toggleConnection = () => {
  if (isConnected.value) {
    disconnectWebSocket()
  } else {
    connectWebSocket()
  }
}

const getTaskDisplayName = (jobName: string) => {
  const nameMap: { [key: string]: string } = {
    'top_strategy_backtest': 'Top策略回测',
    'candidate_pool_update': '候选池更新',
    'data_collection': '数据采集',
    'stock_screening': '股票筛选'
  }
  return nameMap[jobName] || jobName
}

const handleJobStatus = (data: any) => {
  const task: TaskStatus = {
    id: data.job_name || Date.now().toString(),
    name: getTaskDisplayName(data.job_name || '未知任务'),
    status: data.status,
    timestamp: new Date(),
    message: data.message
  }

  // 更新任务列表
  const existingIndex = tasks.value.findIndex(t => t.id === task.id)
  if (existingIndex >= 0) {
    tasks.value[existingIndex] = task
  } else {
    tasks.value.unshift(task)
  }

  // 保持最多10个任务记录
  if (tasks.value.length > 10) {
    tasks.value = tasks.value.slice(0, 10)
  }

  // 更新当前任务
  if (task.status === 'running' || task.status === 'started') {
    currentTask.value = task
  } else if (task.status === 'completed' || task.status === 'failed' || task.status === 'rejected') {
    // 如果当前任务就是这个任务，则清除
    if (currentTask.value && currentTask.value.id === task.id) {
      currentTask.value = null
    }
  }
}

const handleJobProgress = (data: any) => {
  const taskName = getTaskDisplayName(data.job_name || 'top_strategy_backtest')
  const progressPercentage = data.total > 0 ? (data.progress / data.total) * 100 : 0
  
  if (currentTask.value && currentTask.value.id === data.job_name) {
    // 更新现有任务的进度
    currentTask.value.progress = progressPercentage
    currentTask.value.message = data.message || ''
    currentTask.value.progress_detail = data.total > 0 ? `${data.progress}/${data.total}` : ''
  } else {
    // 创建新的进度任务
    currentTask.value = {
      id: data.job_name || 'top_strategy_backtest',
      name: taskName,
      status: 'running',
      timestamp: new Date(),
      progress: progressPercentage,
      message: data.message || '',
      progress_detail: data.total > 0 ? `${data.progress}/${data.total}` : ''
    }
  }
}

const handleSchedulerUpdate = (data: any) => {
  // 处理调度器更新
  console.log('Scheduler update:', data)
}

const getTaskStatusClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'task-pending'
    case 'running':
    case 'started':
      return 'task-running'
    case 'completed':
      return 'task-completed'
    case 'failed':
      return 'task-failed'
    case 'rejected':
      return 'task-rejected'
    default:
      return ''
  }
}

const getTaskTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'info'
    case 'running':
    case 'started':
      return 'warning'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'rejected':
      return 'warning'
    default:
      return 'info'
  }
}

const getTaskStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '等待中'
    case 'running':
      return '执行中'
    case 'started':
      return '已启动'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知'
  }
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#e6a23c'
  return '#409eff'
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
.task-monitor {
  @apply bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-md p-4;
}

.monitor-header {
  @apply flex justify-between items-center mb-4;
}

.monitor-title {
  @apply text-lg font-semibold text-white;
}

.task-list {
  @apply space-y-2 mb-4 max-h-48 overflow-y-auto;
}

.task-item {
  @apply flex justify-between items-center p-3 rounded-md border;
}

.task-item.task-pending {
  @apply bg-blue-900/20 border-blue-700/30;
}

.task-item.task-running {
  @apply bg-yellow-900/20 border-yellow-700/30;
}

.task-item.task-completed {
  @apply bg-green-900/20 border-green-700/30;
}

.task-item.task-failed {
  @apply bg-red-900/20 border-red-700/30;
}

.task-item.task-rejected {
  @apply bg-orange-900/20 border-orange-700/30;
}

.task-info {
  @apply flex flex-col;
}

.task-name {
  @apply text-white font-medium;
}

.task-time {
  @apply text-gray-400 text-sm;
}

.current-task {
  @apply border-t border-gray-700/50 pt-4;
}

.task-progress {
  @apply space-y-2;
}

.progress-header {
  @apply flex justify-between items-center;
}

.progress-title {
  @apply text-white font-medium;
}

.progress-percentage {
  @apply text-blue-400 font-bold;
}

.progress-message {
  @apply text-gray-400 text-sm;
}

.progress-detail {
  @apply text-gray-500 text-xs;
}

/* 滚动条样式 */
.task-list::-webkit-scrollbar {
  width: 4px;
}

.task-list::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 2px;
}

.task-list::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.6);
  border-radius: 2px;
}

.task-list::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.8);
}
</style> 