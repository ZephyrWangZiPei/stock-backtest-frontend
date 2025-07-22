<template>
  <div class="scheduler-status">
    <div class="relative">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-lg blur-xl"></div>
      <div
        class="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg px-6 py-4 flex justify-between items-center"
      >
        <el-tag
          :type="schedulerStatus.is_running ? 'success' : 'info'"
          size="large"
          class="relative px-6 py-2 text-base font-semibold backdrop-blur-sm"
          :class="schedulerStatus.is_running ? 'animate-pulse' : ''"
        >
          <div class="flex items-center space-x-2">
            <div
              :class="schedulerStatus.is_running ? 'w-2 h-2 bg-green-400 rounded-md animate-pulse' : 'w-2 h-2 bg-gray-400 rounded-md'"
            ></div>
            <span>{{ schedulerStatus.is_running ? '运行中' : '已停止' }}</span>
          </div>
        </el-tag>
        
        <div class="flex items-center space-x-4">
          <div class="text-sm text-gray-400">
            任务数量: {{ schedulerStatus.jobs_count || 0 }}
          </div>
          <div class="text-sm text-gray-400">
            当前时间: {{ schedulerStatus.current_time || '--' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSchedulerStore } from '@/store/scheduler'

const store = useSchedulerStore()

const schedulerStatus = computed(() => store.status)
</script>

<style scoped>
.scheduler-status {
  margin-bottom: 1.5rem;
}
</style> 