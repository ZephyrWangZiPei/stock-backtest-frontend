<template>
  <div class="stock-screening">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>股票筛选</h1>
      <p>基于多维度指标进行智能选股，发现优质投资标的</p>
    </div>

    <!-- 快速筛选模板 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <QuickTemplates 
          v-model:selectedTemplate="selectedTemplate"
          @apply-template="applyTemplate"
        />
      </el-col>
    </el-row>

    <!-- 筛选条件设置和结果展示 -->
    <el-row :gutter="20" class="screening-content">
      <!-- 筛选条件面板 -->
      <el-col :xs="24" :lg="8">
        <FilterPanel
          :filters="filters"
          @update:filters="updateFilters"
          :is-screening="isScreening"
          @start-screening="startScreening"
          @reset-filters="resetFilters"
          @save-template="saveTemplate"
        />
      </el-col>
      
      <!-- 筛选结果展示 -->
      <el-col :xs="24" :lg="16">
        <el-card class="result-panel">
          <template #header>
            <div class="card-header">
              <span>筛选结果 ({{ filteredStocks.length }})</span>
              <div class="header-actions">
                <el-select v-model="sortBy" placeholder="排序方式" size="small" style="width: 120px; margin-right: 10px">
                  <el-option label="综合评分" value="score" />
                  <el-option label="市值" value="market_cap" />
                  <el-option label="涨跌幅" value="change_pct" />
                  <el-option label="成交量" value="volume" />
                </el-select>
                <el-button size="small" @click="exportResults">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="result-content">
            <!-- 筛选统计 -->
            <ScreeningStats :stats="screeningStats" />
            
            <!-- 股票列表 -->
            <StockList
              :stocks="filteredStocks"
              :is-screening="isScreening"
              :current-page="currentPage"
              :page-size="pageSize"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              @view-detail="viewStockDetail"
              @add-to-watchlist="addToWatchlist"
              @add-to-candidate="addToCandidatePool"
              @reset-filters="resetFilters"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 股票详情对话框 -->
    <el-dialog
      v-model="stockDetailVisible"
      :title="`${selectedStock?.name} (${selectedStock?.code}) - 详细信息`"
      width="800px"
    >
      <div v-if="selectedStock" class="stock-detail">
        <el-tabs v-model="activeDetailTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="股票代码">{{ selectedStock.code }}</el-descriptions-item>
              <el-descriptions-item label="股票名称">{{ selectedStock.name }}</el-descriptions-item>
              <el-descriptions-item label="所属行业">{{ selectedStock.industry }}</el-descriptions-item>
              <el-descriptions-item label="最新价">¥{{ selectedStock.price }}</el-descriptions-item>
              <el-descriptions-item label="涨跌幅">{{ selectedStock.change_pct }}%</el-descriptions-item>
              <el-descriptions-item label="市值">{{ formatMarketCap(selectedStock.market_cap) }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="财务指标" name="financial">
            <el-row :gutter="20">
              <el-col :span="12">
                <h4>估值指标</h4>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="市盈率(PE)">{{ selectedStock.pe }}</el-descriptions-item>
                  <el-descriptions-item label="市净率(PB)">{{ selectedStock.pb }}</el-descriptions-item>
                  <el-descriptions-item label="净资产收益率(ROE)">{{ selectedStock.roe }}%</el-descriptions-item>
                </el-descriptions>
              </el-col>
              <el-col :span="12">
                <h4>技术指标</h4>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="RSI">{{ selectedStock.rsi }}</el-descriptions-item>
                  <el-descriptions-item label="换手率">{{ selectedStock.turnover }}%</el-descriptions-item>
                  <el-descriptions-item label="成交量">{{ formatVolume(selectedStock.volume) }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="AI分析" name="ai">
            <div class="ai-analysis">
              <el-alert title="AI智能分析" type="info" show-icon>
                <p>基于多维度数据分析，该股票具有以下特征：</p>
                <ul>
                  <li>财务状况：{{ getFinancialAnalysis(selectedStock) }}</li>
                  <li>技术面分析：{{ getTechnicalAnalysis(selectedStock) }}</li>
                  <li>投资建议：{{ getInvestmentAdvice(selectedStock) }}</li>
                </ul>
              </el-alert>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <el-button @click="stockDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="addToCandidatePool(selectedStock)">
          加入候选池
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { FilterPanel, QuickTemplates, StockList, ScreeningStats } from '@/components/stock-screening'

// 导入API客户端和WebSocket服务
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import type { ScreeningCondition, ScreeningRequest, ScreeningResult } from '@/utils/unifiedHttpClient'
import { websocketEventBus } from '@/utils/websocketEventBus'

// 响应式数据
const loading = ref(false)
const isScreening = ref(false)
const selectedTemplate = ref('')
const sortBy = ref('score')
const screeningType = ref<'technical' | 'fundamental' | 'comprehensive'>('comprehensive')

// 筛选结果
const screeningResults = ref<ScreeningResult[]>([])
const totalResults = ref(0)
const screeningSummary = ref<Record<string, any>>({})

// 分页
const currentPage = ref(1)
const pageSize = ref(50)

// UI状态
const stockDetailVisible = ref(false)
const selectedStock = ref<any>(null)
const activeDetailTab = ref('basic')

// 筛选条件
const filters = reactive({
  industry: [] as string[],
  marketCapRange: [0, 10000] as [number, number],
  priceMin: null as number | null,
  priceMax: null as number | null,
  peRange: [0, 100] as [number, number],
  pbRange: [0, 10] as [number, number],
  roeMin: null as number | null,
  debtRatioMax: null as number | null,
  rsiRange: [0, 100] as [number, number],
  macdSignal: 'all',
  maStatus: [] as string[],
  volumeCondition: 'all',
  turnoverRange: [0, 20] as [number, number]
})

// 筛选模板
const templates = ref<any[]>([])

// 计算属性
const filteredStocks = computed(() => {
  // 将API返回的结果转换为Stock格式
  return screeningResults.value.map(result => ({
    code: result.stock_code,
    name: result.stock_name,
    price: result.price,
    change_pct: result.change_pct,
    volume: result.volume,
    market_cap: result.market_cap || 0,
    pe: result.pe || 0,
    pb: result.pb || 0,
    roe: result.roe || 0,
    score: result.score || 0,
    industry: result.industry || '未知',
    tags: []
  }))
})

const screeningStats = computed(() => ({
  total: totalResults.value,
  avgScore: screeningSummary.value.avg_score || 0,
  excellent: screeningSummary.value.high_score_count || 0,
  duration: 1850
}))

// 计算属性
const formatMarketCap = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万亿`
  } else if (value >= 100) {
    return `${(value / 100).toFixed(1)}百亿`
  } else {
    return `${value.toFixed(1)}亿`
  }
}

const formatVolume = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万手`
  } else {
    return `${value.toFixed(0)}手`
  }
}

