<template>
  <div class="dashboard-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>数据概览</h1>
      <p>股票数据分析和任务监控总览</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalStocks }}</div>
            <div class="stat-label">股票总数</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.runningTasks }}</div>
            <div class="stat-label">运行中任务</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.dataCompleteness }}%</div>
            <div class="stat-label">数据完整度</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.todayUpdates }}</div>
            <div class="stat-label">今日更新</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :lg="12">
        <el-card class="content-card">
          <template #header>
            <span>最近任务</span>
          </template>
          <div class="task-list">
            <div v-for="task in recentTasks" :key="task.id" class="task-item">
              <div class="task-info">
                <h4>{{ task.name }}</h4>
                <span class="task-time">{{ formatTime(task.startTime) }}</span>
              </div>
              <el-tag :type="getTaskTagType(task.status)">{{ task.status }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card class="content-card">
          <template #header>
            <span>系统状态</span>
          </template>
          <div class="system-status">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="CPU使用率">{{ stats.cpuUsage }}</el-descriptions-item>
              <el-descriptions-item label="内存使用率">{{ stats.memoryUsage }}</el-descriptions-item>
              <el-descriptions-item label="磁盘使用率">{{ stats.diskUsage }}</el-descriptions-item>
              <el-descriptions-item label="网络状态">{{ stats.networkStatus }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import { ElMessage } from 'element-plus'

interface TaskItem {
  id: number
  name: string
  status: string
  startTime: string
}

interface SystemStats {
  totalStocks: number
  runningTasks: number
  dataCompleteness: number
  todayUpdates: number
  cpuUsage: string
  memoryUsage: string
  diskUsage: string
  networkStatus: string
}

// 响应式数据
const loading = ref(false)
const stats = ref<SystemStats>({
  totalStocks: 0,
  runningTasks: 0,
  dataCompleteness: 0,
  todayUpdates: 0,
  cpuUsage: '0%',
  memoryUsage: '0%',
  diskUsage: '0%',
  networkStatus: '正常'
})

const runningTasks = ref<TaskItem[]>([])
const recentTasks = ref<TaskItem[]>([])

// 加载仪表板数据
const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // 获取数据库统计信息
    const dbStatsResponse = await unifiedHttpClient.dataCollection.getDatabaseStats()
    if (dbStatsResponse.data) {
      stats.value.totalStocks = dbStatsResponse.data.total_stocks || 0
      stats.value.dataCompleteness = dbStatsResponse.data.data_completeness || 0
      stats.value.todayUpdates = dbStatsResponse.data.today_updates || 0
    }
    
    // 获取运行中任务
    const dataTasksResponse = await unifiedHttpClient.dataCollection.getRunningTasks()
    const aiTasksResponse = await unifiedHttpClient.aiAnalysis.getRunningTasks()
    
    const allRunningTasks = [
      ...(dataTasksResponse.data || []),
      ...(aiTasksResponse.data || [])
    ]
    
    stats.value.runningTasks = allRunningTasks.length
    
    runningTasks.value = allRunningTasks.slice(0, 5).map((task: any, index: number) => ({
      id: index + 1,
      name: task.data_type || task.analysis_type || '未知任务',
      status: task.status === 'running' ? '运行中' : task.status,
      startTime: task.start_time || new Date().toISOString()
    }))
    
    // 获取任务历史作为最近任务
    const historyResponse = await unifiedHttpClient.dataCollection.getHistory({
      page: 1,
      limit: 4
    })
    
    if (historyResponse.data && historyResponse.data.tasks) {
      recentTasks.value = historyResponse.data.tasks.map((task: any, index: number) => ({
        id: index + 1,
        name: task.data_type || '数据采集任务',
        status: task.status === 'completed' ? '已完成' : task.status === 'running' ? '运行中' : '等待中',
        startTime: task.start_time || new Date().toISOString()
      }))
    }
    
  } catch (error) {
    console.error('加载仪表板数据失败:', error)
    ElMessage.warning('部分数据加载失败')
  } finally {
    loading.value = false
  }
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '--'
  return new Date(timeStr).toLocaleString('zh-CN')
}

const getTaskTagType = (status: string) => {
  switch (status) {
    case '已完成': return 'success'
    case '运行中': return 'primary'
    case '失败': return 'danger'
    case '等待中': return 'warning'
    default: return 'info'
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-view {
  padding: 20px;
  min-height: calc(100vh - 70px); // 确保最小高度
  overflow-y: auto; // 允许垂直滚动
  
  .page-header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 28px;
    }
    
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }
  
  .stats-row {
    margin-bottom: 20px;
    
    .stat-card {
      margin-bottom: 16px;
      
      .stat-content {
        text-align: center;
        padding: 20px 0;
        
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #409eff;
          margin-bottom: 8px;
        }
        
        .stat-label {
          color: #606266;
          font-size: 14px;
        }
      }
    }
  }
  
  .content-row {
    .content-card {
      margin-bottom: 16px;
      height: 400px; // 固定高度
      
      .task-list {
        max-height: 320px; // 限制最大高度
        overflow-y: auto; // 添加滚动条
        
        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #ebeef5;
          
          &:last-child {
            border-bottom: none;
          }
          
          .task-info {
            h4 {
              margin: 0 0 4px 0;
              color: #303133;
              font-size: 14px;
            }
            
            .task-time {
              color: #909399;
              font-size: 12px;
            }
          }
        }
      }
      
      .system-status {
        max-height: 320px; // 限制最大高度
        overflow-y: auto; // 添加滚动条
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-view {
    padding: 12px;
  }
}
</style> 