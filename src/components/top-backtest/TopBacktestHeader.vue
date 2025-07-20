<template>
  <div class="top-backtest-header">
    <div class="header-left">
      <h1 class="page-title">Top策略回测</h1>
      <p class="page-subtitle">多策略回测胜率排行榜</p>
    </div>
    
    <!-- 进度条 - 放在标题和按钮之间 -->
    <div class="header-progress" v-if="showProgress">
      <TopBacktestProgress
        :show="true"
        :progress="progress"
        :current-step="currentStep"
        :step-progress="stepProgress"
        :message="progressMessage"
        :status="progressStatus"
        @retry="handleRetry"
      />
    </div>
    
    <div class="header-right">
      <el-button
        type="primary"
        :icon="Refresh"
        @click="handleRefresh"
        :loading="loading"
        class="refresh-btn"
      >
        刷新数据
      </el-button>
      
      <el-button
        type="success"
        :icon="VideoPlay"
        @click="handleRunBacktest"
        :loading="runningJob"
        :disabled="runningJob"
        class="run-job-btn"
      >
        {{ runningJob ? '执行中...' : '执行回测' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Refresh, VideoPlay } from '@element-plus/icons-vue'
import TopBacktestProgress from './TopBacktestProgress.vue'

// =============================================================================
// Props 定义
// =============================================================================

interface Props {
  /** 加载状态 */
  loading?: boolean
  /** 任务运行状态 */
  runningJob?: boolean
  /** 总进度百分比 */
  progress?: number
  /** 当前步骤 */
  currentStep?: string
  /** 步骤进度 */
  stepProgress?: number | null
  /** 进度消息 */
  progressMessage?: string
  /** 进度状态 */
  progressStatus?: 'success' | 'exception' | 'warning' | ''
  /** 是否显示进度条 */
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  runningJob: false,
  progress: 0,
  currentStep: '',
  stepProgress: null,
  progressMessage: '',
  progressStatus: '',
  showProgress: false
})

// =============================================================================
// Emits 定义
// =============================================================================

const emit = defineEmits<{
  refresh: []
  runBacktest: []
}>()

// =============================================================================
// 方法
// =============================================================================

/**
 * 处理刷新
 */
const handleRefresh = () => {
  emit('refresh')
}

/**
 * 处理执行回测
 */
const handleRunBacktest = () => {
  emit('runBacktest')
}

/**
 * 处理重试
 */
const handleRetry = () => {
  emit('runBacktest')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
// 全局变量和混入已在global.scss中引入，这里无需重复导入

.top-backtest-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;

  @include desktop {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.header-progress {
  flex: 1;
  margin: 0 24px;
  
  @include mobile {
    margin: 16px 0;
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;

  @include mobile {
    font-size: 1.875rem;
  }
}

.page-subtitle {
  font-size: 1.125rem;
  opacity: 0.7;
  margin: 0;

  @include mobile {
    font-size: 1rem;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;

  @include mobile {
    flex-direction: column;
    width: 100%;
  }
}

// 使用 Element Plus 原生按钮样式，不进行覆盖
</style> 