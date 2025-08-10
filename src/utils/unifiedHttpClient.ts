import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// API响应类型
export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data: T
  error?: string
}

// 数据采集相关类型
export interface DatabaseStats {
  total_stocks: number
  stocks_with_daily_data: number
  daily_data_completeness: number
  last_daily_update: string
  stocks_with_fund_flow: number
  fund_flow_coverage: number
  last_fund_flow_update: string
  stocks_with_institute_hold: number
  institute_hold_coverage: number
  last_institute_hold_update: string
  stocks_with_analyst_rating: number
  analyst_rating_coverage: number
  last_analyst_rating_update: string
  total_stock_scores: number
  total_strategies: number
  total_backtest_results: number
  total_candidate_stocks: number
  total_top_strategy_stocks: number
  // 兼容后端新增字段（全部可选）
  overall_completeness?: number
  daily_data_coverage?: number
  today_daily_count?: number
  today_fund_flow_count?: number
  today_analyst_rating_count?: number
  score_coverage?: number
  stocks_with_score?: number
  last_score_update?: string
  technical_indicators_coverage?: number
  stocks_with_technical_indicators?: number
  total_backtests?: number
  completed_backtests?: number
  backtest_completion_rate?: number
  today_updated?: boolean
}

export interface DataCollectionTask {
  id: string
  data_source: string
  data_type: string
  stock_codes?: string[]
  start_date?: string
  end_date?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  message?: string
  start_time?: string
  end_time?: string
  result?: any
  error_message?: string
  // 详细进度信息
  current_count?: number
  total_count?: number
  success_count?: number
  error_count?: number
}

export interface RunningTask {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  message?: string
  start_time?: string
  end_time?: string
  result?: any
  error_message?: string
  // 详细进度信息
  current_count?: number
  total_count?: number
  success_count?: number
  error_count?: number
}

// 股票筛选相关类型
export interface ScreeningCondition {
  field: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne' | 'in' | 'between'
  value: any
  label?: string
}

