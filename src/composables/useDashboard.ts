import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import unifiedHttpClient from '@/utils/unifiedHttpClient'

export const useDashboard = () => {
  const loading = ref(false)
  const recentTasks = ref<any[]>([])

  // 数据状态
  const dataStatus = reactive({
    // 基础统计
    totalStocks: '--',
    overallCompleteness: '--',

    // 日线数据
    dailyDataCoverage: '--',
    stocksWithDailyData: '--',
    lastDailyUpdate: '--',
    todayDailyCount: '--',

    // 资金流向数据
    fundFlowCoverage: '--',
    stocksWithFundFlow: '--',
    lastFundFlowUpdate: '--',
    todayFundFlowCount: '--',

    // 机构持股数据
    instituteHoldCoverage: '--',
    stocksWithInstituteHold: '--',
    lastInstituteHoldUpdate: '--',

    // 分析师评级数据
    analystRatingCoverage: '--',
    stocksWithAnalystRating: '--',
    lastAnalystRatingUpdate: '--',
    todayAnalystRatingCount: '--',

    // 股票评分数据
    scoreCoverage: '--',
    stocksWithScore: '--',
    lastScoreUpdate: '--',

    // 策略和回测数据
    totalStrategies: '--',
      // totalBacktests: '--', // 将在重构后重新启用
  // completedBacktests: '--', // 将在重构后重新启用
  // backtestCompletionRate: '--', // 将在重构后重新启用

    // 候选股票和策略股票
    totalCandidates: '--',
    totalStrategyStocks: '--',

    // 策略表现指标
    avgReturn: '--',
    avgSharpe: '--',
    avgWinRate: '--',
    avgMaxDrawdown: '--',
    avgProfitFactor: '--',

    // 今日更新状态
    todayUpdated: false
  })

  // 刷新数据状态
  const refreshDataStatus = async () => {
    try {
      const response = await unifiedHttpClient.dataCollection.getDatabaseStats()
      if (response.data) {
        const stats = response.data

        // 基础统计
        dataStatus.totalStocks = stats.total_stocks?.toString() || '0'
        dataStatus.overallCompleteness = stats.overall_completeness?.toString() || '0'

        // 日线数据
        dataStatus.dailyDataCoverage = stats.daily_data_coverage?.toString() || '0'
        dataStatus.stocksWithDailyData = stats.stocks_with_daily_data?.toString() || '0'
        dataStatus.lastDailyUpdate = stats.last_daily_update || '无数据'
        dataStatus.todayDailyCount = stats.today_daily_count?.toString() || '0'

        // 资金流向数据
        dataStatus.fundFlowCoverage = stats.fund_flow_coverage?.toString() || '0'
        dataStatus.stocksWithFundFlow = stats.stocks_with_fund_flow?.toString() || '0'
        dataStatus.lastFundFlowUpdate = stats.last_fund_flow_update || '无数据'
        dataStatus.todayFundFlowCount = stats.today_fund_flow_count?.toString() || '0'

        // 机构持股数据
        dataStatus.instituteHoldCoverage = stats.institute_hold_coverage?.toString() || '0'
        dataStatus.stocksWithInstituteHold = stats.stocks_with_institute_hold?.toString() || '0'
        dataStatus.lastInstituteHoldUpdate = stats.last_institute_hold_update || '无数据'

        // 分析师评级数据
        dataStatus.analystRatingCoverage = stats.analyst_rating_coverage?.toString() || '0'
        dataStatus.stocksWithAnalystRating = stats.stocks_with_analyst_rating?.toString() || '0'
        dataStatus.lastAnalystRatingUpdate = stats.last_analyst_rating_update || '无数据'
        dataStatus.todayAnalystRatingCount = stats.today_analyst_rating_count?.toString() || '0'

        // 股票评分数据
        dataStatus.scoreCoverage = stats.score_coverage?.toString() || '0'
        dataStatus.stocksWithScore = stats.stocks_with_score?.toString() || '0'
        dataStatus.lastScoreUpdate = stats.last_score_update || '无数据'

        // 策略数据
        dataStatus.totalStrategies = stats.total_strategies?.toString() || '0'
        // 回测数据将在重构后重新启用
        // dataStatus.totalBacktests = stats.total_backtests?.toString() || '0'
        // dataStatus.completedBacktests = stats.completed_backtests?.toString() || '0'
        // dataStatus.backtestCompletionRate = stats.backtest_completion_rate?.toString() || '0'

        // 候选股票和策略股票
        dataStatus.totalCandidates = stats.total_candidates?.toString() || '0'
        dataStatus.totalStrategyStocks = stats.total_strategy_stocks?.toString() || '0'

        // 策略表现指标
        dataStatus.avgReturn = stats.avg_return?.toString() || '0'
        dataStatus.avgSharpe = stats.avg_sharpe?.toString() || '0'
        dataStatus.avgWinRate = stats.avg_win_rate?.toString() || '0'
        dataStatus.avgMaxDrawdown = stats.avg_max_drawdown?.toString() || '0'
        dataStatus.avgProfitFactor = stats.avg_profit_factor?.toString() || '0'

        // 今日更新状态
        dataStatus.todayUpdated = stats.today_updated || false

        ElMessage.success('数据状态已刷新')
      }
    } catch (error) {
      console.error('获取数据库统计信息失败', error)
      ElMessage.error('刷新数据状态失败')
    }
  }

  // 刷新任务列表
  const refreshTasks = async () => {
    try {
      loading.value = true
      const response = await unifiedHttpClient.dataCollection.getRunningTasks()
      recentTasks.value = response.data || []
      ElMessage.success('任务列表已刷新')
    } catch (error) {
      console.error('获取任务列表失败:', error)
      ElMessage.error('刷新任务列表失败')
    } finally {
      loading.value = false
    }
  }

  // 处理任务更新
  const handleTaskUpdate = (data: any) => {
    console.log('🔔 收到任务更新事件:', data)

    const taskData = data.task || data

    // 更新任务列表中的任务状态
    const index = recentTasks.value.findIndex(task => task.id === taskData.id)
    if (index > -1) {
      recentTasks.value[index] = { ...recentTasks.value[index], ...taskData }
    } else {
      recentTasks.value.unshift(taskData)
    }
  }

  return {
    loading,
    recentTasks,
    dataStatus,
    refreshDataStatus,
    refreshTasks,
    handleTaskUpdate
  }
} 
