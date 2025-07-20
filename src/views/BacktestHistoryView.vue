<template>
  <div class="backtest-history-container">
    <div class="filter-section">
      <el-input
        v-model="filters.stock_code"
        placeholder="股票代码 (可空)"
        style="width: 240px"
        clearable
      />
      <el-button
        type="primary"
        @click="fetchHistory"
        :loading="loading"
      >查询</el-button>
      <el-button
        type="danger"
        @click="onClear"
        :loading="clearLoading"
      >清空历史</el-button>
    </div>

    <el-table
      :data="history"
      border
      stripe
      style="width: 100%"
    >
      <el-table-column
        prop="id"
        label="ID"
      />
      <el-table-column
        prop="strategy_id"
        label="策略名称"
      >
        <template #default="{ row }">
          {{ getStrategyName(row.strategy_id) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="start_date"
        label="开始日期"
      />
      <el-table-column
        prop="end_date"
        label="结束日期"
      />
      <el-table-column
        prop="total_return"
        label="收益率"
      >
        <template #default="{ row }">
          <span :style="{ color: row.total_return >= 0 ? 'var(--el-color-success)' : 'var(--el-color-danger)' }">
            {{ row.total_return !== null ? (row.total_return * 100).toFixed(2) + '%' : '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        label="状态"
        width="100"
      />
      <el-table-column
        prop="created_at"
        label="创建时间"
        width="160"
      />
      <el-table-column
        prop="selected_stocks"
        label="股票"
      >
        <template #default="{ row }">
          <el-tag
            v-for="item in row.selected_stocks"
            :key="typeof item === 'string' ? item : item.code"
            size="small"
            style="margin-right: 4px"
          >{{ typeof item === 'string' ? item : `${item.code} ${item.name}` }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="100"
      >
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="showDetail(row)"
          >查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next, total"
      :current-page="page"
      :page-size="size"
      :total="total"
      @current-change="onPageChange"
    />

    <!-- 回测详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="回测详情"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      class="backtest-detail-dialog"
    >
      <div
        v-if="detailLoading"
        class="detail-loading"
      >
        <el-progress
          type="circle"
          :percentage="detailProgress"
        />
        <p class="loading-text">正在加载回测详情...</p>
      </div>

      <div
        v-else-if="backtestDetail"
        class="backtest-detail-content"
      >
        <!-- 回测基本信息 -->
        <div class="detail-header">
          <div class="detail-info">
            <h3>回测ID: {{ backtestDetail.id }}</h3>
            <p>策略: {{ backtestDetail.strategy_name || '未知策略' }}</p>
            <p>股票: {{ getStockDisplayName() }}</p>
            <p>时间范围: {{ backtestDetail.start_date }} 至 {{ backtestDetail.end_date }}</p>
          </div>
        </div>

        <!-- 性能指标 -->
        <div class="performance-metrics">
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">总收益率</div>
              <div
                class="metric-value"
                :class="performanceMetrics.totalReturn >= 0 ? 'positive' : 'negative'"
              >
                {{ (performanceMetrics.totalReturn * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">年化收益率</div>
              <div
                class="metric-value"
                :class="performanceMetrics.annualReturn >= 0 ? 'positive' : 'negative'"
              >
                {{ (performanceMetrics.annualReturn * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">最大回撤</div>
              <div class="metric-value negative">
                {{ (performanceMetrics.maxDrawdown * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">夏普比率</div>
              <div class="metric-value">
                {{ performanceMetrics.sharpeRatio.toFixed(2) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">总交易次数</div>
              <div class="metric-value">
                {{ performanceMetrics.totalTrades }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">胜率</div>
              <div class="metric-value">
                {{ (performanceMetrics.winRate * 100).toFixed(2) }}%
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">盈亏比</div>
              <div class="metric-value">
                {{ performanceMetrics.profitFactor.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 股票选择器 -->
        <div
          v-if="backtestDetail.selected_stocks && backtestDetail.selected_stocks.length > 1"
          class="stock-selector"
        >
          <el-select
            v-model="selectedStock"
            placeholder="选择股票查看图表"
            @change="onStockChange"
          >
            <el-option
              v-for="stock in backtestDetail.selected_stocks"
              :key="typeof stock === 'string' ? stock : stock.code"
              :label="typeof stock === 'string' ? stock : `${stock.code} ${stock.name}`"
              :value="typeof stock === 'string' ? stock : stock.code"
            />
          </el-select>
        </div>

        <!-- Tab内容 -->
        <el-tabs
          v-model="activeTab"
          class="detail-tabs"
          @tab-change="onTabChange"
        >
          <el-tab-pane
            label="业绩图表"
            name="chart"
          >
            <div
              ref="chartRef"
              class="chart-container"
            ></div>
          </el-tab-pane>

          <el-tab-pane
            label="交易日志"
            name="trades"
          >
            <div class="trades-container">
              <el-table
                :data="filteredTrades"
                class="trades-table"
                :max-height="400"
                border
                stripe
              >
                <el-table-column
                  prop="trade_date"
                  label="交易日期"
                  width="180"
                />
                <el-table-column
                  prop="stock_code"
                  label="股票代码"
                  width="120"
                />
                <el-table-column
                  prop="trade_type"
                  label="操作"
                  width="100"
                >
                  <template #default="{ row }">
                    <el-tag
                      :type="row.trade_type === 'buy' ? 'success' : 'danger'"
                      size="small"
                    >
                      {{ row.trade_type.toUpperCase() }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="price"
                  label="成交价"
                />
                <el-table-column
                  prop="quantity"
                  label="股数"
                />
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane
            label="AI分析"
            name="ai-analysis"
          >
            <div class="ai-analysis-container">
              <div
                v-if="backtestDetail.ai_analysis_report"
                class="ai-content"
              >
                <div class="ai-header">
                  <el-icon>
                    <ChatDotRound />
                  </el-icon>
                  <span>AI分析报告</span>
                </div>
                <div class="ai-report">
                  <v-md-editor
                    v-model="backtestDetail.ai_analysis_report"
                    mode="preview"
                    :height="400"
                  />
                </div>
              </div>
              <div
                v-else
                class="ai-empty"
              >
                <el-empty description="暂无AI分析报告" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { getBacktestHistory, clearBacktestHistory, getBacktestResult, getDailyData, getStrategies } from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ChatDotRound } from '@element-plus/icons-vue';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import VMdEditor from '@kangc/v-md-editor';
import { usePageWebSocket } from '@/utils/pageWebSocketManager';

// 页面WebSocket连接管理
const { pageManager, checkAndReconnect } = usePageWebSocket()

const filters = reactive<{ stock_code?: string }>({ stock_code: undefined });
const history = ref<any[]>([]);
const loading = ref(false);
const clearLoading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

// 弹窗相关状态
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailProgress = ref(0);
const backtestDetail = ref<any>(null);
const activeTab = ref('chart');
const selectedStock = ref<string>('');
const chartRef = ref<HTMLElement | null>(null);
let chart: IChartApi | null = null;
let candlestickSeries: ISeriesApi<'Candlestick'> | null = null;

// 策略列表状态
const strategies = ref<any[]>([]);
const strategiesLoading = ref(false);

// 性能指标计算
const performanceMetrics = computed(() => {
  if (!backtestDetail.value || !backtestDetail.value.data) {
    return {
      totalReturn: 0,
      annualReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
    };
  }

  const data = backtestDetail.value.data;

  // 计算盈亏比
  let totalProfit = 0.0;
  let totalLoss = 0.0;
  const buyMap = new Map<string, { price: number; quantity: number }[]>();

  for (const trade of data.trades || []) {
    if (trade.trade_type === 'buy') {
      if (!buyMap.has(trade.stock_code)) {
        buyMap.set(trade.stock_code, []);
      }
      buyMap.get(trade.stock_code)!.push({ price: trade.price, quantity: trade.quantity });
    } else {
      const buyInfo = buyMap.get(trade.stock_code)?.shift();
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
    totalReturn: data.total_return || 0,
    annualReturn: data.annual_return || 0,
    maxDrawdown: data.max_drawdown || 0,
    sharpeRatio: data.sharpe_ratio || 0,
    totalTrades: data.total_trades || 0,
    winRate: data.win_rate || 0,
    profitFactor,
  };
});

// 过滤交易记录
const filteredTrades = computed(() => {
  const trades = backtestDetail.value?.data?.trades;
  if (!trades) return [];

  if (backtestDetail.value.selected_stocks.length > 1 && selectedStock.value) {
    return trades.filter((trade: any) => trade.stock_code === selectedStock.value);
  }
  return trades;
});

// 获取策略列表
async function fetchStrategies() {
  try {
    strategiesLoading.value = true;
    const response = await getStrategies();
    strategies.value = response.data || [];
  } catch (error: any) {
    console.error('获取策略列表失败:', error);
  } finally {
    strategiesLoading.value = false;
  }
}

// 根据策略ID获取策略名称
function getStrategyName(strategyId: number): string {
  const strategy = strategies.value.find(s => s.id === strategyId);
  return strategy ? strategy.name : '未知策略';
}

// 获取股票显示名称
function getStockDisplayName(): string {
  if (!backtestDetail.value || !backtestDetail.value.selected_stocks) {
    return '未知股票';
  }

  const stocks = backtestDetail.value.selected_stocks;
  if (stocks.length === 0) {
    return '未知股票';
  }

  if (stocks.length === 1) {
    const stock = stocks[0];
    if (typeof stock === 'string') {
      return stock;
    } else {
      return `${stock.code} ${stock.name || ''}`;
    }
  }

  // 多股票情况，显示选中的股票
  if (selectedStock.value) {
    const stock = stocks.find((s: any) => {
      const code = typeof s === 'string' ? s : s.code;
      return code === selectedStock.value;
    });
    if (stock) {
      if (typeof stock === 'string') {
        return stock;
      } else {
        return `${stock.code} ${stock.name || ''}`;
      }
    }
  }

  // 显示所有股票
  return stocks.map((s: any) => typeof s === 'string' ? s : `${s.code} ${s.name || ''}`).join(', ');
}

async function fetchHistory() {
  loading.value = true;
  try {
    const { data } = await getBacktestHistory({ ...filters, page: page.value, size: size.value });
    history.value = data.items;
    total.value = data.total;
  } catch (e: any) {
    ElMessage.error(e.message || '获取失败');
  } finally {
    loading.value = false;
  }
}

function onPageChange(p: number) {
  page.value = p;
  fetchHistory();
}

async function showDetail(row: any) {
  detailVisible.value = true;
  detailLoading.value = true;
  detailProgress.value = 0;
  backtestDetail.value = null;
  activeTab.value = 'chart';

  try {
    // 先使用列表行信息设置基础信息
    backtestDetail.value = {
      id: row.id,
      status: row.status || 'completed',
      data: null, // 稍后填充
      strategy_name: getStrategyName(row.strategy_id),
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      selected_stocks: row.selected_stocks || [],
      ai_analysis_report: '',
    };

    // 设置默认选中的股票
    if (row.selected_stocks && row.selected_stocks.length > 0) {
      const firstStock = row.selected_stocks[0];
      selectedStock.value = typeof firstStock === 'string'
        ? firstStock
        : (firstStock as any).code || '';
    }

    // 模拟加载进度
    const progressInterval = setInterval(() => {
      if (detailProgress.value < 90) {
        detailProgress.value += 10;
      }
    }, 100);

    // 获取详细的回测结果数据
    const response = await getBacktestResult(row.id);
    const resultData = response.data;

    if (!resultData) {
      throw new Error('无效的回测结果');
    }

    // 更新回测详情数据
    backtestDetail.value.data = resultData;
    backtestDetail.value.ai_analysis_report = (resultData as any).ai_analysis_report || '';

    detailProgress.value = 100;
    clearInterval(progressInterval);

    // 等待DOM更新后渲染图表
    await nextTick();
    // 延迟渲染图表，确保DOM完全渲染
    setTimeout(() => {
      if (activeTab.value === 'chart' && selectedStock.value) {
        renderChart(resultData, selectedStock.value);
      }
    }, 100);

  } catch (error: any) {
    ElMessage.error(error.message || '获取回测详情失败');
  } finally {
    detailLoading.value = false;
  }
}

async function onStockChange(stockCode: string) {
  if (backtestDetail.value && backtestDetail.value.data) {
    await nextTick();
    setTimeout(() => {
      renderChart(backtestDetail.value.data, stockCode);
    }, 100);
  }
}

// 监听Tab切换
function onTabChange(tabName: string) {
  if (tabName === 'chart' && backtestDetail.value && backtestDetail.value.data && selectedStock.value) {
    setTimeout(() => {
      renderChart(backtestDetail.value.data, selectedStock.value);
    }, 100);
  }
}

// 格式化日期
function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 渲染图表
async function renderChart(resultData: any, stockCode: string) {
  if (!chartRef.value || !resultData.portfolio_history) return;

  try {
    // 获取日线数据
    const dailyDataResponse = await getDailyData(
      stockCode,
      resultData.start_date,
      resultData.end_date
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
        const marker = {
          time: trade.trade_date.split('T')[0],
          position: trade.trade_type === 'buy' ? 'belowBar' : 'aboveBar',
          color: trade.trade_type === 'buy' ? '#26a69a' : '#ef5350',
          shape: trade.trade_type === 'buy' ? 'arrowUp' : 'arrowDown',
          text: `${trade.trade_type.toUpperCase()} ${trade.quantity}`,
        };
        return marker;
      });

    // 销毁旧图表
    if (chart) {
      chart.remove();
      chart = null;
      candlestickSeries = null;
    }

    // 创建新图表
    chart = createChart(chartRef.value, {
      width: chartRef.value.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1e293b' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
        visible: true,
      },
      leftPriceScale: {
        borderColor: '#374151',
        visible: true,
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 添加K线图（使用右侧Y轴）
    candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceScaleId: 'right',
    });

    candlestickSeries.setData(candlestickData);

    // 添加交易标记
    candlestickSeries.setMarkers(tradeMarkers);

    // 添加投资组合曲线（使用左侧Y轴）
    const portfolioSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      title: '投资组合价值',
      priceScaleId: 'left',
    });

    portfolioSeries.setData(portfolioData);

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      if (chart && chartRef.value) {
        chart.applyOptions({ width: chartRef.value.clientWidth });
      }
    });
    resizeObserver.observe(chartRef.value);

  } catch (error) {
    console.error('渲染图表失败:', error);
    ElMessage.error('渲染图表失败');
  }
}

async function onClear() {
  try {
    await ElMessageBox.confirm('确定要清除历史记录？此操作不可恢复!', '警告', { type: 'warning' });
    clearLoading.value = true;
    await clearBacktestHistory(filters.stock_code);
    ElMessage.success('已清除');
    page.value = 1;
    fetchHistory();
  } catch (_) { }
  finally {
    clearLoading.value = false;
  }
}

onMounted(async () => {
  try {
    // 先获取策略列表，确保策略名称能正确显示
    await fetchStrategies();
    // 再获取回测历史列表
    await fetchHistory();
  } catch (error) {
    console.error('页面初始化失败:', error);
    ElMessage.error('页面初始化失败');
  }
});
</script>

<style scoped>
.backtest-history-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 弹窗样式 */
.backtest-detail-dialog :deep(.el-dialog) {
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.backtest-detail-dialog :deep(.el-dialog__header) {
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color);
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

.backtest-detail-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.backtest-detail-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.backtest-detail-dialog :deep(.el-dialog__footer) {
  background: var(--el-bg-color-page);
  border-top: 1px solid var(--el-border-color);
  border-radius: 0 0 12px 12px;
  padding: 16px 24px;
}

/* 加载状态 */
.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-text {
  margin-top: 16px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

/* 详情内容 */
.backtest-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.detail-info h3 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.detail-info p {
  margin: 4px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

/* 性能指标 */
.performance-metrics {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.metric-item {
  text-align: center;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.2s ease;
}

.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.metric-value.positive {
  color: var(--el-color-success);
}

.metric-value.negative {
  color: var(--el-color-danger);
}

/* 股票选择器 */
.stock-selector {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

/* Tab样式 */
.detail-tabs {
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

.detail-tabs :deep(.el-tabs__header) {
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  border-radius: 8px 8px 0 0;
  margin: 0;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 20px;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
}

/* 交易日志 */
.trades-container {
  height: 100%;
  overflow: hidden;
}

.trades-table {
  height: 100%;
}

.trades-table :deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.trades-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.trades-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 4px;
}

.trades-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-hover);
}

/* AI分析 */
.ai-analysis-container {
  min-height: 400px;
}

.ai-content {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ai-report {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  background: var(--el-bg-color);

  /* 深色主题样式 */
  :deep(.v-md-editor-preview) {
    background: var(--el-bg-color) !important;
    color: var(--el-text-color-primary) !important;
  }

  :deep(.v-md-editor-preview h1),
  :deep(.v-md-editor-preview h2),
  :deep(.v-md-editor-preview h3),
  :deep(.v-md-editor-preview h4),
  :deep(.v-md-editor-preview h5),
  :deep(.v-md-editor-preview h6) {
    color: var(--el-text-color-primary) !important;
  }

  :deep(.v-md-editor-preview p) {
    color: var(--el-text-color-regular) !important;
  }

  :deep(.v-md-editor-preview table) {
    background: var(--el-fill-color-light) !important;
    border: 1px solid var(--el-border-color) !important;
  }

  :deep(.v-md-editor-preview th) {
    background: var(--el-bg-color-page) !important;
    color: var(--el-text-color-primary) !important;
    border-bottom: 1px solid var(--el-border-color) !important;
  }

  :deep(.v-md-editor-preview td) {
    color: var(--el-text-color-regular) !important;
    border-bottom: 1px solid var(--el-border-color-light) !important;
  }

  :deep(.v-md-editor-preview code) {
    background: var(--el-fill-color) !important;
    color: var(--el-color-primary) !important;
  }

  :deep(.v-md-editor-preview pre) {
    background: var(--el-fill-color-light) !important;
    border: 1px solid var(--el-border-color) !important;
  }

  :deep(.v-md-editor-preview blockquote) {
    background: var(--el-fill-color-light) !important;
    border-left: 4px solid var(--el-color-primary) !important;
    color: var(--el-text-color-regular) !important;
  }

  /* 修复表格背景颜色问题 */
  :deep(.v-md-editor-preview .table) {
    background: var(--el-fill-color-light) !important;
  }

  :deep(.v-md-editor-preview .table th) {
    background: var(--el-bg-color-page) !important;
    color: var(--el-text-color-primary) !important;
  }

  :deep(.v-md-editor-preview .table td) {
    background: var(--el-fill-color-light) !important;
    color: var(--el-text-color-regular) !important;
  }

  /* 确保所有表格元素都使用深色主题 */
  :deep(.v-md-editor-preview *) {
    background-color: inherit !important;
  }

  :deep(.v-md-editor-preview table *) {
    background-color: var(--el-fill-color-light) !important;
  }

  :deep(.v-md-editor-preview table th) {
    background-color: var(--el-bg-color-page) !important;
  }
}

.ai-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .backtest-detail-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 20px auto;
  }
}
</style>