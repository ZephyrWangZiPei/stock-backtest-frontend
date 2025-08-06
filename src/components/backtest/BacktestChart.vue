<template>
  <div class="backtest-chart">
    <el-card class="chart-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">📈 回测K线图</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="resetZoom"
              :disabled="!chartInstance"
            >
              重置缩放
            </el-button>
            <el-switch
              v-model="showTradeMarkers"
              active-text="显示交易标记"
              inactive-text="隐藏交易标记"
              size="small"
            />
          </div>
        </div>
      </template>
      
      <div class="chart-container">
        <div ref="chartContainer" class="chart-wrapper"></div>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <el-loading-spinner />
          <span>正在加载K线数据...</span>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!hasData" class="empty-state">
          <el-empty description="暂无K线数据" />
        </div>
      </div>
      
      <!-- 图例 -->
      <div v-if="hasData" class="chart-legend">
        <div class="legend-item">
          <div class="legend-color buy"></div>
          <span>买入点</span>
        </div>
        <div class="legend-item">
          <div class="legend-color sell"></div>
          <span>卖出点</span>
        </div>
        <div class="legend-item">
          <div class="legend-color portfolio"></div>
          <span>投资组合价值</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts'
import { ElMessage } from 'element-plus'

interface PortfolioHistoryItem {
  date: string
  cash: number
  position: number
  total_value: number
  daily_return: number
}

interface TradeRecord {
  id: number
  trade_date: string
  trade_type: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  reason: string
}

interface Props {
  portfolioHistory?: PortfolioHistoryItem[]
  trades?: TradeRecord[]
  stockData?: CandlestickData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  portfolioHistory: () => [],
  trades: () => [],
  stockData: () => [],
  loading: false
})

// 响应式状态
const chartContainer = ref<HTMLElement>()
const chartInstance = ref<IChartApi | null>(null)
const candlestickSeries = ref<ISeriesApi<'Candlestick'> | null>(null)
const portfolioSeries = ref<ISeriesApi<'Line'> | null>(null)
const showTradeMarkers = ref(true)

// 计算属性
const hasData = computed(() => {
  return props.stockData.length > 0 || props.portfolioHistory.length > 0
})

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return
  
  // 销毁现有图表
  if (chartInstance.value) {
    chartInstance.value.remove()
  }
  
  // 创建新图表
  chartInstance.value = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 400,
    layout: {
      background: { color: '#ffffff' },
      textColor: '#333',
    },
    grid: {
      vertLines: { color: '#f0f0f0' },
      horzLines: { color: '#f0f0f0' },
    },
    crosshair: {
      mode: 1,
    },
    rightPriceScale: {
      borderColor: '#ddd',
    },
    timeScale: {
      borderColor: '#ddd',
      timeVisible: true,
      secondsVisible: false,
    },
  })
  
  // 创建K线图系列
  if (props.stockData.length > 0) {
    candlestickSeries.value = chartInstance.value.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    
    candlestickSeries.value.setData(props.stockData)
  }
  
  // 创建投资组合价值线图
  if (props.portfolioHistory.length > 0) {
    portfolioSeries.value = chartInstance.value.addLineSeries({
      color: '#2196f3',
      lineWidth: 2,
      title: '投资组合价值',
    })
    
    const portfolioData: LineData[] = props.portfolioHistory.map(item => ({
      time: new Date(item.date).getTime() / 1000 as Time,
      value: item.total_value,
    }))
    
    portfolioSeries.value.setData(portfolioData)
  }
  
  // 添加交易标记
  if (showTradeMarkers.value) {
    addTradeMarkers()
  }
  
  // 响应式调整
  const handleResize = () => {
    if (chartInstance.value && chartContainer.value) {
      chartInstance.value.applyOptions({
        width: chartContainer.value.clientWidth,
      })
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (chartInstance.value) {
      chartInstance.value.remove()
    }
  })
}

