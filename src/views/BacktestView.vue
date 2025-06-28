<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">策略回测</h1>
    <el-row :gutter="24">
      <!-- Left Panel: Configuration -->
      <el-col :span="10">
        <el-card shadow="never" class="border border-gray-700/50 h-full">
          <template #header>
            <div class="font-bold text-lg">回测设置</div>
          </template>
          <el-form :model="form" label-position="top">
              <el-form-item label="选择策略">
                <el-select v-model="form.strategy_id" placeholder="请选择策略" @change="onStrategyChange" class="w-full">
                  <el-option
                    v-for="item in strategyOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <template #label>
                  <span>初始资金</span>
                  <el-tooltip content="回测开始时使用的虚拟资金总额" placement="top">
                    <el-icon class="ml-1 align-middle"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input-number v-model="form.initial_capital" :min="1000" :step="1000" class="w-full" />
              </el-form-item>
            
            <el-alert v-if="strategyDescription" :title="strategyDescription" type="info" :closable="false" class="mb-5" />

            <!-- 动态参数表单 -->
            <div v-if="parameterDefinitions.length > 0" class="pt-5 mt-5 border-t border-gray-600/50">
                <h3 class="text-base font-medium mb-4">策略参数</h3>
                <el-row :gutter="20">
                    <el-col :span="12" v-for="param in parameterDefinitions" :key="param.name">
                        <el-form-item :label="param.label">
                             <template #label>
                                <span>{{ param.label }}</span>
                                <el-tooltip :content="param.description" placement="top" v-if="param.description">
                                    <el-icon class="ml-1 align-middle"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input-number v-if="param.type === 'number'" v-model="formParameters[param.name]" class="w-full" />
                            <el-input v-else v-model="formParameters[param.name]" class="w-full" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </div>

            <el-form-item class="mt-5">
                <template #label>
                    <span>回测日期</span>
                    <el-tooltip content="回测模拟交易的时间区间" placement="top">
                        <el-icon class="ml-1 align-middle"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </template>
                <el-date-picker
                    v-model="form.date_range"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    class="w-full"
                />
            </el-form-item>

            <el-form-item>
                <template #label>
                    <span>选择股票</span>
                    <el-tooltip content="选择一只或多只股票进行回测" placement="top">
                        <el-icon class="ml-1 align-middle"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </template>
               <el-select
                 v-model="form.stock_codes"
                 multiple
                 filterable
                 remote
                 reserve-keyword
                 placeholder="输入股票代码或名称搜索"
                 :remote-method="searchStocks"
                 :loading="stockSearchLoading"
                 class="w-full"
               >
                 <el-option
                   v-for="item in stockOptions"
                   :key="item.code"
                   :label="`${item.name} (${item.code})`"
                   :value="item.code"
                 />
               </el-select>
            </el-form-item>

            <el-form-item class="mt-4">
              <el-button type="primary" @click="onSubmit" :loading="loading" class="w-full" size="large">开始回测</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <!-- Right Panel: Results -->
      <el-col :span="14">
        <el-card v-if="backtestResult" class="h-full">
            <template #header>
              <div class="flex justify-between items-center">
                <span class="font-bold text-lg">回测结果 (ID: {{ backtestResult.id }})</span>
              </div>
            </template>

            <div v-if="backtestResult.status === 'running'">
                <div class="flex flex-col items-center justify-center p-10">
                  <el-progress type="circle" :percentage="pollProgress" class="mb-4" />
                  <p class="text-gray-400">正在努力回测中，请稍候...</p>
                </div>
            </div>
            <div v-else-if="backtestResult.status === 'completed' && backtestResult.data">
                
                <div class="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center p-4 rounded-lg bg-white/5 dark:bg-black/10">
                  <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">初始资产</div>
                    <div class="text-xl font-semibold">{{ new Intl.NumberFormat('en-US').format(backtestResult.data.initial_capital) }}</div>
                  </div>
                  <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">最终资产</div>
                    <div class="text-xl font-semibold">{{ new Intl.NumberFormat('en-US').format(backtestResult.data.final_capital) }}</div>
                  </div>
                  <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">总回报率</div>
                    <div :class="['text-xl font-semibold', performanceMetrics.totalReturn >= 0 ? 'text-red-500' : 'text-green-500']">
                      {{ (performanceMetrics.totalReturn * 100).toFixed(2) }}%
                    </div>
                  </div>
                  <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">年化回报率</div>
                    <div :class="['text-xl font-semibold', performanceMetrics.annualReturn >= 0 ? 'text-red-500' : 'text-green-500']">
                      {{ (performanceMetrics.annualReturn * 100).toFixed(2) }}%
                    </div>
                  </div>
                  <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">最大回撤</div>
                    <div class="text-xl font-semibold text-green-500">
                      {{ (performanceMetrics.maxDrawdown * 100).toFixed(2) }}%
                    </div>
                  </div>
                  <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                      <div class="text-sm text-gray-400 mb-2">夏普比率</div>
                      <div class="text-xl font-semibold">{{ performanceMetrics.sharpeRatio.toFixed(2) }}</div>
                  </div>
                  <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">总交易次数</div>
                    <div class="text-xl font-semibold">{{ performanceMetrics.totalTrades }}</div>
                  </div>
                   <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">胜率</div>
                    <div class="text-xl font-semibold">
                      {{ (performanceMetrics.winRate * 100).toFixed(2) }}%
                    </div>
                  </div>
                   <div class="kpi-item p-4 rounded-lg transition-colors hover:bg-white/10">
                    <div class="text-sm text-gray-400 mb-2">盈亏比</div>
                    <div class="text-xl font-semibold">{{ performanceMetrics.profitFactor.toFixed(2) }}</div>
                  </div>
                </div>

                <!-- 股票切换选择器 -->
                <el-form-item v-if="form.stock_codes.length > 1" label="查看图表" class="mt-6">
                  <el-select v-model="chartStock" placeholder="请选择要查看的股票K线">
                    <el-option v-for="code in form.stock_codes" :key="code" :label="getStockName(code)" :value="code" />
                  </el-select>
                </el-form-item>

                <el-tabs v-model="activeTab" class="mt-6">
                  <el-tab-pane label="业绩图表" name="chart">
                    <div ref="chartRef" style="width: 100%; height: 500px;" class="mt-5"></div>
                  </el-tab-pane>
                  <el-tab-pane label="交易日志" name="trades">
                    <el-table :data="filteredTrades" stripe style="width: 100%">
                      <el-table-column prop="trade_date" label="交易日期" width="180" />
                      <el-table-column prop="stock_code" label="股票代码" width="120" />
                      <el-table-column prop="trade_type" label="操作" width="100">
                         <template #default="scope">
                            <el-tag :type="scope.row.trade_type === 'buy' ? 'success' : 'danger'" effect="dark" class="!font-bold">
                              {{ scope.row.trade_type.toUpperCase() }}
                            </el-tag>
                          </template>
                      </el-table-column>
                      <el-table-column prop="price" label="成交价" />
                      <el-table-column prop="quantity" label="股数" />
                    </el-table>
                  </el-tab-pane>
                </el-tabs>
            </div>
            <div v-else>
               <el-alert type="error" :closable="false">
                 获取结果失败或任务超时。请检查后台日志。
               </el-alert>
            </div>
        </el-card>
        <el-card v-else class="border border-gray-700/50 h-full flex items-center justify-center">
          <el-empty description="运行回测后在此处查看结果" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import { runBacktest, getStrategies, getStocks, getBacktestResult, getDailyData, getStrategyDetails } from '@/utils/api'
