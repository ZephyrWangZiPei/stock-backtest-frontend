<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3 class="chart-title">策略表现分析</h3>
      <div class="chart-controls">
        <el-select v-model="chartType" @change="updateChart" class="chart-type-select">
          <el-option label="胜率分布" value="winRate" />
          <el-option label="收益对比" value="returns" />
          <el-option label="夏普比率" value="sharpe" />
          <el-option label="回撤分析" value="drawdown" />
        </el-select>
      </div>
    </div>
    
    <div class="charts-grid">
      <!-- 主图表 -->
      <div class="main-chart">
        <div ref="chartContainer" class="chart-canvas"></div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-panel">
        <div class="stat-item">
          <div class="stat-title">平均胜率</div>
          <div class="stat-value win-rate">{{ avgWinRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">平均年化收益</div>
          <div class="stat-value" :class="avgReturnClass">{{ avgReturn }}%</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts'

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

interface Props {
  data: TopStrategyStock[]
}

const props = defineProps<Props>()

const chartContainer = ref<HTMLElement>()
const chartType = ref('winRate')
let chart: IChartApi | null = null
let series: ISeriesApi<any> | null = null

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

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return

  chart = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 300,
    layout: {
      background: { type: ColorType.Solid, color: 'rgba(17, 24, 39, 0.8)' },
      textColor: '#d1d5db',
    },
    grid: {
      vertLines: { color: 'rgba(75, 85, 99, 0.3)' },
      horzLines: { color: 'rgba(75, 85, 99, 0.3)' },
    },
    crosshair: {
      mode: 1,
    },
    rightPriceScale: {
      borderColor: 'rgba(75, 85, 99, 0.5)',
    },
    timeScale: {
      borderColor: 'rgba(75, 85, 99, 0.5)',
      timeVisible: true,
      secondsVisible: false,
    },
  })

  updateChart()
}

// 更新图表数据
const updateChart = () => {
  if (!chart || !props.data.length) return

  // 清除现有系列
  if (series) {
    chart.removeSeries(series)
  }

  switch (chartType.value) {
    case 'winRate':
      createWinRateChart()
      break
    case 'returns':
      createReturnsChart()
      break
    case 'sharpe':
      createSharpeChart()
      break
    case 'drawdown':
      createDrawdownChart()
      break
  }
}

// 胜率分布图
const createWinRateChart = () => {
  if (!chart) return

  series = chart.addHistogramSeries({
    color: '#3b82f6',
    priceFormat: {
      type: 'percent',
    },
  })

  // 按策略分组计算平均胜率
  const strategyData = new Map<string, { sum: number; count: number }>()
  props.data.forEach(item => {
    const existing = strategyData.get(item.strategy_name) || { sum: 0, count: 0 }
    strategyData.set(item.strategy_name, {
      sum: existing.sum + item.win_rate,
      count: existing.count + 1
    })
  })

  const chartData = Array.from(strategyData.entries()).map(([name, data], index) => ({
    time: index + 1,
    value: data.sum / data.count,
    color: getStrategyColor(index)
  }))

  series.setData(chartData)
}

// 收益对比图
const createReturnsChart = () => {
  if (!chart) return

  series = chart.addAreaSeries({
    topColor: 'rgba(34, 197, 94, 0.4)',
    bottomColor: 'rgba(34, 197, 94, 0.1)',
    lineColor: '#22c55e',
    lineWidth: 2,
    priceFormat: {
      type: 'percent',
    },
  })

  const sortedData = [...props.data]
    .sort((a, b) => a.annual_return - b.annual_return)
    .map((item, index) => ({
      time: index + 1,
      value: item.annual_return
    }))

  series.setData(sortedData)
}

// 夏普比率图
const createSharpeChart = () => {
  if (!chart) return

  series = chart.addLineSeries({
    color: '#f59e0b',
    lineWidth: 2,
    priceFormat: {
      type: 'custom',
      formatter: (price: number) => price.toFixed(3),
    },
  })

  const sortedData = [...props.data]
    .filter(item => item.sharpe_ratio != null)
    .sort((a, b) => (a.sharpe_ratio || 0) - (b.sharpe_ratio || 0))
    .map((item, index) => ({
      time: index + 1,
      value: item.sharpe_ratio || 0
    }))

  series.setData(sortedData)
}

// 回撤分析图
const createDrawdownChart = () => {
  if (!chart) return

  series = chart.addAreaSeries({
    topColor: 'rgba(239, 68, 68, 0.1)',
    bottomColor: 'rgba(239, 68, 68, 0.4)',
    lineColor: '#ef4444',
    lineWidth: 2,
    priceFormat: {
      type: 'percent',
    },
  })

  const sortedData = [...props.data]
    .sort((a, b) => Math.abs(b.max_drawdown) - Math.abs(a.max_drawdown))
    .map((item, index) => ({
      time: index + 1,
      value: Math.abs(item.max_drawdown)
    }))

  series.setData(sortedData)
}

// 获取策略颜色
const getStrategyColor = (index: number) => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
  ]
  return colors[index % colors.length]
}

// 处理窗口大小变化
const handleResize = () => {
  if (chart && chartContainer.value) {
    chart.applyOptions({
      width: chartContainer.value.clientWidth,
    })
  }
}

// 监听数据变化
watch(() => props.data, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (chart) {
    chart.remove()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chart-container {
  @apply bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6;
}

.chart-header {
  @apply flex justify-between items-center mb-6;
}

.chart-title {
  @apply text-xl font-bold text-white;
}

.chart-controls {
  @apply flex gap-3;
}

.chart-type-select {
  @apply w-32;
}

.charts-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.main-chart {
  @apply lg:col-span-2;
}

.chart-canvas {
  @apply w-full h-80 bg-gray-900/50 rounded-lg;
}

.stats-panel {
  @apply space-y-4;
}

.stat-item {
  @apply bg-gray-700/50 rounded-lg p-4 text-center;
}

.stat-title {
  @apply text-gray-400 text-sm mb-2;
}

.stat-value {
  @apply text-2xl font-bold text-white;
}

.stat-value.win-rate {
  @apply text-blue-400;
}

.stat-value.positive {
  @apply text-green-400;
}

.stat-value.negative {
  @apply text-red-400;
}

.stat-value.neutral {
  @apply text-gray-400;
}

.stat-value.best-strategy {
  @apply text-yellow-400 text-lg;
}

.stat-value.total-count {
  @apply text-purple-400;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .charts-grid {
    @apply grid-cols-1;
  }
  
  .chart-canvas {
    @apply h-64;
  }
}
</style> 