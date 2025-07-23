<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="90%"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    class="backtest-detail-dialog"
    @close="handleClose"
  >
    <div
      v-if="detailLoading"
      class="detail-loading"
    >
      <el-progress
        type="circle"
        :percentage="detailProgress"
      />
      <p class="loading-text">正在加载回测详情...</p>
    </div>

    <div
      v-else-if="backtestDetail"
      class="backtest-detail-content"
    >
      <!-- 回测基本信息 -->
      <div class="detail-header">
        <div class="detail-info">
          <h3>回测ID: {{ backtestDetail.id }}</h3>
          <p>策略: {{ backtestDetail.strategy_name || '未知策略' }}</p>
          <p>股票: {{ getStockDisplayName() }}</p>
          <p>时间范围: {{ backtestDetail.start_date }} 至 {{ backtestDetail.end_date }}</p>
        </div>
      </div>

      <!-- 性能指标 -->
      <div class="performance-metrics">
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">总收益率</div>
            <div
              class="metric-value"
              :class="performanceMetrics.totalReturn >= 0 ? 'positive' : 'negative'"
            >
              {{ (performanceMetrics.totalReturn * 100).toFixed(2) }}%
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">年化收益率</div>
            <div
              class="metric-value"
              :class="performanceMetrics.annualReturn >= 0 ? 'positive' : 'negative'"
            >
              {{ (performanceMetrics.annualReturn * 100).toFixed(2) }}%
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">最大回撤</div>
            <div class="metric-value negative">
              {{ (performanceMetrics.maxDrawdown * 100).toFixed(2) }}%
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">夏普比率</div>
            <div class="metric-value">
              {{ performanceMetrics.sharpeRatio.toFixed(2) }}
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">总交易次数</div>
            <div class="metric-value">
              {{ performanceMetrics.totalTrades }}
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">胜率</div>
            <div class="metric-value">
              {{ (performanceMetrics.winRate * 100).toFixed(2) }}%
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">盈亏比</div>
            <div class="metric-value">
              {{ performanceMetrics.profitFactor.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 股票选择器 -->
      <div
        v-if="backtestDetail.selected_stocks && backtestDetail.selected_stocks.length > 1"
        class="stock-selector"
      >
        <el-select
          v-model="selectedStock"
          placeholder="选择股票查看图表"
          @change="onStockChange"
        >
          <el-option
            v-for="stock in backtestDetail.selected_stocks"
            :key="typeof stock === 'string' ? stock : stock.code"
            :label="typeof stock === 'string' ? stock : `${stock.code} ${stock.name}`"
            :value="typeof stock === 'string' ? stock : stock.code"
          />
        </el-select>
      </div>

      <!-- Tab内容 -->
      <el-tabs
        v-model="activeTab"
        class="detail-tabs"
        @tab-change="onTabChange"
      >
        <el-tab-pane
          label="业绩图表"
          name="chart"
        >
          <div
            ref="chartRef"
            class="chart-container"
          ></div>
        </el-tab-pane>

        <el-tab-pane
          label="交易日志"
          name="trades"
        >
          <div class="trades-container">
            <el-table
              :data="filteredTrades"
              class="trades-table"
              :max-height="400"
              border
              stripe
            >
              <el-table-column
                prop="trade_date"
                label="交易日期"
                width="180"
              />
              <el-table-column
                prop="stock_code"
                label="股票代码"
                width="120"
              />
              <el-table-column
                prop="trade_type"
                label="操作"
                width="100"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="row.trade_type === 'buy' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.trade_type.toUpperCase() }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="price"
                label="成交价"
              />
              <el-table-column
                prop="quantity"
                label="股数"
              />
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane
          v-if="showNewsAnalysis"
          label="AI分析"
          name="ai-analysis"
        >
          <div class="ai-analysis-container">
            <div
              v-if="backtestDetail.ai_analysis_report"
              class="ai-content"
            >
              <div class="ai-header">
                <el-icon>
                  <ChatDotRound />
                </el-icon>
                <span>AI分析报告</span>
              </div>
              <div class="ai-report">
                <v-md-editor
                  v-model="backtestDetail.ai_analysis_report"
                  mode="preview"
                  :height="400"
                />
              </div>
            </div>
            <div
              v-else
              class="ai-empty"
            >
              <el-empty description="暂无AI分析报告" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { getBacktestDetail, getDailyData } from '@/utils/api'
import { formatDate } from '@/utils/formatters'
import { createChart, IChartApi, ISeriesApi, CrosshairMode } from 'lightweight-charts'
import type { BacktestResult } from '@/types/api'

// =============================================================================
// Props
// =============================================================================

interface Props {
  modelValue: boolean
  backtestId?: number
  stockCode?: string
  title?: string
  showNewsAnalysis?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '回测详情',
  showNewsAnalysis: false
})

// =============================================================================
// Emits
// =============================================================================

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// =============================================================================
// 响应式状态
// =============================================================================

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const detailLoading = ref(false)
const detailProgress = ref(0)
const backtestDetail = ref<BacktestResult | null>(null)
const selectedStock = ref<string>('')
const activeTab = ref('chart')
const chartRef = ref<HTMLElement>()
let chart: IChartApi | null = null
let candlestickSeries: ISeriesApi<'Candlestick'> | null = null

// =============================================================================
// 计算属性
// =============================================================================

const performanceMetrics = computed(() => {
  if (!backtestDetail.value) {
    return {
      totalReturn: 0,
      annualReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0
    }
  }

  const detail = backtestDetail.value
  return {
    totalReturn: detail.total_return || 0,
    annualReturn: detail.annual_return || 0,
    maxDrawdown: detail.max_drawdown || 0,
    sharpeRatio: detail.sharpe_ratio || 0,
    totalTrades: detail.total_trades || 0,
    winRate: detail.win_rate || 0,
    profitFactor: detail.profit_factor || 0
  }
})

const filteredTrades = computed(() => {
  if (!backtestDetail.value?.trades) return []
  
  const trades = backtestDetail.value.trades
  if (!selectedStock.value) return trades
  
  return trades.filter((trade: any) => {
    if (typeof selectedStock.value === 'string') {
      return trade.stock_code === selectedStock.value
    }
    return true
  })
})

// =============================================================================
// 生命周期
// =============================================================================

onMounted(() => {
  // 组件挂载时的初始化
})

onUnmounted(() => {
  // 组件卸载时清理图表
  if (chart) {
    chart.remove()
    chart = null
    candlestickSeries = null
  }
})

// =============================================================================
// 监听器
// =============================================================================

watch(() => props.backtestId, (newId) => {
  if (newId && dialogVisible.value) {
    loadBacktestDetail()
  }
})

watch(() => props.stockCode, (newCode) => {
  if (newCode) {
    selectedStock.value = newCode
  }
})

watch(dialogVisible, (visible) => {
  if (visible && props.backtestId) {
    loadBacktestDetail()
  } else if (!visible) {
    resetState()
  }
})

// =============================================================================
// 方法
// =============================================================================

/**
 * 加载回测详情
 */
const loadBacktestDetail = async () => {
  if (!props.backtestId) return

  detailLoading.value = true
  detailProgress.value = 0

  try {
    // 模拟进度
    const progressInterval = setInterval(() => {
      if (detailProgress.value < 90) {
        detailProgress.value += 10
      }
    }, 100)

    const response = await getBacktestDetail(props.backtestId)
    backtestDetail.value = response.data || null

    // 设置默认选中的股票
    if (props.stockCode && backtestDetail.value?.selected_stocks) {
      selectedStock.value = props.stockCode
    } else if (backtestDetail.value?.selected_stocks?.length === 1) {
      const stock = backtestDetail.value.selected_stocks[0]
      selectedStock.value = typeof stock === 'string' ? stock : stock.code
    }

    clearInterval(progressInterval)
    detailProgress.value = 100

    // 延迟渲染图表
    await nextTick()
    if (activeTab.value === 'chart') {
      renderChart()
    }

  } catch (error: any) {
    ElMessage.error(error.message || '加载回测详情失败')
  } finally {
    detailLoading.value = false
  }
}

/**
 * 渲染图表
 */
const renderChart = async () => {
  if (!chartRef.value || !backtestDetail.value?.portfolio_history || !selectedStock.value) return

  try {
    // 获取真实的日线数据
    const dailyDataResponse = await getDailyData(
      selectedStock.value,
      backtestDetail.value.start_date,
      backtestDetail.value.end_date
    )
    const dailyData = dailyDataResponse.data || []

    const candlestickData = dailyData.map((d: any) => ({
      time: d.trade_date.split('T')[0],
      open: d.open_price,
      high: d.high_price,
      low: d.low_price,
      close: d.close_price
    }))

    const portfolioHistory = backtestDetail.value.portfolio_history
    const portfolioData = portfolioHistory.map((p: any) => ({
      time: p.date.split('T')[0],
      value: p.total
    }))

    // 创建交易标记
    const trades = backtestDetail.value.trades || []
    const tradeMarkers = trades
      .filter((trade: any) => trade.stock_code === selectedStock.value)
      .map((trade: any) => ({
        time: trade.trade_date.split('T')[0],
        position: trade.trade_type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
        color: trade.trade_type === 'buy' ? '#26a69a' : '#ef5350',
        shape: trade.trade_type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
        text: `${trade.trade_type.toUpperCase()} ${trade.quantity}@${trade.price}`
      }))

    // 销毁旧图表
    if (chart) {
      chart.remove()
      chart = null
      candlestickSeries = null
    }

    // 创建新图表
    chart = createChart(chartRef.value, {
      width: chartRef.value.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1e293b' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#374151',
        visible: true,
      },
      leftPriceScale: {
        borderColor: '#374151',
        visible: true,
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    // 添加K线图（使用右侧Y轴）
    candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceScaleId: 'right',
    })

    candlestickSeries.setData(candlestickData)

    // 添加交易标记
    candlestickSeries.setMarkers(tradeMarkers)

    // 添加投资组合曲线（使用左侧Y轴）
    const portfolioSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      title: '投资组合价值',
      priceScaleId: 'left',
    })

    portfolioSeries.setData(portfolioData)

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      if (chart && chartRef.value) {
        chart.applyOptions({ width: chartRef.value.clientWidth })
      }
    })
    resizeObserver.observe(chartRef.value)

  } catch (error: any) {
    console.error('渲染图表失败:', error)
    ElMessage.error('渲染图表失败')
  }
}