import { ElMessage, ElEmpty } from 'element-plus'
import { createChart, IChartApi, ISeriesApi, CrosshairMode } from 'lightweight-charts';
import { QuestionFilled } from '@element-plus/icons-vue'

interface Strategy {
  id: number;
  name: string;
  identifier: string;
}
interface Stock {
    code: string;
    name: string;
}

interface ParameterDefinition {
    name: string;
    label: string;
    type: string;
    default: any;
    description?: string;
}

const form = reactive({
  strategy_id: null as number | null,
  initial_capital: 100000,
  date_range: [new Date(new Date().setFullYear(new Date().getFullYear() - 1)), new Date()],
  stock_codes: [] as string[],
})

const parameterDefinitions = ref<ParameterDefinition[]>([]);
const formParameters = reactive<Record<string, any>>({});
const strategyDescription = ref('');

const backtestResult = ref<{id: number, status: string, data?: any} | null>(null);
const loading = ref(false);
const pollProgress = ref(0);
const chartStock = ref<string | null>(null);
const activeTab = ref('chart');
const strategyOptions = ref<Strategy[]>([]);
const stockOptions = ref<Stock[]>([]);
const stockSearchLoading = ref(false);
const chartRef = ref<HTMLElement | null>(null);
let chart: IChartApi | null = null;
let candlestickSeries: ISeriesApi<'Candlestick'> | null = null;
let searchTimeout: number | null = null;

