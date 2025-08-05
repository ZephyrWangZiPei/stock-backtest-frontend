<template>
  <div class="backtest-center">
    <div class="page-header">
      <h2>📊 回测中心</h2>
      <p>配置策略参数，执行回测分析，查看交易结果</p>
    </div>

    <div class="backtest-content">
      <el-row :gutter="20">
        <!-- 左侧：配置面板 -->
        <el-col :span="8">
          <el-card class="config-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>⚙️ 回测配置</span>
                <div class="connection-status">
                  <el-tag 
                    :type="isConnected ? 'success' : 'danger'" 
                    size="small"
                  >
                    {{ isConnected ? '已连接' : '未连接' }}
                  </el-tag>
                  <el-button 
                    v-if="!isConnected"
                    type="primary" 
                    size="small" 
                    @click="reconnectBacktest"
                  >
                    重连
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 策略选择 -->
            <div class="config-section">
              <h4>策略选择</h4>
              <el-select 
                v-model="selectedStrategy" 
                placeholder="选择策略" 
                style="width: 100%"
                :loading="loadingStrategies"
                @change="handleStrategyChange"
              >
                <el-option 
                  v-for="strategy in strategies" 
                  :key="strategy.id" 
                  :label="strategy.name" 
                  :value="strategy.id"
                />
              </el-select>
            </div>

            <!-- 股票选择 -->
            <div class="config-section">
              <h4>股票选择</h4>
              <el-select 
                v-model="selectedStock" 
                placeholder="选择股票" 
                style="width: 100%"
                :loading="loadingStocks"
                filterable
              >
                <el-option 
                  v-for="stock in stocks" 
                  :key="stock.code" 
                  :label="`${stock.name} (${stock.code})`" 
                  :value="stock.code"
                />
              </el-select>
            </div>

            <!-- 时间范围 -->
            <div class="config-section">
              <h4>时间范围</h4>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </div>

            <!-- 初始资金 -->
            <div class="config-section">
              <h4>初始资金</h4>
              <el-input-number
                v-model="initialCapital"
                :min="1000"
                :max="10000000"
                :step="1000"
                style="width: 100%"
                placeholder="输入初始资金"
              />
            </div>

            <!-- 操作按钮 -->
            <div class="config-section">
              <el-button 
                type="primary" 
                :loading="isRunning"
                :disabled="!canStartBacktest"
                @click="handleStartBacktest"
                style="width: 100%"
              >
                <VideoPlay />
                {{ isRunning ? '回测中...' : '开始回测' }}
              </el-button>
              
              <el-button 
                v-if="isRunning"
                type="danger" 
                @click="handleStopBacktest"
                style="width: 100%; margin-top: 10px;"
              >
                停止回测
              </el-button>
            </div>

            <!-- 进度条 -->
            <div v-if="isRunning" class="progress-section">
              <h4>回测进度</h4>
              <el-progress 
                :percentage="progress" 
                :status="progress === 100 ? 'success' : undefined"
              />
              <p class="progress-message">{{ progressMessage }}</p>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：结果展示 -->
        <el-col :span="16">
          <el-card class="result-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>📈 回测结果</span>
                <div class="header-actions" v-if="backtestResult">
                  <el-button 
                    type="success" 
                    size="small" 
                    @click="exportResults"
                  >
                    <Download />
                    导出结果
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="clearResults"
                  >
                    <Delete />
                    清空结果
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 回测结果 -->
            <div v-if="backtestResult" class="result-content">
              <!-- K线图 -->
              <div class="chart-section">
                <BacktestChart 
                  :portfolio-history="backtestResult.portfolio_history || []"
                  :trades="currentTrades"
                  :loading="isRunning"
                />
              </div>

              <!-- 关键指标 -->
              <div class="metrics-section">
                <h4>关键指标</h4>
                <el-row :gutter="16">
                  <el-col :span="6">
                    <el-card class="summary-card" shadow="hover">
                      <div class="card-title">总收益率</div>
                      <div class="card-value" :class="getReturnClass(backtestResult.total_return)">
                        {{ (backtestResult.total_return * 100).toFixed(2) }}%
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="6">
                    <el-card class="summary-card" shadow="hover">
                      <div class="card-title">年化收益率</div>
                      <div class="card-value" :class="getReturnClass(backtestResult.annual_return)">
                        {{ (backtestResult.annual_return * 100).toFixed(2) }}%
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="6">
                    <el-card class="summary-card" shadow="hover">
                      <div class="card-title">夏普比率</div>
                      <div class="card-value" :class="getSharpeClass(backtestResult.sharpe_ratio)">
                        {{ backtestResult.sharpe_ratio.toFixed(2) }}
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="6">
                    <el-card class="summary-card" shadow="hover">
                      <div class="card-title">胜率</div>
                      <div class="card-value" :class="getWinRateClass(backtestResult.win_rate)">
                        {{ (backtestResult.win_rate * 100).toFixed(1) }}%
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>

              <!-- 详细统计 -->
              <div class="stats-section">
                <h4>详细统计</h4>
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="初始资金">
                    ¥{{ backtestResult.initial_capital?.toLocaleString() }}
                  </el-descriptions-item>
                  <el-descriptions-item label="最终资金">
                    ¥{{ backtestResult.final_capital?.toLocaleString() }}
                  </el-descriptions-item>
                  <el-descriptions-item label="总交易次数">
                    {{ backtestResult.total_trades }}
                  </el-descriptions-item>
                  <el-descriptions-item label="盈利交易">
                    {{ backtestResult.winning_trades }}
                  </el-descriptions-item>
                  <el-descriptions-item label="亏损交易">
                    {{ backtestResult.losing_trades }}
                  </el-descriptions-item>
                  <el-descriptions-item label="最大回撤">
                    {{ (backtestResult.max_drawdown * 100).toFixed(2) }}%
                  </el-descriptions-item>
                  <el-descriptions-item label="波动率">
                    {{ (backtestResult.volatility * 100).toFixed(2) }}%
                  </el-descriptions-item>
                  <el-descriptions-item label="贝塔系数">
                    {{ backtestResult.beta.toFixed(2) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="信息比率">
                    {{ backtestResult.information_ratio.toFixed(2) }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 交易记录 -->
              <div class="trades-section">
                <h4>交易记录 ({{ currentTrades.length }}笔)</h4>
                <el-table :data="currentTrades" stripe style="width: 100%">
                  <el-table-column prop="trade_date" label="交易日期" width="120" />
                  <el-table-column prop="trade_type" label="交易类型" width="80">
                    <template #default="{ row }">
                      <el-tag :type="row.trade_type === 'buy' ? 'success' : 'danger'" size="small">
                        {{ row.trade_type === 'buy' ? '买入' : '卖出' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="price" label="价格" width="100">
                    <template #default="{ row }">
                      ¥{{ row.price.toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="quantity" label="数量" width="100" />
                  <el-table-column prop="amount" label="金额" width="120">
                    <template #default="{ row }">
                      ¥{{ row.amount.toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="reason" label="交易原因" />
                </el-table>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!isRunning" class="empty-state">
              <el-empty description="暂无回测结果，请配置参数后开始回测" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Download, Delete } from '@element-plus/icons-vue'
import { useBacktestWebSocket } from '@/composables/useBacktestWebSocket'
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import BacktestChart from '@/components/backtest/BacktestChart.vue'

// 定义策略和股票类型
interface Strategy {
  id: string
  name: string
  description: string
  category?: string
  parameters?: any
}

interface Stock {
  code: string
  name: string
  market?: string
  industry?: string
}

const {
  isConnected,
  isRunning,
  currentProgress,
  currentResult,
  currentTrades,
  currentTaskId,
  startBacktest,
  stopBacktest,
  getBacktestStatus,
  getRunningTasks,
  getAvailableStrategies,
  getStrategyParameters,
  getAvailableStocks,
  getStockDailyData,
  joinTaskRoom,
  leaveTaskRoom,
  resetState,
  checkConnectionStatus,
  reconnectBacktest
} = useBacktestWebSocket()

// 从currentProgress中提取progress和progressMessage
const progress = computed(() => currentProgress.value.progress)
const progressMessage = computed(() => currentProgress.value.message)

// 使用currentResult作为backtestResult
const backtestResult = currentResult

// 使用真实API获取数据
const strategies = ref<Strategy[]>([])
const stocks = ref<Stock[]>([])
const loadingStrategies = ref(false)
const loadingStocks = ref(false)

// 表单数据
const selectedStrategy = ref('')
const selectedStock = ref('')
const dateRange = ref<string[]>([])
const initialCapital = ref(100000)

const loadStrategies = async () => {
  loadingStrategies.value = true
  try {
    const response = await unifiedHttpClient.backtest.getAvailableStrategies()
    strategies.value = response.data.data || []
    console.log('加载策略成功:', strategies.value)
  } catch (error) {
    console.error('加载策略失败:', error)
    ElMessage.error('加载策略失败')
  } finally {
    loadingStrategies.value = false
  }
}

const loadStocks = async () => {
  loadingStocks.value = true
  try {
    const response = await unifiedHttpClient.backtest.getAvailableStocks()
    stocks.value = response.data.data || []
    console.log('加载股票成功:', stocks.value)
  } catch (error) {
    console.error('加载股票失败:', error)
    ElMessage.error('加载股票失败')
  } finally {
    loadingStocks.value = false
  }
}

// 计算属性
const canStartBacktest = computed(() => {
  return selectedStrategy.value && selectedStock.value && dateRange.value.length === 2 && initialCapital.value > 0
})

// 事件处理
const handleStrategyChange = (value: string) => {
  console.log('策略选择:', value)
  // 可以在这里加载策略参数
}

const handleStartBacktest = async () => {
  if (!canStartBacktest.value) {
    ElMessage.warning('请先配置回测参数')
    return
  }

  try {
    const config = {
      strategy_id: selectedStrategy.value,
      stock_code: selectedStock.value,
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      initial_capital: initialCapital.value,
      parameters: {
        task_name: `回测_${selectedStrategy.value}_${selectedStock.value}_${dateRange.value[0]}_${dateRange.value[1]}`
      }
    }

    console.log('开始回测，配置:', config)
    await startBacktest(config)
  } catch (error) {
    console.error('启动回测失败:', error)
    ElMessage.error('启动回测失败')
  }
}

const handleStopBacktest = () => {
  ElMessageBox.confirm('确定要停止当前回测任务吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await stopBacktest()
      ElMessage.success('回测任务已停止')
    } catch (error) {
      console.error('停止回测失败:', error)
      ElMessage.error('停止回测失败')
    }
  }).catch(() => {
    // 用户取消
  })
}

const exportResults = async () => {
  try {
    if (!backtestResult.value?.id) {
      ElMessage.warning('没有可导出的回测结果')
      return
    }
    
    ElMessage.info('正在导出回测结果...')
    const response = await unifiedHttpClient.backtest.exportBacktestResult(backtestResult.value.id.toString(), 'excel')
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backtest_result_${backtestResult.value.id}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    ElMessage.success('回测结果导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const clearResults = () => {
  ElMessageBox.confirm('确定要清空回测结果吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    resetState()
    ElMessage.success('回测结果已清空')
  }).catch(() => {
    // 用户取消
  })
}

// 样式类计算
const getReturnClass = (value: number) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getSharpeClass = (value: number) => {
  if (value > 1) return 'positive'
  if (value > 0) return 'neutral'
  return 'negative'
}

const getWinRateClass = (value: number) => {
  if (value >= 0.6) return 'positive'
  if (value >= 0.4) return 'neutral'
  return 'negative'
}

// 生命周期
onMounted(async () => {
  console.log('回测中心页面加载')
  
  // 检查回测WebSocket连接状态
  setTimeout(() => {
    checkConnectionStatus()
  }, 1000)
  
  // 加载策略和股票数据
  await Promise.all([
    loadStrategies(),
    loadStocks()
  ])
  
  // 设置默认日期范围（最近一年）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(endDate.getFullYear() - 1)
  
  dateRange.value = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
})

onUnmounted(() => {
  console.log('回测中心页面卸载')
})
</script>

<style scoped lang="scss">
.backtest-center {
  padding: 20px;
  
  .page-header {
    margin-bottom: 30px;
    text-align: center;
    
    h2 {
      font-size: 2rem;
      font-weight: bold;
      color: #303133;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 1rem;
      color: #909399;
      margin: 0;
    }
  }
  
  .backtest-content {
    .config-card,
    .result-card {
      height: 100%;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
    
    .config-section {
      margin-bottom: 20px;
      
      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }
    }
    
    .progress-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e4e7ed;
      
      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }
      
      .progress-message {
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
        text-align: center;
      }
    }
    
    .result-content {
      .chart-section {
        margin-bottom: 30px;
      }
      
      .metrics-section {
        margin-bottom: 30px;
        
        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
        }
        
        .summary-card {
          text-align: center;
          
          .card-title {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
          }
          
          .card-value {
            font-size: 20px;
            font-weight: bold;
            
            &.positive {
              color: #67c23a;
            }
            
            &.negative {
              color: #f56c6c;
            }
            
            &.neutral {
              color: #909399;
            }
          }
        }
      }
      
      .stats-section {
        margin-bottom: 30px;
        
        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
        }
      }
      
      .trades-section {
        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
        }
      }
    }
    
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .backtest-center {
    .backtest-content {
      .el-row {
        .el-col {
          margin-bottom: 20px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .backtest-center {
    padding: 10px;
    
    .page-header {
      h2 {
        font-size: 1.5rem;
      }
    }
    
    .backtest-content {
      .config-card,
      .result-card {
        .card-header {
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }
      }
      
      .metrics-section {
        .el-row {
          .el-col {
            margin-bottom: 16px;
          }
        }
      }
    }
  }
}
</style> 

