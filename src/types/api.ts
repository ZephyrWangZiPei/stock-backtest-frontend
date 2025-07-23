// API 响应类型定义

// 基础响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

// 股票相关类型
export interface Stock {
  id: number
  code: string
  name: string
  industry?: string
  market?: string
  list_date?: string
  created_at?: string
  updated_at?: string
}

export interface DailyData {
  id: number
  stock_id: number
  trade_date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
  adjustflag: string
  turn?: number
  tradestatus?: string
  pctChg?: number
  peTTM?: number
  pbMRQ?: number
  psTTM?: number
  pcfNcfTTM?: number
  isST?: string
}

// 策略相关类型
export interface Strategy {
  id: number
  name: string
  description?: string
  class_name: string
  identifier: string
  parameters?: Record<string, any>
  parameter_definitions?: StrategyParameter[]
  created_at?: string
  updated_at?: string
}

export interface StrategyParameter {
  name: string
  label: string
  type: 'number' | 'string' | 'boolean' | 'select'
  default: any
  description?: string
  options?: Array<{ label: string; value: any }>
  min?: number
  max?: number
  step?: number
}

// 回测相关类型
export interface BacktestRequest {
  strategy_id: number
  start_date: string
  end_date: string
  initial_capital: number
  stock_codes: string[]
  parameters?: Record<string, any>
}

export interface BacktestResult {
  id: number
  strategy_id: number
  strategy_name?: string
  start_date: string
  end_date: string
  initial_capital: number
  final_capital: number
  total_return: number
  annual_return: number
  max_drawdown: number
  sharpe_ratio: number
  win_rate: number
  total_trades: number
  profit_factor?: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  updated_at?: string
  error_message?: string
  selected_stocks?: Array<string | { code: string; name: string }>
  parameters_used?: string
  ai_analysis_report?: string
  portfolio_history?: Array<{ date: string; total: number }>
  trades?: BacktestTrade[]
}

export interface BacktestTrade {
  id: number
  backtest_result_id: number
  stock_code: string
  action: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  trade_date: string
  signal_type?: string
  created_at: string
}

// Top策略相关类型
export interface TopStrategyStock {
  id: number
  strategy_id: number
  strategy_name?: string
  stock_code: string
  stock_name: string
  win_rate: number
  total_return?: number
  annual_return?: number
  max_drawdown?: number
  sharpe_ratio?: number
  trade_count?: number
  win_rate_lb?: number
  expectancy?: number
  profit_factor?: number
  rank: number
  backtest_result_id?: number
  backtest_period_days?: number
  initial_capital?: number
  created_at?: string
  updated_at?: string
  // DeepSeek AI 分析字段
  potential_rating?: string
  confidence_score?: number
  recommendation_reason?: string
  buy_point?: string
  sell_point?: string
  risks?: string
}

// 系统统计类型
export interface SystemStats {
  totalStocks: number
  totalBacktests: number
  totalStrategies: number
  lastUpdateTime?: string
}

// 信号相关类型
export interface TradingSignal {
  stock_code: string
  stock_name: string
  strategy_name: string
  signal_type: 'buy' | 'sell' | 'hold'
  signal_strength: number
  price: number
  date: string
  description?: string
}

export interface BatchSignalsResponse {
  signals: TradingSignal[]
  total_count: number
  generated_at: string
}

// 推荐相关类型
export interface StockRecommendation {
  stock_code: string
  stock_name: string
  recommendation_score: number
  reasons: string[]
  risk_level: 'low' | 'medium' | 'high'
  target_price?: number
  stop_loss?: number
  generated_at: string
}

// 调度器相关类型
export interface SchedulerJob {
  id: string
  name: string
  next_run_time?: string
  trigger: string
  status?: 'running' | 'paused' | 'stopped'
}

export interface SchedulerStatus {
  is_running: boolean
  jobs_count: number
  jobs: SchedulerJob[]
  current_time: string
}

export interface TaskStatus {
  progress?: number
  current_date_progress: number
  current_stock_progress?: number
  current_date_progress_detail?: number
  message: string
  success?: boolean
  data?: any
  // 重构版智能更新新增字段
  scan_progress?: number
  update_progress?: number
  phase?: 'scanning' | 'updating' | 'complete' | 'error'
  current_stock?: string
  completed_scans?: number
  total_stocks?: number
  missing_dates_count?: number
  batch_progress?: number
  current_batch?: number
  total_batches?: number
}

// 任务相关类型
export interface JobTrigger {
  hour?: number
  minute?: number
  second?: number
  day?: number
  month?: number
  day_of_week?: number
  timezone?: string
}

// WebSocket 事件类型
export interface WebSocketEvent<T = any> {
  event: string
  data: T
  timestamp?: string
}

// 错误类型
export interface ApiError {
  code?: string | number
  message: string
  details?: any
  timestamp?: string
}

// 查询参数类型
export interface StockQueryParams {
  page?: number
  per_page?: number
  query?: string
  keyword?: string
  stock_type?: string
  start_date?: string
  end_date?: string
}

export interface BacktestHistoryParams {
  stock_code?: string
  page?: number
  size?: number
  strategy_id?: number
  status?: string
}

// 图表数据类型
export interface ChartDataPoint {
  time: string | number
  value: number
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[]
  type?: 'line' | 'candlestick' | 'area' | 'histogram'
  color?: string
}

// AI分析相关类型
export interface AIAnalysisRequest {
  stock_code: string
  analysis_type?: 'fundamental' | 'technical' | 'comprehensive'
  time_range?: string
}

export interface AIAnalysisResult {
  stock_code: string
  analysis_type: string
  summary: string
  score: number
  recommendations: string[]
  risks: string[]
  confidence: number
  generated_at: string
}