const getFinancialAnalysis = (stock: any) => {
  if (stock.roe > 15) return '财务状况优秀，盈利能力强'
  if (stock.roe > 10) return '财务状况良好，盈利稳定'
  return '财务状况一般，需关注盈利能力'
}

const getTechnicalAnalysis = (stock: any) => {
  if (stock.rsi < 30) return '技术面超卖，可能存在反弹机会'
  if (stock.rsi > 70) return '技术面超买，需注意回调风险'
  return '技术面相对平衡，可持续关注'
}

const getInvestmentAdvice = (stock: any) => {
  if (stock.score >= 4) return '综合评分较高，建议重点关注'
  if (stock.score >= 3) return '具备一定投资价值，可适度配置'
  return '投资价值有限，建议谨慎对待'
}

// 构建筛选请求
const buildScreeningRequest = (): ScreeningRequest => {
  const conditions: ScreeningCondition[] = []
  
  // 添加范围条件
  if (filters.marketCapRange[0] > 0 || filters.marketCapRange[1] < 10000) {
    conditions.push({
      field: 'market_cap',
      operator: 'between',
      value: [filters.marketCapRange[0], filters.marketCapRange[1]],
      label: '市值范围'
    })
  }
  
  if (filters.peRange[0] > 0 || filters.peRange[1] < 100) {
    conditions.push({
      field: 'pe',
      operator: 'between',
      value: [filters.peRange[0], filters.peRange[1]],
      label: 'PE范围'
    })
  }
  
  if (filters.pbRange[0] > 0 || filters.pbRange[1] < 10) {
    conditions.push({
      field: 'pb',
      operator: 'between',
      value: [filters.pbRange[0], filters.pbRange[1]],
      label: 'PB范围'
    })
  }
  
  if (filters.priceMin !== null || filters.priceMax !== null) {
    conditions.push({
      field: 'price',
      operator: 'between',
      value: [filters.priceMin || 0, filters.priceMax || 999999],
      label: '价格范围'
    })
  }
  
  if (filters.roeMin !== null) {
    conditions.push({
      field: 'roe',
      operator: 'gte',
      value: filters.roeMin,
      label: `ROE >= ${filters.roeMin}%`
    })
  }
  
  if (filters.industry.length > 0) {
    conditions.push({
      field: 'industry',
      operator: 'in',
      value: filters.industry,
      label: '行业筛选'
    })
  }
  
  return {
    conditions,
    sort_by: sortBy.value,
    sort_order: 'desc',
    limit: pageSize.value,
    offset: (currentPage.value - 1) * pageSize.value
  }
}