/**
 * 股票选择器变化
 */
const onStockChange = () => {
  if (activeTab.value === 'chart') {
    renderChart()
  }
}

/**
 * Tab切换
 */
const onTabChange = (tabName: string) => {
  if (tabName === 'chart') {
    nextTick(() => {
      renderChart()
    })
  }
}

/**
 * 获取股票显示名称
 */
const getStockDisplayName = () => {
  if (!backtestDetail.value?.selected_stocks) return '未知'
  
  if (backtestDetail.value.selected_stocks.length === 1) {
    const stock = backtestDetail.value.selected_stocks[0]
    return typeof stock === 'string' ? stock : `${stock.code} ${stock.name}`
  }
  
  if (selectedStock.value) {
    const stock = backtestDetail.value.selected_stocks.find((s: any) => {
      const code = typeof s === 'string' ? s : s.code
      return code === selectedStock.value
    })
    return typeof stock === 'string' ? stock : stock ? `${stock.code} ${stock.name}` : '未知'
  }
  
  return '多只股票'
}

/**
 * 重置状态
 */
const resetState = () => {
  detailLoading.value = false
  detailProgress.value = 0
  backtestDetail.value = null
  selectedStock.value = ''
  activeTab.value = 'chart'
}

/**
 * 处理关闭
 */
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.backtest-detail-dialog {
  --el-dialog-width: 90%;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-text {
  margin-top: 16px;
  color: var(--el-text-color-regular);
}

.detail-header {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.detail-info h3 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.detail-info p {
  margin: 4px 0;
  color: var(--el-text-color-regular);
}

.performance-metrics {
  margin-bottom: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.metric-item {
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.metric-value.positive {
  color: var(--el-color-success);
}

.metric-value.negative {
  color: var(--el-color-danger);
}

.stock-selector {
  margin-bottom: 24px;
}

.detail-tabs {
  margin-top: 24px;
}

.chart-container {
  height: 400px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
}

.trades-container {
  max-height: 400px;
  overflow-y: auto;
}

.trades-table {
  width: 100%;
}

.ai-analysis-container {
  padding: 16px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.ai-content {
  background: var(--el-bg-color-page);
  border-radius: 8px;
  padding: 16px;
}

.ai-empty {
  text-align: center;
  padding: 40px;
}
</style> 