export interface ScreeningRequest {
  conditions: ScreeningCondition[]
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ScreeningResult {
  stock_code: string
  stock_name: string
  price: number
  change_pct: number
  volume: number
  market_cap?: number
  pe?: number
  pb?: number
  roe?: number
  [key: string]: any
}

// 回测相关类型
export interface BacktestConfig {
  strategy_id: number
  stock_codes: string[]
  start_date: string
  end_date: string
  initial_capital: number
  parameters?: Record<string, any>
}

export interface BacktestResult {
  id: string
  strategy_name: string
  total_return: number
  annual_return: number
  max_drawdown: number
  sharpe_ratio: number
  win_rate: number
  total_trades: number
  start_date: string
  end_date: string
  initial_capital: number
  final_capital: number
  status: string
  created_at: string
  [key: string]: any
}

// AI分析相关类型
export interface AIAnalysisRequest {
  analysis_type: string
  stock_codes: string[]
  parameters?: Record<string, any>
}

export interface AIAnalysisResult {
  id: string
  analysis_type: string
  status: string
  progress: number
  result?: any
  message?: string
  start_time?: string
  end_time?: string
  error_message?: string
}

// 候选池相关类型
export interface CandidateStock {
  id?: number
  stock_code: string
  stock_name: string
  price: number
  change_pct: number
  volume: number
  pe?: number
  pb?: number
  roe?: number
  score: number
  recommendation: string
  added_date: string
  notes?: string
  [key: string]: any
}

// 调度任务相关类型
export interface ScheduledJob {
  id: string
  name: string
  job_type: string
  enabled: boolean
  cron_expression: string
  parameters?: Record<string, any>
  next_run_time?: string
  last_run_time?: string
  status: string
  description?: string
}

class UnifiedHttpClient {
  private instance: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
    
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data)
        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
        return response
      },
      (error) => {
        console.error('❌ Response Error:', error)
        
        if (error.response) {
          const { status, data } = error.response
          let message = data?.message || data?.error || '请求失败'
          
          switch (status) {
            case 400:
              message = `请求参数错误: ${message}`
              break
            case 401:
              message = '未授权访问'
              break
            case 403:
              message = '访问被拒绝'
              break
            case 404:
              message = '接口不存在'
              break
            case 500:
              message = `服务器内部错误: ${message}`
              break
            default:
              message = `请求失败 (${status}): ${message}`
          }
          
          ElMessage.error(message)
        } else if (error.request) {
          ElMessage.error('网络连接失败，请检查网络设置')
        } else {
          ElMessage.error('请求配置错误')
        }
        
        return Promise.reject(error)
      }
    )
  }

  // 健康检查
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.instance.get('/health')
    return response.data
  }

  // 数据采集模块API
  dataCollection = {
    // 获取数据采集状态
    getStatus: (): Promise<ApiResponse<RunningTask>> =>
      this.instance.get('/data-collection/status'),

    // 获取数据库统计信息
    getDatabaseStats: (): Promise<ApiResponse<DatabaseStats>> =>
      this.instance.get('/data-collection/database-stats'),

    // 获取运行中的任务
    getRunningTasks: (): Promise<ApiResponse<RunningTask[]>> =>
      this.instance.get('/data-collection/tasks'),

    // 启动数据采集任务
    startCollection: (params: {
      data_source: string
      data_type: string
      stock_codes?: string[]
      start_date?: string
      end_date?: string
    }): Promise<ApiResponse<DataCollectionTask>> =>
      this.instance.post('/data-collection/start', params),

    // 停止数据采集任务
    stopCollection: (taskId: string): Promise<ApiResponse> =>
      this.instance.post(`/data-collection/stop/${taskId}`),

    // 获取任务详情
    getTaskDetail: (taskId: string): Promise<ApiResponse<DataCollectionTask>> =>
      this.instance.get(`/data-collection/task/${taskId}`),

    // 计算股票评分
    calculateScores: (): Promise<ApiResponse> =>
      this.instance.post('/data-collection/calculate-scores'),

    // 获取数据采集历史
    getHistory: (params?: {
      page?: number
      limit?: number
      status?: string
    }): Promise<ApiResponse<{ tasks: DataCollectionTask[], total: number }>> =>
      this.instance.get('/data-collection/history', { params }),

    // 获取股票列表
    getStocksList: (params?: {
      limit?: number
      search?: string
    }): Promise<ApiResponse<{ stock_list: any[], total: number }>> =>
      this.instance.get('/data-collection/stocks', { params })
  }

  // 股票筛选模块API
  screening = {
    // 技术指标筛选
    technicalScreening: (request: ScreeningRequest): Promise<ApiResponse<{
      results: ScreeningResult[]
      total: number
      summary: Record<string, any>
    }>> =>
      this.instance.post('/screening/technical', request),

    // 基本面筛选
    fundamentalScreening: (request: ScreeningRequest): Promise<ApiResponse<{
      results: ScreeningResult[]
      total: number
      summary: Record<string, any>
    }>> =>
      this.instance.post('/screening/fundamental', request),

    // 综合筛选
    comprehensiveScreening: (request: ScreeningRequest): Promise<ApiResponse<{
      results: ScreeningResult[]
      total: number
      summary: Record<string, any>
    }>> =>
      this.instance.post('/screening/comprehensive', request),

    // 获取筛选模板
    getTemplates: (): Promise<ApiResponse<any[]>> =>
      this.instance.get('/screening/templates'),

    // 保存筛选模板
    saveTemplate: (template: {
      name: string
      description?: string
      conditions: ScreeningCondition[]
    }): Promise<ApiResponse> =>
      this.instance.post('/screening/templates', template),

    // 删除筛选模板
    deleteTemplate: (templateId: string): Promise<ApiResponse> =>
      this.instance.delete(`/screening/templates/${templateId}`),

    // 获取可用股票列表
    getAvailableStocks: (): Promise<ApiResponse<{ data: any[] }>> =>
      this.instance.get('/screening/stocks')
  }

  // 回测中心模块API
  backtest = {
    // 获取回测状态
    getStatus: (): Promise<ApiResponse> =>
      this.instance.get('/backtest/status'),

    // 启动回测
    startBacktest: (config: BacktestConfig): Promise<ApiResponse<{ task_id: string }>> =>
      this.instance.post('/backtest/start', config),

    // 停止回测
    stopBacktest: (taskId: string): Promise<ApiResponse> =>
      this.instance.post(`/backtest/stop/${taskId}`),

    // 获取回测结果
    getResults: (params?: {
      page?: number
      limit?: number
      strategy_id?: number
    }): Promise<ApiResponse<{ results: BacktestResult[], total: number }>> =>
      this.instance.get('/backtest/results', { params }),

    // 获取回测详情
    getResult: (resultId: string): Promise<ApiResponse<BacktestResult>> =>
      this.instance.get(`/backtest/results/${resultId}`),

    // 删除回测结果
    deleteResult: (resultId: string): Promise<ApiResponse> =>
      this.instance.delete(`/backtest/results/${resultId}`),

    // 获取策略列表
    getStrategies: (): Promise<ApiResponse<any[]>> =>
      this.instance.get('/backtest/strategies'),

    // 获取运行中的回测任务
    getRunningTasks: (): Promise<ApiResponse<any[]>> =>
      this.instance.get('/backtest/running-tasks')
  }

  // AI分析模块API
  aiAnalysis = {
    // 获取AI分析状态
    getStatus: (): Promise<ApiResponse> =>
      this.instance.get('/ai-analysis/status'),

    // 启动AI分析
    startAnalysis: (request: AIAnalysisRequest): Promise<ApiResponse<{ task_id: string }>> =>
      this.instance.post('/ai-analysis/start', request),

    // 停止AI分析
    stopAnalysis: (taskId: string): Promise<ApiResponse> =>
      this.instance.post(`/ai-analysis/stop/${taskId}`),

    // 获取分析结果
    getResults: (params?: {
      page?: number
      limit?: number
      analysis_type?: string
    }): Promise<ApiResponse<{ results: AIAnalysisResult[], total: number }>> =>
      this.instance.get('/ai-analysis/results', { params }),

    // 获取分析详情
    getResult: (resultId: string): Promise<ApiResponse<AIAnalysisResult>> =>
      this.instance.get(`/ai-analysis/results/${resultId}`),

    // 获取运行中的分析任务
    getRunningTasks: (): Promise<ApiResponse<AIAnalysisResult[]>> =>
      this.instance.get('/ai-analysis/tasks'),

    // 获取分析类型
    getAnalysisTypes: (): Promise<ApiResponse<string[]>> =>
      this.instance.get('/ai-analysis/types')
  }

  // 候选池管理模块API
  candidates = {
    // 获取候选股票列表
    getCandidates: (params?: {
      page?: number
      limit?: number
      sort_by?: string
      sort_order?: 'asc' | 'desc'
      filters?: Record<string, any>
    }): Promise<ApiResponse<{ candidates: CandidateStock[], total: number }>> =>
      this.instance.get('/data-collection/candidate-stocks', { params }),

    // 添加候选股票
    addCandidate: (candidate: Partial<CandidateStock>): Promise<ApiResponse<CandidateStock>> =>
      this.instance.post('/candidates', candidate),

    // 更新候选股票
    updateCandidate: (id: number, candidate: Partial<CandidateStock>): Promise<ApiResponse<CandidateStock>> =>
      this.instance.put(`/candidates/${id}`, candidate),

    // 删除候选股票
    deleteCandidate: (id: number): Promise<ApiResponse> =>
      this.instance.delete(`/candidates/${id}`),

    // 批量操作
    batchOperation: (operation: 'delete' | 'update', ids: number[], data?: any): Promise<ApiResponse> =>
      this.instance.post('/candidates/batch', { operation, ids, data }),

    // 获取候选股票统计
    getStats: (): Promise<ApiResponse<Record<string, any>>> =>
      this.instance.get('/data-collection/candidate-stats'),

    // 刷新候选股票数据
    refreshData: (ids?: number[]): Promise<ApiResponse> =>
      this.instance.post('/candidates/refresh', { ids }),

    // 导出候选股票
    exportCandidates: (format: 'csv' | 'excel' = 'csv'): Promise<Blob> =>
      this.instance.get(`/candidates/export?format=${format}`, { responseType: 'blob' }).then(res => res.data)
  }

  // 调度器模块API
  scheduler = {
    // 获取调度器状态
    getStatus: (): Promise<ApiResponse> =>
      this.instance.get('/scheduler/status'),

    // 获取定时任务列表
    getScheduledJobs: (): Promise<ApiResponse<ScheduledJob[]>> =>
      this.instance.get('/scheduler/jobs'),

    // 创建定时任务
    createScheduledJob: (job: Partial<ScheduledJob>): Promise<ApiResponse<ScheduledJob>> =>
      this.instance.post('/scheduler/jobs', job),

    // 更新定时任务
    updateScheduledJob: (jobId: string, job: Partial<ScheduledJob>): Promise<ApiResponse<ScheduledJob>> =>
      this.instance.put(`/scheduler/jobs/${jobId}`, job),

    // 删除定时任务
    deleteScheduledJob: (jobId: string): Promise<ApiResponse> =>
      this.instance.delete(`/scheduler/jobs/${jobId}`),

    // 启用/禁用定时任务
    toggleScheduledJob: (jobId: string, enabled: boolean): Promise<ApiResponse> =>
      this.instance.patch(`/scheduler/jobs/${jobId}/toggle`, { enabled }),

    // 立即执行定时任务
    executeJob: (jobId: string): Promise<ApiResponse> =>
      this.instance.post(`/scheduler/jobs/${jobId}/execute`),

    // 获取任务执行历史
    getJobHistory: (jobId: string, params?: {
      page?: number
      limit?: number
    }): Promise<ApiResponse<any[]>> =>
      this.instance.get(`/scheduler/jobs/${jobId}/history`, { params })
  }

  // 新闻分析模块API
  newsAnalysis = {
    // 获取新闻分析状态
    getStatus: (): Promise<ApiResponse> =>
      this.instance.get('/news-analysis/status'),

    // 获取新闻列表
    getNews: (params?: {
      page?: number
      limit?: number
      category?: string
      sentiment?: string
      keywords?: string
      start_date?: string
      end_date?: string
    }): Promise<ApiResponse<{ news: any[], total: number }>> =>
      this.instance.get('/news-analysis/news', { params }),

    // 启动新闻分析
    startAnalysis: (params: {
      keywords?: string[]
      sources?: string[]
      start_date?: string
      end_date?: string
    }): Promise<ApiResponse<{ task_id: string }>> =>
      this.instance.post('/news-analysis/start', params),

    // 获取分析结果
    getAnalysisResults: (params?: {
      page?: number
      limit?: number
    }): Promise<ApiResponse<{ results: any[], total: number }>> =>
      this.instance.get('/news-analysis/results', { params }),

    // 导出新闻数据
    exportNews: (format: 'csv' | 'excel' = 'csv'): Promise<Blob> =>
      this.instance.get(`/news-analysis/export?format=${format}`, { responseType: 'blob' }).then(res => res.data)
  }

  // 工作流模块API
  workflow = {
    // 执行工作流
    executeWorkflow: (params: {
      workflow_type: string
      parameters?: Record<string, any>
    }): Promise<ApiResponse<{ workflow_id: string }>> =>
      this.instance.post('/workflow/execute', params),

    // 获取工作流状态
    getWorkflowStatus: (workflowId: string): Promise<ApiResponse> =>
      this.instance.get(`/workflow/status/${workflowId}`),

    // 停止工作流
    stopWorkflow: (workflowId: string): Promise<ApiResponse> =>
      this.instance.post(`/workflow/stop/${workflowId}`),

    // 获取工作流列表
    getWorkflows: (): Promise<ApiResponse<any[]>> =>
      this.instance.get('/workflow/list')
  }
}

// 创建并导出单例实例
const unifiedHttpClient = new UnifiedHttpClient()

export default unifiedHttpClient 
