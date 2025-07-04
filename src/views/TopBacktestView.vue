<template>
  <div class="top-backtest-container">
    <!-- Main content wrapper for consistent spacing and max-width -->
    <div class="content-wrapper">
      <!-- Header Section -->
      <header class="page-header">
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
      </header>

      <!-- Stats and Monitor Section -->
      <section v-if="stats" class="stats-monitor-section">
        <div class="stats-cards-grid">
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
        
        <!-- Task Status Monitor -->
        <div class="monitor-area">
          <TaskStatusMonitor />
        </div>
      </section>

      <!-- Control Panel -->
      <section class="control-panel">
        <div class="control-group-left">
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
        <div class="control-group-right">
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
      </section>

      <!-- Main Data Display Area -->
      <main class="data-display-area">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="8" animated />
        </div>

        <!-- Data Content -->
        <div v-else-if="filteredData.length > 0" class="data-content-wrapper">
          <!-- Table View -->
          <div v-if="viewMode === 'table'" class="table-view-container">
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
                prop="potential_rating"
                label="AI潜力"
                width="100"
                align="center"
                sortable="custom"
              >
                <template #default="scope">
                  <el-tag
                    :type="getPotentialRatingTagType(scope.row.potential_rating)"
                    size="small"
                    round
                    v-if="scope.row.potential_rating"
                  >
                    {{ scope.row.potential_rating }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="confidence_score"
                label="AI置信"
                width="100"
                align="center"
                sortable="custom"
              >
                <template #default="scope">
                  <span v-if="scope.row.confidence_score !== undefined && scope.row.confidence_score !== null">
                    {{ scope.row.confidence_score.toFixed(2) }}%
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="recommendation_reason"
                label="AI推荐理由"
                width="200"
                show-overflow-tooltip
              />
              <el-table-column
                prop="buy_point"
                label="AI建议买入"
                width="150"
                show-overflow-tooltip
              />
              <el-table-column
                prop="sell_point"
                label="AI建议卖出"
                width="150"
                show-overflow-tooltip
              />
              <el-table-column
                prop="risks"
                label="AI风险提示"
                width="200"
                show-overflow-tooltip
              />
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

          <!-- Card View -->
          <div v-else class="card-view-container">
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

                  <!-- AI分析结果 - 潜力评级 -->
                  <div class="metric-item" v-if="item.potential_rating">
                    <span class="metric-label">AI潜力</span>
                    <el-tag
                      :type="getPotentialRatingTagType(item.potential_rating)"
                      size="small"
                      round
                    >
                      {{ item.potential_rating }}
                    </el-tag>
                  </div>

                  <!-- AI分析结果 - 置信率 -->
                  <div class="metric-item" v-if="item.confidence_score !== undefined && item.confidence_score !== null">
                    <span class="metric-label">AI置信</span>
                    <span class="metric-text">
                      {{ item.confidence_score.toFixed(2) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination-section">
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

        <!-- Empty Data State -->
        <div v-else class="empty-state">
          <el-empty description="暂无数据">
            <el-button type="primary" @click="runBacktestJob">执行回测任务</el-button>
          </el-empty>
        </div>
      </main>
    </div>

    <!-- Detail Dialog (outside main content flow to ensure proper z-index) -->
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

        <!-- Core Metrics -->
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

          <!-- AI Analysis Results - Core Metrics -->
          <div class="metric-card" v-if="selectedStock.potential_rating">
            <div class="metric-title">AI潜力评级</div>
            <div class="metric-main-value">
              <el-tag
                :type="getPotentialRatingTagType(selectedStock.potential_rating)"
                size="large"
                round
              >
                {{ selectedStock.potential_rating }}
              </el-tag>
            </div>
          </div>

          <div class="metric-card" v-if="selectedStock.confidence_score !== undefined && selectedStock.confidence_score !== null">
            <div class="metric-title">AI置信率</div>
            <div class="metric-main-value">
              {{ selectedStock.confidence_score.toFixed(2) }}%
            </div>
          </div>
        </div>

        <!-- Detailed Information -->
        <div class="detail-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="回测周期">{{ selectedStock.backtest_period_days }} 天</el-descriptions-item>
            <el-descriptions-item label="初始资金">¥{{ formatNumber(selectedStock.initial_capital) }}</el-descriptions-item>
            <el-descriptions-item label="总收益率">{{ formatPercentage(selectedStock.total_return) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(selectedStock.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(selectedStock.updated_at) }}</el-descriptions-item>

            <!-- AI analysis details -->
            <el-descriptions-item label="AI推荐理由" :span="2" v-if="selectedStock.recommendation_reason">
              {{ selectedStock.recommendation_reason }}
            </el-descriptions-item>
            <el-descriptions-item label="AI建议买入" :span="1" v-if="selectedStock.buy_point">
              {{ selectedStock.buy_point }}
            </el-descriptions-item>
            <el-descriptions-item label="AI建议卖出" :span="1" v-if="selectedStock.sell_point">
              {{ selectedStock.sell_point }}
            </el-descriptions-item>
            <el-descriptions-item label="AI风险提示" :span="2" v-if="selectedStock.risks">
              {{ selectedStock.risks }}
            </el-descriptions-item>
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
  // DeepSeek AI 分析结果字段
  potential_rating?: string
  confidence_score?: number
  recommendation_reason?: string
  buy_point?: string
  sell_point?: string
  risks?: string
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

    if ((stocksResponse as any).code===200) {
      rawData.value = (stocksResponse as any).data
    } else {
      ElMessage.error((stocksResponse as any).message || '获取数据失败')
    }

    if ((statsResponse as any).code===200) {
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

const getPotentialRatingTagType = (rating?: string) => {
  if (!rating) return 'info'
  switch (rating.toLowerCase()) {
    case '高': return 'success'
    case '中': return 'warning'
    case '低': return 'danger'
    default: return 'info'
  }
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
/* Main container for the entire view */
.top-backtest-container {
  @apply min-h-screen flex flex-col p-6 bg-gradient-to-br from-gray-950 to-gray-800 text-gray-100 font-sans;
  height: 100%;
  overflow-y: auto;
}

/* Wrapper for main content to apply max-width and center */
.content-wrapper {
  @apply w-full max-w-7xl mx-auto flex flex-col gap-8;
}

/* Page Header */
.page-header {
  @apply flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-700;
}

.header-left {
  @apply text-white;
}

.page-title {
  @apply text-4xl font-extrabold;
}

.page-subtitle {
  @apply text-lg text-gray-400;
}

.header-right {
  @apply flex gap-3;
}

/* Stats and Monitor Section */
.stats-monitor-section {
  @apply grid grid-cols-1 lg:grid-cols-4 gap-6;
}

.stats-cards-grid {
  @apply lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6;
}

.monitor-area {
  @apply lg:col-span-1;
}

.stat-card {
  @apply bg-gray-800/60 border border-gray-700 rounded-lg p-5 flex items-center gap-4 shadow-lg transition-all duration-300 hover:bg-gray-700/70 hover:shadow-xl;
}

.stat-icon {
  @apply flex-shrink-0 w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white text-2xl shadow-md;
}

.stat-content {
  @apply flex flex-col;
}

.stat-value {
  @apply text-3xl font-bold text-white;
}

.stat-label {
  @apply text-sm text-gray-400;
}

/* Control Panel */
.control-panel {
  @apply flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 bg-gray-800/60 border border-gray-700 rounded-lg shadow-lg;
}

.control-group-left,
.control-group-right {
  @apply flex flex-col sm:flex-row gap-4;
}

/* Specific input/select widths (adjust as needed for responsiveness) */
.search-input { @apply w-full sm:w-64; }
.strategy-select { @apply w-full sm:w-48; }
.trade-count-input { @apply w-full sm:w-40; }
.sort-select { @apply w-full sm:w-32; }
.sort-order-select { @apply w-full sm:w-24; }
.view-toggle-btn { @apply w-full sm:w-auto; }


/* Data Display Area */
.data-display-area {
  @apply flex flex-col gap-6;
}

.loading-state, .empty-state {
  @apply flex justify-center items-center py-10;
}

.data-content-wrapper {
  @apply flex flex-col gap-6;
}

/* Table View */
.table-view-container {
  @apply bg-gray-800/60 border border-gray-700 rounded-lg p-5 shadow-lg overflow-x-auto;
}

/* Table specific styling (Element Plus overrides) */
.data-table {
  @apply w-full;
  --el-table-bg-color: #1F2937; /* Darker background for table */
  --el-table-tr-bg-color: #374151; /* Slightly lighter background for table rows */
  --el-table-header-bg-color: #111827; /* Darkest background for table header */
  --el-table-header-text-color: #f3f4f6;
  --el-table-text-color: #d1d5db;
  --el-table-border-color: rgba(75, 85, 99, 0.2);
  --el-table-row-hover-bg-color: #4B5563;
}

.win-rate-cell {
  @apply flex items-center gap-2; /* Align progress and text horizontally */
}

.win-rate-text {
  @apply text-xs font-medium text-gray-300;
}

/* Color classes for metrics */
.positive-return, .excellent-sharpe { @apply text-green-400 font-semibold; }
.negative-return, .poor-sharpe, .drawdown-text { @apply text-red-400 font-semibold; }
.neutral-return, .good-sharpe { @apply text-yellow-400 font-semibold; } /* Adjusted yellow for better contrast */

/* Card View */
.cards-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.stock-card {
  @apply bg-gray-800/60 border border-gray-700 rounded-lg p-5 flex flex-col gap-3 shadow-lg cursor-pointer transition-all duration-300 hover:bg-gray-700/70 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1;
}

.card-header {
  @apply flex justify-between items-start gap-2 border-b border-gray-700 pb-3 mb-3;
}

.card-title {
  @apply flex flex-col;
}

.stock-code {
  @apply text-white font-bold text-xl;
}

.stock-name {
  @apply text-gray-400 text-sm;
}

.card-strategy {
  @apply mb-2;
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
  @apply text-white text-base font-medium;
}

/* Pagination */
.pagination-section {
  @apply py-4 flex justify-center;
}

/* Detail Dialog (Element Plus overrides) */
.detail-dialog {
  --el-dialog-bg-color: #1a202c; /* Darker background for dialog */
  --el-dialog-title-font-size: 1.5rem;
  --el-dialog-title-text-color: #f3f4f6;
  --el-dialog-header-padding: 20px 20px 0;
  --el-dialog-body-padding: 20px;
  --el-dialog-border-radius: 8px;
}

.detail-content {
  @apply space-y-6;
}

.detail-header {
  @apply flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-700;
}

.stock-info h3 {
  @apply text-2xl font-bold text-white;
}

.rank-badge .el-tag {
  @apply text-lg px-4 py-2; /* Make tag larger in dialog */
}

.detail-metrics {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

.metric-card {
  @apply bg-gray-900/70 rounded-lg p-4 text-center shadow-inner;
}

.metric-title {
  @apply text-gray-400 text-sm mb-2;
}

.metric-main-value {
  @apply text-3xl font-extrabold text-white mb-2;
}

.detail-info {
  @apply mt-6;
}

/* Element Plus Descriptions override */
:deep(.el-descriptions) {
  --el-descriptions-border-color: rgba(75, 85, 99, 0.3);
  --el-descriptions-header-text-color: #f3f4f6;
  --el-descriptions-item-label-color: #d1d5db;
  --el-descriptions-item-content-color: #f3f4f6;
  --el-descriptions-table-bg-color: transparent;
}
:deep(.el-descriptions__body) {
  background-color: transparent !important;
}
:deep(.el-descriptions__table) {
  background-color: transparent !important;
}

/* Element Plus button overrides for refresh/run buttons */
.refresh-btn, .run-job-btn {
  @apply px-6 py-3 rounded-md text-base;
}

/* Ensure Element Plus inputs/selects adapt to dark theme */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-input-number__controls) {
  @apply bg-gray-700/50 border border-gray-600;
}

:deep(.el-input__inner),
:deep(.el-select__placeholder),
:deep(.el-select__selected-item) {
  @apply text-gray-200;
}

:deep(.el-input__prefix-inner) {
  @apply text-gray-400;
}

:deep(.el-input-number__increase),
:deep(.el-input-number__decrease) {
  @apply bg-gray-700/50 border-gray-600 text-gray-200;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: #d1d5db;
  --el-pagination-button-bg-color: rgba(55, 65, 81, 0.4);
  --el-pagination-button-color: #d1d5db;
  --el-pagination-hover-color: #409eff;
  --el-pagination-active-color: #409eff;
  --el-pagination-border-radius: 4px;
}
:deep(.el-pager li) {
  @apply text-gray-300;
}
:deep(.el-pager li.is-active) {
  @apply text-blue-400 !important;
}
:deep(.el-pagination .el-select .el-input .el-input__wrapper) {
  @apply bg-gray-700/50 border-gray-600;
}

/* Progress bar color for win rate, ensure it's still good in dark mode */
:deep(.el-progress-bar__outer) {
  @apply bg-gray-700; /* Darker background for progress bar */
}

/* Skeleton loader adjustments */
:deep(.el-skeleton__item) {
  @apply bg-gray-700/50;
}

/* Empty state button */
.empty-container .el-button {
  @apply px-6 py-3;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .stats-monitor-section {
    @apply grid-cols-1;
  }
  .stats-cards-grid {
    @apply grid-cols-2; /* Adjust to 2 columns on medium screens */
  }
  .monitor-area {
    @apply col-span-1;
  }
  .cards-grid {
    @apply grid-cols-2; /* Adjust to 2 columns for card view on medium screens */
  }
}

@media (max-width: 768px) {
  .page-header {
    @apply items-center text-center;
  }
  .header-left {
    @apply w-full;
  }
  .header-right {
    @apply w-full justify-center;
  }
  .stats-cards-grid {
    @apply grid-cols-1; /* Adjust to 1 column on small screens */
  }
  .control-panel {
    @apply flex-col;
  }
  .control-group-left,
  .control-group-right {
    @apply w-full flex-col;
  }
  .search-input, .strategy-select, .trade-count-input,
  .sort-select, .sort-order-select, .view-toggle-btn {
    @apply w-full;
  }
  .cards-grid {
    @apply grid-cols-1; /* Adjust to 1 column for card view on small screens */
  }
  .detail-metrics {
    @apply grid-cols-1; /* Adjust detail metrics to 1 column on small screens */
  }
  .detail-header {
    @apply flex-col items-center text-center;
  }
}
</style> 