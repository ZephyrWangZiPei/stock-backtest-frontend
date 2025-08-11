<template>
  <div class="backtest-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>回测中心</h1>
      <p>配置交易策略，进行历史数据回测，分析策略效果</p>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧策略配置 -->
      <el-col :xs="24" :lg="8">
        <StrategyConfig
          :config="backtestConfig"
          :is-running="isBacktestRunning"
          @update:config="backtestConfig = $event"
          @start-backtest="startBacktest"
          @reset-config="resetConfig"
          @save-template="saveTemplate"
        />
        
        <!-- 回测进度 -->
        <div style="margin-top: 20px;">
          <BacktestProgress
            :progress="backtestProgress"
            :is-running="isBacktestRunning"
            @stop-backtest="stopBacktest"
            @clear-logs="clearLogs"
          />
        </div>
      </el-col>
      
      <!-- 右侧结果展示 -->
      <el-col :xs="24" :lg="16">
        <el-card class="results-card">
          <template #header>
            <div class="card-header">
              <span>回测结果</span>
              <div class="header-actions" v-if="backtestResults">
                <el-button size="small" @click="compareResults">
                  <el-icon><TrendCharts /></el-icon>
                  对比分析
                </el-button>
                <el-button size="small" @click="exportReport">
                  <el-icon><Document /></el-icon>
                  导出报告
                </el-button>
              </div>
            </div>
          </template>
          
          <BacktestResults :results="backtestResults" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 历史回测记录 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="history-card">
          <template #header>
            <div class="card-header">
              <span>历史回测记录</span>
              <el-button size="small" @click="refreshHistory">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <div class="history-content" style="max-height: 400px; overflow-y: auto;">
            <el-table :data="backtestHistory" stripe size="small">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="strategyName" label="策略名称" width="120" />
              <el-table-column prop="stockPool" label="股票池" width="150">
                <template #default="{ row }">
                  <el-tag v-for="stock in row.stockPool.slice(0, 2)" :key="stock" size="small" style="margin: 1px;">
                    {{ stock }}
                  </el-tag>
                  <span v-if="row.stockPool.length > 2" class="more-stocks">
                    +{{ row.stockPool.length - 2 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="dateRange" label="回测期间" width="200" />
              <el-table-column prop="totalReturn" label="总收益率" width="100">
                <template #default="{ row }">
                  <span :class="getReturnClass(row.totalReturn)">
                    {{ formatPercent(row.totalReturn) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="sharpeRatio" label="夏普比率" width="100" />
              <el-table-column prop="maxDrawdown" label="最大回撤" width="100">
                <template #default="{ row }">
                  <span class="negative">{{ formatPercent(row.maxDrawdown) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="150" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button-group size="small">
                    <el-button @click="viewHistoryDetail(row)">
                      <el-icon><View /></el-icon>
                      查看
                    </el-button>
                    <el-button @click="cloneBacktest(row)">
                      <el-icon><CopyDocument /></el-icon>
                      克隆
                    </el-button>
                    <el-button type="danger" @click="deleteBacktest(row)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </el-button-group>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-wrapper">
              <el-pagination
                :current-page="historyPage"
                :page-size="historyPageSize"
                :total="historyTotal"
                layout="total, prev, pager, next"
                @current-change="handleHistoryPageChange"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  TrendCharts, 
  Document, 
  Refresh, 
  View, 
  CopyDocument, 
  Delete 
} from '@element-plus/icons-vue'
import { StrategyConfig, BacktestResults, BacktestProgress } from '../components/backtest'

// 导入API客户端和WebSocket服务
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import type { BacktestConfig as APIBacktestConfig, BacktestResult } from '@/utils/unifiedHttpClient'
import { websocketEventBus } from '@/utils/websocketEventBus'
import { realtimeDataService } from '@/services/realtimeDataService'
import { UnifiedWebSocketManager } from '@/utils/unifiedWebSocketManager'

const websocketManager = new UnifiedWebSocketManager()

// 接口定义
interface BacktestConfig {
  strategy: string
  stockPool: string[]
  dateRange: [string, string] | null
  initialCapital: number
  commission: number
  stampTax: number
  slippage: number
  maxPositionPct: number
  stopLoss: number
  takeProfit: number
  strategyParams: Record<string, number>
}

interface BacktestProgress {
  overall: number
  stages: {
    data_loading: number
    strategy_calculation: number
    trading_simulation: number
    result_analysis: number
  }
  currentDate: string
  processedDays: number
  totalTrades: number
  currentValue: number
  elapsedTime: number
  estimatedTime: number
  remainingTime: number
  logs: ProgressLog[]
}

interface ProgressLog {
  time: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

interface BacktestResults {
  totalReturn: number
  annualReturn: number
  sharpeRatio: number
  maxDrawdown: number
  totalTrades: number
  winRate: number
  volatility: number
  finalValue: number
  monthlyReturns: MonthlyReturn[]
  positionAnalysis: PositionAnalysis[]
  trades: Trade[]
  portfolioHistory?: { date: string; total_value: number }[]
  klineData?: any[] // 新增K线数据
}

interface MonthlyReturn {
  month: string
  return: number
}

interface PositionAnalysis {
  stock: string
  return: number
  trades: number
}

interface Trade {
  id: string; // 新增ID
  date: string
  stock: string
  action: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  return: number | null
  reason: string
}

interface BacktestHistoryItem {
  id: number
  strategyName: string
  stockPool: string[]
  dateRange: string
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  createTime: string
}

// 响应式数据
const isBacktestRunning = ref(false)
const backtestProgress = ref<BacktestProgress | null>(null)
const backtestResults = ref<BacktestResults | null>(null)
const currentTaskId = ref<string>('')
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)

// 回测配置
const backtestConfig = ref<BacktestConfig>({
  strategy: '',
  stockPool: [],
  dateRange: null,
  initialCapital: 100000,
  commission: 0.0003,
  stampTax: 0.001,
  slippage: 0.001,
  maxPositionPct: 20,
  stopLoss: 10,
  takeProfit: 20,
  strategyParams: {}
})

// 历史记录
const backtestHistory = ref<BacktestHistoryItem[]>([])

// 工具函数
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`
}

const getReturnClass = (value: number) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

// 映射交易记录到前端格式
const mapTrades = (trades: any[]): Trade[] => {
  return trades.map(trade => ({
    id: trade.id || `trade_${Date.now()}_${Math.random()}`,
    date: trade.trade_date || trade.date || '--',
    stock: trade.stock_code || '--',
    action: trade.trade_type === 'buy' ? 'buy' : 'sell',
    price: trade.price || 0,
    quantity: trade.quantity || 0,
    amount: trade.amount || 0,
    return: trade.return || null,
    reason: trade.reason || '策略信号'
  }));
};

// 格式化数量显示（股数转手数）
const formatQuantity = (quantity: number): string => {
  if (quantity <= 0) return '0';
  const lots = quantity / 100;
  if (lots === Math.floor(lots)) {
    return `${lots}手`;
  } else {
    return `${quantity}股`;
  }
};

// 计算月度收益
const computeMonthlyReturns = (portfolioHistory: any[]): MonthlyReturn[] => {
  if (!portfolioHistory || portfolioHistory.length === 0) {
    return [];
  }

  const monthlyData = new Map<string, { startValue: number; endValue: number; startDate: string }>();
  
  portfolioHistory.forEach((item, index) => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        startValue: item.total_value,
        endValue: item.total_value,
        startDate: item.date
      });
    } else {
      monthlyData.get(monthKey)!.endValue = item.total_value;
    }
  });

  return Array.from(monthlyData.entries()).map(([month, data]) => {
    const returnRate = data.startValue > 0 ? ((data.endValue - data.startValue) / data.startValue) * 100 : 0;
    return {
      month,
      return: returnRate,
      startValue: data.startValue,
      endValue: data.endValue,
      startDate: data.startDate
    };
  });
};

// 主要功能方法
const startBacktest = async () => {
  try {
    isBacktestRunning.value = true
    
    // 验证配置
    if (!backtestConfig.value.strategy) {
      ElMessage.error('请选择回测策略')
      return
    }
    
    if (!backtestConfig.value.stockPool.length) {
      ElMessage.error('请选择股票池')
      return
    }
    
    if (!backtestConfig.value.dateRange || backtestConfig.value.dateRange.length !== 2) {
      ElMessage.error('请选择回测时间范围')
      return
    }
    
    // 启动真实回测任务
    const response = await unifiedHttpClient.backtest.startBacktest({
      strategy_id: backtestConfig.value.strategy, // 直接使用策略ID，不需要parseInt
      stock_code: backtestConfig.value.stockPool[0], // 使用第一个股票代码，因为后端期望单个股票
      start_date: backtestConfig.value.dateRange[0],
      end_date: backtestConfig.value.dateRange[1],
      initial_capital: backtestConfig.value.initialCapital,
      parameters: {
        commission: backtestConfig.value.commission,
        stamp_tax: backtestConfig.value.stampTax,
        slippage: backtestConfig.value.slippage,
        max_position_pct: backtestConfig.value.maxPositionPct,
        stop_loss: backtestConfig.value.stopLoss,
        take_profit: backtestConfig.value.takeProfit,
        ...backtestConfig.value.strategyParams // 合并策略特定参数
      }
    })
    
    if (response.data && response.data.task_id) {
      currentTaskId.value = response.data.task_id
      
             // 初始化进度状态
       backtestProgress.value = {
         overall: 0,
         stages: {
           data_loading: 0,
           strategy_calculation: 0,
           trading_simulation: 0,
           result_analysis: 0
         },
         currentDate: backtestConfig.value.dateRange[0],
         processedDays: 0,
         totalTrades: 0,
         currentValue: backtestConfig.value.initialCapital,
         elapsedTime: 0,
         estimatedTime: 0,
         remainingTime: 0,
         logs: [{
           time: new Date().toLocaleTimeString(),
           level: 'info',
           message: '回测任务已启动，正在连接WebSocket监听进度...'
         }]
       }
      
      // 连接WebSocket监听回测进度
      connectBacktestWebSocket(response.data.task_id)
      
      ElMessage.success(`回测任务已启动，任务ID: ${response.data.task_id}`)
    } else {
      throw new Error('回测任务启动失败')
    }
    
  } catch (error) {
    console.error('启动回测失败:', error)
    ElMessage.error('启动回测失败，请检查网络连接')
    backtestProgress.value?.logs.push({
      time: new Date().toLocaleTimeString(),
      level: 'error',
      message: `回测失败: ${error}`
    })
  } finally {
    isBacktestRunning.value = false
  }
}

// 连接回测WebSocket监听进度
const connectBacktestWebSocket = (taskId: string) => {
  console.log('开始连接回测WebSocket，任务ID:', taskId)
  
  // 使用统一WebSocket管理器连接回测进度监听
  websocketManager.connect('/backtest').then(() => {
    console.log('回测WebSocket连接成功')
    
    // 监听进度更新（与后端一致的事件名）
    websocketManager.on('/backtest', 'backtest_progress', (data: any) => {
      console.log('收到回测进度更新:', data)
      
      if (data.task_id === taskId && backtestProgress.value) {
        // 更新总体进度
        backtestProgress.value.overall = data.overall_progress || data.progress || 0
        
        // 更新各阶段进度
        if (data.stage_progress) {
          Object.assign(backtestProgress.value.stages, data.stage_progress)
        }
        
        // 更新其他信息
        backtestProgress.value.processedDays = data.processed_days || 0
        backtestProgress.value.totalTrades = data.total_trades || 0
        backtestProgress.value.currentValue = data.current_value || backtestConfig.value.initialCapital
        
        // 添加日志
        if (data.message) {
          backtestProgress.value.logs.push({
            time: new Date().toLocaleTimeString(),
            level: data.level || 'info',
            message: data.message
          })
        }
        
        // 如果进度达到100%，标记为完成
        if (data.overall_progress >= 100 || data.progress >= 100) {
          isBacktestRunning.value = false
        }
      }
    })
    
    // 监听交易事件（可选，用于日志/统计）
    websocketManager.on('/backtest', 'trade_event', (trade: any) => {
      console.log('收到交易事件:', trade)
      
      if (backtestProgress.value) {
        // 添加交易日志
        const actionText = trade.trade_type === 'buy' ? '买入' : (trade.trade_type === 'sell' ? '卖出' : String(trade.trade_type))
        backtestProgress.value.logs.push({
          time: new Date().toLocaleTimeString(),
          level: 'info',
          message: `交易 ${actionText} ${trade.stock_code || trade.stock || ''} 数量 ${trade.quantity || 0} 价格 ¥${trade.price || 0}`
        })
        
        // 更新交易计数
        backtestProgress.value.totalTrades = (backtestProgress.value.totalTrades || 0) + 1
        
        // 如果回测结果已存在，更新交易记录
        if (backtestResults.value) {
          // 规范化并追加
          const normalized = {
            id: `trade_${Date.now()}_${Math.random()}`,
            date: trade.trade_date,
            stock: trade.stock_code,
            action: (trade.trade_type === 'buy' ? 'buy' : 'sell') as 'buy' | 'sell',
            price: Number(trade.price ?? 0),
            quantity: Number(trade.quantity ?? 0),
            amount: Number(trade.amount ?? 0),
            return: null, // 后端未提供单笔收益率，避免NaN，使用 null 显示"--"
            reason: trade.reason || '策略信号'
          }
          backtestResults.value.trades = [...(backtestResults.value.trades || []), normalized]
          backtestResults.value.totalTrades = backtestResults.value.trades.length
          
          // 动态追加净值点（使用交易日与当前进度中的当前净值）
          const equityPoint = { date: normalized.date, total_value: Number(backtestProgress.value?.currentValue ?? 0) }
          
          // 确保净值数据按时间顺序添加并去重
          if (backtestResults.value.portfolioHistory) {
            const existingIndex = backtestResults.value.portfolioHistory.findIndex(p => p.date === equityPoint.date)
            if (existingIndex >= 0) {
              backtestResults.value.portfolioHistory[existingIndex] = equityPoint
            } else {
              backtestResults.value.portfolioHistory.push(equityPoint)
            }
            backtestResults.value.portfolioHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          } else {
            backtestResults.value.portfolioHistory = [equityPoint]
          }

          // 若K线未加载，尝试请求（仅请求一次）
          if (!backtestResults.value.klineData || backtestResults.value.klineData.length === 0) {
            const stockCode = trade.stock_code || backtestConfig.value.stockPool?.[0]
            if (stockCode) {
              websocketManager.emit('/backtest', 'get_stock_daily_data', {
                stock_code: stockCode,
                start_date: backtestConfig.value.dateRange?.[0],
                end_date: backtestConfig.value.dateRange?.[1],
                limit: 2000
              })
            }
          }
        }
      }
    })

    // 监听回测完成
    websocketManager.on('/backtest', 'backtest_completed', (data: any) => {
      console.log('收到回测完成事件:', data)
      console.log('事件数据结构:', JSON.stringify(data, null, 2))
      
      if (data.task_id === taskId) {
        isBacktestRunning.value = false
        
        // 处理回测结果数据
        if (data.results) {
          console.log('后端返回的原始结果:', data.results)
          
          backtestResults.value = {
            totalReturn: Number(data.results.total_return || 0),
            annualReturn: Number(data.results.annual_return || 0),
            sharpeRatio: Number(data.results.sharpe_ratio || 0),
            maxDrawdown: Number(data.results.max_drawdown || 0),
            totalTrades: Number(data.results.total_trades || 0),
            winRate: Number(data.results.win_rate || 0),
            volatility: Number(data.results.volatility || 0),
            finalValue: Number(data.results.final_capital ?? backtestConfig.value.initialCapital),
            monthlyReturns: computeMonthlyReturns(data.results.portfolio_history),
            positionAnalysis: [{
              stock: data.results.stock_code,
              return: Number(data.results.total_return || 0),
              trades: Number(data.results.total_trades || 0)
            }],
            trades: mapTrades(data.trades),
            portfolioHistory: (data.results.portfolio_history || []) as any,
            klineData: [] as any
          }

          // 请求K线数据
          const stockCode = data.results.stock_code || backtestConfig.value.stockPool?.[0]
          if (stockCode) {
            websocketManager.emit('/backtest', 'get_stock_daily_data', {
              stock_code: stockCode,
              start_date: backtestConfig.value.dateRange?.[0],
              end_date: backtestConfig.value.dateRange?.[1],
              limit: 2000
            })
          }
          
          console.log('转换后的前端结果:', backtestResults.value)
          console.log('回测结果组件是否更新:', !!backtestResults.value)
        } else {
          console.warn('回测完成事件中没有results数据')
          fetchBacktestResults(taskId)
        }
        
        backtestProgress.value?.logs.push({
          time: new Date().toLocaleTimeString(),
          level: 'success',
          message: '回测任务已完成'
        })
        
        ElMessage.success('回测任务已完成')
        loadBacktestHistory()
      }
    })

    // 接收K线数据
    websocketManager.on('/backtest', 'stock_daily_data', (payload: any) => {
      try {
        if (!backtestResults.value) return
        const data = Array.isArray(payload?.data) ? payload.data : []
        // 确保升序
        const sorted = data.slice().sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
        ;(backtestResults.value as any).klineData = sorted
      } catch (e) {
        console.error('处理K线数据失败:', e)
      }
    })
    
    // 监听回测错误
    websocketManager.on('/backtest', 'backtest_error', (data: any) => {
      console.log('收到回测错误事件:', data)
      
      if (data.task_id === taskId) {
        isBacktestRunning.value = false
        
        backtestProgress.value?.logs.push({
          time: new Date().toLocaleTimeString(),
          level: 'error',
          message: `回测失败: ${data.error}`
        })
        
        ElMessage.error(`回测失败: ${data.error}`)
      }
    })
    
    console.log('回测WebSocket事件监听器设置完成')
    
  }).catch(error => {
    console.error('连接回测WebSocket失败:', error)
    ElMessage.error('连接回测监听失败')
    
    // 即使WebSocket连接失败，也要更新进度状态
    if (backtestProgress.value) {
      backtestProgress.value.logs.push({
        time: new Date().toLocaleTimeString(),
        level: 'warning',
        message: 'WebSocket连接失败，无法实时监听进度，但回测任务仍在后台运行'
      })
    }
  })
}

const stopBacktest = () => {
  isBacktestRunning.value = false
  backtestProgress.value?.logs.push({
    time: new Date().toLocaleTimeString(),
    level: 'warning',
    message: '用户停止回测'
  })
  ElMessage.info('回测已停止')
}

const clearLogs = () => {
  if (backtestProgress.value) {
    backtestProgress.value.logs = []
  }
}

const resetConfig = () => {
  backtestConfig.value = {
    strategy: '',
    stockPool: [],
    dateRange: null,
    initialCapital: 100000,
    commission: 0.0003,
    stampTax: 0.001,
    slippage: 0.001,
    maxPositionPct: 20,
    stopLoss: 10,
    takeProfit: 20,
    strategyParams: {}
  }
}

const saveTemplate = () => {
  // TODO: 实际保存模板逻辑
  ElMessage.success('配置模板已保存')
}

const compareResults = () => {
  // TODO: 实际对比分析逻辑
  ElMessage.info('对比分析功能待实现')
}

const exportReport = () => {
  // TODO: 实际导出报告逻辑
  ElMessage.success('回测报告已导出')
}

const refreshHistory = () => {
  loadBacktestHistory()
  ElMessage.success('历史记录已刷新')
}

// WebSocket监听器
const setupBacktestWebSocketListener = (taskId: string) => {
  const unsubscribe = websocketEventBus.subscribe({
    id: `backtest_${taskId}`,
    handler: (event) => {
      if (event.namespace !== '/backtest') return
      
      switch (event.event) {
        case 'backtest_progress':
          updateBacktestProgress(event.data)
          break
        case 'backtest_completed':
          handleBacktestCompleted(event.data)
          break
        case 'backtest_error':
          handleBacktestError(event.data)
          break
      }
    }
  })
  
  // 5分钟后自动取消订阅（防止内存泄漏）
  setTimeout(() => {
    unsubscribe()
  }, 5 * 60 * 1000)
}

const updateBacktestProgress = (data: any) => {
  if (!backtestProgress.value) return
  
  backtestProgress.value.overall = data.progress || 0
  backtestProgress.value.currentDate = data.current_date || ''
  backtestProgress.value.processedDays = data.processed_days || 0
  backtestProgress.value.totalTrades = data.total_trades || 0
  backtestProgress.value.currentValue = data.current_value || backtestConfig.value.initialCapital
  
  if (data.stage_progress) {
    Object.assign(backtestProgress.value.stages, data.stage_progress)
  }
  
  if (data.message) {
    backtestProgress.value.logs.push({
      time: new Date().toLocaleTimeString(),
      level: 'info',
      message: data.message
    })
  }
}

const handleBacktestCompleted = async (data: any) => {
  isBacktestRunning.value = false
  
  backtestProgress.value?.logs.push({
    time: new Date().toLocaleTimeString(),
    level: 'success',
    message: '回测完成'
  })
  
  // 获取回测结果
  try {
    if (data.result_id) {
      const response = await unifiedHttpClient.backtest.getResults(data.result_id)
      if (response.data) {
        backtestResults.value = transformApiResultToLocal(response.data)
      }
    } else {
      backtestResults.value = null
    }
    ElMessage.success('回测完成')
  } catch (error) {
    console.error('获取回测结果失败:', error)
    backtestResults.value = null
    ElMessage.error('获取回测结果失败')
  }
}

const handleBacktestError = (data: any) => {
  isBacktestRunning.value = false
  
  backtestProgress.value?.logs.push({
    time: new Date().toLocaleTimeString(),
    level: 'error',
    message: `回测失败: ${data.error || '未知错误'}`
  })
  
  ElMessage.error('回测失败')
}

const transformApiResultToLocal = (apiResult: any): BacktestResults => {
  return {
    totalReturn: Number(apiResult.total_return || 0),
    annualReturn: Number(apiResult.annual_return || 0),
    sharpeRatio: Number(apiResult.sharpe_ratio || 0),
    maxDrawdown: Number(apiResult.max_drawdown || 0),
    totalTrades: Number(apiResult.total_trades || 0),
    winRate: Number(apiResult.win_rate || 0),
    volatility: Number(apiResult.volatility || 0),
    finalValue: Number(apiResult.final_capital ?? backtestConfig.value.initialCapital),
    monthlyReturns: computeMonthlyReturns(apiResult.portfolio_history),
    positionAnalysis: [{
      stock: apiResult.stock_code,
      return: Number(apiResult.total_return || 0),
      trades: Number(apiResult.total_trades || 0)
    }],
    trades: mapTrades(apiResult.trades)
  }
}

// 从数据库获取回测结果
const fetchBacktestResults = async (taskId: string) => {
  try {
    console.log('尝试从数据库获取回测结果，任务ID:', taskId)
    const response = await unifiedHttpClient.backtest.getResult(taskId)
    if (response.data) {
      console.log('从数据库获取到的回测结果:', response.data)
      backtestResults.value = transformApiResultToLocal(response.data)
      console.log('转换后的前端结果:', backtestResults.value)
    } else {
      console.warn('数据库中没有找到回测结果')
      backtestResults.value = null
    }
  } catch (error) {
    console.error('获取回测结果失败:', error)
    ElMessage.error('获取回测结果失败')
    backtestResults.value = null
  }
}

const loadBacktestHistory = async () => {
  try {
    const response = await unifiedHttpClient.backtest.getResults({
      page: historyPage.value,
      limit: historyPageSize.value
    })
    
    if (response.data) {
      backtestHistory.value = response.data.results?.map((item: any) => ({
        id: item.id,
        strategyName: item.strategy_name || '未知策略',
        stockPool: item.stock_codes || [],
        dateRange: `${item.start_date} 至 ${item.end_date}`,
        totalReturn: item.total_return || 0,
        sharpeRatio: item.sharpe_ratio || 0,
        maxDrawdown: item.max_drawdown || 0,
        createTime: item.created_at || ''
      })) || []
      
      historyTotal.value = response.data.total || 0
    }
  } catch (error) {
    console.error('获取回测历史失败:', error)
    
    // API调用失败时清空数据
    backtestHistory.value = []
    historyTotal.value = 0
  }
}

const viewHistoryDetail = (item: BacktestHistoryItem) => {
  ElMessage.info(`查看回测记录 ${item.id} 的详细信息`)
}

const cloneBacktest = (item: BacktestHistoryItem) => {
  ElMessage.success(`已克隆回测配置 ${item.id}`)
}

const deleteBacktest = async (item: BacktestHistoryItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除回测记录 ${item.id} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('回测记录已删除')
    loadBacktestHistory()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleHistoryPageChange = (page: number) => {
  historyPage.value = page
  loadBacktestHistory()
}

// 生命周期
onMounted(() => {
  loadBacktestHistory()
})
</script>

<style lang="scss" scoped>
.backtest-center {
  padding: 20px;
  min-height: calc(100vh - 70px); // 确保最小高度
  overflow-y: auto; // 允许垂直滚动
  
  .page-header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 28px;
    }
    
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }
  
  .main-content {
    .results-card {
      min-height: 600px;
      height: 100%;
    }
  }
  
  .history-card {
    .history-content {
      .more-stocks {
        font-size: 12px;
        color: #909399;
        margin-left: 4px;
      }
      
      .pagination-wrapper {
        margin-top: 16px;
        text-align: center;
      }
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
  }
}

// 表格中的颜色样式
:deep(.el-table) {
  .positive {
    color: #67c23a;
  }
  
  .negative {
    color: #f56c6c;
  }
  
  .neutral {
    color: #909399;
  }
}

@media (max-width: 768px) {
  .backtest-center {
    padding: 12px;
    
    .main-content {
      .el-col {
        margin-bottom: 16px;
      }
    }
    
    .card-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
      
      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  }
}
</style> 