const performanceMetrics = computed(() => {
  if (!backtestResult.value || !backtestResult.value.data) {
    return {
      totalReturn: 0,
      annualReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0, // 暂时保留，或设为 N/A
    };
  }

  const data = backtestResult.value.data;

  // 盈亏比仍在前端计算，因为它可能为无穷大，不适合在数据库中存储
  let totalProfit = 0.0;
  let totalLoss = 0.0;
  const buyMap = new Map<string, { price: number; quantity: number }[]>();

  for (const trade of data.trades || []) {
    if (trade.trade_type === 'buy') {
      if (!buyMap.has(trade.stock_code)) {
        buyMap.set(trade.stock_code, []);
      }
      buyMap.get(trade.stock_code)!.push({ price: trade.price, quantity: trade.quantity });
    } else { // sell
      const buyInfo = buyMap.get(trade.stock_code)?.shift(); // FIFO
      if (buyInfo) {
        const profit = (trade.price - buyInfo.price) * buyInfo.quantity;
        if (profit > 0) {
          totalProfit += profit;
        } else {
          totalLoss += Math.abs(profit);
        }
      }
    }
  }
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : Infinity;

  return {
    // 直接从后端获取的指标
    totalReturn: data.total_return || 0,
    annualReturn: data.annual_return || 0,
    maxDrawdown: data.max_drawdown || 0,
    sharpeRatio: data.sharpe_ratio || 0,
    totalTrades: data.total_trades || 0,
    winRate: data.win_rate || 0,
    
    // 仍在前端计算的指标
    profitFactor,
  };
});

const filteredTrades = computed(() => {
  const trades = backtestResult.value?.data?.trades;
  if (!trades) {
    return [];
  }

  // For multi-stock backtests, filter by the selected stock.
  if (form.stock_codes.length > 1 && chartStock.value) {
    return trades.filter((trade: any) => trade.stock_code === chartStock.value);
  }

  // For single-stock backtests, show all trades.
  return trades;
});

const getStockName = (code: string) => {
    const stock = stockOptions.value.find(s => s.code === code);
    return stock ? `${stock.name} (${stock.code})` : code;
};

onMounted(async () => {
  try {
    const response = await getStrategies();
    const strategies = response.data || []; // 新结构: response.data 是策略数组
    if (strategies.length > 0) {
      strategyOptions.value = strategies;
      form.strategy_id = strategies[0].id; // 默认选中第一个
      await onStrategyChange(form.strategy_id); // 主动加载第一个策略的参数
    }
  } catch (error) {
    ElMessage.error('获取策略列表失败');
    console.error(error);
  }
});

const searchStocks = (query: string) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (query) {
    stockSearchLoading.value = true;
    searchTimeout = window.setTimeout(async () => {
      try {
        const res = await getStocks({ query: query, per_page: 50 });
        stockOptions.value = res.data.items;
      } catch (error) {
        stockOptions.value = [];
      } finally {
        stockSearchLoading.value = false;
      }
    }, 300); // 300ms 延迟
  } else {
    stockOptions.value = [];
  }
}

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const onStrategyChange = async (strategyId: number | null) => {
    parameterDefinitions.value = [];
    strategyDescription.value = '';
    Object.keys(formParameters).forEach(key => delete formParameters[key]); // 清空旧参数

    if (!strategyId) return;

    const selectedStrategy = strategyOptions.value.find(s => s.id === strategyId);
    if (!selectedStrategy) return;

    try {
        const response = await getStrategyDetails(selectedStrategy.identifier);
        const details = response.data; // 新结构: response.data 包含策略详情
        parameterDefinitions.value = details.parameter_definitions;
        strategyDescription.value = details.description;
        // 根据定义初始化表单参数
        for (const param of parameterDefinitions.value) {
            formParameters[param.name] = param.default;
        }
    } catch (error) {
        ElMessage.error('获取策略参数失败');
        console.error(error);
    }
}

const onSubmit = async () => {
    if (form.strategy_id === null) {
        ElMessage.error('请先选择一个策略');
        return;
    }
    if (form.stock_codes.length === 0) {
        ElMessage.error('请至少选择一只股票');
        return;
    }

    loading.value = true;
    backtestResult.value = null;

    try {
        const payload = {
            strategy_id: form.strategy_id,
            start_date: form.date_range[0].toISOString().split('T')[0],
            end_date: form.date_range[1].toISOString().split('T')[0],
            initial_capital: form.initial_capital,
            stock_codes: form.stock_codes,
            parameters: formParameters, // 附加参数
        };

        const response = await runBacktest(payload);
        const backtestId = response.data.backtest_id;

        ElMessage.success(response.data.message || `回测任务 (ID: ${backtestId}) 已启动`);

        // 开始轮询获取结果
        pollForResult(backtestId);

    } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '启动回测失败');
    } finally {
        loading.value = false;
    }
}

