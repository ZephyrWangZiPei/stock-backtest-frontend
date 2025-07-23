<template>
  <div
    v-if="show"
    class="top-backtest-progress"
  >
    <div class="progress-header">
      <div class="progress-title">
        <el-icon class="progress-icon">
          <Loading />
        </el-icon>
        <span>Top策略回测执行中...</span>
      </div>
      <div class="progress-status">
        <span class="status-text">{{ statusText }}</span>
        <span class="progress-percentage">{{ Number(progress.toFixed(2)) }}%</span>
      </div>
    </div>

    <div class="progress-bar-container">
      <el-progress
        :percentage="progress"
        :status="progressStatus"
        :stroke-width="8"
        :show-text="false"
        class="progress-bar"
      />
    </div>

    <div
      v-if="currentStep"
      class="progress-details"
    >
      <div class="step-info">
        <span class="step-label">当前步骤:</span>
        <span class="step-text">{{ currentStep }}</span>
      </div>
      <div
        v-if="stepProgress !== null"
        class="step-progress"
      >
        <span class="step-label">步骤进度:</span>
        <span class="step-text">{{ Number(stepProgress.toFixed(2)) }}%</span>
      </div>
    </div>

    <div
      v-if="message"
      class="progress-message"
    >
      <el-icon class="message-icon">
        <InfoFilled />
      </el-icon>
      <span>{{ message }}</span>
      <el-button
        v-if="status === 'exception'"
        type="primary"
        size="small"
        @click="handleRetry"
        class="retry-btn"
      >
        重试
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading, InfoFilled } from '@element-plus/icons-vue'

// =============================================================================
// Props 定义
// =============================================================================

interface Props {
  /** 是否显示进度条 */
  show?: boolean
  /** 总进度百分比 (0-100) */
  progress?: number
  /** 当前步骤描述 */
  currentStep?: string
  /** 步骤内进度百分比 (0-100) */
  stepProgress?: number | null
  /** 状态消息 */
  message?: string
  /** 进度状态 */
  status?: 'success' | 'exception' | 'warning' | ''
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  progress: 0,
  currentStep: '',
  stepProgress: null,
  message: '',
  status: ''
})

// =============================================================================
// Emits 定义
// =============================================================================

const emit = defineEmits<{
  retry: []
}>()

// =============================================================================
// 方法
// =============================================================================

/**
 * 处理重试
 */
const handleRetry = () => {
  emit('retry')
}

// =============================================================================
// 计算属性
// =============================================================================

/**
 * 进度状态
 */
const progressStatus = computed(() => {
  if (props.status === 'exception') return 'exception'
  if (props.status === 'warning') return 'warning'
  if (props.progress >= 100) return 'success'
  return ''
})

/**
 * 状态文本
 */
const statusText = computed(() => {
  if (props.status === 'exception') return '执行失败'
  if (props.status === 'warning') return '执行警告'
  if (props.progress >= 100) return '执行完成'
  if (props.progress > 0) return '执行中'
  return '准备中'
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.top-backtest-progress {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: 16px;
  margin: 0;
  box-shadow: var(--el-box-shadow-light);
  min-width: 300px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-icon {
  color: var(--el-color-primary);
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.progress-percentage {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  min-width: 48px;
  text-align: right;
}

.progress-bar-container {
  margin-bottom: 12px;
}

.progress-bar {
  :deep(.el-progress-bar__outer) {
    background-color: var(--el-border-color-lighter);
  }
  
  :deep(.el-progress-bar__inner) {
    transition: width 0.3s ease;
  }
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.step-info,
.step-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.step-text {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.progress-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  border-radius: var(--el-border-radius-base);
  font-size: 13px;
  color: var(--el-color-info);
}

.message-icon {
  font-size: 14px;
}

.retry-btn {
  margin-left: auto;
  flex-shrink: 0;
}

// 响应式设计
@include mobile {
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .progress-status {
    width: 100%;
    justify-content: space-between;
  }
  
  .progress-details {
    .step-info,
    .step-progress {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    
    .step-label {
      min-width: auto;
    }
  }
}
</style> 