/**
 * Top回测业务逻辑 Composable
 * 封装Top回测相关的数据获取、状态管理等逻辑
 */

import { ref, computed, readonly } from 'vue'
import { ElMessage } from 'element-plus'
import { getTopStrategyStocks, runTopStrategyBacktestJob } from '@/utils/api'
import { formatPercentage, formatNumber } from '@/utils/formatters'

// =============================================================================
// 类型定义
// =============================================================================

export interface TopStrategyStock {
  id: number
  stock_code: string
  stock_name: string
  strategy_name: string
  total_return: number
  win_rate: number
  profit_factor: number
  max_drawdown: number
  sharpe_ratio: number
  created_at: string
}

export interface TopBacktestStats {
  totalStocks: number
  avgReturn: number
  avgWinRate: number
  avgProfitFactor: number
  bestStock: TopStrategyStock | null
  worstStock: TopStrategyStock | null
}

// =============================================================================
// 主要功能
// =============================================================================

export function useTopBacktest() {
  // =============================================================================
  // 响应式状态
  // =============================================================================
  
  const loading = ref(false)
  const runningJob = ref(false)
  const topStocks = ref<TopStrategyStock[]>([])
  const error = ref<string | null>(null)
  
  // 进度相关状态
  const progress = ref(0)
  const currentStep = ref('')
  const stepProgress = ref<number | null>(null)
  const progressMessage = ref('')
  const progressStatus = ref<'success' | 'exception' | 'warning' | ''>('')

  // =============================================================================
  // 计算属性
  // =============================================================================

  /**
   * 统计数据
   */
  const stats = computed((): TopBacktestStats => {
    if (!topStocks.value || topStocks.value.length === 0) {
      return {
        totalStocks: 0,
        avgReturn: 0,
        avgWinRate: 0,
        avgProfitFactor: 0,
        bestStock: null,
        worstStock: null
      }
    }

    const totalStocks = topStocks.value.length
    const avgReturn = topStocks.value.reduce((sum, stock) => sum + stock.total_return, 0) / totalStocks
    const avgWinRate = topStocks.value.reduce((sum, stock) => sum + stock.win_rate, 0) / totalStocks
    const avgProfitFactor = topStocks.value.reduce((sum, stock) => sum + stock.profit_factor, 0) / totalStocks

    // 找出最佳和最差股票
    const bestStock = topStocks.value.reduce((best, current) => 
      current.total_return > best.total_return ? current : best
    )
    const worstStock = topStocks.value.reduce((worst, current) => 
      current.total_return < worst.total_return ? current : worst
    )

    return {
      totalStocks,
      avgReturn,
      avgWinRate,
      avgProfitFactor,
      bestStock,
      worstStock
    }
  })

  /**
   * 按策略分组的股票
   */
  const stocksByStrategy = computed(() => {
    const groups: Record<string, TopStrategyStock[]> = {}
    
    topStocks.value.forEach(stock => {
      if (!groups[stock.strategy_name]) {
        groups[stock.strategy_name] = []
      }
      groups[stock.strategy_name].push(stock)
    })
    
    return groups
  })

  /**
   * 策略列表
   */
  const strategies = computed(() => {
    return [...new Set(topStocks.value.map(stock => stock.strategy_name))]
  })

  /**
   * 是否显示进度条
   * 当任务正在运行且进度大于0时显示
   */
  const showProgress = computed(() => {
    return runningJob.value && progress.value > 0
  })

  // =============================================================================
  // 方法
  // =============================================================================

  /**
   * 加载Top策略数据
   */
  const loadData = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await getTopStrategyStocks()

      // 处理后端返回的分组数据结构
      if (Array.isArray(response.data)) {
        // 将分组数据扁平化为股票数组
        const flattenedStocks: TopStrategyStock[] = []

        response.data.forEach((strategyGroup: any) => {
          if (strategyGroup.top_stocks && Array.isArray(strategyGroup.top_stocks)) {
            flattenedStocks.push(...strategyGroup.top_stocks)
          }
        })

        topStocks.value = flattenedStocks
        ElMessage.success(`成功加载 ${flattenedStocks.length} 条Top策略数据`)
      } else {
        // 如果是直接的股票数组（向后兼容）
        topStocks.value = response.data || []
        ElMessage.success(`成功加载 ${response.data?.length || 0} 条Top策略数据`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载数据失败'
      error.value = message
      ElMessage.error(message)
      console.error('加载Top策略数据失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新数据
   */
  const refreshData = async () => {
    await loadData()
  }

  /**
   * 执行Top策略回测
   */
  const runBacktest = async () => {
    try {
      runningJob.value = true
      error.value = null
      
      // 重置进度状态
      progress.value = 0
      currentStep.value = '准备执行回测任务...'
      stepProgress.value = null
      progressMessage.value = '正在启动回测任务'
      progressStatus.value = ''
      
      await runTopStrategyBacktestJob()
      ElMessage.success('Top策略回测任务已启动，请等待完成')
    } catch (err) {
      const message = err instanceof Error ? err.message : '启动回测任务失败'
      error.value = message
      progressStatus.value = 'exception'
      progressMessage.value = message
      runningJob.value = false // 启动失败时重置状态
      ElMessage.error(message)
      console.error('启动Top策略回测失败:', err)
    } finally {
      // 注意：这里不重置 runningJob，因为任务可能还在后台运行
      // 只有在收到完成或失败消息时才重置
    }
  }

  /**
   * 更新进度信息
   */
  const updateProgress = (data: {
    progress?: number
    currentStep?: string
    stepProgress?: number | null
    message?: string
    status?: 'success' | 'exception' | 'warning' | ''
  }) => {
    console.log('更新进度信息:', data)
    console.log('更新前runningJob:', runningJob.value)
    console.log('更新前progress:', progress.value)
    
    // 如果收到进度数据且progress > 0，说明任务正在运行
    if (data.progress !== undefined && data.progress > 0) {
      runningJob.value = true
      console.log('设置runningJob为true')
    }
    
    if (data.progress !== undefined) {
      progress.value = Math.min(100, Math.max(0, data.progress))
      console.log('设置progress为:', progress.value)
    }
    if (data.currentStep !== undefined) {
      currentStep.value = data.currentStep
      console.log('设置currentStep为:', currentStep.value)
    }
    if (data.stepProgress !== undefined) {
      stepProgress.value = data.stepProgress
    }
    if (data.message !== undefined) {
      progressMessage.value = data.message
      console.log('设置progressMessage为:', progressMessage.value)
    }
    if (data.status !== undefined) {
      progressStatus.value = data.status
    }
    
    console.log('更新后runningJob:', runningJob.value)
    console.log('更新后progress:', progress.value)
    console.log('更新后showProgress:', showProgress.value)
    
    // 保存状态到本地存储
    saveJobStatus()
    
    // 如果任务完成或失败，重置运行状态
    if (data.status === 'success' || data.status === 'exception') {
      runningJob.value = false
      
      // 清除本地存储的状态
      clearJobStatus()
      
      // 延迟清除进度信息
      setTimeout(() => {
        progress.value = 0
        currentStep.value = ''
        stepProgress.value = null
        progressMessage.value = ''
        progressStatus.value = ''
      }, 3000)
    }
  }

  /**
   * 重置进度状态
   */
  const resetProgress = () => {
    runningJob.value = false
    progress.value = 0
    currentStep.value = ''
    stepProgress.value = null
    progressMessage.value = ''
    progressStatus.value = ''
    clearJobStatus() // 同时清除本地存储
  }

  /**
   * 强制重置所有状态
   * 用于页面初始化时确保状态正确
   */
  const forceReset = () => {
    console.log('强制重置所有状态')
    resetProgress()
    error.value = null
  }

  /**
   * 检查任务状态
   * 页面刷新后调用此方法检查是否有正在运行的任务
   */
  const checkJobStatus = async () => {
    try {
      // 检查本地存储的状态
      const savedStatus = localStorage.getItem('top_backtest_status')
      if (savedStatus) {
        const status = JSON.parse(savedStatus)
        
        // 检查状态是否过期（超过1小时）
        const isExpired = Date.now() - (status.timestamp || 0) > 60 * 60 * 1000
        
        if (status.running && status.jobName === 'top_strategy_backtest' && !isExpired) {
          // 恢复任务状态
          runningJob.value = true
          progress.value = status.progress || 0
          currentStep.value = status.currentStep || '正在执行回测任务...'
          stepProgress.value = status.stepProgress || null
          progressMessage.value = status.message || '正在执行回测任务'
          progressStatus.value = status.status || ''
          
          console.log('恢复回测任务状态:', status)
        } else if (isExpired) {
          // 状态过期，清除本地存储
          console.log('任务状态已过期，清除本地存储')
          clearJobStatus()
        }
      }
    } catch (err) {
      console.error('检查任务状态失败:', err)
    }
  }

  /**
   * 保存任务状态到本地存储
   */
  const saveJobStatus = () => {
    try {
      const status = {
        running: runningJob.value,
        jobName: 'top_strategy_backtest',
        progress: progress.value,
        currentStep: currentStep.value,
        stepProgress: stepProgress.value,
        message: progressMessage.value,
        status: progressStatus.value,
        timestamp: Date.now()
      }
      localStorage.setItem('top_backtest_status', JSON.stringify(status))
    } catch (err) {
      console.error('保存任务状态失败:', err)
    }
  }

  /**
   * 清除任务状态
   */
  const clearJobStatus = () => {
    try {
      localStorage.removeItem('top_backtest_status')
    } catch (err) {
      console.error('清除任务状态失败:', err)
    }
  }

  /**
   * 获取股票详情
   */
  const getStockDetail = (stockId: number): TopStrategyStock | null => {
    return topStocks.value.find(stock => stock.id === stockId) || null
  }

  /**
   * 根据条件过滤股票
   */
  const filterStocks = (filters: {
    strategy?: string
    minReturn?: number
    maxReturn?: number
    minWinRate?: number
    maxWinRate?: number
    minProfitFactor?: number
    maxProfitFactor?: number
  }) => {
    return topStocks.value.filter(stock => {
      if (filters.strategy && stock.strategy_name !== filters.strategy) {
        return false
      }
      if (filters.minReturn !== undefined && stock.total_return < filters.minReturn) {
        return false
      }
      if (filters.maxReturn !== undefined && stock.total_return > filters.maxReturn) {
        return false
      }
      if (filters.minWinRate !== undefined && stock.win_rate < filters.minWinRate) {
        return false
      }
      if (filters.maxWinRate !== undefined && stock.win_rate > filters.maxWinRate) {
        return false
      }
      if (filters.minProfitFactor !== undefined && stock.profit_factor < filters.minProfitFactor) {
        return false
      }
      if (filters.maxProfitFactor !== undefined && stock.profit_factor > filters.maxProfitFactor) {
        return false
      }
      return true
    })
  }

  /**
   * 排序股票
   */
  const sortStocks = (stocks: TopStrategyStock[], sortBy: keyof TopStrategyStock, order: 'asc' | 'desc' = 'desc') => {
    return [...stocks].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      return 0
    })
  }

  // =============================================================================
  // 工具方法
  // =============================================================================

  /**
   * 获取收益率样式类
   */
  const getReturnClass = (value: number) => {
    if (value >= 0.1) return 'text-success'
    if (value >= 0.05) return 'text-warning'
    if (value >= 0) return 'text-info'
    return 'text-danger'
  }

  /**
   * 获取胜率样式类
   */
  const getWinRateClass = (value: number) => {
    if (value >= 0.7) return 'text-success'
    if (value >= 0.6) return 'text-warning'
    if (value >= 0.5) return 'text-info'
    return 'text-danger'
  }

  /**
   * 获取盈亏比样式类
   */
  const getProfitFactorClass = (value: number) => {
    if (value >= 2) return 'text-success'
    if (value >= 1.5) return 'text-warning'
    if (value >= 1) return 'text-info'
    return 'text-danger'
  }

  /**
   * 获取回撤样式类
   */
  const getDrawdownClass = (value: number) => {
    if (value <= -0.2) return 'text-danger'
    if (value <= -0.1) return 'text-warning'
    if (value <= -0.05) return 'text-info'
    return 'text-success'
  }

  /**
   * 获取夏普比率样式类
   */
  const getSharpeClass = (value: number) => {
    if (value >= 1.5) return 'text-success'
    if (value >= 1) return 'text-warning'
    if (value >= 0.5) return 'text-info'
    return 'text-danger'
  }

  /**
   * 格式化股票数据用于显示
   */
  const formatStockForDisplay = (stock: TopStrategyStock) => {
    return {
      ...stock,
      total_return_formatted: formatPercentage(stock.total_return),
      win_rate_formatted: formatPercentage(stock.win_rate),
      profit_factor_formatted: formatNumber(stock.profit_factor, 2),
      max_drawdown_formatted: formatPercentage(stock.max_drawdown),
      sharpe_ratio_formatted: formatNumber(stock.sharpe_ratio, 2),
      return_class: getReturnClass(stock.total_return),
      win_rate_class: getWinRateClass(stock.win_rate),
      profit_factor_class: getProfitFactorClass(stock.profit_factor),
      drawdown_class: getDrawdownClass(stock.max_drawdown),
      sharpe_class: getSharpeClass(stock.sharpe_ratio)
    }
  }

  // =============================================================================
  // 返回值
  // =============================================================================

  return {
    // 状态
    loading: readonly(loading),
    runningJob: readonly(runningJob),
    topStocks: readonly(topStocks),
    error: readonly(error),
    
    // 进度状态
    progress: readonly(progress),
    currentStep: readonly(currentStep),
    stepProgress: readonly(stepProgress),
    progressMessage: readonly(progressMessage),
    progressStatus: readonly(progressStatus),
    
    // 计算属性
    stats,
    stocksByStrategy,
    strategies,
    showProgress,
    
    // 方法
    loadData,
    refreshData,
    runBacktest,
    updateProgress,
    resetProgress,
    forceReset,
    checkJobStatus,
    saveJobStatus,
    clearJobStatus,
    getStockDetail,
    filterStocks,
    sortStocks,
    
    // 工具方法
    getReturnClass,
    getWinRateClass,
    getProfitFactorClass,
    getDrawdownClass,
    getSharpeClass,
    formatStockForDisplay
  }
} 