// 更新筛选条件
const updateFilters = (newFilters: any) => {
  Object.assign(filters, newFilters)
}

// 应用模板
const applyTemplate = (template: any) => {
  selectedTemplate.value = template.id
  
  // 重置筛选条件
  resetFilters()
  
  // 根据模板设置筛选条件
  if (template.filters) {
    Object.assign(filters, template.filters)
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    industry: [],
    marketCapRange: [0, 10000],
    priceMin: null,
    priceMax: null,
    peRange: [0, 100],
    pbRange: [0, 10],
    roeMin: null,
    debtRatioMax: null,
    rsiRange: [0, 100],
    macdSignal: 'all',
    maStatus: [],
    volumeCondition: 'all',
    turnoverRange: [0, 20]
  })
  selectedTemplate.value = ''
  ElMessage.info('筛选条件已重置')
}

const startScreening = async () => {
  try {
    isScreening.value = true
    
    const request = buildScreeningRequest()
    console.log('🔍 Starting screening with request:', request)
    
    let response
    switch (screeningType.value) {
      case 'technical':
        response = await unifiedHttpClient.screening.technicalScreening(request)
        break
      case 'fundamental':
        response = await unifiedHttpClient.screening.fundamentalScreening(request)
        break
      case 'comprehensive':
      default:
        response = await unifiedHttpClient.screening.comprehensiveScreening(request)
        break
    }
    
    if (response.data) {
      screeningResults.value = response.data.results || []
      totalResults.value = response.data.total || 0
      screeningSummary.value = response.data.summary || {}
      
      ElMessage.success(`筛选完成，找到 ${totalResults.value} 只股票`)
      console.log('✅ Screening completed:', response.data)
    }
  } catch (error) {
    console.error('❌ Screening failed:', error)
    ElMessage.error('筛选失败，请检查筛选条件')
    
    // 如果API调用失败，使用模拟数据
    // generateMockResults() // This line is removed as per the edit hint
  } finally {
    isScreening.value = false
  }
}

