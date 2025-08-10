<template>
  <el-card class="todo-list">
    <template #header>
      <div class="card-header">
        <span>系统任务</span>
      </div>
    </template>
    <div class="todo-content" v-loading="loading">
      <div v-if="todoList.length === 0" class="empty-state">
        <el-empty description="暂无运行中任务" />
      </div>
      <div v-else>
        <div v-for="item in todoList" :key="item.id" class="todo-item">
          <div class="task-info">
            <span class="task-name">{{ item.name }}</span>
            <el-tag :type="getStatusTagType(item.status)" size="small">{{ item.status }}</el-tag>
          </div>
          <div class="task-progress" v-if="item.progress !== undefined">
            <el-progress :percentage="item.progress" :stroke-width="4" />
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import unifiedHttpClient from '@/utils/unifiedHttpClient'

interface TodoItem {
  id: string
  name: string
  status: string
  progress?: number
}

const todoList = ref<TodoItem[]>([])
const loading = ref(false)

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'running':
    case '运行中':
      return 'primary'
    case 'completed':
    case '已完成':
      return 'success'
    case 'failed':
    case '失败':
      return 'danger'
    case 'pending':
    case '等待中':
      return 'warning'
    default:
      return 'info'
  }
}

// 加载运行中的任务
const loadRunningTasks = async () => {
  try {
    loading.value = true
    
    // 获取数据采集任务
    const dataCollectionResponse = await unifiedHttpClient.dataCollection.getRunningTasks()
    const dataCollectionTasks = dataCollectionResponse.data || []
    
    // 获取AI分析任务
    const aiAnalysisResponse = await unifiedHttpClient.aiAnalysis.getRunningTasks()
    const aiAnalysisTasks = aiAnalysisResponse.data || []
    
    // 合并任务列表
    const allTasks: TodoItem[] = [
      ...dataCollectionTasks.map((task: any) => ({
        id: task.id,
        name: task.data_type ? `${task.data_type}数据采集` : '数据采集任务',
        status: task.status === 'running' ? '运行中' : task.status,
        progress: task.progress
      })),
      ...aiAnalysisTasks.map((task: any) => ({
        id: task.id,
        name: task.analysis_type ? `${task.analysis_type}分析` : 'AI分析任务',
        status: task.status === 'running' ? '运行中' : task.status,
        progress: task.progress
      }))
    ]
    
    todoList.value = allTasks.slice(0, 5) // 只显示前5个任务
  } catch (error) {
    console.error('加载任务列表失败:', error)
    todoList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRunningTasks()
})
</script>

<style lang="scss" scoped>
.todo-list {
  height: 400px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      font-weight: 600;
      color: #303133;
    }
  }
  
  .todo-content {
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }
    
    .todo-item {
      margin-bottom: 16px;
      
      .task-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .task-name {
          font-weight: 500;
          color: #303133;
        }
      }
      
      .task-progress {
        margin-top: 8px;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style> 