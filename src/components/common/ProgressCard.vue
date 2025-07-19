<template>
  <el-card class="progress-card">
    <template #header>
      <div class="card-header">
        <span class="header-title">
          <el-icon class="header-icon">
            <component :is="icon" />
          </el-icon>
          {{ title }}
        </span>
        <el-tag
          :type="statusType"
          size="small"
        >
          {{ statusText }}
        </el-tag>
      </div>
    </template>

    <!-- 进度条 -->
    <div v-if="showProgress" class="progress-section">
      <el-progress
        :percentage="percentage"
        :status="progressStatus"
        :stroke-width="8"
        :show-text="false"
      />
      <div class="progress-text">{{ percentage }}% 完成</div>
    </div>

    <!-- 日志列表 -->
    <div v-if="logs && logs.length > 0" class="logs-container">
      <h4 class="logs-title">
        <el-icon class="logs-icon">
          <Document />
        </el-icon>
        {{ logsTitle }}
      </h4>
      <div class="logs-list">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="getLogClass(log.type)"
        >
          <div class="log-content">
            <div class="log-header">
              <div class="log-step">
                <div class="log-dot" :class="getLogDotClass(log.type)"></div>
                <span class="step-text">{{ log.step }}</span>
              </div>
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            </div>
            <div class="log-message">{{ log.message }}</div>
            <div v-if="log.details" class="log-details">
              <pre>{{ log.details }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="showEmpty" class="empty-state">
      <el-empty
        :description="emptyText"
        :image-size="80"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

/**
 * 日志类型
 */
export interface LogItem {
  step: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  timestamp: Date
  details?: string
}

/**
 * 组件属性
 */
interface Props {
  /** 卡片标题 */
  title: string
  /** 状态类型 */
  status: 'pending' | 'running' | 'completed' | 'error'
  /** 进度百分比 */
  percentage?: number
  /** 日志列表 */
  logs?: LogItem[]
  /** 是否显示进度条 */
  showProgress?: boolean
  /** 是否显示空状态 */
  showEmpty?: boolean
  /** 空状态文本 */
  emptyText?: string
  /** 日志标题 */
  logsTitle?: string
  /** 图标名称 */
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  percentage: 0,
  logs: () => [],
  showProgress: true,
  showEmpty: false,
  emptyText: '暂无数据',
  logsTitle: '处理日志',
  icon: 'Document'
})

// 计算属性
const statusType = computed(() => {
  switch (props.status) {
    case 'running':
      return 'primary'
    case 'completed':
      return 'success'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'pending':
      return '等待中'
    case 'running':
      return '进行中'
    case 'completed':
      return '已完成'
    case 'error':
      return '错误'
    default:
      return '未知'
  }
})

const progressStatus = computed(() => {
  if (props.percentage === 100) return 'success'
  if (props.status === 'error') return 'exception'
  return undefined
})

// 方法
const getLogClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'log-success'
    case 'error':
      return 'log-error'
    case 'warning':
      return 'log-warning'
    default:
      return 'log-info'
  }
}

const getLogDotClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'dot-success'
    case 'error':
      return 'dot-error'
    case 'warning':
      return 'dot-warning'
    default:
      return 'dot-info'
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.progress-card {
  @include card-base;
  margin-bottom: $spacing-lg;

  .card-header {
    @include flex(row, space-between, center);

    .header-title {
      @include flex(row, flex-start, center);
      font-weight: $font-weight-medium;
      color: $text-primary;

      .header-icon {
        margin-right: $spacing-sm;
        font-size: $font-size-medium;
      }
    }
  }

  .progress-section {
    margin-bottom: $spacing-lg;

    .progress-text {
      text-align: center;
      margin-top: $spacing-sm;
      color: $text-regular;
      font-size: $font-size-small;
    }
  }

  .logs-container {
    .logs-title {
      @include flex(row, flex-start, center);
      margin-bottom: $spacing-md;
      font-size: $font-size-medium;
      font-weight: $font-weight-medium;
      color: $text-primary;

      .logs-icon {
        margin-right: $spacing-sm;
      }
    }

    .logs-list {
      max-height: 400px;
      overflow-y: auto;
      @include custom-scrollbar;

      .log-item {
        margin-bottom: $spacing-sm;
        padding: $spacing-md;
        border-radius: $card-border-radius;
        border: 1px solid $border-light;

        &.log-success {
          background-color: rgba($success-color, 0.1);
          border-color: rgba($success-color, 0.2);
        }

        &.log-error {
          background-color: rgba($danger-color, 0.1);
          border-color: rgba($danger-color, 0.2);
        }

        &.log-warning {
          background-color: rgba($warning-color, 0.1);
          border-color: rgba($warning-color, 0.2);
        }

        &.log-info {
          background-color: rgba($primary-color, 0.1);
          border-color: rgba($primary-color, 0.2);
        }

        .log-content {
          .log-header {
            @include flex(row, space-between, center);
            margin-bottom: $spacing-xs;

            .log-step {
              @include flex(row, flex-start, center);

              .log-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: $spacing-sm;

                &.dot-success {
                  background-color: $success-color;
                }

                &.dot-error {
                  background-color: $danger-color;
                }

                &.dot-warning {
                  background-color: $warning-color;
                }

                &.dot-info {
                  background-color: $primary-color;
                }
              }

              .step-text {
                font-weight: $font-weight-medium;
                color: $text-primary;
                font-size: $font-size-small;
              }
            }

            .log-time {
              color: $text-secondary;
              font-size: $font-size-extra-small;
            }
          }

          .log-message {
            color: $text-regular;
            font-size: $font-size-small;
            line-height: $line-height-base;
            margin-bottom: $spacing-xs;
          }

          .log-details {
            background-color: $bg-secondary;
            border-radius: 4px;
            padding: $spacing-sm;
            margin-top: $spacing-xs;

            pre {
              margin: 0;
              font-size: $font-size-extra-small;
              color: $text-secondary;
              white-space: pre-wrap;
              word-break: break-word;
            }
          }
        }
      }
    }
  }

  .empty-state {
    padding: $spacing-xxl 0;
  }
}
</style> 