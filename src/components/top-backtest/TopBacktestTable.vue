<template>
  <div class="top-backtest-table">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索股票代码或名称..."
          :prefix-icon="Search"
          clearable
          style="width: 300px"
          @input="handleSearch"
        />
        <el-select
          v-model="selectedStrategy"
          placeholder="选择策略"
          clearable
          style="width: 200px"
          @change="handleStrategyFilter"
        >
          <el-option
            v-for="strategy in strategyOptions"
            :key="strategy.value"
            :label="strategy.label"
            :value="strategy.value"
          />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button
          :icon="Refresh"
          @click="handleRefresh"
          :loading="loading"
        >
          刷新
        </el-button>
        <el-button
          :type="showFullAI ? 'primary' : 'default'"
          @click="toggleAIDisplay"
          size="default"
        >
          {{ showFullAI ? '简化AI' : '完整AI' }}
        </el-button>
      </div>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <el-table
        :data="paginatedData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :max-height="tableMaxHeight"
        @sort-change="handleSortChange"
      >
        <!-- 表格列定义 -->
        <el-table-column
          prop="stock_code"
          label="股票代码"
          width="120"
          sortable
        />
        <el-table-column
          prop="stock_name"
          label="股票名称"
          min-width="150"
          sortable
        />
        <!-- AI 分析列 -->
        <el-table-column
          prop="potential_rating"
          label="AI评级"
          width="100"
          sortable
          :sort-method="sortByRating"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.potential_rating"
              size="small"
              :class="['rating-tag', getRatingColorClass(row.potential_rating)]"
            >
              {{ row.potential_rating }}
            </el-tag>
            <span
              v-else
              class="text-gray-400"
            >-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="confidence_score"
          label="置信度"
          width="100"
          sortable
        >
          <template #default="{ row }">
            <span
              v-if="row.confidence_score !== undefined"
              :class="getConfidenceClass(row.confidence_score)"
            >
              {{ formatConfidenceScore(row.confidence_score) }}
            </span>
            <span
              v-else
              class="text-gray-400"
            >-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="showFullAI"
          prop="recommendation_reason"
          label="推荐理由"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span
              v-if="row.recommendation_reason"
              class="recommendation-text"
            >
              {{ row.recommendation_reason }}
            </span>
            <span
              v-else
              class="text-gray-400"
            >-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="showFullAI"
          prop="buy_point"
          label="买入点"
          width="100"
          sortable
        >
          <template #default="{ row }">
            <span
              v-if="row.buy_point"
              class="buy-point"
            >
              ¥{{ row.buy_point }}
            </span>
            <span
              v-else
              class="text-gray-400"
            >-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="showFullAI"
          prop="sell_point"
          label="卖出点"
          width="100"
          sortable
        >
          <template #default="{ row }">
            <span
              v-if="row.sell_point"
              class="sell-point"
            >
              ¥{{ row.sell_point }}
            </span>
            <span
              v-else
              class="text-gray-400"
            >-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="showFullAI"
          prop="risks"
          label="风险提示"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span
              v-if="row.risks"
              class="risk-text"
            >
              {{ row.risks }}
            </span>
            <span
              v-else
              class="text-gray-400"
            >-</span>
          </template>
        </el-table-column>
        <!-- 策略和回测指标列 -->
        <el-table-column
          prop="strategy_name"
          label="策略名称"
          min-width="150"
          sortable
        />
        <el-table-column
          prop="total_return"
          label="总收益率"
          width="120"
          sortable
        >
          <template #default="{ row }">
            <span :class="getReturnClass(row.total_return)">
              {{ formatPercentage(row.total_return) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="win_rate"
          label="胜率"
          width="100"
          sortable
        >
          <template #default="{ row }">
            <span :class="getWinRateClass(row.win_rate)">
              {{ formatPercentage(row.win_rate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="profit_factor"
          label="盈亏比"
          width="100"
          sortable
        >
          <template #default="{ row }">
            <span :class="getProfitFactorClass(row.profit_factor)">
              {{ formatNumber(row.profit_factor, 2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="max_drawdown"
          label="最大回撤"
          width="120"
          sortable
        >
          <template #default="{ row }">
            <span :class="getDrawdownClass(row.max_drawdown)">
              {{ formatPercentage(row.max_drawdown) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="sharpe_ratio"
          label="夏普比率"
          width="120"
          sortable
        >
          <template #default="{ row }">
            <span :class="getSharpeClass(row.sharpe_ratio)">
              {{ formatNumber(row.sharpe_ratio, 2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_at"
          label="创建时间"
          width="180"
          sortable
        >
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewStock(row)"
            >
              查看详情
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleViewChart(row)"
            >
              查看图表
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredData.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { formatPercentage, formatNumber, formatDate } from '@/utils/formatters'

// =============================================================================
// Props 定义
// =============================================================================

import type { TopStrategyStock } from '@/types/api'

interface Props {
  /** Top策略股票数据 */
  topStocks?: TopStrategyStock[]
  /** 加载状态 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  topStocks: () => [],
  loading: false
})

// =============================================================================
// Emits 定义
// =============================================================================

const emit = defineEmits<{
  refresh: []
  viewStock: [stock: TopStrategyStock]
  viewChart: [stock: TopStrategyStock]
}>()

// =============================================================================
// 响应式状态
// =============================================================================

const searchQuery = ref('')
const selectedStrategy = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const tableMaxHeight = ref(600) // 默认表格最大高度
const showFullAI = ref(true) // 是否显示完整AI分析信息

// 计算表格最大高度
const calculateTableHeight = () => {
  const windowHeight = window.innerHeight
  const toolbarHeight = 180 // 工具栏高度
  const paginationHeight = 80 // 分页器高度
  const padding = 350 // 页面内边距
  const minHeight = 400 // 最小高度
  
  const availableHeight = windowHeight - toolbarHeight - paginationHeight - padding
  tableMaxHeight.value = Math.max(availableHeight, minHeight)
}

// 窗口大小变化监听
const handleResize = () => {
  calculateTableHeight()
}

// =============================================================================
// 计算属性
// =============================================================================

/**
 * 策略选项
 */
const strategyOptions = computed(() => {
  if (!props.topStocks) return []

  const strategies = [...new Set(props.topStocks.map(stock => stock.strategy_name))]
  return strategies.map(strategy => ({
    label: strategy,
    value: strategy
  }))
})

/**
 * 过滤后的数据
 */
const filteredData = computed(() => {
  if (!props.topStocks) return []

  let result = [...props.topStocks]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(stock =>
      stock.stock_code.toLowerCase().includes(query) ||
      stock.stock_name.toLowerCase().includes(query)
    )
  }

  // 策略过滤
  if (selectedStrategy.value) {
    result = result.filter(stock => stock.strategy_name === selectedStrategy.value)
  }

  return result
})

/**
 * 分页后的数据
 */
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredData.value.slice(startIndex, endIndex)
})

// =============================================================================
// 方法
// =============================================================================

/**
 * 处理搜索
 */
const handleSearch = () => {
  currentPage.value = 1
}

/**
 * 处理策略过滤
 */
const handleStrategyFilter = () => {
  currentPage.value = 1
}

/**
 * 处理排序变化
 */
const handleSortChange = (config: { prop: string; order: string | null }) => {
  // Element Plus 的排序已经自动处理，这里可以添加额外逻辑
  console.log('排序变化:', config)
}

/**
 * AI评级自定义排序方法
 * 按照 高 > 中 > 低 的顺序排序
 */
const sortByRating = (a: any, b: any) => {
  const getRatingValue = (rating: string) => {
    if (!rating) return 0
    const ratingLower = rating.toLowerCase()

    // 高/A级/优秀/Strong
    if (ratingLower.includes('高') || ratingLower.includes('a') ||
      ratingLower.includes('优秀') || ratingLower.includes('strong')) {
      return 3
    }
    // 中/B级/良好/Good
    if (ratingLower.includes('中') || ratingLower.includes('b') ||
      ratingLower.includes('良好') || ratingLower.includes('good')) {
      return 2
    }
    // 低/C级/一般/Neutral
    if (ratingLower.includes('低') || ratingLower.includes('c') ||
      ratingLower.includes('一般') || ratingLower.includes('neutral')) {
      return 1
    }
    // 很差/D级/较差/Weak
    if (ratingLower.includes('很差') || ratingLower.includes('d') ||
      ratingLower.includes('较差') || ratingLower.includes('weak')) {
      return 0
    }
    return 0
  }

  const aValue = getRatingValue(a.potential_rating)
  const bValue = getRatingValue(b.potential_rating)

  return bValue - aValue // 降序排列：高 > 中 > 低
}

/**
 * 处理分页大小变化
 */
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

/**
 * 处理页码变化
 */
const handlePageChange = (page: number) => {
  currentPage.value = page
}

/**
 * 获取收益率样式类
 */
const getReturnClass = (value: number) => {
  if (value >= 0.1) return 'text-success'
  if (value >= 0.05) return 'text-warning'
  if (value >= 0) return 'text-info'
  return 'text-danger'
}

/**
 * 获取胜率样式类
 */
const getWinRateClass = (value: number) => {
  if (value >= 0.7) return 'text-success'
  if (value >= 0.6) return 'text-warning'
  if (value >= 0.5) return 'text-info'
  return 'text-danger'
}

/**
 * 获取盈亏比样式类
 */
const getProfitFactorClass = (value: number) => {
  if (value >= 2) return 'text-success'
  if (value >= 1.5) return 'text-warning'
  if (value >= 1) return 'text-info'
  return 'text-danger'
}

/**
 * 获取回撤样式类
 */
const getDrawdownClass = (value: number) => {
  if (value <= -0.2) return 'text-danger'
  if (value <= -0.1) return 'text-warning'
  if (value <= -0.05) return 'text-info'
  return 'text-success'
}

/**
 * 获取夏普比率样式类
 */
const getSharpeClass = (value: number) => {
  if (value >= 1.5) return 'text-success'
  if (value >= 1) return 'text-warning'
  if (value >= 0.5) return 'text-info'
  return 'text-danger'
}

/**
 * 获取AI评级标签类型
 */
const getRatingType = (rating: string) => {
  const ratingLower = rating.toLowerCase()
  
  // A级/优秀/Strong/高
  if (ratingLower.includes('a') || ratingLower.includes('优秀') || ratingLower.includes('strong') || ratingLower.includes('高')) {
    return 'success'
  }
  
  // B级/良好/Good/中
  if (ratingLower.includes('b') || ratingLower.includes('良好') || ratingLower.includes('good') || ratingLower.includes('中')) {
    return 'warning'
  }
  
  // C级/一般/Neutral/低
  if (ratingLower.includes('c') || ratingLower.includes('一般') || ratingLower.includes('neutral') || ratingLower.includes('低')) {
    return 'info'
  }
  
  // D级/较差/Weak/很差
  if (ratingLower.includes('d') || ratingLower.includes('较差') || ratingLower.includes('weak') || ratingLower.includes('很差')) {
    return 'danger'
  }
  
  return 'info'
}

/**
 * 获取AI评级自定义颜色类
 */
const getRatingColorClass = (rating: string) => {
  const ratingLower = rating.toLowerCase()
  
  // A级/优秀/Strong/高
  if (ratingLower.includes('a') || ratingLower.includes('优秀') || ratingLower.includes('strong') || ratingLower.includes('高')) {
    return 'rating-a'
  }
  
  // B级/良好/Good/中
  if (ratingLower.includes('b') || ratingLower.includes('良好') || ratingLower.includes('good') || ratingLower.includes('中')) {
    return 'rating-b'
  }
  
  // C级/一般/Neutral/低
  if (ratingLower.includes('c') || ratingLower.includes('一般') || ratingLower.includes('neutral') || ratingLower.includes('低')) {
    return 'rating-c'
  }
  
  // D级/较差/Weak/很差
  if (ratingLower.includes('d') || ratingLower.includes('较差') || ratingLower.includes('weak') || ratingLower.includes('很差')) {
    return 'rating-d'
  }
  
  return 'rating-default'
}

/**
 * 获取置信度样式类
 */
const getConfidenceClass = (score: number) => {
  // 如果分数大于1，说明已经是百分比形式
  const percentage = score > 1 ? score : score * 100
  
  if (percentage >= 80) return 'text-success'
  if (percentage >= 60) return 'text-warning'
  if (percentage >= 40) return 'text-info'
  return 'text-danger'
}

/**
 * 获取AI评级标签效果
 */
const getRatingEffect = (rating: string) => {
  const ratingLower = rating.toLowerCase()
  
  // A级/优秀/Strong/高
  if (ratingLower.includes('a') || ratingLower.includes('优秀') || ratingLower.includes('strong') || ratingLower.includes('高')) {
    return 'dark'
  }
  
  // B级/良好/Good/中
  if (ratingLower.includes('b') || ratingLower.includes('良好') || ratingLower.includes('good') || ratingLower.includes('中')) {
    return 'light'
  }
  
  // C级/一般/Neutral/低
  if (ratingLower.includes('c') || ratingLower.includes('一般') || ratingLower.includes('neutral') || ratingLower.includes('低')) {
    return 'plain'
  }
  
  // D级/较差/Weak/很差
  if (ratingLower.includes('d') || ratingLower.includes('较差') || ratingLower.includes('weak') || ratingLower.includes('很差')) {
    return 'dark'
  }
  
  return 'plain'
}

/**
 * 格式化置信度分数
 */
const formatConfidenceScore = (score: number) => {
  // 如果分数大于1，说明已经是百分比形式，直接显示
  if (score > 1) {
    return `${score.toFixed(1)}%`
  }
  // 如果分数小于等于1，说明是小数形式，转换为百分比
  return `${(score * 100).toFixed(1)}%`
}

/**
 * 处理刷新
 */
const handleRefresh = () => {
  emit('refresh')
}

/**
 * 处理查看股票详情
 */
const handleViewStock = (stock: TopStrategyStock) => {
  emit('viewStock', stock)
}

/**
 * 处理查看图表
 */
const handleViewChart = (stock: TopStrategyStock) => {
  emit('viewChart', stock)
}

/**
 * 切换AI分析显示模式
 */
const toggleAIDisplay = () => {
  showFullAI.value = !showFullAI.value
}

// =============================================================================
// 生命周期
// =============================================================================

onMounted(() => {
  calculateTableHeight()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/mixins.scss' as *;

.top-backtest-table {
  padding: 24px;

  @include mobile {
    padding: 16px;
  }
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  @include mobile {
    flex-direction: column;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: center;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

// 文本颜色样式 - 使用 Element Plus CSS 变量
.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}

.text-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}

.text-info {
  color: var(--el-color-info);
  font-weight: 600;
}

.text-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-gray-400 {
  color: var(--el-text-color-placeholder);
}

// AI 分析字段样式
.recommendation-text {
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.buy-point {
  color: var(--el-color-success);
  font-weight: 600;
  font-size: 14px;
}

.sell-point {
  color: var(--el-color-warning);
  font-weight: 600;
  font-size: 14px;
}

.risk-text {
  color: var(--el-color-danger);
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

// AI评级标签样式
.rating-tag {
  font-weight: 600;
  border-radius: 6px;
  border: none;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  // A级 - 金色渐变（最高评级）
  &.rating-a {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border: 1px solid #FF8C00;
    
    &:hover {
      background: linear-gradient(135deg, #FFA500, #FF8C00);
    }
  }
  
  // B级 - 绿色渐变（良好评级）
  &.rating-b {
    background: linear-gradient(135deg, #4CAF50, #45A049);
    border: 1px solid #388E3C;
    
    &:hover {
      background: linear-gradient(135deg, #45A049, #388E3C);
    }
  }
  
  // C级 - 蓝色渐变（一般评级）
  &.rating-c {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    border: 1px solid #1565C0;
    
    &:hover {
      background: linear-gradient(135deg, #1976D2, #1565C0);
    }
  }
  
  // D级 - 红色渐变（较差评级）
  &.rating-d {
    background: linear-gradient(135deg, #F44336, #D32F2F);
    border: 1px solid #C62828;
    
    &:hover {
      background: linear-gradient(135deg, #D32F2F, #C62828);
    }
  }
  
  // 默认评级
  &.rating-default {
    background: linear-gradient(135deg, #9E9E9E, #757575);
    border: 1px solid #616161;
    
    &:hover {
      background: linear-gradient(135deg, #757575, #616161);
    }
  }
}

// 表格容器样式
.table-container {
  width: 100%;
  overflow: auto;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  
  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 4px;
    
    &:hover {
      background: var(--el-border-color-hover);
    }
  }
  
  // 表格样式优化
  :deep(.el-table) {
    // 确保表格在容器内正确显示
    width: 100%;
    
    // 表头样式
    .el-table__header {
      th {
        background: var(--el-bg-color-page);
        color: var(--el-text-color-primary);
        font-weight: 600;
        border-bottom: 1px solid var(--el-border-color);
      }
    }
    
    // 表格行样式
    .el-table__row {
      &:hover {
        background: var(--el-fill-color-light);
      }
    }
    
    // 固定列样式
    .el-table__fixed-right {
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    }
  }
}
</style> 