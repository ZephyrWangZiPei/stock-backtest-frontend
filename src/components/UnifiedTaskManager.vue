<template>
  <div class="unified-task-manager">
    <el-card class="task-manager-card">
      <template #header>
        <div class="card-header">
          <span class="title">📋 统一任务管理器</span>
          <div class="header-actions">
            <el-button @click="refreshAllTasks" type="primary" size="small">
              刷新所有任务
            </el-button>
            <el-button @click="clearCompletedTasks" type="warning" size="small">
              清理已完成
            </el-button>
          </div>
        </div>
      </template>

      <!-- 连接状态 -->
      <div class="connection-status">
        <h4>🔗 服务连接状态</h4>
        <el-row :gutter="20">
          <el-col :span="6" v-for="(connected, service) in connectionStatus" :key="service">
            <div class="status-indicator" :class="{ connected }">
              <el-icon :class="{ 'is-success': connected, 'is-danger': !connected }">
                <CircleCheck v-if="connected" />
                <CircleClose v-else />
              </el-icon>
              <span class="service-name">{{ getServiceDisplayName(service) }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 任务统计 -->
      <div class="task-statistics">
        <h4>📊 任务统计</h4>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card running">
              <div class="stat-value">{{ runningTasks }}</div>
              <div class="stat-label">运行中</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card completed">
              <div class="stat-value">{{ completedTasks }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card failed">
              <div class="stat-value">{{ failedTasks }}</div>
              <div class="stat-label">失败</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 任务标签页 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="数据采集" name="dataCollection">
          <TaskTable 
            :tasks="dataCollectionTasks" 
            :service="'dataCollection'"
            @refresh="refreshTasks('dataCollection')"
          />
        </el-tab-pane>
        <el-tab-pane label="AI分析" name="aiAnalysis">
          <TaskTable 
            :tasks="aiAnalysisTasks" 
            :service="'aiAnalysis'"
            @refresh="refreshTasks('aiAnalysis')"
          />
        </el-tab-pane>
        <el-tab-pane label="新闻分析" name="newsAnalysis">
          <TaskTable 
            :tasks="newsAnalysisTasks" 
            :service="'newsAnalysis'"
            @refresh="refreshTasks('newsAnalysis')"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import enhancedWebSocketManager from '@/utils/unifiedWebSocketManager'
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import TaskTable from './TaskTable.vue'

// 响应式数据
const activeTab = ref('dataCollection')
const connectionStatus = reactive({
  dataCollection: false,
  aiAnalysis: false,
  newsAnalysis: false,
  scheduler: false
})

interface Task {
  id: string
  status: string
  progress: number
  message: string
  start_time: string
  end_time?: string
  result?: any
  error_message?: string
}

const dataCollectionTasks = ref<Task[]>([])
const aiAnalysisTasks = ref<Task[]>([])
const newsAnalysisTasks = ref<Task[]>([])

// 计算属性
const totalTasks = computed(() => {
  return dataCollectionTasks.value.length + 
         aiAnalysisTasks.value.length + 
         newsAnalysisTasks.value.length
})

const runningTasks = computed(() => {
  return [...dataCollectionTasks.value, ...aiAnalysisTasks.value, 
          ...newsAnalysisTasks.value]
    .filter(task => task.status === 'running').length
})

const completedTasks = computed(() => {
  return [...dataCollectionTasks.value, ...aiAnalysisTasks.value, 
          ...newsAnalysisTasks.value]
    .filter(task => task.status === 'completed').length
})

const failedTasks = computed(() => {
  return [...dataCollectionTasks.value, ...aiAnalysisTasks.value, 
          ...newsAnalysisTasks.value]
    .filter(task => task.status === 'failed').length
})

// 方法
const getServiceDisplayName = (service: string) => {
  const names = {
    dataCollection: '数据采集',
    aiAnalysis: 'AI分析',
    newsAnalysis: '新闻分析',
    scheduler: '调度器'
  }
  return names[service as keyof typeof names] || service
}

const refreshAllTasks = async () => {
  try {
    await Promise.all([
      refreshTasks('dataCollection'),
      refreshTasks('aiAnalysis'),
      refreshTasks('newsAnalysis')
    ])
    ElMessage.success('所有任务已刷新')
  } catch (error) {
    ElMessage.error('刷新任务失败')
  }
}

const refreshTasks = async (service: string) => {
  try {
    // 使用WebSocket获取任务列表
    if (enhancedWebSocketManager.getServiceConnectionStatus(service)) {
      enhancedWebSocketManager.sendToService(service, 'get_running_tasks')
    } else {
      ElMessage.warning(`${service} WebSocket未连接，无法获取任务列表`)
    }
  } catch (error) {
    console.error(`刷新${service}任务失败:`, error)
  }
}

const clearCompletedTasks = () => {
  dataCollectionTasks.value = dataCollectionTasks.value.filter(task => task.status !== 'completed')
  aiAnalysisTasks.value = aiAnalysisTasks.value.filter(task => task.status !== 'completed')
  newsAnalysisTasks.value = newsAnalysisTasks.value.filter(task => task.status !== 'completed')
  ElMessage.success('已清理完成的任务')
}

const handleTabClick = (tab: any) => {
  refreshTasks(tab.name)
}

// WebSocket事件处理
const handleConnectionStatus = (service: string, connected: boolean) => {
  connectionStatus[service as keyof typeof connectionStatus] = connected
}

const handleTaskUpdate = (service: string, data: any) => {
  switch (service) {
    case 'dataCollection':
      updateTaskList(dataCollectionTasks.value, data)
      break
    case 'aiAnalysis':
      updateTaskList(aiAnalysisTasks.value, data)
      break
    case 'newsAnalysis':
      updateTaskList(newsAnalysisTasks.value, data)
      break
  }
}

const updateTaskList = (taskList: any[], data: any) => {
  const index = taskList.findIndex(task => task.id === data.id)
  if (index > -1) {
    taskList[index] = { ...taskList[index], ...data }
  } else {
    taskList.unshift(data)
  }
}

// 生命周期
onMounted(async () => {
  // 初始化WebSocket连接
  enhancedWebSocketManager.initEnhancedWebSockets()
  
  // 监听连接状态
  enhancedWebSocketManager.addUnifiedEventListener('dataCollectionConnected', (connected: boolean) => {
    handleConnectionStatus('dataCollection', connected)
  })
  enhancedWebSocketManager.addUnifiedEventListener('aiAnalysisConnected', (connected: boolean) => {
    handleConnectionStatus('aiAnalysis', connected)
  })
  enhancedWebSocketManager.addUnifiedEventListener('newsAnalysisConnected', (connected: boolean) => {
    handleConnectionStatus('newsAnalysis', connected)
  })

  // 监听任务更新事件
  enhancedWebSocketManager.addUnifiedEventListener('task_status', (data: any) => {
    handleTaskUpdate(data.service, data)
  })
  enhancedWebSocketManager.addUnifiedEventListener('task_created', (data: any) => {
    handleTaskUpdate(data.service, data)
  })
  
  // 初始加载任务
  await refreshAllTasks()
})

onUnmounted(() => {
  // 清理事件监听器
  enhancedWebSocketManager.removeUnifiedEventListener('dataCollectionConnected', handleConnectionStatus)
  enhancedWebSocketManager.removeUnifiedEventListener('aiAnalysisConnected', handleConnectionStatus)
  enhancedWebSocketManager.removeUnifiedEventListener('newsAnalysisConnected', handleConnectionStatus)
  enhancedWebSocketManager.removeUnifiedEventListener('task_status', handleTaskUpdate)
  enhancedWebSocketManager.removeUnifiedEventListener('task_created', handleTaskUpdate)
})
</script>

<style scoped>
.unified-task-manager {
  padding: 20px;
}

.task-manager-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 1.2rem;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.connection-status {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.connection-status h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 6px;
  background-color: #f56c6c;
  color: white;
  transition: all 0.3s ease;
}

.status-indicator.connected {
  background-color: #67c23a;
}

.service-name {
  font-size: 14px;
  font-weight: 500;
}

.task-statistics {
  margin-bottom: 30px;
}

.task-statistics h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #909399;
}

.stat-card.running {
  border-left-color: #409eff;
}

.stat-card.completed {
  border-left-color: #67c23a;
}

.stat-card.failed {
  border-left-color: #f56c6c;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style> 
