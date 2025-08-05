<template>
  <div class="unified-data-management-container">
    <div class="data-management-header">
      <h1 class="data-management-title">📊 统一数据管理</h1>
      <p class="data-management-subtitle">使用统一服务的数据管理，支持多种数据源和任务调度</p>
    </div>

    <div class="data-management-content">
      <!-- 连接状态卡片 -->
      <ConnectionStatusCard 
        :connectionStatus="connectionStatus"
        @statusUpdate="handleConnectionStatusUpdate"
      />

      <!-- 数据采集任务管理 -->
      <DataCollectionTasksTable 
        :tasks="tasks"
        :loading="loading"
        @refresh="refreshTasks"
        @startTask="startDataCollection"
      />

      <!-- 定时任务管理 -->
      <ScheduledTasksTable 
        :tasks="scheduledTasks"
        :loading="scheduledTasksLoading"
        @refresh="refreshScheduledTasks"
        @create="showNewScheduledTaskDialog"
        @toggle="toggleScheduledTask"
        @delete="deleteScheduledTask"
      />

      <!-- 创建定时任务对话框 -->
      <CreateScheduledTaskDialog 
        v-model="newScheduledTaskDialogVisible"
        :creating="creatingScheduledTask"
        @create="createNewScheduledTask"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ConnectionStatusCard from '@/components/dashboard/ConnectionStatusCard.vue'
import DataCollectionTasksTable from '@/components/data-management/DataCollectionTasksTable.vue'
import ScheduledTasksTable from '@/components/data-management/ScheduledTasksTable.vue'
import CreateScheduledTaskDialog from '@/components/data-management/CreateScheduledTaskDialog.vue'
import { useDataCollection } from '@/composables/useDataCollection'
import { useScheduledTasks } from '@/composables/useScheduledTasks'
import { useWebSocket } from '@/composables/useWebSocket'

const {
  dataCollectionTasks: tasks,
  loading,
  refreshTasks,
  startDataCollection,
  handleTaskUpdate
} = useDataCollection()

const {
  scheduledTasks,
  scheduledTasksLoading,
  newScheduledTaskDialogVisible,
  creatingScheduledTask,
  refreshScheduledTasks,
  showNewScheduledTaskDialog,
  createNewScheduledTask,
  toggleScheduledTask,
  deleteScheduledTask,
  handleScheduledTasksUpdate,
  handleScheduledTaskEvent
} = useScheduledTasks()

const {
  connectionStatus,
  initWebSockets,
  cleanupWebSockets,
  addTaskEventListeners,
  removeTaskEventListeners,
  handleConnectionStatus
} = useWebSocket()

// 处理连接状态更新
const handleConnectionStatusUpdate = (status: Record<string, boolean>) => {
  Object.assign(connectionStatus, status)
}

// 生命周期
onMounted(async () => {
  console.log('🚀 组件挂载，初始化WebSocket连接...')
  
  // 初始化WebSocket连接
  initWebSockets()
  
  // 添加任务事件监听器
  addTaskEventListeners({
    taskUpdate: handleTaskUpdate,
    scheduledTasksUpdate: handleScheduledTasksUpdate,
    scheduledTaskEvent: handleScheduledTaskEvent
  })
  
  console.log('✅ WebSocket事件监听器已设置')
  
  // 初始加载
  await Promise.all([
    refreshTasks(),
    refreshScheduledTasks()
  ])
  
  console.log('✅ 组件初始化完成')
})

onUnmounted(() => {
  // 清理事件监听器
  removeTaskEventListeners({
    taskUpdate: handleTaskUpdate,
    scheduledTasksUpdate: handleScheduledTasksUpdate,
    scheduledTaskEvent: handleScheduledTaskEvent
  })
  
  // 清理WebSocket连接
  cleanupWebSockets()
})
</script>

<style scoped>
.unified-data-management-container {
  padding: 20px;
}

.data-management-header {
  margin-bottom: 30px;
  text-align: center;
}

.data-management-title {
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
}

.data-management-subtitle {
  font-size: 1rem;
  color: #909399;
  margin: 0;
}

.data-management-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style> 
