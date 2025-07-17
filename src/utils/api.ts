import service from './request'
import type {
  BacktestRequest,
  BacktestResult,
  Strategy,
  Stock,
  DailyData,
  PaginatedResponse,
  ApiResponse,
  SystemStats,
  BatchSignalsResponse,
  StockRecommendation,
  TopStrategyStock,
  StockQueryParams,
  BacktestHistoryParams,
  JobTrigger
} from '@/types/api'

/**
 * 启动一个新的回测任务
 * @param params 回测参数
 * @returns 包含 backtest_id 的对象
 */
export const runBacktest = (params: BacktestRequest): Promise<ApiResponse<{ backtest_id: number }>> => {
  return service.post('/backtests/', params)
}

/**
 * 获取回测结果
 * @param id 回测任务的ID
 * @returns 详细的回测结果数据
 */
export const getBacktestResult = (id: number): Promise<ApiResponse<BacktestResult>> => {
  return service.get(`/backtests/${id}`)
}

/**
 * 获取所有策略
 * @returns 策略列表
 */
export const getStrategies = (): Promise<ApiResponse<Strategy[]>> => {
  return service.get('/strategies/')
}

/**
 * 获取股票列表
 * @param params 查询参数
 * @returns 分页的股票列表数据
 */
export const getStocks = (params: StockQueryParams): Promise<ApiResponse<PaginatedResponse<Stock>>> => {
  const { query, stock_type, ...rest } = params
  const apiParams: StockQueryParams = { ...rest }
  if (query) {
    apiParams.keyword = query
  }
  // 默认只获取股票类型的数据
  apiParams.stock_type = stock_type || 'stock'

  return service.get('/stocks/', { params: apiParams })
}

/**
 * 获取指定股票的日线数据
 * @param code 股票代码
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @returns 股票日线数据列表
 */
export const getDailyData = (
  code: string,
  start_date: string,
  end_date: string
): Promise<ApiResponse<DailyData[]>> => {
  const params = { start_date, end_date }
  return service.get(`/stocks/${code}/daily`, { params })
}

/**
 * 获取策略详情
 * @param identifier 策略ID或标识符
 * @returns 策略详细信息
 */
export const getStrategyDetails = (identifier: string): Promise<ApiResponse<Strategy>> => {
  return service.get(`/strategies/${identifier}`)
}

// --- Scheduler API ---

/**
 * 修改任务的调度规则
 * @param jobId 任务ID
 * @param data 包含trigger的对象
 */
export const rescheduleJob = (
  jobId: string,
  data: { trigger: JobTrigger }
): Promise<ApiResponse<void>> => {
  return service.put(`/scheduler/jobs/${jobId}`, data)
}

/**
 * 删除一个定时任务
 * @param jobId 任务ID
 */
export const deleteJob = (jobId: string): Promise<ApiResponse<void>> => {
  return service.delete(`/scheduler/jobs/${jobId}`)
}

/**
 * 批量获取多只股票的策略信号
 * @param codes 股票代码数组
 * @returns 批量策略信号汇总
 */
export const getBatchSignals = (codes: string[]) => {
    const codesParam = codes.join(',');
    return service.get('/signals/batch', { params: { codes: codesParam } });
}

/**
 * 获取系统统计数据
 * @returns 系统统计信息
 */
export const getSystemStats = () => {
    return service.get('/stats/');
}

/**
 * 获取策略推荐股票
 * @returns 推荐的股票列表
 */
export const getRecommendations = () => {
    return service.get('/signals/recommendations');
}

/**
 * 获取潜力股多策略回测 Top 结果
 */
export const getTopBacktest = () => {
    return service.get('/backtests/top');
}

/**
 * 获取所有策略的Top股票，按策略分组
 */
export const getAllTopStrategyStocks = () => {
    return service.get('/top-strategy/');
}

/**
 * 获取指定策略的Top股票
 * @param strategyId 策略ID
 */
export const getStrategyTopStocks = (strategyId: number) => {
    return service.get(`/top-strategy/strategy/${strategyId}`);
}

/**
 * 获取最新的Top策略股票
 */
export const getLatestTopStocks = () => {
    return service.get('/top-strategy/latest');
}

/**
 * 获取Top策略股票的统计信息
 */
export const getTopStocksStats = () => {
    return service.get('/top-strategy/stats');
}

/**
 * 手动触发Top策略回测任务
 */
export const runTopStrategyBacktestJob = () => {
    return service.post('/jobs/run/top_strategy_backtest');
}

/**
 * 手动触发一个后台任务
 * @param jobName 任务名称
 * @returns 任务启动状态
 */
export const runJob = (jobName: string) => {
    return service.post(`/jobs/run/${jobName}`);
}

// --- Backtest History ---

/**
 * 获取回测历史列表
 * @param params 查询参数 { stock_code?: string; page?: number; size?: number }
 */
export const getBacktestHistory = (params: { stock_code?: string; page?: number; size?: number }) => {
    return service.get('/backtests/history', { params });
}

/**
 * 清除回测历史
 * @param stock_code 可选，指定股票代码只删除相关回测
 */
export const clearBacktestHistory = (stock_code?: string) => {
    return service.delete('/backtests/clear', { params: stock_code ? { stock_code } : {} });
} 