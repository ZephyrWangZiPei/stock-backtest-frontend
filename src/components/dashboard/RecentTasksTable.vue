<template>
  <el-card class="table-card">
    <template #header>
      <div class="card-header">
        <span>最近任务</span>
        <el-button @click="$emit('refresh')" size="small" type="primary">
          刷新任务
        </el-button>
      </div>
    </template>
    <el-table :data="tasks" style="width: 100%" v-loading="loading">
      <el-table-column prop="data_type" label="任务类型" width="120">
        <template #default="scope">
          <span>{{ getTaskTypeText(scope.row.data_type) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="data_source" label="数据源" width="100">
        <template #default="scope">
          <span>{{ getDataSourceText(scope.row.data_source) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="200">
        <template #default="scope">
          <el-progress
            :percentage="scope.row.progress || 0"
            :status="getProgressStatus(scope.row.progress, scope.row.status)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="message" label="消息" min-width="300">
        <template #default="scope">
          <span class="message-text">{{ scope.row.message || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="start_date" label="开始日期" width="120">
        <template #default="scope">
          <span>{{ scope.row.start_date || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="end_date" label="结束日期" width="120">
        <template #default="scope">
          <span>{{ scope.row.end_date || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="scope">
          <span>{{ formatTime(scope.row.created_at) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
// Props
interface Props {
  tasks: any[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  refresh: []
}>()

// 方法
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'info',
    'running': 'primary',
    'completed': 'success',
    'failed': 'danger',
    'cancelled': 'warning'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '等待中',
    'running': '运行中',
    'completed': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const getProgressStatus = (progress: number, status: string) => {
  if (status === 'failed') return 'exception'
  if (status === 'completed') return 'success'
  if (progress === 100) return 'success'
  return undefined
}

const getTaskTypeText = (dataType: string) => {
  const typeMap: Record<string, string> = {
    'stock_basic': '基础数据',
    'daily_data': '日线数据',
    'news_data': '新闻数据',
    'fundamental': '基本面数据',
    'technical': '技术指标',
    'fund_flow': '资金流向',
    'institute_hold': '机构持股',
    'analyst_rating': '分析师评级',
    'stock_score': '股票评分'
  }
  return typeMap[dataType] || dataType
}

const getDataSourceText = (dataSource: string) => {
  const sourceMap: Record<string, string> = {
    'baostock': 'Baostock',
    'akshare': 'AkShare',
    'free_news': '免费新闻'
  }
  return sourceMap[dataSource] || dataSource
}

const formatTime = (time: string | null) => {
  if (!time) return '--'
  try {
    const date = new Date(time)
    return date.toLocaleString('zh-CN')
  } catch {
    return time
  }
}
</script>

<style scoped>
.table-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  word-break: break-word;
}
</style> 
