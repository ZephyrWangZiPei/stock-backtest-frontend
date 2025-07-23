<template>
  <div class="job-list">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-200 flex items-center">
        <div class="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-md mr-3"></div>
        定时任务
      </h3>
      <button
        @click="handleRequestStatusUpdate"
        class="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
      >
        刷新状态
      </button>
    </div>

    <div class="space-y-3">
      <div
        v-for="job in jobs"
        :key="job.id"
        class="job-card"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span class="font-medium text-gray-200">{{ job.name }}</span>
            </div>

            <div class="text-xs text-gray-400 space-y-1">
              <div>任务ID: {{ job.id }}</div>
              <div>下次执行: {{ formatNextRunTime(job.next_run_time) }}</div>
              <div>触发器: {{ formatTrigger(job.trigger) }}</div>
            </div>
          </div>

          <div class="flex items-center space-x-2 ml-4">
            <button
              @click="handleRunJob(job.id)"
              class="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
            >
              立即执行
            </button>
            <button
              @click="handleEditJob(job)"
              class="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
            >
              编辑
            </button>
            <button
              @click="handleDeleteJob(job.id)"
              class="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="jobs.length === 0"
        class="text-center py-8 text-gray-400"
      >
        暂无定时任务
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSchedulerStore } from '@/store/scheduler'
import type { SchedulerJob } from '@/types/api'

const store = useSchedulerStore()

const jobs = computed(() => store.status.jobs || [])

const handleRequestStatusUpdate = () => {
  store.requestStatusUpdate()
  ElMessage.info('已请求状态更新')
}

const handleRunJob = (jobId: string) => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法执行任务。')
    return
  }

  store.socket.emit('run_job_manually', { job_id: jobId })
  ElMessage.info(`已发送执行任务请求: ${jobId}`)
}

const handleEditJob = (job: SchedulerJob) => {
  // TODO: 实现任务编辑功能
  ElMessage.info('任务编辑功能开发中...')
}

const handleDeleteJob = (jobId: string) => {
  ElMessageBox.confirm(`确定要删除任务 "${jobId}" 吗？`, '确认删除', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 实现任务删除功能
    ElMessage.info('任务删除功能开发中...')
  })
}

const formatNextRunTime = (time: string | null | undefined) => {
  if (!time) return '未设置'
  return time
}

const formatTrigger = (trigger: string) => {
  // 简化触发器显示
  if (trigger.includes('CronTrigger')) {
    return '定时任务'
  } else if (trigger.includes('IntervalTrigger')) {
    return '间隔任务'
  }
  return trigger
}
</script>

<style scoped>
.job-card {
  @apply p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-colors;
}
</style> 