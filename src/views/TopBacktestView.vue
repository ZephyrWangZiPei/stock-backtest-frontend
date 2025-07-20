<template>
  <div class="top-backtest-view">
    <!-- 页面头部 -->
    <TopBacktestHeader
      :loading="loading"
      :running-job="runningJob"
      :progress="progress"
      :current-step="currentStep"
      :step-progress="stepProgress"
      :progress-message="progressMessage"
      :progress-status="progressStatus"
      :show-progress="showProgress"
      @refresh="handleRefresh"
      @run-backtest="handleRunBacktest"
    />



    <!-- 统计信息 -->
    <TopBacktestStats
      :top-stocks="topStocks as TopStrategyStock[]"
      :loading="loading"
    />

    <!-- 数据表格 -->
    <TopBacktestTable
      :top-stocks="topStocks as TopStrategyStock[]"
      :loading="loading"
      @refresh="handleRefresh"
      @view-stock="handleViewStock"
      @view-chart="handleViewChart"
    />

    <!-- 股票详情对话框 -->
    <el-dialog
      v-model="showStockDialog"
      title="股票详情"
      width="800px"
      :before-close="handleCloseStockDialog"
    >
      <div
        v-if="selectedStock"
        class="stock-detail"
      >
        <div class="detail-grid">
          <div class="detail-item">
            <label>股票代码</label>
            <span>{{ selectedStock.stock_code }}</span>
          </div>
          <div class="detail-item">
            <label>股票名称</label>
            <span>{{ selectedStock.stock_name }}</span>
          </div>
          <div class="detail-item">
            <label>策略名称</label>
            <span>{{ selectedStock.strategy_name }}</span>
          </div>
          <div class="detail-item">
            <label>总收益率</label>
            <span :class="getReturnClass(selectedStock.total_return || 0)">
              {{ formatPercentage(selectedStock.total_return || 0) }}
            </span>
          </div>
          <div class="detail-item">
            <label>胜率</label>
            <span :class="getWinRateClass(selectedStock.win_rate)">
              {{ formatPercentage(selectedStock.win_rate) }}
            </span>
          </div>
          <div class="detail-item">
            <label>盈亏比</label>
            <span :class="getProfitFactorClass(selectedStock.profit_factor || 0)">
              {{ formatNumber(selectedStock.profit_factor || 0, 2) }}
            </span>
          </div>
          <div class="detail-item">
            <label>最大回撤</label>
            <span :class="getDrawdownClass(selectedStock.max_drawdown || 0)">
              {{ formatPercentage(selectedStock.max_drawdown || 0) }}
            </span>
          </div>
          <div class="detail-item">
            <label>夏普比率</label>
            <span :class="getSharpeClass(selectedStock.sharpe_ratio || 0)">
              {{ formatNumber(selectedStock.sharpe_ratio || 0, 2) }}
            </span>
          </div>
        </div>

        <!-- AI 分析信息 -->
        <div
          v-if="selectedStock.potential_rating || selectedStock.confidence_score"
          class="ai-analysis-section"
        >
          <h4>AI 分析</h4>
          <div class="detail-grid">
            <div
              v-if="selectedStock.potential_rating"
              class="detail-item"
            >
              <label>AI评级</label>
              <el-tag :type="getRatingType(selectedStock.potential_rating)">
                {{ selectedStock.potential_rating }}
              </el-tag>
            </div>
            <div
              v-if="selectedStock.confidence_score !== undefined"
              class="detail-item"
            >
              <label>置信度</label>
              <span>{{ formatConfidenceScore(selectedStock.confidence_score) }}</span>
            </div>
            <div
              v-if="selectedStock.recommendation_reason"
              class="detail-item full-width"
            >
              <label>推荐理由</label>
              <span>{{ selectedStock.recommendation_reason }}</span>
            </div>
            <div
              v-if="selectedStock.buy_point"
              class="detail-item full-width"
            >
              <label>买入点</label>
              <span>{{ selectedStock.buy_point }}</span>
            </div>
            <div
              v-if="selectedStock.sell_point"
              class="detail-item full-width"
            >
              <label>卖出点</label>
              <span>{{ selectedStock.sell_point }}</span>
            </div>
            <div
              v-if="selectedStock.risks"
              class="detail-item full-width"
            >
              <label>风险提示</label>
              <span class="risk-text">{{ selectedStock.risks }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TopBacktestHeader from '@/components/top-backtest/TopBacktestHeader.vue'
import TopBacktestStats from '@/components/top-backtest/TopBacktestStats.vue'
import TopBacktestTable from '@/components/top-backtest/TopBacktestTable.vue'
import { formatPercentage, formatNumber } from '@/utils/formatters'
import { useWebSocket } from '@/composables/useWebSocket'
import { useTopBacktest } from '@/composables/useTopBacktest'
import { useSchedulerStore } from '@/store/scheduler'
import type { TopStrategyStock } from '@/types/api'

// =============================================================================
// 响应式状态
// =============================================================================

const showStockDialog = ref(false)
const selectedStock = ref<TopStrategyStock | null>(null)

// =============================================================================
// 使用 Top 回测 Composable
// =============================================================================

const {
  loading,
  runningJob,
  topStocks,
  error,
  stats,
  progress,
  currentStep,
  stepProgress,
  progressMessage,
  progressStatus,
  showProgress,
  loadData,
  refreshData,
  runBacktest,
  updateProgress,
  resetProgress,
  forceReset,
  checkJobStatus,
  saveJobStatus,
  clearJobStatus,
  getReturnClass,
  getWinRateClass,
  getProfitFactorClass,
  getDrawdownClass,
  getSharpeClass
} = useTopBacktest()

// =============================================================================
// Scheduler Store
// =============================================================================

const schedulerStore = useSchedulerStore()

// =============================================================================
// WebSocket 连接
// =============================================================================

const { connect, disconnect, isConnected, on } = useWebSocket({ url: '/scheduler' })

// =============================================================================
// WebSocket 事件监听
// =============================================================================

// 监听通用进度推送事件
on('job_progress', (data: any) => {
  console.log('收到通用进度推送:', data)
  console.log('WebSocket连接状态:', isConnected.value)

  // 检查是否是 top_strategy_backtest 任务
  if (data.job_name === 'top_strategy_backtest') {
    console.log('处理 Top 回测进度:', data)
    console.log('当前runningJob状态:', runningJob.value)

    // 检查是否有错误
    if (data.error || data.status === 'exception') {
      let errorMessage = data.error || data.message || '执行过程中出现错误'

      // 根据错误类型提供更具体的错误信息
      if (errorMessage.includes('Connection error') || errorMessage.includes('WSAECONNREFUSED')) {
        errorMessage = 'AI分析服务连接失败，请检查网络连接或稍后重试'
      } else if (errorMessage.includes('DeepSeek')) {
        errorMessage = 'AI分析服务暂时不可用，请稍后重试'
      } else if (errorMessage.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接'
      }

      updateProgress({
        progress: data.progress || 0,
        currentStep: data.message || '执行出错',
        stepProgress: null,
        message: errorMessage,
        status: 'exception'
      })

      ElMessage.error(errorMessage)
    } else {
      // 处理正常进度数据
      const progressData = {
        progress: data.progress || 0,
        currentStep: data.message || '正在执行回测任务...',
        stepProgress: null,
        message: data.message || '',
        status: data.status || ''
      }

      console.log('准备更新进度:', progressData)
      updateProgress(progressData)
      console.log('进度更新完成，当前runningJob:', runningJob.value)
    }
  } else {
    console.log('不是top_strategy_backtest任务，忽略:', data.job_name)
  }
})

// 监听 Top 回测进度推送
on('top_backtest_progress', (data: any) => {
  console.log('收到 Top 回测进度推送:', data)

  // 检查进度数据中是否包含错误信息
  if (data.error || data.status === 'exception') {
    let errorMessage = data.error || data.message || '执行过程中出现错误'

    // 根据错误类型提供更具体的错误信息
    if (errorMessage.includes('Connection error') || errorMessage.includes('WSAECONNREFUSED')) {
      errorMessage = 'AI分析服务连接失败，请检查网络连接或稍后重试'
    } else if (errorMessage.includes('DeepSeek')) {
      errorMessage = 'AI分析服务暂时不可用，请稍后重试'
    } else if (errorMessage.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接'
    }

    // 更新进度状态为错误
    updateProgress({
      ...data,
      message: errorMessage,
      status: 'exception'
    })

    // 显示错误提示
    ElMessage.error(errorMessage)
  } else {
    // 处理标准进度数据格式
    const progressData = {
      progress: data.progress || 0,
      currentStep: data.message || '正在执行回测任务...',
      stepProgress: null,
      message: data.message || '',
      status: data.status || ''
    }

    // 如果数据包含 job_name，确保是 top_strategy_backtest 任务
    if (data.job_name && data.job_name === 'top_strategy_backtest') {
      updateProgress(progressData)
    } else if (!data.job_name) {
      // 如果没有 job_name，也更新进度（向后兼容）
      updateProgress(progressData)
    }
  }
})

// 监听其他可能的进度事件名称
on('progress', (data: any) => {
  console.log('收到 progress 事件:', data)
  if (data.job_name === 'top_strategy_backtest') {
    const progressData = {
      progress: data.progress || 0,
      currentStep: data.message || '正在执行回测任务...',
      stepProgress: null,
      message: data.message || '',
      status: data.status || ''
    }
    updateProgress(progressData)
  }
})

on('backtest_progress', (data: any) => {
  console.log('收到 backtest_progress 事件:', data)
  if (data.job_name === 'top_strategy_backtest') {
    const progressData = {
      progress: data.progress || 0,
      currentStep: data.message || '正在执行回测任务...',
      stepProgress: null,
      message: data.message || '',
      status: data.status || ''
    }
    updateProgress(progressData)
  }
})

// 监听 Top 回测完成推送
on('top_backtest_complete', (data: any) => {
  console.log('Top 回测完成:', data)

  // 检查是否是 top_strategy_backtest 任务
  if (data.job_name && data.job_name === 'top_strategy_backtest') {
    updateProgress({
      progress: 100,
      currentStep: '回测完成',
      stepProgress: 100,
      message: 'Top策略回测已完成，正在刷新数据...',
      status: 'success'
    })

    // 延迟刷新数据
    setTimeout(() => {
      refreshData()
    }, 2000)
  }
})

// 监听 Top 回测失败推送
on('top_backtest_error', (data: any) => {
  console.error('Top 回测失败:', data)

  // 检查是否是 top_strategy_backtest 任务
  if (data.job_name && data.job_name === 'top_strategy_backtest') {
    // 根据错误类型提供更具体的错误信息
    let errorMessage = data.message || '回测执行失败'

    if (errorMessage.includes('Connection error') || errorMessage.includes('WSAECONNREFUSED')) {
      errorMessage = 'AI分析服务连接失败，请检查网络连接或稍后重试'
    } else if (errorMessage.includes('DeepSeek')) {
      errorMessage = 'AI分析服务暂时不可用，请稍后重试'
    } else if (errorMessage.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接'
    }

    updateProgress({
      message: errorMessage,
      status: 'exception'
    })

    // 显示错误提示
    ElMessage.error(errorMessage)
  }
})

// =============================================================================
// 生命周期
// =============================================================================

onMounted(async () => {
  console.log('TopBacktestView 开始初始化...')

  // 先强制重置状态，确保初始状态正确
  forceReset()

  await connect()
  console.log('WebSocket 连接状态:', isConnected.value)

  // 检查是否有正在运行的任务
  await checkJobStatus()
  console.log('任务状态检查完成，runningJob:', runningJob.value)

  await loadData()
  console.log('数据加载完成')
})

// =============================================================================
// 监听 SchedulerStore 中的任务状态变化
// =============================================================================

watch(
  () => schedulerStore.taskStatus['top_strategy_backtest'],
  (newStatus) => {
    console.log('SchedulerStore taskStatus 变化:', newStatus)
    
    if (newStatus) {
      // 如果有进度信息，更新进度
      if (newStatus.current_date_progress !== undefined) {
        const progressData = {
          progress: newStatus.current_date_progress,
          currentStep: newStatus.message || '正在执行回测任务...',
          stepProgress: null,
          message: newStatus.message || '',
          status: newStatus.success === true ? 'success' :
            newStatus.success === false ? 'exception' : '' as '' | 'success' | 'exception' | 'warning'
        }

        console.log('从SchedulerStore更新进度:', progressData)
        updateProgress(progressData)
      }
    }
  },
  { deep: true, immediate: true }
)

// =============================================================================
// 监听任务完成事件
// =============================================================================

const handleJobCompleted = (event: CustomEvent) => {
  const { job_name, data } = event.detail
  console.log('收到任务完成事件:', job_name, data)

  if (job_name === 'top_strategy_backtest') {
    console.log('Top策略回测任务完成，准备刷新数据')

    // 延迟刷新数据，确保后端数据已更新
    setTimeout(async () => {
      try {
        console.log('开始刷新Top回测数据...')
        await refreshData()
        console.log('Top回测数据刷新完成')
        ElMessage.success('Top策略回测完成，数据已更新')
      } catch (error) {
        console.error('刷新Top回测数据失败:', error)
        ElMessage.error('数据刷新失败，请手动刷新页面')
      }
    }, 2000) // 延迟2秒，确保后端数据处理完成
  }
}

// 添加事件监听器
onMounted(() => {
  window.addEventListener('job_completed', handleJobCompleted as EventListener)
})

// 移除事件监听器
onUnmounted(() => {
  window.removeEventListener('job_completed', handleJobCompleted as EventListener)
})

onUnmounted(() => {
  disconnect()
})

// =============================================================================
// 方法
// =============================================================================

/**
 * 处理刷新
 */
const handleRefresh = async () => {
  await refreshData()
}

/**
 * 处理执行回测
 */
const handleRunBacktest = async () => {
  await runBacktest()
}

/**
 * 处理查看股票详情
 */
const handleViewStock = (stock: TopStrategyStock) => {
  selectedStock.value = stock
  showStockDialog.value = true
}

/**
 * 处理查看图表
 */
const handleViewChart = (stock: TopStrategyStock) => {
  // TODO: 实现图表查看功能
  ElMessage.info('图表功能开发中...')
}

/**
 * 处理关闭股票详情对话框
 */
const handleCloseStockDialog = () => {
  showStockDialog.value = false
  selectedStock.value = null
}

/**
 * 获取AI评级标签类型
 */
const getRatingType = (rating: string) => {
  const ratingLower = rating.toLowerCase()
  if (ratingLower.includes('a') || ratingLower.includes('优秀') || ratingLower.includes('strong')) return 'success'
  if (ratingLower.includes('b') || ratingLower.includes('良好') || ratingLower.includes('good')) return 'warning'
  if (ratingLower.includes('c') || ratingLower.includes('一般') || ratingLower.includes('neutral')) return 'info'
  if (ratingLower.includes('d') || ratingLower.includes('较差') || ratingLower.includes('weak')) return 'danger'
  return 'info'
}

/**
 * 格式化置信度分数
 */
const formatConfidenceScore = (score: number) => {
  // 如果分数大于1，说明已经是百分比形式，直接显示
  if (score > 1) {
    return `${score.toFixed(1)}%`
  }
  // 如果分数小于等于1，说明是小数形式，转换为百分比
  return `${(score * 100).toFixed(1)}%`
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/mixins.scss' as *;

.top-backtest-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;

  @include mobile {
    padding: 16px;
    gap: 24px;
  }
}

.stock-detail {
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-weight: 600;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }

    span {
      color: var(--el-text-color-primary);
      font-size: 16px;
    }

    .risk-text {
      color: var(--el-color-danger);
      font-size: 14px;
    }
  }

  .ai-analysis-section {
    border-top: 1px solid var(--el-border-color);
    padding-top: 24px;

    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
      font-size: 18px;
      font-weight: 600;
    }
  }
}

// 股票详情样式
.stock-detail {
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;

    @include mobile {
      grid-template-columns: 1fr;
    }
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 0.875rem;
      font-weight: 500;
      opacity: 0.7;
    }

    span {
      font-size: 1rem;
      font-weight: 600;
    }
  }
}
// 文本颜色样式 - 使用 Element Plus CSS 变量
.text-success {
  color: var(--el-color-success);
}
.text-warning {
  color: var(--el-color-warning);
}
.text-info {
  color: var(--el-color-info);
}

.text-danger {
  color: var(--el-color-danger);
}
</style>