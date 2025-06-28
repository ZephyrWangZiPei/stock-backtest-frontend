import service from './request';

// 定义回测请求的数据结构
export interface BacktestRequest {
  strategy_id: number;
  start_date: string;
  end_date: string;
  initial_capital: number;
  stock_codes: string[];
  parameters?: Record<string, any>; // 添加可选的参数字段
}

/**
 * 启动一个新的回测任务
 * @param params 回测参数
 * @returns 包含 backtest_id 的对象
 */
export const runBacktest = (params: BacktestRequest) => {
  // 注意：baseURL已在request.ts中设置为 /api
  return service.post('/backtests/', params);
};

/**
 * 获取回测结果
 * @param id 回测任务的ID
 * @returns 详细的回测结果数据
 */
export const getBacktestResult = (id: number) => {
    return service.get(`/backtests/${id}`);
};

/**
 * 获取所有策略
 * @returns 策略列表
 */
export const getStrategies = () => {
    return service.get('/strategies/');
}

/**
 * 获取股票列表
 * @param params 查询参数 { page, per_page, query }
 * @returns 分页的股票列表数据
 */
export const getStocks = (params: { page?: number; per_page?: number; query?: string }) => {
    const { query, ...rest } = params;
    const apiParams: { page?: number; per_page?: number; keyword?: string } = { ...rest };
    if (query) {
        apiParams.keyword = query;
    }
    return service.get('/stocks/', { params: apiParams });
}

/**
 * 获取指定股票的日线数据
 * @param code 股票代码
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @returns 股票日线数据列表
 */
export const getDailyData = (code: string, start_date: string, end_date: string) => {
    const params = { start_date, end_date };
    // GET请求的参数应该放在params字段中
    return service.get(`/stocks/${code}/daily`, { params });
}

export async function getStrategyDetails(identifier: string) {
    return await service.get(`/strategies/${identifier}`);
}

// --- Scheduler API ---

/**
 * 修改任务的调度规则
 * @param jobId 任务ID
 * @param data 包含trigger的对象, e.g., { trigger: { hour: 1, minute: 30 } }
 */
export const rescheduleJob = (jobId: string, data: { trigger: Record<string, any> }) => {
    return service.put(`/scheduler/jobs/${jobId}`, data);
};

/**
 * 删除一个定时任务
 * @param jobId 任务ID
 */
export const deleteJob = (jobId: string) => {
    return service.delete(`/scheduler/jobs/${jobId}`);
};

/**
 * 获取指定股票的实时数据
 * @param code 股票代码
 * @returns 实时股价数据
 */
export const getRealtimeData = (code: string) => {
    return service.get(`/realtime/${code}`);
}

/**
 * 批量获取多只股票的实时数据
 * @param codes 股票代码数组
 * @returns 批量实时股价数据
 */
export const getBatchRealtimeData = (codes: string[]) => {
    const codesParam = codes.join(',');
    return service.get('/realtime/batch', { params: { codes: codesParam } });
}

/**
 * 获取市场概况数据
 * @returns 主要指数的实时数据
 */
export const getMarketSummary = () => {
    return service.get('/realtime/market/summary');
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
 * 手动触发一个后台任务
 * @param jobName 任务名称
 * @returns 任务启动状态
 */
export const runJob = (jobName: string) => {
    return service.post(`/jobs/run/${jobName}`);
} 