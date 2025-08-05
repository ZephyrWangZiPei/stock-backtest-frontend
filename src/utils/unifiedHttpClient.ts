import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// HTTP API配置
const API_CONFIG = {
  baseURL: 'http://127.0.0.1:5000',
  timeout: 60000, // 增加超时时间到60秒
  headers: {
    'Content-Type': 'application/json'
  }
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create(API_CONFIG)

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`HTTP API请求: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('HTTP API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`HTTP API响应: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('HTTP API响应错误:', error)
    
    // 处理连接中断错误
    if (error.code === 'ECONNABORTED' || error.message.includes('aborted')) {
      console.warn('连接被中断，可能是客户端主动关闭')
      return Promise.reject(error)
    }
    
    // 处理网络错误
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      ElMessage.error('网络连接失败，请检查网络状态')
      return Promise.reject(error)
    }
    
    // 显示错误消息
    const message = error.response?.data?.error || error.message || '请求失败'
    ElMessage.error(message)
    
    return Promise.reject(error)
  }
)

// 通用API方法
const api = {
  get: (url: string, params?: any) => apiClient.get(url, { params }),
  post: (url: string, data?: any) => apiClient.post(url, data),
  put: (url: string, data?: any) => apiClient.put(url, data),
  delete: (url: string) => apiClient.delete(url)
}

// 数据采集API
export const dataCollectionAPI = {
  // 获取服务状态
  getStatus: () => api.get('/api/v1/data-collection/status'),
  
  // 获取数据库统计信息
  getDatabaseStats: () => api.get('/api/v1/data-collection/database-stats'),
  
  // 获取运行中的任务
  getRunningTasks: () => api.get('/api/v1/data-collection/tasks'),
  
  // 获取任务详情
  getTaskStatus: (taskId: string) => api.get(`/api/v1/data-collection/tasks/${taskId}`),
  
  // 启动数据采集任务
  startCollection: (data: {
    data_source: string
    data_type: string
    stock_codes: string[]
    start_date: string
    end_date: string
    parameters?: any
  }) => api.post('/api/v1/data-collection/collect', data),
  
  // 计算股票评分
  calculateStockScores: () => api.post('/api/v1/data-collection/calculate-scores')
}

// AI分析API
export const aiAnalysisAPI = {
  // 获取服务状态
  getStatus: () => api.get('/api/v1/ai-analysis/status'),
  
  // 获取运行中的任务
  getRunningTasks: () => api.get('/api/v1/ai-analysis/tasks'),
  
  // 获取任务详情
  getTaskStatus: (taskId: string) => api.get(`/api/v1/ai-analysis/tasks/${taskId}`),
  
  // 启动AI分析任务
  startAnalysis: (data: {
    analysis_type: string
    stock_codes: string[]
    parameters?: any
  }) => api.post('/api/v1/ai-analysis/analyze', data)
}

// 新闻分析API
export const newsAnalysisAPI = {
  // 获取服务状态
  getStatus: () => api.get('/api/v1/news-analysis/status'),
  
  // 获取运行中的任务
  getRunningTasks: () => api.get('/api/v1/news-analysis/tasks'),
  
  // 获取任务详情
  getTaskStatus: (taskId: string) => api.get(`/api/v1/news-analysis/tasks/${taskId}`),
  
  // 启动新闻分析任务
  startAnalysis: (data: {
    analysis_type: string
    stock_codes: string[]
    parameters?: any
  }) => api.post('/api/v1/news-analysis/analyze', data)
}

