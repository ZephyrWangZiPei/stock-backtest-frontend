<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3 class="chart-title">策略表现分析</h3>
      <div class="chart-controls">
        <el-select
          v-model="chartType"
          @change="updateChart"
          class="chart-type-select"
        >
          <el-option
            label="胜率分布"
            value="winRate"
          />
          <el-option
            label="收益对比"
            value="returns"
          />
          <el-option
            label="夏普比率"
            value="sharpe"
          />
          <el-option
            label="回撤分析"
            value="drawdown"
          />
          <el-option
            label="综合评分"
            value="comprehensive"
          />
        </el-select>
      </div>
    </div>

    <div class="charts-grid">
      <!-- 主图表 -->
      <div class="main-chart">
        <div
          ref="chartContainer"
          class="chart-canvas"
        ></div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-panel">
        <div class="stat-item">
          <div class="stat-title">平均胜率</div>
          <div class="stat-value win-rate">{{ avgWinRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">平均年化收益</div>
          <div
            class="stat-value"
            :class="avgReturnClass"
          >{{ avgReturn }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">最佳策略</div>
          <div class="stat-value best-strategy">{{ bestStrategy }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">股票总数</div>
          <div class="stat-value total-count">{{ totalStocks }}</div>
        </div>
      </div>
    </div>

    <!-- 评分详情展示 -->
    <div
      v-if="chartType === 'comprehensive' && scoreDetails.length > 0"
      class="score-details-section"
    >
      <h4 class="score-details-title">多条件权重评分详情</h4>
      <div class="scoring-system-info">
        <div class="info-card">
          <h5>评分系统说明</h5>
          <p>本系统采用多条件权重评分，综合考虑以下指标：</p>
          <ul>
            <li><strong>胜率 (25%)</strong>: 交易胜率，80%以上为优秀</li>
            <li><strong>置信胜率 (20%)</strong>: Wilson置信下界，70%以上为优秀</li>
            <li><strong>年化收益 (20%)</strong>: 年化收益率，30%以上为优秀</li>
            <li><strong>夏普比率 (15%)</strong>: 风险调整收益，1.5以上为优秀</li>
            <li><strong>盈亏比 (10%)</strong>: 盈利亏损比，2.0以上为优秀</li>
            <li><strong>交易次数 (5%)</strong>: 样本数量，20次以上为优秀</li>
            <li><strong>最大回撤 (5%)</strong>: 风险控制，10%以下为优秀</li>
          </ul>
        </div>
      </div>

      <div class="score-details-table">
        <el-table
          :data="scoreDetails"
          stripe
          class="score-table"
        >
          <el-table-column
            prop="stock_code"
            label="股票代码"
            width="100"
          />
          <el-table-column
            prop="stock_name"
            label="股票名称"
            width="120"
          />
          <el-table-column
            prop="strategy_name"
            label="策略"
            width="120"
          />
          <el-table-column
            prop="comprehensive_score"
            label="综合评分"
            width="100"
            sortable
          >
            <template #default="scope">
              <el-tag
                :type="getScoreTagType(scope.row.comprehensive_score)"
                size="small"
              >
                {{ scope.row.comprehensive_score.toFixed(3) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="评分明细"
            min-width="400"
          >
            <template #default="scope">
              <div class="score-breakdown">
                <div
                  class="breakdown-item"
                  v-for="(detail, key) in scope.row.score_breakdown"
                  :key="key"
                >
                  <span class="metric-name">{{ getMetricDisplayName(key) }}</span>
                  <span class="metric-value">{{ detail.value.toFixed(2) }}</span>
                  <span class="metric-score">{{ detail.score.toFixed(2) }}</span>
                  <span class="metric-weight">×{{ detail.weight.toFixed(2) }}</span>
                  <span class="weighted-score">={{ detail.weighted_score.toFixed(3) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts'
import { getTopStrategyScoreDetails } from '@/utils/api'

interface TopStrategyStock {
  id: number
  strategy_id: number
  strategy_name: string
  stock_code: string
  stock_name: string
  win_rate: number
  total_return: number
  annual_return: number
  max_drawdown: number
  sharpe_ratio: number
  rank: number
  backtest_period_days: number
  initial_capital: number
  created_at: string
  updated_at: string
}

interface ScoreDetail {
  stock_code: string
  stock_name: string
  strategy_name: string
  comprehensive_score: number
  score_breakdown: Record<string, {
    value: number
    score: number
    weight: number
    weighted_score: number
  }>
  metrics: Record<string, number>
}

interface Props {
  data: TopStrategyStock[]
}

const props = defineProps<Props>()

const chartContainer = ref<HTMLElement>()
const chartType = ref('winRate')
let chart: IChartApi | null = null
let series: ISeriesApi<any> | null = null

// 评分详情数据
const scoreDetails = ref<ScoreDetail[]>([])

// 计算属性
const avgWinRate = computed(() => {
  if (!props.data.length) return '0.00'
  const avg = props.data.reduce((sum, item) => sum + item.win_rate, 0) / props.data.length
  return (avg * 100).toFixed(2)
})

const avgReturn = computed(() => {
  if (!props.data.length) return '0.00'
  const avg = props.data.reduce((sum, item) => sum + item.annual_return, 0) / props.data.length
  return (avg * 100).toFixed(2)
})

const avgReturnClass = computed(() => {
  const value = parseFloat(avgReturn.value)
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
})

const bestStrategy = computed(() => {
  if (!props.data.length) return '-'
  const best = props.data.reduce((best, current) =>
    current.win_rate > best.win_rate ? current : best
  )
  return best.strategy_name
})

const totalStocks = computed(() => props.data.length)

// 工具函数
const getScoreTagType = (score: number) => {
  if (score >= 0.8) return 'success'
  if (score >= 0.6) return 'warning'
  if (score >= 0.4) return 'info'
  return 'danger'
}

const getMetricDisplayName = (key: string | number) => {
  const names: Record<string, string> = {
    'win_rate': '胜率',
    'win_rate_confidence': '置信胜率',
    'annual_return': '年化收益',
    'sharpe_ratio': '夏普比率',
    'profit_factor': '盈亏比',
    'trade_count': '交易次数',
    'max_drawdown': '最大回撤'
  }
  return names[String(key)] || String(key)
}

// 加载评分详情数据
const loadScoreDetails = async () => {
  try {
    const response = await getTopStrategyScoreDetails()
    if ((response as any).code === 200) {
      scoreDetails.value = (response as any).data
    }
  } catch (error) {
    console.error('加载评分详情失败:', error)
  }
}

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return

  chart = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 400,
    layout: {
      background: { type: ColorType.Solid, color: '#1F2937' },
      textColor: '#D1D5DB'
    },
    grid: {
      vertLines: { color: '#374151' },
      horzLines: { color: '#374151' }
    }
  })

  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!chart || !props.data.length) return

  // 清除现有系列
  if (series) {
    chart.removeSeries(series)
  }

  let chartData: any[] = []
  let seriesType: 'line' | 'histogram' = 'line'

  switch (chartType.value) {
    case 'winRate':
      chartData = props.data.map((item, index) => ({
        time: index + 1,
        value: item.win_rate * 100
      }))
      break
    case 'returns':
      chartData = props.data.map((item, index) => ({
        time: index + 1,
        value: (item.annual_return || 0) * 100
      }))
      break
    case 'sharpe':
      chartData = props.data.map((item, index) => ({
        time: index + 1,
        value: item.sharpe_ratio || 0
      }))
      break
    case 'drawdown':
      chartData = props.data.map((item, index) => ({
        time: index + 1,
        value: Math.abs(item.max_drawdown || 0) * 100
      }))
      break
    case 'comprehensive':
      // 对于综合评分，需要加载评分详情数据
      loadScoreDetails()
      return
  }

  if (chartData.length > 0) {
    series = chart.addLineSeries({
      color: '#3B82F6',
      lineWidth: 2
    })
    series.setData(chartData)
  }
}

// 监听数据变化
watch(() => props.data, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

// 监听图表类型变化
watch(chartType, () => {
  updateChart()
})

// 组件挂载
onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  if (chart) {
    chart.remove()
  }
  window.removeEventListener('resize', handleResize)
})

// 处理窗口大小变化
const handleResize = () => {
  if (chart && chartContainer.value) {
    chart.applyOptions({
      width: chartContainer.value.clientWidth
    })
  }
}
</script>

<style scoped>
.chart-container {
  @apply bg-gray-800/60 border border-gray-700 rounded-lg p-6 shadow-lg;
}

.chart-header {
  @apply flex justify-between items-center mb-6;
}

.chart-title {
  @apply text-xl font-bold text-white;
}

.chart-controls {
  @apply flex gap-4;
}

.chart-type-select {
  @apply w-48;
}

.charts-grid {
  @apply grid grid-cols-1 lg:grid-cols-4 gap-6;
}

.main-chart {
  @apply lg:col-span-3;
}

.chart-canvas {
  @apply w-full h-96;
}

.stats-panel {
  @apply lg:col-span-1 space-y-4;
}

.stat-item {
  @apply bg-gray-700/50 rounded-lg p-4 text-center;
}

.stat-title {
  @apply text-gray-400 text-sm mb-2;
}

.stat-value {
  @apply text-2xl font-bold;
}

.stat-value.win-rate {
  @apply text-green-400;
}

.stat-value.positive {
  @apply text-green-400;
}

.stat-value.negative {
  @apply text-red-400;
}

.stat-value.neutral {
  @apply text-yellow-400;
}

.stat-value.best-strategy {
  @apply text-blue-400;
}

.stat-value.total-count {
  @apply text-purple-400;
}

/* 评分详情样式 */
.score-details-section {
  @apply mt-8;
}

.score-details-title {
  @apply text-lg font-bold text-white mb-4;
}

.scoring-system-info {
  @apply mb-6;
}

.info-card {
  @apply bg-gray-700/50 rounded-lg p-4;
}

.info-card h5 {
  @apply text-white font-semibold mb-2;
}

.info-card p {
  @apply text-gray-300 mb-2;
}

.info-card ul {
  @apply list-disc list-inside space-y-1;
}

.info-card li {
  @apply text-gray-300 text-sm;
}

.score-details-table {
  @apply bg-gray-700/50 rounded-lg p-4;
}

.score-table {
  @apply w-full;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: rgba(55, 65, 81, 0.3);
  --el-table-header-bg-color: rgba(31, 41, 55, 0.8);
  --el-table-header-text-color: #f3f4f6;
  --el-table-text-color: #d1d5db;
  --el-table-border-color: rgba(75, 85, 99, 0.2);
}

.score-breakdown {
  @apply space-y-1;
}

.breakdown-item {
  @apply flex items-center gap-2 text-xs;
}

.metric-name {
  @apply text-gray-400 w-16;
}

.metric-value {
  @apply text-blue-400 w-12;
}

.metric-score {
  @apply text-green-400 w-8;
}

.metric-weight {
  @apply text-yellow-400 w-8;
}

.weighted-score {
  @apply text-purple-400 font-semibold;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .charts-grid {
    @apply grid-cols-1;
  }
.main-chart {
  @apply col-span-1;
}

.stats-panel {
  @apply col-span-1;
  }
}
</style> 