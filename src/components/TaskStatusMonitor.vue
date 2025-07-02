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
          <span class="progress-percentage">{{ currentTask.progress }}%</span>
        </div>
        <el-progress
          :percentage="currentTask.progress || 0"
          :color="getProgressColor(currentTask.progress || 0)"
          :show-text="false"
        />
        <div class="progress-message">{{ currentTask.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Connection, Close } from '@element-plus/icons-vue'
import { io, Socket } from 'socket.io-client'
import { formatTime } from '@/utils/format'

interface TaskStatus {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  timestamp: Date
  progress?: number
  message?: string
}

const isConnected = ref(false)
const tasks = ref<TaskStatus[]>([])
const currentTask = ref<TaskStatus | null>(null)
let socket: Socket | null = null

const connectWebSocket = () => {
  if (socket) {
    socket.disconnect()
  }

  socket = io('http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: true
  })

  socket.on('connect', () => {
    isConnected.value = true
    console.log('WebSocket connected')
  })

  socket.on('disconnect', () => {
    isConnected.value = false
    console.log('WebSocket disconnected')
  })

  socket.on('task_status', (data: any) => {
    handleTaskStatus(data)
  })

  socket.on('top_strategy_backtest_progress', (data: any) => {
    handleTaskProgress(data)
  })

  socket.on('scheduler_update', (data: any) => {
    handleSchedulerUpdate(data)
  })
}

const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
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

const handleTaskStatus = (data: any) => {
  const task: TaskStatus = {
    id: data.task_id || Date.now().toString(),
    name: data.task_name || 'Top策略回测',
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
  if (task.status === 'running') {
    currentTask.value = task
  } else if (task.status === 'completed' || task.status === 'failed') {
    currentTask.value = null
  }
}

const handleTaskProgress = (data: any) => {
  if (currentTask.value) {
    currentTask.value.progress = data.progress || 0
    currentTask.value.message = data.message || ''
  } else {
    // 创建新的进度任务
    currentTask.value = {
      id: 'top_strategy_backtest',
      name: 'Top策略回测',
      status: 'running',
      timestamp: new Date(),
      progress: data.progress || 0,
      message: data.message || ''
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
      return 'task-running'
    case 'completed':
      return 'task-completed'
    case 'failed':
      return 'task-failed'
    default:
      return ''
  }
}

const getTaskTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'info'
    case 'running':
      return 'warning'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
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
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
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
  @apply bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4;
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
  @apply flex justify-between items-center p-3 rounded-lg border;
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