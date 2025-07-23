<template>
  <div class="scheduler-container">
    <!-- 调度器状态 -->
    <div class="status-section">
      <SchedulerStatus />
    </div>

    <div class="scheduler-content">
      <el-row :gutter="24">
        <!-- 左侧控制面板 -->
        <el-col :span="12">
          <TaskControlPanel />
        </el-col>

        <!-- 右侧任务列表 -->
        <el-col :span="12">
          <div class="relative group">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"
            ></div>
            <el-card
              class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              <template #header>
                <div class="flex justify-between items-center">
                  <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-purple-400 rounded-md animate-pulse"></div>
                    <span
                      class="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                    >任务管理</span>
                  </div>
                </div>
              </template>

              <div>
                <JobList />
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useSchedulerStore } from '@/store/scheduler'
import SchedulerStatus from '@/components/scheduler/SchedulerStatus.vue'
import TaskControlPanel from '@/components/scheduler/TaskControlPanel.vue'
import JobList from '@/components/scheduler/JobList.vue'

const store = useSchedulerStore()

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (!document.hidden) {
    console.log('[Scheduler] Page became visible, checking connection...')
    if (!store.isConnected) {
      console.log('[Scheduler] Connection lost, reconnecting...')
      store.connect()
    } else {
      console.log('[Scheduler] Connection active, requesting status update...')
      store.requestStatusUpdate()
      store.checkRunningTasks()
    }
  }
}

// 定期检查连接状态
let connectionCheckInterval: NodeJS.Timeout | null = null

// 组件挂载时连接WebSocket
onMounted(() => {
  console.log('[Scheduler] Component mounted, connecting to WebSocket...')
  // 强制重新连接，确保状态是最新的
  store.connect()

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 定期检查连接状态（每30秒）
  connectionCheckInterval = setInterval(() => {
    if (!store.isConnected && !document.hidden) {
      console.log('[Scheduler] Connection check: reconnecting...')
      store.connect()
    }
  }, 30000)
})

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
    connectionCheckInterval = null
  }
})
</script>

<style scoped>
.scheduler-container {
  @apply p-6 bg-gray-900;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.status-section {
  @apply flex-shrink-0 mb-6;
}

.scheduler-content {
  @apply flex-1;
}

:deep(.el-card__body) {
  @apply overflow-auto;
}

:deep(.el-card) {
  @apply overflow-hidden;
}
</style>