const pollForResult = async (id: number, interval = 3000, maxAttempts = 20) => {
    let attempts = 0;

    const executePoll = async (resolve: (value: any) => void, reject: (reason?: any) => void) => {
        attempts++;
        try {
            const response = await getBacktestResult(id);
            const resultData = response.data;

            if (resultData && resultData.status !== 'running') {
                backtestResult.value = { id: id, status: 'completed', data: resultData };
                pollProgress.value = 100;
                ElMessage.success(response.data.message || '回测结果获取成功！');
                await nextTick();
                // 确保在第一次加载时就渲染图表
                if (form.stock_codes.length > 0) {
                    chartStock.value = form.stock_codes[0];
                }
                if (chartStock.value) {
                    renderChart(resultData, chartStock.value);
                }
                return resolve(resultData);
            } else if (attempts >= maxAttempts) {
                backtestResult.value = { id, status: 'error' };
                return reject(new Error('获取回测结果超时'));
            } else {
                backtestResult.value = { id, status: 'running' };
                pollProgress.value = Math.round((attempts / maxAttempts) * 100);
                setTimeout(() => executePoll(resolve, reject), interval);
            }
        } catch (error) {
            return reject(error);
        }
    };

    return new Promise((resolve, reject) => {
        executePoll(resolve, reject);
    }).catch(error => {
        ElMessage.error(error.message || '获取回测结果失败');
        backtestResult.value = { id, status: 'error' };
    });
}

watch(chartStock, (newStockCode) => {
  if (newStockCode && backtestResult.value && backtestResult.value.data) {
    // 确保图表在Tab切换后也能被正确渲染
    nextTick(() => {
       renderChart(backtestResult.value!.data, newStockCode);
    });
  }
});

const renderChart = async (resultData: any, stockCode: string) => {
    if (!chartRef.value || !resultData.portfolio_history) return;
    
    // 获取真实的日线数据
    const dailyDataResponse = await getDailyData(
        stockCode,
        formatDate(form.date_range[0]),
        formatDate(form.date_range[1])
    );
    const dailyData = dailyDataResponse.data || [];

    const candlestickData = dailyData.map((d: any) => ({
        time: d.trade_date.split('T')[0],
        open: d.open_price,
        high: d.high_price,
        low: d.low_price,
        close: d.close_price
    }));

    const portfolioHistory = resultData.portfolio_history;
    const portfolioData = portfolioHistory.map((p: any) => ({
        time: p.date.split('T')[0],
        value: p.total
    }));

    // 创建交易标记
    const tradeMarkers = (resultData.trades || [])
        .filter((t: any) => t.stock_code === stockCode)
        .map((trade: any) => {
            const date = trade.trade_date.split('T')[0];
            const isBuy = trade.trade_type === 'buy';
            return {
                time: date,
                position: isBuy ? 'belowBar' : 'aboveBar',
                color: isBuy ? '#2196F3' : '#E91E63',
                shape: isBuy ? 'arrowUp' : 'arrowDown',
                text: isBuy ? `买入 @ ${trade.price.toFixed(2)}` : `卖出 @ ${trade.price.toFixed(2)}`
            };
        });

    if (chart) {
        chart.remove();
        chart = null;
    }

    const chartOptions = {
        layout: {
            background: { color: '#1E222D' },
            textColor: '#D1D4DC',
        },
        grid: {
            vertLines: { color: '#2A2E39' },
            horzLines: { color: '#2A2E39' },
        },
        crosshair: {
            mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
            borderColor: '#485158',
        },
        leftPriceScale: {
            visible: true,
            borderColor: '#485158',
        },
        timeScale: {
            borderColor: '#485158',
            timeVisible: true,
            secondsVisible: false,
        },
        watermark: {
            color: 'rgba(209, 212, 220, 0.1)',
            visible: true,
            text: stockCode,
            fontSize: 48,
            horzAlign: 'center',
            vertAlign: 'center',
        },
    };
    
    chart = createChart(chartRef.value, chartOptions as any);

    // Candlestick Series on the right scale
    candlestickSeries = chart.addCandlestickSeries({
        upColor: '#E2363A',
        downColor: '#00B164',
        borderDownColor: '#00B164',
        borderUpColor: '#E2363A',
        wickDownColor: '#00B164',
        wickUpColor: '#E2363A',
    });

    candlestickSeries.setData(candlestickData);
    candlestickSeries.setMarkers(tradeMarkers);

    // Volume Series as an overlay
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay
    });

    // 假设您的 dailyData 包含成交量 (volume)
    const volumeData = dailyData.map((d: any) => ({
      time: d.trade_date.split('T')[0],
      value: d.volume,
      color: d.close_price > d.open_price ? 'rgba(226, 54, 58, 0.5)' : 'rgba(0, 177, 100, 0.5)',
    }));
    volumeSeries.setData(volumeData);
    
    // Asset line on the left scale
    const assetSeries = chart.addLineSeries({
      color: '#3B82F6',
      lineWidth: 2,
      priceScaleId: 'left',
    });
    assetSeries.setData(portfolioData);


    chart.timeScale().fitContent();
}
</script>

<style scoped>
/* All custom styles have been replaced by Tailwind CSS */
</style> 