<template>
  <div class="task-table">
    <el-table :data="tasks" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="任务ID" width="280" />
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
            :percentage="scope.row.progress"
            :status="getProgressStatus(scope.row.progress, scope.row.status)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="message" label="消息" />
      <el-table-column prop="start_time" label="开始时间" width="180">
        <template #default="scope">
          {{ formatTime(scope.row.start_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="end_time" label="结束时间" width="180">
        <template #default="scope">
          {{ scope.row.end_time ? formatTime(scope.row.end_time) : '--' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button
            @click="viewTaskDetail(scope.row)"
            size="small"
            type="primary"
          >
            详情
          </el-button>
          <el-button
            v-if="scope.row.status === 'running'"
            @click="stopTask(scope.row)"
            size="small"
            type="danger"
          >
            停止
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 任务详情对话框-->
    <el-dialog
      v-model="detailDialogVisible"
      title="任务详情"
      width="600px"
    >
      <div v-if="selectedTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">
            {{ selectedTask.id }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedTask.status)">
              {{ getStatusText(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">
            {{ selectedTask.progress }}%
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatTime(selectedTask.start_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间" v-if="selectedTask.end_time">
            {{ formatTime(selectedTask.end_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="消息" :span="2">
            {{ selectedTask.message }}
          </el-descriptions-item>
          <el-descriptions-item label="错误信息" v-if="selectedTask.error_message" :span="2">
            <el-alert
              :title="selectedTask.error_message"
              type="error"
              show-icon
            />
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedTask.result" class="task-result">
          <h4>任务结果</h4>
          <pre>{{ JSON.stringify(selectedTask.result, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

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

const props = defineProps<{
  tasks: Task[]
  service: string
}>()

const emit = defineEmits<{
  refresh: []
}>()

const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedTask = ref<Task | null>(null)

// 获取状态类型
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

// 获取状态文本
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

// 获取进度状态
const getProgressStatus = (progress: number, status: string) => {
  if (status === 'failed') return 'exception'
  if (status === 'completed') return 'success'
  if (progress === 100) return 'success'
  return undefined
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return '--'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN')
  } catch (error) {
    return timeStr
  }
}

// 查看任务详情
const viewTaskDetail = (task: Task) => {
  selectedTask.value = task
  detailDialogVisible.value = true
}

// 停止任务
const stopTask = async (task: Task) => {
  try {
    await ElMessageBox.confirm(
      `确定要停止任务 ${task.id} 吗？`,
      '确认停止',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用后端API停止任务
    // 暂时只是显示消息
    ElMessage.success('停止任务请求已发送')
    emit('refresh')
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped>
.task-table {
  width: 100%;
}

.task-detail {
  max-height: 400px;
  overflow-y: auto;
}

.task-result {
  margin-top: 20px;
}

.task-result h4 {
  margin-bottom: 10px;
  color: #606266;
}

.task-result pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style> 