// 添加交易标记
const addTradeMarkers = () => {
  if (!chartInstance.value || !props.trades.length) return
  
  console.log('🔍 开始添加交易标记，交易数量:', props.trades.length)
  console.log('🔍 交易数据:', props.trades)
  
  // 收集所有标记
  const candlestickMarkers: any[] = []
  const portfolioMarkers: any[] = []
  
  props.trades.forEach((trade, index) => {
    console.log(`🔍 处理第 ${index + 1} 条交易:`, trade)
    
    const time = new Date(trade.trade_date).getTime() / 1000 as Time
    const color = trade.trade_type === 'buy' ? '#26a69a' : '#ef5350'
    const shape = trade.trade_type === 'buy' ? 'arrowUp' : 'arrowDown'
    const text = trade.trade_type === 'buy' ? '买入' : '卖出'
    
    console.log(`🔍 交易时间: ${trade.trade_date} -> ${time}`)
    
    // 添加到K线图标记数组
    candlestickMarkers.push({
      time,
      position: trade.trade_type === 'buy' ? 'belowBar' : 'aboveBar',
      color,
      shape,
      text: `${text} ${trade.quantity}股`,
      size: 1,
    })
    
    // 添加到投资组合价值线标记数组
    const portfolioItem = props.portfolioHistory.find(item => 
      new Date(item.date).getTime() / 1000 === time
    )
    
    if (portfolioItem) {
      portfolioMarkers.push({
        time,
        position: 'inBar',
        color,
        shape: 'circle',
        text: `${text} ${trade.quantity}股`,
        size: 1,
      })
    } else {
      console.log(`⚠️ 未找到对应的投资组合数据: ${trade.trade_date}`)
    }
  })
  
  console.log('🔍 K线图标记数量:', candlestickMarkers.length)
  console.log('🔍 投资组合标记数量:', portfolioMarkers.length)
  
  // 一次性设置所有标记
  if (candlestickSeries.value) {
    candlestickSeries.value.setMarkers(candlestickMarkers)
  }
  
  if (portfolioSeries.value) {
    portfolioSeries.value.setMarkers(portfolioMarkers)
  }
}

// 重置缩放
const resetZoom = () => {
  if (chartInstance.value) {
    chartInstance.value.timeScale().fitContent()
  }
}

// 监听数据变化
watch(
  () => [props.stockData, props.portfolioHistory, props.trades, showTradeMarkers.value],
  () => {
    nextTick(() => {
      if (chartInstance.value) {
        // 更新数据
        if (candlestickSeries.value && props.stockData.length > 0) {
          candlestickSeries.value.setData(props.stockData)
        }
        
        if (portfolioSeries.value && props.portfolioHistory.length > 0) {
          const portfolioData: LineData[] = props.portfolioHistory.map(item => ({
            time: new Date(item.date).getTime() / 1000 as Time,
            value: item.total_value,
          }))
          portfolioSeries.value.setData(portfolioData)
        }
        
        // 更新交易标记
        if (showTradeMarkers.value) {
          addTradeMarkers()
        } else {
          // 清除标记
          if (candlestickSeries.value) {
            candlestickSeries.value.setMarkers([])
          }
          if (portfolioSeries.value) {
            portfolioSeries.value.setMarkers([])
          }
        }
      }
    })
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.remove()
  }
})
</script>

<style scoped lang="scss">
.backtest-chart {
  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        font-weight: 600;
        font-size: 16px;
      }
      
      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }
    
    .chart-container {
      position: relative;
      
      .chart-wrapper {
        width: 100%;
        height: 400px;
      }
      
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: rgba(255, 255, 255, 0.9);
        z-index: 10;
        
        span {
          margin-top: 12px;
          color: #666;
        }
      }
      
      .empty-state {
        height: 400px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
    
    .chart-legend {
      display: flex;
      gap: 20px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e4e7ed;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 2px;
          
          &.buy {
            background: #26a69a;
          }
          
          &.sell {
            background: #ef5350;
          }
          
          &.portfolio {
            background: #2196f3;
          }
        }
        
        span {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}
</style> 