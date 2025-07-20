<template>
  <div
    class="progress-card"
    :class="cardClass"
  >
    <div class="progress-header">
      <div class="progress-title">
        <el-icon
          v-if="icon"
          class="progress-icon"
        >
          <component :is="icon" />
        </el-icon>
        <span class="title-text">{{ title }}</span>
      </div>
      <div class="progress-percentage">{{ Math.round(percentage) }}%</div>
    </div>

    <div class="progress-body">
      <el-progress
        :percentage="percentage"
        :color="progressColor"
        :stroke-width="strokeWidth"
        :show-text="false"
        :status="progressStatus"
        class="progress-bar"
      />

      <div
        v-if="detail"
        class="progress-detail"
      >
        {{ detail }}
      </div>

      <div
        v-if="showTime"
        class="progress-time"
      >
        <span
          v-if="startTime"
          class="start-time"
        >
          开始: {{ formatTime(startTime) }}
        </span>
        <span
          v-if="estimatedEndTime"
          class="end-time"
        >
          预计完成: {{ formatTime(estimatedEndTime) }}
        </span>
      </div>
    </div>

    <div
      v-if="showActions"
      class="progress-actions"
    >
      <slot name="actions">
        <el-button
          v-if="canCancel"
          type="danger"
          size="small"
          @click="handleCancel"
          :loading="cancelling"
        >
          取消
        </el-button>
        <el-button
          v-if="canRetry"
          type="primary"
          size="small"
          @click="handleRetry"
          :loading="retrying"
        >
          重试
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/formatters'

// =============================================================================
// Props 定义
// =============================================================================

interface Props {
  /** 标题 */
  title?: string
  /** 进度百分比 (0-100) */
  percentage?: number
  /** 详细信息 */
  detail?: string
  /** 图标组件 */
  icon?: string
  /** 进度条颜色 */
  color?: string
  /** 进度条宽度 */
  strokeWidth?: number
  /** 进度状态 */
  status?: 'success' | 'exception' | 'warning'
  /** 是否显示时间信息 */
  showTime?: boolean
  /** 开始时间 */
  startTime?: Date | string
  /** 预计完成时间 */
  estimatedEndTime?: Date | string
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 是否可以取消 */
  canCancel?: boolean
  /** 是否可以重试 */
  canRetry?: boolean
  /** 取消中状态 */
  cancelling?: boolean
  /** 重试中状态 */
  retrying?: boolean
  /** 卡片变体 */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** 卡片大小 */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  title: '进度',
  percentage: 0,
  detail: '',
  icon: '',
  color: '',
  strokeWidth: 8,
  status: undefined,
  showTime: false,
  startTime: undefined,
  estimatedEndTime: undefined,
  showActions: false,
  canCancel: false,
  canRetry: false,
  cancelling: false,
  retrying: false,
  variant: 'default',
  size: 'md'
})

// =============================================================================
// Emits 定义
// =============================================================================

const emit = defineEmits<{
  cancel: []
  retry: []
}>()

// =============================================================================
// 计算属性
// =============================================================================

/**
 * 卡片样式类
 */
const cardClass = computed(() => [
  'progress-card',
  `progress-card--${props.variant}`,
  `progress-card--${props.size}`,
  {
    'progress-card--completed': props.percentage >= 100,
    'progress-card--error': props.status === 'exception',
    'progress-card--warning': props.status === 'warning'
  }
])

/**
 * 进度条颜色
 */
const progressColor = computed(() => {
  if (props.color) return props.color

  if (props.status === 'exception') return '#ef4444'
  if (props.status === 'warning') return '#f59e0b'
  if (props.percentage >= 100) return '#22c55e'
  if (props.percentage >= 80) return '#22c55e'
  if (props.percentage >= 50) return '#f59e0b'
  return '#3b82f6'
})

/**
 * 进度状态
 */
const progressStatus = computed(() => {
  if (props.status) return props.status
  if (props.percentage >= 100) return 'success'
  return undefined
})

// =============================================================================
// 方法
// =============================================================================

/**
 * 格式化时间
 */
const formatTime = (time: Date | string): string => {
  return formatDate(time, 'short')
}

/**
 * 处理取消
 */
const handleCancel = () => {
  if (props.canCancel && !props.cancelling) {
    emit('cancel')
  }
}

/**
 * 处理重试
 */
const handleRetry = () => {
  if (props.canRetry && !props.retrying) {
    emit('retry')
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/mixins.scss' as *;

// 基础样式
.progress-card {
  padding: 24px;
    border-radius: 8px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    transition: all 0.2s ease;
  
    &:hover {
      border-color: var(--el-border-color-hover);
      box-shadow: var(--el-box-shadow-light);
    }
  }
  
                // 变体样式 - 使用原生 Element Plus 颜色变量
                .progress-card--primary {
                  border-color: var(--el-color-primary);
                }
        
                .progress-card--success {
                  border-color: var(--el-color-success);
                }
        
                .progress-card--warning {
                  border-color: var(--el-color-warning);
                }
        
                .progress-card--danger {
                  border-color: var(--el-color-danger);
                }
        
                .progress-card--info {
                  border-color: var(--el-color-info);
                }
        
                // 尺寸样式
                .progress-card--sm {
                  padding: 16px;
                }
        
                .progress-card--md {
                  padding: 24px;
                }
        
                .progress-card--lg {
                  padding: 32px;
                }
        
                // 头部样式
                .progress-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 16px;
                }
        
                .progress-title {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
        
                .progress-icon {
                  font-size: 20px;
                }
        
                .title-text {
                  font-size: 16px;
                  font-weight: 600;
                }
        
                .progress-percentage {
                  font-size: 18px;
                  font-weight: 700;
                }
        
                // 主体样式
                .progress-body {
                  display: flex;
                  flex-direction: column;
                  gap: 12px;
                }
        
                .progress-detail {
                  font-size: 14px;
                  opacity: 0.8;
                }
        
                .progress-time {
                  display: flex;
                  justify-content: space-between;
                  font-size: 12px;
                  opacity: 0.7;
        
                  @include mobile {
                    flex-direction: column;
                    gap: 4px;
    }
  }

// 操作按钮样式
.progress-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}
</style> 