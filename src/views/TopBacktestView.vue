<template>
  <div class="top-backtest-container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Top策略回测</h1>
        <p class="page-subtitle">多策略回测胜率排行榜</p>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Refresh"
          @click="refreshData"
          :loading="loading"
          class="refresh-btn"
        >
          刷新数据
        </el-button>
        <el-button
          type="success"
          :icon="VideoPlay"
          @click="runBacktestJob"
          :loading="runningJob"
          class="run-job-btn"
        >
          {{ runningJob ? '执行中...' : '执行回测' }}
        </el-button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card group">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon>
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.summary?.total_strategies || 0 }}</div>
              <div class="stat-label">活跃策略</div>
            </div>
          </div>
        </div>

        <div class="stat-card group">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon>
                <Star />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.summary?.total_stocks || 0 }}</div>
              <div class="stat-label">Top股票</div>
            </div>
          </div>
        </div>

        <div class="stat-card group">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon>
                <Timer />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatLastUpdateTime(stats?.summary?.latest_update) }}</div>
              <div class="stat-label">最后更新</div>
            </div>
          </div>
        </div>

        <div class="stat-card group">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon>
                <Connection />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                <el-tag
                  type="success"
                  size="small"
                >
                  <el-icon>
                    <Check />
                  </el-icon>
                  已连接
                </el-tag>
              </div>
              <div class="stat-label">连接状态</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Section (only show when running) -->
    <div
      v-if="runningJob"
      class="progress-section"
    >
      <div class="progress-card group">
        <div class="progress-content">
          <div class="progress-header">
            <div class="progress-title">
              <el-icon class="progress-icon">
                <VideoPlay />
              </el-icon>
              <span>执行进度</span>
            </div>
            <div class="progress-percentage">{{ Math.round(jobProgress.progress) }}%</div>
          </div>
          <div class="progress-body">
            <el-progress
              :percentage="Math.round(jobProgress.progress)"
              :color="getProgressColor(jobProgress.progress)"
              :stroke-width="8"
              :show-text="false"
            />
            <div class="progress-detail">{{ jobProgress.detail }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="filter-card group">
        <div class="filter-content">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">搜索股票</label>
              <el-input
                v-model="searchQuery"
                placeholder="搜索股票代码或名称"
                :prefix-icon="Search"
                clearable
                class="filter-input"
              />
            </div>
            <div class="filter-item">
              <label class="filter-label">选择策略</label>
              <el-select
                v-model="selectedStrategy"
                placeholder="选择策略"
                clearable
                class="filter-input"
              >
                <el-option
                  v-for="strategy in availableStrategies"
                  :key="strategy.strategy_id"
                  :label="strategy.strategy_name"
                  :value="strategy.strategy_id"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <label class="filter-label">最小交易次数</label>
              <el-input-number
                v-model="minTradeCount"
                :min="0"
                :step="5"
                controls-position="right"
                class="filter-input"
                placeholder="最小交易次数"
              />
            </div>
          </div>
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">排序方式</label>
              <el-select
                v-model="sortBy"
                placeholder="排序方式"
                class="filter-input"
              >
                <el-option
                  label="胜率排序"
                  value="win_rate"
                />
                <el-option
                  label="年化收益"
                  value="annual_return"
                />
                <el-option
                  label="夏普比率"
                  value="sharpe_ratio"
                />
                <el-option
                  label="最大回撤"
                  value="max_drawdown"
                />
                <el-option
                  label="置信胜率"
                  value="win_rate_lb"
                />
                <el-option
                  label="期望收益"
                  value="expectancy"
                />
                <el-option
                  label="盈亏比"
                  value="profit_factor"
                />
                <el-option
                  label="交易次数"
                  value="trade_count"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <label class="filter-label">排序顺序</label>
              <el-select
                v-model="sortOrder"
                class="filter-input"
              >
                <el-option
                  label="降序"
                  value="desc"
                />
                <el-option
                  label="升序"
                  value="asc"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <label class="filter-label">视图模式</label>
              <el-button-group class="view-toggle">
                <el-button
                  :type="viewMode === 'table' ? 'primary' : 'default'"
                  :icon="List"
                  @click="viewMode = 'table'"
                >
                  表格视图
                </el-button>
                <el-button
                  :type="viewMode === 'card' ? 'primary' : 'default'"
                  :icon="Grid"
                  @click="viewMode = 'card'"
                >
                  卡片视图
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Display Section -->
    <div class="data-section">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <el-skeleton
          :rows="8"
          animated
        />
      </div>

      <!-- Data Content -->
      <div
        v-else-if="filteredData.length > 0"
        class="data-content"
      >
        <!-- Table View -->
        <div
          v-if="viewMode === 'table'"
          class="table-container group"
        >
          <div class="table-content">
            <el-table
              :data="paginatedData"
              stripe
              class="data-table"
              @sort-change="handleSortChange"
              default-sort="win_rate"
              height="calc(100vh - 800px)"
            >
              <el-table-column
                prop="strategy_name"
                label="策略"
                width="150"
                fixed
              />
              <el-table-column
                prop="stock_code"
                label="股票代码"
                width="120"
              />
              <el-table-column
                prop="stock_name"
                label="股票名称"
                width="150"
              />
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
                width="400"
              />
              <el-table-column
                prop="buy_point"
                label="AI建议买入"
                width="150"
              />
              <el-table-column
                prop="sell_point"
                label="AI建议卖出"
                width="150"
              />
              <el-table-column
                prop="risks"
                label="AI风险提示"
                width="200"
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
              <el-table-column
                label="操作"
                width="120"
                align="center"
                fixed="right"
              >
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
        </div>

        <!-- Card View -->
        <div
          v-else
          class="cards-container"
        >
          <div class="cards-grid">
            <div
              v-for="item in paginatedData"
              :key="`${item.strategy_id}-${item.stock_code}`"
              class="stock-card group"
              @click="viewDetail(item)"
            >
              <div class="card-content">
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
                  <el-tag
                    type="info"
                    size="small"
                  >{{ item.strategy_name }}</el-tag>
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
                    <span
                      class="metric-text"
                      :class="getReturnClass(item.profit_factor)"
                    >
                      {{ item.profit_factor?.toFixed(2) || '-' }}
                    </span>
                  </div>

                  <!-- AI Analysis Results -->
                  <div
                    v-if="item.potential_rating"
                    class="metric-item"
                  >
                    <span class="metric-label">AI潜力</span>
                    <el-tag
                      :type="getPotentialRatingTagType(item.potential_rating)"
                      size="small"
                      round
                    >
                      {{ item.potential_rating }}
                    </el-tag>
                  </div>

                  <div
                    v-if="item.confidence_score !== undefined && item.confidence_score !== null"
                    class="metric-item"
                  >
                    <span class="metric-label">AI置信</span>
                    <span class="metric-text">{{ item.confidence_score.toFixed(2) }}%</span>
                  </div>
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
      <div
        v-else
        class="empty-state"
      >
        <el-empty description="暂无数据">
          <div
            class="debug-info"
            style="margin-bottom: 20px; text-align: center; color: #999;"
          >
            <p>调试信息:</p>
            <p>原始数据长度: {{ topStrategyStocks.length }}</p>
            <p>过滤后数据长度: {{ filteredData.length }}</p>
            <p>搜索条件: "{{ searchQuery }}"</p>
            <p>策略过滤: {{ selectedStrategy }}</p>
            <p>最小交易次数: {{ minTradeCount }}</p>
          </div>
          <el-button
            type="primary"
            @click="runBacktestJob"
          >执行回测任务</el-button>
        </el-empty>
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="股票详情"
      width="800px"
      class="detail-dialog"
    >
      <div
        v-if="selectedStock"
        class="detail-content"
      >
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
        </div>

        <div class="detail-info">
          <el-descriptions
            :column="2"
            border
          >
            <el-descriptions-item label="置信胜率">
              {{ formatPercentage(selectedStock.win_rate_lb) }}
            </el-descriptions-item>
            <el-descriptions-item label="交易次数">
              {{ selectedStock.trade_count }}
            </el-descriptions-item>
            <el-descriptions-item label="期望收益">
              {{ formatPercentage(selectedStock.expectancy) }}
            </el-descriptions-item>
            <el-descriptions-item label="盈亏比">
              {{ selectedStock.profit_factor?.toFixed(2) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="回测天数">
              {{ selectedStock.backtest_period_days }}
            </el-descriptions-item>
            <el-descriptions-item
              label="AI潜力"
              v-if="selectedStock.potential_rating"
            >
              <el-tag
                :type="getPotentialRatingTagType(selectedStock.potential_rating)"
                size="small"
              >
                {{ selectedStock.potential_rating }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item
              label="AI置信"
              v-if="selectedStock.confidence_score !== undefined && selectedStock.confidence_score !== null"
            >
              {{ selectedStock.confidence_score.toFixed(2) }}%
            </el-descriptions-item>
            <el-descriptions-item
              label="AI推荐理由"
              :span="2"
              v-if="selectedStock.recommendation_reason"
            >
              {{ selectedStock.recommendation_reason }}
            </el-descriptions-item>
            <el-descriptions-item
              label="AI建议买入"
              :span="2"
              v-if="selectedStock.buy_point"
            >
              {{ selectedStock.buy_point }}
            </el-descriptions-item>
            <el-descriptions-item
              label="AI建议卖出"
              :span="2"
              v-if="selectedStock.sell_point"
            >
              {{ selectedStock.sell_point }}
            </el-descriptions-item>
            <el-descriptions-item
              label="AI风险提示"
              :span="2"
              v-if="selectedStock.risks"
            >
              {{ selectedStock.risks }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  TrendCharts,
  Star,
  Timer,
  Connection,
  Check,
  VideoPlay,
  Search,
  Refresh,
  Grid,
  List
} from '@element-plus/icons-vue'
import { getTopStrategyStocks, getTopStocksStats, runTopStrategyBacktestJob, getStrategies } from '@/utils/api'
import { usePageWebSocket } from '@/utils/pageWebSocketManager'

// WebSocket连接管理
const { pageManager, checkAndReconnect } = usePageWebSocket()

// 响应式数据
const loading = ref(false)
const runningJob = ref(false)
const stats = ref<any>({
  summary: {
    total_strategies: 0,
    total_stocks: 0,
    latest_update: null
  }
})
const topStrategyStocks = ref<any[]>([])
const availableStrategies = ref<any[]>([])

// 过滤和排序
const searchQuery = ref('')
const selectedStrategy = ref('')
const minTradeCount = ref(3)
const sortBy = ref('win_rate')
const sortOrder = ref('desc')
const viewMode = ref<'table' | 'card'>('table')

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 详情对话框
const detailDialogVisible = ref(false)
const selectedStock = ref<any>(null)

// 执行进度
const jobProgress = ref({
  progress: 0,
  detail: '',
  taskName: '',
  status: 'idle' as 'idle' | 'running' | 'completed' | 'failed'
})

// 计算属性
const filteredData = computed(() => {
  let data = topStrategyStocks.value
  console.log('filteredData 计算 - 原始数据长度:', data.length)

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    data = data.filter(item =>
      item.stock_code.toLowerCase().includes(query) ||
      item.stock_name.toLowerCase().includes(query)
    )
  }

  // 策略过滤
  if (selectedStrategy.value) {
    data = data.filter(item => item.strategy_id == selectedStrategy.value)
  }

  // 交易次数过滤
  if (minTradeCount.value > 0) {
    data = data.filter(item => item.trade_count >= minTradeCount.value)
  }
  return data
})

const sortedData = computed(() => {
  const data = [...filteredData.value]

  if (sortBy.value) {
    data.sort((a, b) => {
      let aVal = a[sortBy.value]
      let bVal = b[sortBy.value]

      // 处理null/undefined值
      if (aVal == null) aVal = sortOrder.value === 'desc' ? -Infinity : Infinity
      if (bVal == null) bVal = sortOrder.value === 'desc' ? -Infinity : Infinity

      if (sortOrder.value === 'desc') {
        return bVal - aVal
      } else {
        return aVal - bVal
      }
    })
  }

  return data
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    const [statsResponse, stocksResponse, strategiesResponse] = await Promise.all([
      getTopStocksStats(),
      getTopStrategyStocks(),
      getStrategies()
    ])

    // 处理API响应
    if (statsResponse.data) {
      stats.value = statsResponse.data
    }

    if (stocksResponse.data) {
      // 处理Top策略股票数据 - 需要展平数据结构
      const allStocks: any[] = []
      stocksResponse.data.forEach((strategyGroup: any) => {
        if (strategyGroup.top_stocks && Array.isArray(strategyGroup.top_stocks)) {
          // 确保每个股票对象都有正确的数据结构
          strategyGroup.top_stocks.forEach((stock: any) => {
            if (stock && typeof stock === 'object') {
              allStocks.push(stock)
            }
          })
        }
      })
      topStrategyStocks.value = allStocks
    }

    if (strategiesResponse.data) {
      availableStrategies.value = strategiesResponse.data
    }

    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

const runBacktestJob = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要执行Top策略回测吗？这可能需要一些时间。',
      '确认执行',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    runningJob.value = true
    jobProgress.value = {
      progress: 0,
      detail: '正在启动回测任务...',
      taskName: 'Top策略回测',
      status: 'running'
    }

    await runTopStrategyBacktestJob()
    ElMessage.success('回测任务已启动')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('启动回测任务失败:', error)
      ElMessage.error('启动回测任务失败')
      runningJob.value = false
      jobProgress.value.status = 'failed'
    }
  }
}

const handleSortChange = ({ prop, order }: any) => {
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

const viewDetail = (item: any) => {
  selectedStock.value = item
  detailDialogVisible.value = true
}

const formatPercentage = (value: number) => {
  if (value == null) return '-'
  return `${(value * 100).toFixed(2)}%`
}

const formatLastUpdateTime = (timestamp?: string) => {
  if (!timestamp) return '-'
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  } catch {
    return timestamp
  }
}

const getWinRateColor = (winRate: number) => {
  if (winRate >= 0.8) return '#67c23a'
  if (winRate >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const getReturnClass = (value: number) => {
  if (value == null) return ''
  if (value > 0.2) return 'positive-return'
  if (value < -0.1) return 'negative-return'
  return 'neutral-return'
}

const getSharpeClass = (value: number) => {
  if (value == null) return ''
  if (value > 1.5) return 'excellent-sharpe'
  if (value > 1.0) return 'good-sharpe'
  return 'poor-sharpe'
}

const getRankTagType = (rank: number) => {
  if (rank <= 3) return 'danger'
  if (rank <= 10) return 'warning'
  return 'info'
}

const getPotentialRatingTagType = (rating: string) => {
  switch (rating) {
    case '高': return 'success'
    case '中': return 'warning'
    case '低': return 'info'
    default: return 'info'
  }
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#e6a23c'
  return '#409eff'
}

// WebSocket事件处理
const handleWebSocketMessage = (data: any) => {
  try {
    // 处理job_progress事件
    if (data.job_name === 'top_strategy_backtest') {
      // 计算进度百分比
      const progress = data.total > 0 ? (data.progress / data.total) * 100 : data.progress || 0

      jobProgress.value = {
        progress: progress,
        detail: data.message || '',
        taskName: 'Top策略回测',
        status: 'running'
      }
    }

    // 处理job_status事件
    if (data.job_name === 'top_strategy_backtest' && data.status) {
      if (data.status === 'completed') {
        runningJob.value = false
        jobProgress.value = {
          progress: 100,
          detail: data.message || '任务完成',
          taskName: 'Top策略回测',
          status: 'completed'
        }
        ElMessage.success('回测任务已完成')
        refreshData() // 自动刷新数据
      } else if (data.status === 'failed') {
        runningJob.value = false
        jobProgress.value = {
          progress: 0,
          detail: data.message || '任务失败',
          taskName: 'Top策略回测',
          status: 'failed'
        }
        ElMessage.error('回测任务失败')
      } else if (data.status === 'started') {
        runningJob.value = true
        jobProgress.value = {
          progress: 0,
          detail: data.message || '任务开始',
          taskName: 'Top策略回测',
          status: 'running'
        }
      }
    }
  } catch (error) {
    console.error('[TopBacktestView] 处理WebSocket消息失败:', error)
  }
}

// WebSocket连接管理
const connectWebSocket = () => {
  if (pageManager) {
    // 使用现有的WebSocket连接
    checkAndReconnect()

    // 获取top_backtest连接管理器
    const topBacktestManager = pageManager.getManager('top_backtest')
    if (topBacktestManager) {
      // 监听job_progress和job_status事件
      topBacktestManager.on('job_progress', handleWebSocketMessage)
      topBacktestManager.on('job_status', handleWebSocketMessage)
    } else {
      console.warn('[TopBacktestView] 未找到top_backtest连接管理器')
    }
  }
}

const disconnectWebSocket = () => {
  if (pageManager) {
    // 移除事件监听器
    const topBacktestManager = pageManager.getManager('top_backtest')
    if (topBacktestManager) {
      topBacktestManager.off('job_progress', handleWebSocketMessage)
      topBacktestManager.off('job_status', handleWebSocketMessage)
    }
  }
}

// 监听器
watch(runningJob, (newVal) => {
  if (!newVal) {
    // 任务结束时重置进度
    setTimeout(() => {
      jobProgress.value = {
        progress: 0,
        detail: '',
        taskName: '',
        status: 'idle'
      }
    }, 3000)
  }
})

// 生命周期
onMounted(() => {
  refreshData()

  // 延迟连接WebSocket，确保页面管理器已初始化
  setTimeout(() => {
    connectWebSocket()
  }, 1000)
})



onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
/* Main container */
.top-backtest-container {
  @apply min-h-screen bg-gray-950 text-gray-100 p-6;
}

/* Page Header */
.page-header {
  @apply flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8;
}

.header-left {
  @apply flex-1;
}

.page-title {
  @apply text-4xl font-bold text-white mb-2;
}

.page-subtitle {
  @apply text-lg text-gray-400;
}

.header-right {
  @apply flex gap-3;
}

.refresh-btn,
.run-job-btn {
  @apply px-6 py-3 rounded-lg font-medium;
}

/* Stats Section */
.stats-section {
  @apply mb-8;
}

.stats-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6;
}

.stat-card {
  @apply relative;
}

.stat-card::before {
  content: '';
  @apply absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-75 transition duration-300;
}

.stat-card>div {
  @apply relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300;
}

.stat-content {
  @apply flex items-center gap-4;
}

.stat-icon {
  @apply flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center;
}

.stat-icon .el-icon {
  @apply text-blue-400 text-xl;
}

.stat-info {
  @apply flex-1 min-w-0;
}

.stat-value {
  @apply text-2xl font-bold text-white mb-1;
}

.stat-label {
  @apply text-gray-400 text-sm font-medium;
}

/* Progress Section */
.progress-section {
  @apply mb-8;
}

.progress-card {
  @apply relative;
  }
  
  .progress-card::before {
    content: '';
    @apply absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl opacity-50 group-hover:opacity-75 transition duration-300;
  }
  
  .progress-card>div {
    @apply relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300;
  }
  
  .progress-header {
    @apply flex justify-between items-center mb-4;
  }
  
  .progress-title {
    @apply flex items-center gap-2 text-white font-semibold text-lg;
  }
  
  .progress-icon {
    @apply text-purple-400;
    }
    
    .progress-percentage {
      @apply text-2xl font-bold text-white;
    }
    
    .progress-body {
      @apply space-y-3;
    }
    
        .progress-detail {
          @apply text-gray-300 text-sm font-medium;
        }
    
        /* Filter Section */
        .filter-section {
          @apply mb-8;
        }
    
        .filter-card {
          @apply relative;
        }
    
        .filter-card::before {
          content: '';
          @apply absolute -inset-1 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-xl opacity-50 group-hover:opacity-75 transition duration-300;
        }
    
        .filter-card>div {
          @apply relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-2xl hover:shadow-gray-500/10 transition-all duration-300;
        }
    
        .filter-content {
          @apply space-y-6;
        }
    
        .filter-row {
          @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
        }
    
        .filter-item {
          @apply flex flex-col gap-2;
        }
    
        .filter-label {
          @apply text-gray-300 text-sm font-medium;
        }
    
        .filter-input {
          @apply w-full;
        }
    
        .view-toggle {
          @apply w-full;
        }
    
        .view-toggle .el-button {
          @apply flex-1;
        }
    
        /* Data Section */
        .data-section {
          @apply flex-1;
        }
    
        .loading-state {
          @apply p-6;
        }
    
        .data-content {
          @apply space-y-6;
        }
    
        /* Table Container */
        .table-container {
          @apply relative;
        }
    
        .table-container::before {
          content: '';
          @apply absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-xl opacity-50 group-hover:opacity-75 transition duration-300;
        }
    
        .table-container>div {
          @apply relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden;
        }
    
        /* Table specific styling */
        .data-table {
          @apply w-full;
          --el-table-bg-color: #1F2937;
          --el-table-tr-bg-color: #374151;
          --el-table-header-bg-color: #111827;
          --el-table-header-text-color: #f3f4f6;
          --el-table-text-color: #d1d5db;
          --el-table-border-color: rgba(75, 85, 99, 0.2);
          --el-table-row-hover-bg-color: #4B5563;
        }
    
        .win-rate-cell {
          @apply flex items-center gap-2;
        }
    
        .win-rate-text {
          @apply text-xs font-medium text-gray-300;
        }
    
        /* Color classes for metrics */
        .positive-return,
        .excellent-sharpe {
          @apply text-green-400 font-semibold;
        }
    
        .negative-return,
        .poor-sharpe,
        .drawdown-text {
          @apply text-red-400 font-semibold;
        }
    
        .neutral-return,
        .good-sharpe {
          @apply text-yellow-400 font-semibold;
        }
    
        /* Cards Container */
        .cards-container {
          @apply space-y-6;
        }
    
        .cards-grid {
          @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
        }
    
        .stock-card {
          @apply relative;
        }
    
        .stock-card::before {
          content: '';
          @apply absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-75 transition duration-300;
        }
    
        .stock-card>div {
          @apply relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 flex flex-col gap-4 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1;
        }
    
        .card-header {
          @apply flex justify-between items-start gap-2 border-b border-gray-700 pb-3;
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
          @apply text-white text-sm font-medium;
        }
    
        /* Pagination Section */
        .pagination-section {
          @apply flex justify-center py-6 bg-gray-800/50 rounded-xl border border-gray-700/50;
        }
    
        /* Empty State */
        .empty-state {
          @apply flex flex-col items-center justify-center py-20;
        }
    
        /* Detail Dialog */
        .detail-dialog {
          --el-dialog-bg-color: #1a202c;
          --el-dialog-title-font-size: 1.5rem;
          --el-dialog-title-text-color: #f3f4f6;
          --el-dialog-header-padding: 20px 20px 0;
          --el-dialog-body-padding: 20px;
          --el-dialog-border-radius: 12px;
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
          @apply text-lg px-4 py-2;
        }
    
        .detail-metrics {
          @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
        }
    
        .metric-card {
          @apply bg-gray-900/70 rounded-lg p-4 text-center shadow-inner;
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
    
        /* Element Plus overrides */
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
    
        :deep(.el-input__wrapper),
        :deep(.el-select__wrapper),
        :deep(.el-input-number__controls) {
          @apply bg-gray-700/50 border border-gray-600;
        }
    
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .stats-grid {
            @apply grid-cols-2;
          }
      .filter-row {
        @apply grid-cols-1;
      }

  .cards-grid {
    @apply grid-cols-1;
  }
}
</style>