// 回测API
export const backtestAPI = {
  // 获取可用策略
  getAvailableStrategies: () => api.get('/api/v1/backtest/strategies'),
  
  // 获取策略参数
  getStrategyParameters: (strategyId: string) => api.get(`/api/v1/backtest/strategies/${strategyId}/parameters`),
  
  // 获取可用股票
  getAvailableStocks: () => api.get('/api/v1/backtest/stocks'),
  
  // 获取股票日线数据
  getStockDailyData: (stockCode: string, startDate?: string, endDate?: string) => 
    api.get(`/api/v1/backtest/stocks/${stockCode}/daily`, { 
      params: { start_date: startDate, end_date: endDate } 
    }),
  
  // 开始回测
  startBacktest: (config: {
    strategy_id: string
    stock_code: string
    start_date: string
    end_date: string
    initial_capital: number
    parameters?: any
  }) => api.post('/api/v1/backtest/start', config),
  
  // 停止回测
  stopBacktest: (taskId: string) => api.post(`/api/v1/backtest/stop/${taskId}`),
  
  // 获取回测状态
  getBacktestStatus: (taskId: string) => api.get(`/api/v1/backtest/status/${taskId}`),
  
  // 获取回测结果
  getBacktestResult: (taskId: string) => api.get(`/api/v1/backtest/result/${taskId}`),
  
  // 获取运行中的任务
  getRunningTasks: () => api.get('/api/v1/backtest/running-tasks'),
  
  // 获取历史回测记录
  getBacktestHistory: (params?: {
    page?: number
    size?: number
    strategy_id?: string
    stock_code?: string
    start_date?: string
    end_date?: string
  }) => api.get('/api/v1/backtest/history', { params }),
  
  // 删除回测记录
  deleteBacktestResult: (resultId: string) => api.delete(`/api/v1/backtest/results/${resultId}`),
  
  // 导出回测结果
  exportBacktestResult: (resultId: string, format: 'json' | 'csv' | 'excel' = 'json') => 
    api.get(`/api/v1/backtest/results/${resultId}/export`, { 
      params: { format },
      responseType: 'blob'
    })
}

// 调度器API
export const schedulerAPI = {
  // 获取调度器状态
  getStatus: () => api.get('/api/v1/scheduler/status'),
  
  // 获取定时任务列表
  getScheduledJobs: () => api.get('/api/v1/scheduler/jobs'),
  
  // 创建定时任务
  createScheduledJob: (data: {
    name: string
    description?: string
    task_type: string
    execution_time: string
    frequency: string
    parameters?: any
  }) => api.post('/api/v1/scheduler/jobs', data),
  
  // 删除定时任务
  deleteScheduledJob: (jobId: string) => api.delete(`/api/v1/scheduler/jobs/${jobId}`),
  
  // 暂停定时任务
  pauseScheduledJob: (jobId: string) => api.post(`/api/v1/scheduler/jobs/${jobId}/pause`),
  
  // 恢复定时任务
  resumeScheduledJob: (jobId: string) => api.post(`/api/v1/scheduler/jobs/${jobId}/resume`)
}

// 股票筛选API
export const screeningAPI = {
  // 综合筛选
  comprehensiveFilter: (data: {
    min_score: number
    max_results: number
    config: any
  }) => api.post('/api/v1/screening/comprehensive', data),
  
  // 技术面筛选
  technicalFilter: (data: {
    min_score: number
    max_results: number
    config: any
  }) => api.post('/api/v1/screening/technical', data),
  
  // 基本面筛选
  fundamentalFilter: (data: {
    min_score: number
    max_results: number
    config: any
  }) => api.post('/api/v1/screening/fundamental', data),
  
  // 获取筛选配置
  getFilterConfig: () => api.get('/api/v1/screening/config'),
  
  // 获取可用股票列表
  getAvailableStocks: () => api.get('/api/v1/screening/stocks')
}

// 工作流API
export const workflowAPI = {
  // 执行工作流
  executeWorkflow: (workflowType: string, parameters: any) => 
    api.post('/api/v1/workflow/execute', { workflow_type: workflowType, parameters }),
  
  // 获取工作流状态
  getWorkflowStatus: (workflowId: string) => api.get(`/api/v1/workflow/status/${workflowId}`),
  
  // 获取可用工作流列表
  getAvailableWorkflows: () => api.get('/api/v1/workflow/list'),
  
  // 停止工作流
  stopWorkflow: (workflowId: string) => api.post(`/api/v1/workflow/stop/${workflowId}`)
}

// 统一API客户端
export const unifiedHttpClient = {
  // 基础方法
  get: api.get,
  post: api.post,
  put: api.put,
  delete: api.delete,
  
  // 服务API
  dataCollection: dataCollectionAPI,
  aiAnalysis: aiAnalysisAPI,
  newsAnalysis: newsAnalysisAPI,
  backtest: backtestAPI,
  scheduler: schedulerAPI,
  screening: screeningAPI,
  workflow: workflowAPI,
  
  // 工具方法
  setBaseURL: (url: string) => {
    apiClient.defaults.baseURL = url
  },
  
  setToken: (token: string) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  },
  
  removeToken: () => {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

export default unifiedHttpClient 
