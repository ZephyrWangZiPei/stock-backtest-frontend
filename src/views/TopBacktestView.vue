<template>
  <div class="top-backtest-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Top策略回测</h1>
        <p class="page-subtitle">多策略回测胜率排行榜</p>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          :icon="Refresh" 
          :loading="loading" 
          @click="refreshData"
          class="refresh-btn"
        >
          刷新数据
        </el-button>
        <el-button 
          type="success" 
          :icon="VideoPlay" 
          :loading="runningJob" 
          @click="runBacktestJob"
          class="run-job-btn"
        >
          执行回测
        </el-button>
      </div>
    </div>

    <!-- 统计卡片和任务监控 -->
    <div class="stats-and-monitor-section" v-if="stats">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_strategies }}</div>
            <div class="stat-label">活跃策略</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_top_stocks }}</div>
            <div class="stat-label">Top股票</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ lastUpdateTime }}</div>
            <div class="stat-label">最后更新</div>
          </div>
        </div>
      </div>
      
      <!-- 任务监控 -->
      <div class="monitor-section">
        <TaskStatusMonitor />
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索股票代码或名称"
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select
          v-model="selectedStrategy"
          placeholder="选择策略"
          clearable
          class="strategy-select"
        >
          <el-option
            v-for="strategy in availableStrategies"
            :key="strategy.strategy_id"
            :label="strategy.strategy_name"
            :value="strategy.strategy_id"
          />
        </el-select>
        <el-input-number
          v-model="minTradeCount"
          :min="0"
          :step="5"
          controls-position="right"
          class="trade-count-input"
          placeholder="最小交易次数"
        />
      </div>
      <div class="control-right">
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          class="sort-select"
        >
          <el-option label="胜率排序" value="win_rate" />
          <el-option label="年化收益" value="annual_return" />
          <el-option label="夏普比率" value="sharpe_ratio" />
          <el-option label="最大回撤" value="max_drawdown" />
          <el-option label="置信胜率" value="win_rate_lb" />
          <el-option label="期望收益" value="expectancy" />
          <el-option label="盈亏比" value="profit_factor" />
          <el-option label="交易次数" value="trade_count" />
        </el-select>
        <el-select
          v-model="sortOrder"
          class="sort-order-select"
        >
          <el-option label="降序" value="desc" />
          <el-option label="升序" value="asc" />
        </el-select>
        <el-button
          :icon="viewMode === 'table' ? Grid : List"
          @click="toggleViewMode"
          class="view-toggle-btn"
        >
          {{ viewMode === 'table' ? '卡片视图' : '表格视图' }}
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 数据展示区域 -->
    <div v-else-if="filteredData.length > 0" class="data-container">
      <!-- 图表可视化 -->
      <div class="chart-section">
        <TopStrategyChart :data="allStocks" />
      </div>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <el-table
          :data="paginatedData"
          stripe
          class="data-table"
          @sort-change="handleSortChange"
          default-sort="win_rate"
        >
          <el-table-column prop="strategy_name" label="策略" width="150" fixed />
          <el-table-column prop="stock_code" label="股票代码" width="120" />
          <el-table-column prop="stock_name" label="股票名称" width="150" />
          <el-table-column 
            prop="rank" 
            label="排名" 
            width="80" 
            align="center"
            sortable
          >
            <template #default="scope">
              <el-tag
                :type="getRankTagType(scope.row.rank)"
                size="small"
                round
              >
                #{{ scope.row.rank }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column 
            prop="win_rate" 
            label="胜率" 
            width="120" 
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <div class="win-rate-cell">
                <el-progress
                  :percentage="scope.row.win_rate * 100"
                  :color="getWinRateColor(scope.row.win_rate)"
                  :show-text="false"
                  :stroke-width="8"
                />
                <span class="win-rate-text">{{ (scope.row.win_rate * 100).toFixed(2) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column 
            prop="win_rate_lb"
            label="置信胜率"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span>{{ formatPercentage(scope.row.win_rate_lb) }}</span>
            </template>
          </el-table-column>
          <el-table-column 
            prop="annual_return" 
            label="年化收益" 
            width="120" 
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span :class="getReturnClass(scope.row.annual_return)">
                {{ formatPercentage(scope.row.annual_return) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column 
            prop="expectancy"
            label="期望值"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span :class="getReturnClass(scope.row.expectancy)">
                {{ formatPercentage(scope.row.expectancy) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column 
            prop="profit_factor"
            label="盈亏比"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span :class="getReturnClass(scope.row.profit_factor)">
                {{ scope.row.profit_factor?.toFixed(2) || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column 
            prop="trade_count"
            label="交易次数"
            width="100"
            align="center"
            sortable="custom"
          />
          <el-table-column 
            prop="sharpe_ratio" 
            label="夏普比率" 
            width="120" 
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span :class="getSharpeClass(scope.row.sharpe_ratio)">
                {{ scope.row.sharpe_ratio?.toFixed(3) || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column 
            prop="max_drawdown" 
            label="最大回撤" 
            width="120" 
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span class="drawdown-text">
                {{ formatPercentage(scope.row.max_drawdown) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column 
            prop="backtest_period_days" 
            label="回测天数" 
            width="100" 
            align="center"
          />
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewDetail(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <div class="cards-grid">
          <div
            v-for="item in paginatedData"
            :key="`${item.strategy_id}-${item.stock_code}`"
            class="stock-card"
            @click="viewDetail(item)"
          >
            <div class="card-header">
              <div class="card-title">
                <span class="stock-code">{{ item.stock_code }}</span>
                <span class="stock-name">{{ item.stock_name }}</span>
              </div>
              <el-tag
                :type="getRankTagType(item.rank)"
                size="small"
                round
              >
                #{{ item.rank }}
              </el-tag>
            </div>
            
            <div class="card-strategy">
              <el-tag type="info" size="small">{{ item.strategy_name }}</el-tag>
            </div>

            <div class="card-metrics">
              <div class="metric-item">
                <span class="metric-label">胜率</span>
                <div class="metric-value">
                  <el-progress
                    :percentage="item.win_rate * 100"
                    :color="getWinRateColor(item.win_rate)"
                    :show-text="false"
                    :stroke-width="6"
                  />
                  <span class="metric-text">{{ (item.win_rate * 100).toFixed(2) }}%</span>
                </div>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">置信胜率</span>
                <span class="metric-text">{{ formatPercentage(item.win_rate_lb) }}</span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">交易次数</span>
                <span class="metric-text">{{ item.trade_count }}</span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">年化收益</span>
                <span :class="['metric-text', getReturnClass(item.annual_return)]">
                  {{ formatPercentage(item.annual_return) }}
                </span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">夏普比率</span>
                <span :class="['metric-text', getSharpeClass(item.sharpe_ratio)]">
                  {{ item.sharpe_ratio?.toFixed(3) || '-' }}
                </span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">最大回撤</span>
                <span class="metric-text drawdown-text">
                  {{ formatPercentage(item.max_drawdown) }}
                </span>
              </div>

              <div class="metric-item">
                <span class="metric-label">盈亏比</span>
                <span class="metric-text" :class="getReturnClass(item.profit_factor)">
                  {{ item.profit_factor?.toFixed(2) || '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页器 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 空数据状态 -->
    <div v-else class="empty-container">
      <el-empty description="暂无数据">
        <el-button type="primary" @click="runBacktestJob">执行回测任务</el-button>
      </el-empty>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="股票详情"
      width="800px"
      class="detail-dialog"
    >
      <div v-if="selectedStock" class="detail-content">
        <div class="detail-header">
          <div class="stock-info">
            <h3>{{ selectedStock.stock_code }} - {{ selectedStock.stock_name }}</h3>
            <el-tag type="info">{{ selectedStock.strategy_name }}</el-tag>
          </div>
          <div class="rank-badge">
            <el-tag
              :type="getRankTagType(selectedStock.rank)"
              size="large"
            >
              排名 #{{ selectedStock.rank }}
            </el-tag>
          </div>
        </div>

        <div class="detail-metrics">
          <div class="metric-card">
            <div class="metric-title">胜率</div>
            <div class="metric-main-value">{{ (selectedStock.win_rate * 100).toFixed(2) }}%</div>
            <el-progress
              :percentage="selectedStock.win_rate * 100"
              :color="getWinRateColor(selectedStock.win_rate)"
              :show-text="false"
            />
          </div>
          
          <div class="metric-card">
            <div class="metric-title">年化收益率</div>
            <div :class="['metric-main-value', getReturnClass(selectedStock.annual_return)]">
              {{ formatPercentage(selectedStock.annual_return) }}
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">夏普比率</div>
            <div :class="['metric-main-value', getSharpeClass(selectedStock.sharpe_ratio)]">
              {{ selectedStock.sharpe_ratio?.toFixed(3) || '-' }}
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">最大回撤</div>
            <div class="metric-main-value drawdown-text">
              {{ formatPercentage(selectedStock.max_drawdown) }}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-title">盈亏比</div>
            <div class="metric-main-value">
              {{ selectedStock.profit_factor?.toFixed(2) || '-' }}
            </div>
          </div>
        </div>

        <div class="detail-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="回测周期">{{ selectedStock.backtest_period_days }} 天</el-descriptions-item>
            <el-descriptions-item label="初始资金">¥{{ formatNumber(selectedStock.initial_capital) }}</el-descriptions-item>
            <el-descriptions-item label="总收益率">{{ formatPercentage(selectedStock.total_return) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(selectedStock.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(selectedStock.updated_at) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  VideoPlay,
  Search,
  TrendCharts,
  Star,
  Timer,
  Grid,
  List
} from '@element-plus/icons-vue'
import {
  getAllTopStrategyStocks,
  getTopStocksStats,
  runTopStrategyBacktestJob
} from '@/utils/api'
import TopStrategyChart from '@/components/TopStrategyChart.vue'
import TaskStatusMonitor from '@/components/TaskStatusMonitor.vue'

// 数据类型定义
interface TopStrategyStock {
  id: number
  strategy_id: number
  strategy_name: string
  stock_code: string
  stock_name: string
  win_rate: number
  total_return: number
  annual_return: number
  max_drawdown: number
  sharpe_ratio: number
  rank: number
  backtest_period_days: number
  initial_capital: number
  created_at: string
  updated_at: string
  trade_count: number
  win_rate_lb: number
  expectancy: number
  profit_factor?: number
}

interface StrategyGroup {
  strategy_id: number
  strategy_name: string
  top_stocks: TopStrategyStock[]
}

interface StatsData {
  total_strategies: number
  total_top_stocks: number
  strategy_details: Array<{
    strategy_name: string
    stock_count: number
    avg_win_rate: number
    last_update: string
  }>
}

// 响应式数据
const loading = ref(false)
const runningJob = ref(false)
const rawData = ref<StrategyGroup[]>([])
const stats = ref<StatsData | null>(null)
const searchQuery = ref('')
const selectedStrategy = ref<number | null>(null)
const sortBy = ref('win_rate')
const sortOrder = ref('desc')
const viewMode = ref<'table' | 'card'>('table')
const currentPage = ref(1)
const pageSize = ref(20)
const minTradeCount = ref(3)

// 详情弹窗
const detailDialogVisible = ref(false)
const selectedStock = ref<TopStrategyStock | null>(null)

// 计算属性
const allStocks = computed(() => {
  const stocks: TopStrategyStock[] = []
  rawData.value.forEach(group => {
    stocks.push(...group.top_stocks)
  })
  return stocks
})

const availableStrategies = computed(() => {
  return rawData.value.map(group => ({
    strategy_id: group.strategy_id,
    strategy_name: group.strategy_name
  }))
})

const filteredData = computed(() => {
  let filtered = allStocks.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(stock =>
      stock.stock_code.toLowerCase().includes(query) ||
      stock.stock_name.toLowerCase().includes(query)
    )
  }

  // 策略过滤
  if (selectedStrategy.value) {
    filtered = filtered.filter(stock => stock.strategy_id === selectedStrategy.value)
  }

  // 最小交易次数过滤
  if (minTradeCount.value) {
    filtered = filtered.filter(stock => (stock.trade_count || 0) >= minTradeCount.value)
  }

  // 排序
  filtered.sort((a, b) => {
    const aValue = a[sortBy.value as keyof TopStrategyStock] as number
    const bValue = b[sortBy.value as keyof TopStrategyStock] as number
    
    if (sortOrder.value === 'desc') {
      return (bValue || 0) - (aValue || 0)
    } else {
      return (aValue || 0) - (bValue || 0)
    }
  })

  return filtered
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const lastUpdateTime = computed(() => {
  if (!stats.value?.strategy_details?.length) return '-'
  
  const latestUpdate = stats.value.strategy_details
    .map(s => s.last_update)
    .filter(Boolean)
    .sort()
    .pop()
  
  return latestUpdate ? formatDate(latestUpdate) : '-'
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    const [stocksResponse, statsResponse] = await Promise.all([
      getAllTopStrategyStocks(),
      getTopStocksStats()
    ])

    if ((stocksResponse as any).code=200) {
      rawData.value = (stocksResponse as any).data
    } else {
      ElMessage.error((stocksResponse as any).message || '获取数据失败')
    }

    if ((statsResponse as any).code=200) {
      stats.value = (statsResponse as any).data
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const runBacktestJob = async () => {
  try {
    await ElMessageBox.confirm(
      '执行回测任务可能需要较长时间，确定要继续吗？',
      '确认执行',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    runningJob.value = true
    const response = await runTopStrategyBacktestJob()
    
    if ((response as any).success) {
      ElMessage.success('回测任务已启动，请稍后查看结果')
      // 延迟刷新数据
      setTimeout(() => {
        refreshData()
      }, 2000)
    } else {
      ElMessage.error((response as any).message || '启动任务失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('启动任务失败:', error)
      ElMessage.error('启动任务失败')
    }
  } finally {
    runningJob.value = false
  }
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'table' ? 'card' : 'table'
}

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  if (prop) {
    sortBy.value = prop
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const viewDetail = (stock: TopStrategyStock) => {
  selectedStock.value = stock
  detailDialogVisible.value = true
}

// 工具函数
const getRankTagType = (rank: number) => {
  if (rank <= 3) return 'danger'
  if (rank <= 10) return 'warning'
  return 'info'
}

const getWinRateColor = (winRate: number) => {
  if (winRate >= 0.8) return '#67c23a'
  if (winRate >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const getReturnClass = (returnValue?: number) => {
  if (returnValue && returnValue > 0) return 'positive-return'
  if (returnValue && returnValue < 0) return 'negative-return'
  return 'neutral-return'
}

const getSharpeClass = (sharpe: number) => {
  if (sharpe > 1) return 'excellent-sharpe'
  if (sharpe > 0.5) return 'good-sharpe'
  return 'poor-sharpe'
}

const formatPercentage = (value: number) => {
  if (value == null) return '-'
  return `${(value * 100).toFixed(2)}%`
}

const formatNumber = (value: number) => {
  if (value == null) return '-'
  return new Intl.NumberFormat('zh-CN').format(value)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 监听搜索和筛选变化，重置分页
watch([searchQuery, selectedStrategy], () => {
  currentPage.value = 1
})

// 初始化
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.top-backtest-container {
  @apply min-h-screen flex flex-col p-6 bg-gradient-to-br from-gray-900 to-gray-800 overflow-y-auto;
  height: 100%;
}

/* 页面头部 */
.page-header {
  @apply flex justify-between items-center mb-6;
}

.header-left {
  @apply flex flex-col;
}

.page-title {
  @apply text-3xl font-bold text-white mb-2;
}

.page-subtitle {
  @apply text-gray-400 text-lg;
}

.header-right {
  @apply flex gap-3;
}

.refresh-btn, .run-job-btn {
  @apply px-6 py-3 font-medium;
}

/* 统计卡片和任务监控 */
.stats-and-monitor-section {
  @apply grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6;
}

.stats-cards {
  @apply lg:col-span-3 grid grid-cols-3 gap-6;
}

.monitor-section {
  @apply lg:col-span-1;
}

.stat-card {
  @apply bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-md p-6 flex items-center gap-4;
}

.stat-icon {
  @apply w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex items-center justify-center text-white text-xl;
}

.stat-content {
  @apply flex flex-col;
}

.stat-value {
  @apply text-2xl font-bold text-white;
}

.stat-label {
  @apply text-gray-400 text-sm;
}

/* 控制面板 */
.control-panel {
  @apply flex justify-between items-center mb-6 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-md;
}

.control-left {
  @apply flex gap-4;
}

.control-right {
  @apply flex gap-3;
}

.search-input {
  @apply w-64;
}

.strategy-select {
  @apply w-48;
}

.trade-count-input {
  @apply w-40;
}

.sort-select {
  @apply w-32;
}

.sort-order-select {
  @apply w-20;
}

.view-toggle-btn {
  @apply px-4;
}

/* 加载状态 */
.loading-container {
  @apply flex-1 p-6;
}

/* 数据容器 */
.data-container {
  @apply flex flex-col gap-6;
}

/* 图表区域 */
.chart-section {
  @apply mb-6;
}

/* 表格视图 */
.table-view {
  /* 保留空样式占位，若需额外调整可在此添加 */
}

.data-table {
  @apply h-full;
  --el-table-bg-color: rgba(31, 41, 55, 0.5);
  --el-table-tr-bg-color: rgba(55, 65, 81, 0.3);
  --el-table-header-bg-color: rgba(17, 24, 39, 0.8);
  --el-table-header-text-color: #f3f4f6;
  --el-table-text-color: #d1d5db;
  --el-table-border-color: rgba(75, 85, 99, 0.3);
}

.win-rate-cell {
  @apply flex flex-col gap-1;
}

.win-rate-text {
  @apply text-xs text-center;
}

.positive-return {
  @apply text-green-400 font-medium;
}

.negative-return {
  @apply text-red-400 font-medium;
}

.neutral-return {
  @apply text-gray-400;
}

.excellent-sharpe {
  @apply text-green-400 font-medium;
}

.good-sharpe {
  @apply text-yellow-400;
}

.poor-sharpe {
  @apply text-red-400;
}

.drawdown-text {
  @apply text-red-400;
}

/* 卡片视图 */
.card-view {
  /* 保留空样式占位 */
}

.cards-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
}

.stock-card {
  @apply bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-md p-4 cursor-pointer transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-600/50 hover:scale-105;
}

.card-header {
  @apply flex justify-between items-start mb-3;
}

.card-title {
  @apply flex flex-col;
}

.stock-code {
  @apply text-white font-bold text-lg;
}

.stock-name {
  @apply text-gray-400 text-sm;
}

.card-strategy {
  @apply mb-4;
}

.card-metrics {
  @apply space-y-3;
}

.metric-item {
  @apply flex justify-between items-center;
}

.metric-label {
  @apply text-gray-400 text-sm;
}

.metric-value {
  @apply flex items-center gap-2;
}

.metric-text {
  @apply text-white text-sm font-medium;
}

/* 分页器 */
.pagination-container {
  @apply mt-6 flex justify-center;
}

/* 空状态 */
.empty-container {
  @apply flex-1 flex items-center justify-center;
}

/* 详情弹窗 */
.detail-dialog {
  --el-dialog-bg-color: rgba(31, 41, 55, 0.95);
  --el-dialog-title-font-size: 20px;
}

.detail-content {
  @apply space-y-6;
}

.detail-header {
  @apply flex justify-between items-center;
}

.stock-info h3 {
  @apply text-xl font-bold text-white mb-2;
}

.rank-badge {
  @apply flex items-center;
}

.detail-metrics {
  @apply grid grid-cols-2 gap-4;
}

.metric-card {
  @apply bg-gray-800/50 rounded-sm p-4 text-center;
}

.metric-title {
  @apply text-gray-400 text-sm mb-2;
}

.metric-main-value {
  @apply text-2xl font-bold text-white mb-2;
}

.detail-info {
  @apply mt-6;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .stats-and-monitor-section {
    @apply grid-cols-1 gap-4;
  }
  
  .stats-cards {
    @apply grid-cols-1 gap-4;
  }
  
  .monitor-section {
    @apply col-span-1;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    @apply grid-cols-1;
  }
  
  .control-panel {
    @apply flex-col gap-4;
  }
  
  .control-left, .control-right {
    @apply w-full flex-wrap;
  }
  
  .cards-grid {
    @apply grid-cols-1;
  }
  
  .detail-metrics {
    @apply grid-cols-1;
  }
}
</style> 