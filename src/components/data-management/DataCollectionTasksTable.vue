<template>
  <el-card class="data-collection-tasks-table" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>数据采集任务</span>
        <el-button @click="$emit('refresh')" size="small" type="primary" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </template>

    <el-table :data="tasks" v-loading="loading" style="width: 100%">
      <el-table-column prop="name" label="任务名称" width="200" />
      <el-table-column prop="description" label="描述" min-width="250" />
      <el-table-column prop="data_type" label="数据类型" width="120">
        <template #default="scope">
          <el-tag :type="getDataTypeType(scope.row.data_type)" size="small">
            {{ getDataTypeDisplayName(scope.row.data_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="200">
        <template #default="scope">
          <el-progress
            :percentage="scope.row.progress"
            :status="getProgressStatus(scope.row.progress, scope.row.status)"
            :stroke-width="8"
          />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)" size="small">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="消息" min-width="200">
        <template #default="scope">
          <span class="message-text" :class="getMessageClass(scope.row.status)">
            {{ scope.row.message || '--' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button
            @click="$emit('startTask', scope.row)" 
            size="small"
            type="primary"
            :loading="scope.row.loading"
            :disabled="scope.row.status === 'running'"
          >
            {{ scope.row.status === 'running' ? '采集中' : '启动' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'

// Props
interface Props {
  tasks: any[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  refresh: []
  startTask: [task: any]
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

const getDataTypeType = (dataType: string) => {
  const typeMap: Record<string, string> = {
    'stock_basic': 'primary',
    'daily_data': 'success',
    'news_data': 'warning',
    'fundamental': 'info',
    'technical': 'danger',
    'fund_flow': 'success',
    'institute_hold': 'warning',
    'analyst_rating': 'info'
  }
  return typeMap[dataType] || 'info'
}

const getDataTypeDisplayName = (dataType: string) => {
  const nameMap: Record<string, string> = {
    'stock_basic': '基础数据',
    'daily_data': '日线数据',
    'news_data': '新闻数据',
    'fundamental': '基本面数据',
    'technical': '技术指标',
    'fund_flow': '资金流向',
    'institute_hold': '机构持股',
    'analyst_rating': '分析师评级'
  }
  return nameMap[dataType] || dataType
}

const getMessageClass = (status: string) => {
  const classMap: Record<string, string> = {
    'completed': 'message-success',
    'failed': 'message-error',
    'running': 'message-info'
  }
  return classMap[status] || ''
}
</script>

<style scoped>
.data-collection-tasks-table {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-text {
  font-size: 12px;
  line-height: 1.4;
  word-break: break-word;
}

.message-success {
  color: #67c23a;
}

.message-error {
  color: #f56c6c;
}

.message-info {
  color: #409eff;
}
</style> 