// 执行筛选
const executeScreening = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择筛选模板')
    return
  }
  
  try {
    isScreening.value = true
    screeningResults.value = []
    
    const request = {
      min_score: 60,
      max_results: 100,
      config: {
        template: selectedTemplate.value,
        conditions: screeningConditions.value
      }
    }
    
    let response
    switch (selectedTemplate.value) {
      case 'technical':
        response = await unifiedHttpClient.screening.technicalScreening(request)
        break
      case 'fundamental':
        response = await unifiedHttpClient.screening.fundamentalScreening(request)
        break
      case 'comprehensive':
      default:
        response = await unifiedHttpClient.screening.comprehensiveScreening(request)
        break
    }
    
    if (response.data && response.data.results) {
      screeningResults.value = response.data.results
      totalResults.value = response.data.total || response.data.results.length
      ElMessage.success(`筛选完成，找到 ${screeningResults.value.length} 只符合条件的股票`)
    } else {
      ElMessage.warning('筛选完成，但没有找到符合条件的股票')
      screeningResults.value = []
      totalResults.value = 0
    }
    
  } catch (error) {
    console.error('筛选失败:', error)
    ElMessage.error('筛选失败，请检查网络连接')
    screeningResults.value = []
    totalResults.value = 0
  } finally {
    isScreening.value = false
  }
}

const saveTemplate = () => {
  // 由子组件处理
}

const exportResults = () => {
  if (filteredStocks.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  // TODO: 实际导出逻辑
  ElMessage.success('筛选结果已导出')
}

const viewStockDetail = (stock: any) => {
  selectedStock.value = stock
  stockDetailVisible.value = true
  activeDetailTab.value = 'basic'
}

const addToWatchlist = (stock: any) => {
  // TODO: 实际添加到自选股逻辑
  ElMessage.success(`${stock.name} 已添加到自选股`)
}

const addToCandidatePool = (stock: any) => {
  // TODO: 实际添加到候选池逻辑
  ElMessage.success(`${stock.name} 已添加到候选池`)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  // 初始化默认筛选结果
  // generateMockResults() // This line is removed as per the edit hint
})

// WS: 监听 /screening 事件，展示进度并在完成/失败时刷新
onMounted(() => {
  const unsubscribe = websocketEventBus.subscribe({
    id: 'stock_screening_view_subscriber',
    namespace: '/screening',
    handler: async (event) => {
      console.log('🔌 [/screening] 事件:', event.event, event.data)
      switch (event.event) {
        case 'screening_started':
        case 'screening_progress': {
          isScreening.value = true
          break
        }
        case 'screening_completed': {
          isScreening.value = false
          // 完成后：按当前筛选条件重新请求一次 HTTP 结果
          await startScreening()
          break
        }
        case 'screening_error':
        case 'screening_cancelled': {
          isScreening.value = false
          // 失败/取消后：也刷新一次（可选）
          await startScreening()
          break
        }
      }
    }
  })

  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style lang="scss" scoped>
.stock-screening {
  padding: 20px;
  min-height: calc(100vh - 70px); // 确保最小高度
  overflow-y: auto; // 允许垂直滚动
  
  .page-header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 28px;
    }
    
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }

  .screening-content {
    .screening-controls {
      margin-bottom: 20px;
    }

    .screening-results {
      // 结果区域样式
    }
  }

  .stock-detail {
    .stock-info-tabs {
      .basic-info {
        max-height: 400px; // 限制最大高度
        overflow-y: auto; // 添加滚动条
      }

      .financial-data {
        max-height: 400px; // 限制最大高度
        overflow-y: auto; // 添加滚动条

        .financial-metrics {
          .metric-group {
            margin-bottom: 20px;

            h4 {
              margin: 0 0 12px 0;
              color: #303133;
              font-size: 16px;
            }

            .metric-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #ebeef5;

              &:last-child {
                border-bottom: none;
              }

              .metric-label {
                color: #606266;
                font-size: 14px;
              }

              .metric-value {
                color: #303133;
                font-weight: 500;
              }
            }
          }
        }
      }

      .technical-analysis {
        max-height: 400px; // 限制最大高度
        overflow-y: auto; // 添加滚动条

        .chart-placeholder {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          border-radius: 8px;
          color: #909399;

          p {
            margin: 16px 0 0 0;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .stock-screening {
    padding: 12px;

    .screening-content {
      .el-col {
        margin-bottom: 20px;
      }
    }
  }
}
</style> 