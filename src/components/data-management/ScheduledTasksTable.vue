<template>
  <el-card class="scheduled-tasks-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>定时任务管理</span>
        <div class="header-actions">
          <el-button @click="$emit('showCreateDialog')" size="small" type="primary">
            <el-icon><Plus /></el-icon>
            新建任务
          </el-button>
          <el-button @click="$emit('refresh')" size="small" type="info" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </template>

    <el-table :data="tasks" v-loading="loading" style="width: 100%">
      <el-table-column prop="name" label="任务名称" width="200" />
      <el-table-column prop="description" label="描述" min-width="250">
        <template #default="scope">
          <span class="task-description">{{ scope.row.description || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getScheduledTaskStatusType(scope.row.status)" size="small">
            {{ getScheduledTaskStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="next_run_time" label="下次运行时间" width="180">
        <template #default="scope">
          <span class="next-run-time">{{ formatTime(scope.row.next_run_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="trigger" label="触发规则" width="150">
        <template #default="scope">
          <span class="trigger-rule">{{ scope.row.trigger || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button 
            @click="$emit('toggleTask', scope.row)" 
            size="small" 
            :type="scope.row.status === 'active' ? 'warning' : 'success'"
          >
            {{ scope.row.status === 'active' ? '暂停' : '启动' }}
          </el-button>
          <el-button 
            @click="$emit('deleteTask', scope.row)" 
            size="small" 
            type="danger" 
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { Plus, Refresh } from '@element-plus/icons-vue'

// Props
interface Props {
  tasks: any[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  refresh: []
  showCreateDialog: []
  toggleTask: [task: any]
  deleteTask: [task: any]
}>()

// 方法
const getScheduledTaskStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'active': 'success',
    'paused': 'warning',
    'error': 'danger',
    'idle': 'info'
  }
  return statusMap[status] || 'info'
}

const getScheduledTaskStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'active': '运行中',
    'paused': '已暂停',
    'error': '错误',
    'idle': '空闲'
  }
  return statusMap[status] || status
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '--'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN')
  } catch (error) {
    return timeStr
  }
}
</script>

<style scoped>
.scheduled-tasks-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.task-description {
  color: #606266;
  font-size: 12px;
}

.next-run-time {
  font-size: 12px;
  color: #409eff;
}

.trigger-rule {
  font-size: 12px;
  color: #909399;
}
</style> 
