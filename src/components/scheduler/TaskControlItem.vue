<template>
  <div class="task-control-item">
    <!-- 任务按钮 -->
    <div class="task-button-container">
      <button
        @click="$emit('click')"
        :disabled="loading || !isConnected"
        class="task-button"
        :class="buttonClasses"
      >
        <div class="button-content">
          <div class="icon-container" :class="iconContainerClasses">
            <i :class="[icon, iconClasses]"></i>
          </div>
          <div class="text-content">
            <div class="title">{{ title }}</div>
            <div class="description">{{ description }}</div>
          </div>
          <div class="status-indicator">
            <i v-if="loading" class="fas fa-spinner fa-spin" :class="iconClasses"></i>
            <i v-else class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </div>
      </button>
    </div>

    <!-- 进度条 -->
    <div v-if="showProgress" class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :class="progressFillClasses"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <div class="progress-text">
        <span class="progress-percentage">{{ progress }}%</span>
        <span class="progress-message">{{ progressMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSchedulerStore } from '@/store/scheduler'

const props = defineProps<{
  title: string
  description: string
  icon: string
  color: 'green' | 'orange' | 'blue' | 'purple' | 'cyan' | 'red'
  loading: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const store = useSchedulerStore()

// 连接状态
const isConnected = computed(() => store.socket?.connected)

// 获取任务状态
const taskStatus = computed(() => {
  const taskMap = {
    '智能数据更新': 'update_daily_data_smart',
    '股票列表更新': 'update_stock_list',
    '股票详细信息': 'update_stock_details',
    '基本面数据': 'update_stock_fundamentals',
    '潜力股海选': 'candidate_pool'
  }
  
  const taskKey = taskMap[props.title as keyof typeof taskMap]
  const status = taskKey ? store.taskStatus[taskKey] : null
  
  return status
})

// 进度相关
const showProgress = computed(() => {
  return taskStatus.value && 
         taskStatus.value.current_date_progress !== undefined
})

const progress = computed(() => {
  const rawProgress = taskStatus.value?.current_date_progress || 0
  return Number(rawProgress.toFixed(2))
})

const progressMessage = computed(() => {
  return taskStatus.value?.message || ''
})

// 样式类
const colorClasses = {
  green: {
    button: 'hover:border-green-500/50 hover:bg-green-500/10',
    icon: 'text-green-400',
    iconContainer: 'bg-green-500/20 group-hover:bg-green-500/30',
    progress: 'bg-green-500'
  },
  orange: {
    button: 'hover:border-orange-500/50 hover:bg-orange-500/10',
    icon: 'text-orange-400',
    iconContainer: 'bg-orange-500/20 group-hover:bg-orange-500/30',
    progress: 'bg-orange-500'
  },
  blue: {
    button: 'hover:border-blue-500/50 hover:bg-blue-500/10',
    icon: 'text-blue-400',
    iconContainer: 'bg-blue-500/20 group-hover:bg-blue-500/30',
    progress: 'bg-blue-500'
  },
  purple: {
    button: 'hover:border-purple-500/50 hover:bg-purple-500/10',
    icon: 'text-purple-400',
    iconContainer: 'bg-purple-500/20 group-hover:bg-purple-500/30',
    progress: 'bg-purple-500'
  },
  cyan: {
    button: 'hover:border-cyan-500/50 hover:bg-cyan-500/10',
    icon: 'text-cyan-400',
    iconContainer: 'bg-cyan-500/20 group-hover:bg-cyan-500/30',
    progress: 'bg-cyan-500'
  },
  red: {
    button: 'hover:border-red-500/50 hover:bg-red-500/10',
    icon: 'text-red-400',
    iconContainer: 'bg-red-500/20 group-hover:bg-red-500/30',
    progress: 'bg-red-500'
  }
}

const buttonClasses = computed(() => {
  const baseClasses = 'w-full px-4 py-3 rounded-lg border border-gray-600/50 bg-gray-700/50 backdrop-blur-sm text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group'
  return `${baseClasses} ${colorClasses[props.color].button}`
})

const iconClasses = computed(() => colorClasses[props.color].icon)

const iconContainerClasses = computed(() => colorClasses[props.color].iconContainer)

const progressFillClasses = computed(() => colorClasses[props.color].progress)
</script>

<style scoped>
.task-control-item {
  @apply space-y-2;
}

.task-button-container {
  @apply relative;
}

.task-button {
  @apply relative overflow-hidden;
}

.button-content {
  @apply flex items-center space-x-3;
}

.icon-container {
  @apply w-10 h-10 rounded-sm flex items-center justify-center transition-colors;
}

.text-content {
  @apply flex-1 text-left;
}

.title {
  @apply font-medium text-white;
}

.description {
  @apply text-sm text-gray-400;
}

.status-indicator {
  @apply w-6 h-6 flex items-center justify-center;
}

.progress-container {
  @apply space-y-1;
}

.progress-bar {
  @apply w-full h-2 bg-gray-600/50 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full rounded-full transition-all duration-300 ease-out;
}

.progress-text {
  @apply flex justify-between items-center text-xs;
}

.progress-percentage {
  @apply font-medium text-gray-300;
}

.progress-message {
  @apply text-gray-400 truncate flex-1 ml-2;
}
</style> 