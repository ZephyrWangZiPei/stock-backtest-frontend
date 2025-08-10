<template>
  <div class="candidate-selection">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>候选池管理</h1>
      <p>管理筛选出的候选股票，进行评分和投资决策</p>
    </div>
    
    <!-- 操作工具栏 -->
    <CandidateToolbar
      :selected-count="selectedCandidates.length"
      v-model:filter-status="filterStatus"
      v-model:search-keyword="searchKeyword"
      @refresh-candidates="refreshCandidates"
      @import-from-screening="importFromScreening"
      @batch-analysis="batchAnalysis"
    />

    <!-- 统计概览 -->
    <CandidateStats :stats="candidateStats" />

    <!-- 候选股票列表 -->
    <CandidateList
      :candidates="filteredCandidates"
      v-model:view-mode="viewMode"
      :current-page="currentPage"
      :page-size="pageSize"
      @selection-change="handleSelectionChange"
      @view-detail="viewCandidateDetail"
      @edit-candidate="editCandidate"
      @remove-candidate="removeCandidate"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 候选股票详情对话框 -->
    <el-dialog
      v-model="candidateDetailVisible"
      :title="`${selectedCandidate?.name} (${selectedCandidate?.code}) - 候选股票详情`"
      width="900px"
    >
      <div v-if="selectedCandidate" class="candidate-detail">
        <el-tabs v-model="activeDetailTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-descriptions title="股票信息" :column="1" border>
                  <el-descriptions-item label="股票代码">{{ selectedCandidate.code }}</el-descriptions-item>
                  <el-descriptions-item label="股票名称">{{ selectedCandidate.name }}</el-descriptions-item>
                  <el-descriptions-item label="所属行业">{{ selectedCandidate.industry }}</el-descriptions-item>
                  <el-descriptions-item label="最新价">¥{{ selectedCandidate.price }}</el-descriptions-item>
                  <el-descriptions-item label="涨跌幅">{{ selectedCandidate.change_pct }}%</el-descriptions-item>
                  <el-descriptions-item label="市值">{{ formatMarketCap(selectedCandidate.market_cap || 0) }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
              <el-col :span="12">
                <el-descriptions title="评估信息" :column="1" border>
                  <el-descriptions-item label="综合评分">
                    <el-rate v-model="selectedCandidate.score" disabled show-score text-color="#ff9900" :max="5" />
                  </el-descriptions-item>
                  <el-descriptions-item label="投资建议">
                    <el-tag :type="getRecommendationTagType(selectedCandidate.recommendation)">
                      {{ getRecommendationText(selectedCandidate.recommendation) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="加入时间">{{ formatDate(selectedCandidate.added_date) }}</el-descriptions-item>
                  <el-descriptions-item label="最后更新">{{ formatDate(selectedCandidate.last_updated || '') }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="财务分析" name="financial">
            <div class="financial-analysis">
      <el-row :gutter="20">
        <el-col :span="8">
                  <h4>估值指标</h4>
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="市盈率(PE)">{{ selectedCandidate.pe }}</el-descriptions-item>
                    <el-descriptions-item label="市净率(PB)">{{ selectedCandidate.pb }}</el-descriptions-item>
                    <el-descriptions-item label="市销率(PS)">{{ selectedCandidate.ps || '--' }}</el-descriptions-item>
                  </el-descriptions>
                </el-col>
                <el-col :span="8">
                  <h4>盈利能力</h4>
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="ROE">{{ selectedCandidate.roe }}%</el-descriptions-item>
                    <el-descriptions-item label="ROA">{{ selectedCandidate.roa || '--' }}%</el-descriptions-item>
                    <el-descriptions-item label="毛利率">{{ selectedCandidate.gross_margin || '--' }}%</el-descriptions-item>
                  </el-descriptions>
                </el-col>
                <el-col :span="8">
                  <h4>成长性</h4>
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="营收增长">{{ selectedCandidate.revenue_growth || '--' }}%</el-descriptions-item>
                    <el-descriptions-item label="利润增长">{{ selectedCandidate.profit_growth || '--' }}%</el-descriptions-item>
                    <el-descriptions-item label="EPS增长">{{ selectedCandidate.eps_growth || '--' }}%</el-descriptions-item>
                  </el-descriptions>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="技术分析" name="technical">
            <div class="technical-analysis">
              <el-row :gutter="20">
                <el-col :span="12">
                  <h4>技术指标</h4>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="RSI">{{ selectedCandidate.rsi }}</el-descriptions-item>
                    <el-descriptions-item label="MACD">{{ selectedCandidate.macd || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="KDJ">{{ selectedCandidate.kdj || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="布林带">{{ selectedCandidate.bollinger || '--' }}</el-descriptions-item>
                  </el-descriptions>
                </el-col>
                <el-col :span="12">
                  <h4>交易数据</h4>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="成交量">{{ formatVolume(selectedCandidate.volume) }}</el-descriptions-item>
                    <el-descriptions-item label="换手率">{{ selectedCandidate.turnover }}%</el-descriptions-item>
                    <el-descriptions-item label="振幅">{{ selectedCandidate.amplitude || '--' }}%</el-descriptions-item>
                    <el-descriptions-item label="量比">{{ selectedCandidate.volume_ratio || '--' }}</el-descriptions-item>
                  </el-descriptions>
        </el-col>
              </el-row>
              </div>
          </el-tab-pane>
          
          <el-tab-pane label="评估记录" name="evaluation">
            <div class="evaluation-history" style="max-height: 300px; overflow-y: auto;">
              <el-timeline>
                <el-timeline-item
                  v-for="record in evaluationHistory"
                  :key="record.id"
                  :timestamp="formatDate(record.date)"
                  :type="record.type"
                >
                  <h4>{{ record.title }}</h4>
                  <p>{{ record.description }}</p>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <el-button @click="candidateDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="selectedCandidate && editCandidate(selectedCandidate)">
          编辑评估
        </el-button>
            </template>
    </el-dialog>

    <!-- 编辑候选股票对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑候选股票"
      width="600px"
    >
      <el-form v-if="editingCandidate" :model="editingCandidate" label-width="100px">
        <el-form-item label="综合评分">
          <el-rate v-model="editingCandidate.score" show-score text-color="#ff9900" :max="5" />
        </el-form-item>
        
        <el-form-item label="投资建议">
          <el-select v-model="editingCandidate.recommendation" style="width: 100%">
            <el-option label="推荐买入" value="buy" />
            <el-option label="观望" value="watch" />
            <el-option label="不推荐" value="reject" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="editingCandidate.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入评估备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCandidate">保存</el-button>
                  </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Edit, 
  Delete, 
  Refresh, 
  Download,
  Upload,
  Search,
  Filter,
  Sort
} from '@element-plus/icons-vue'

// 导入API客户端和WebSocket服务
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import type { CandidateStock } from '@/utils/unifiedHttpClient'
import { websocketEventBus } from '@/utils/websocketEventBus'
import { realtimeDataService } from '@/services/realtimeDataService'

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const editDialogVisible = ref(false)
const batchOperationVisible = ref(false)
const filterPanelVisible = ref(false)
const candidateDetailVisible = ref(false)
const filterStatus = ref('all')
const searchKeyword = ref('')
const viewMode = ref('table')
const activeDetailTab = ref('basic')

// 候选股票列表
const candidates = ref<CandidateStock[]>([])
const selectedCandidates = ref<CandidateStock[]>([])
const editingCandidate = ref<Partial<CandidateStock>>({})
const selectedCandidate = ref<CandidateStock | null>(null)

// 分页和排序
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const sortBy = ref('score')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 搜索和筛选
const searchForm = reactive({
  keyword: '',
  minScore: 0,
  maxScore: 5,
  recommendation: '',
  industry: '',
  minPrice: '',
  maxPrice: '',
  minPE: '',
  maxPE: '',
  minPB: '',
  maxPB: ''
})

// 批量操作表单
const batchForm = reactive({
  operation: 'update',
  field: 'recommendation',
  value: '',
  selectedIds: [] as number[]
})

// 统计信息
const stats = ref({
  total: 0,
  buyRecommendations: 0,
  holdRecommendations: 0,
  sellRecommendations: 0,
  averageScore: 0,
  highScoreCount: 0
})

// 计算属性
const filteredCandidates = computed(() => {
  return candidates.value.filter(candidate => {
    // 关键词搜索
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      if (!candidate.stock_name.toLowerCase().includes(keyword) &&
          !candidate.stock_code.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 评分筛选
    if (candidate.score < searchForm.minScore || candidate.score > searchForm.maxScore) {
      return false
    }
    
    // 推荐类型筛选
    if (searchForm.recommendation && candidate.recommendation !== searchForm.recommendation) {
      return false
    }
    
    // 价格筛选
    if (searchForm.minPrice && candidate.price < Number(searchForm.minPrice)) {
      return false
    }
    if (searchForm.maxPrice && candidate.price > Number(searchForm.maxPrice)) {
      return false
    }
    
    // PE筛选
    if (searchForm.minPE && candidate.pe && candidate.pe < Number(searchForm.minPE)) {
      return false
    }
    if (searchForm.maxPE && candidate.pe && candidate.pe > Number(searchForm.maxPE)) {
      return false
    }
    
    // PB筛选
    if (searchForm.minPB && candidate.pb && candidate.pb < Number(searchForm.minPB)) {
      return false
    }
    if (searchForm.maxPB && candidate.pb && candidate.pb > Number(searchForm.maxPB)) {
      return false
    }
    
    return true
  })
})

// 候选股票统计
const candidateStats = computed(() => ({
  total: candidates.value.length,
  buyRecommendations: candidates.value.filter(c => c.recommendation === 'buy').length,
  holdRecommendations: candidates.value.filter(c => c.recommendation === 'watch').length,
  sellRecommendations: candidates.value.filter(c => c.recommendation === 'reject').length,
  averageScore: candidates.value.length > 0 
    ? candidates.value.reduce((sum, c) => sum + c.score, 0) / candidates.value.length
    : 0,
  highScoreCount: candidates.value.filter(c => c.score >= 4).length
}))

// 历史评估记录
const evaluationHistory = ref<any[]>([])

// 方法
const refreshCandidates = async () => {
  try {
    refreshing.value = true
    const response = await unifiedHttpClient.candidates.getCandidates({
      page: currentPage.value,
      limit: pageSize.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
      filters: buildFilters()
    })
    
    if (response.data) {
      candidates.value = response.data.candidates || []
      total.value = response.data.total || 0
    }
    
    console.log('📊 Candidates updated:', response.data)
  } catch (error) {
    console.error('Failed to fetch candidates:', error)
    ElMessage.error('获取候选股票失败')
    
    // 如果API调用失败，使用模拟数据
    await loadCandidates()
  } finally {
    refreshing.value = false
  }
}

const refreshStats = async () => {
  try {
    const response = await unifiedHttpClient.candidates.getStats()
    if (response.data) {
      stats.value = {
        total: response.data.total || 0,
        buyRecommendations: response.data.buyRecommendations || 0,
        holdRecommendations: response.data.holdRecommendations || 0,
        sellRecommendations: response.data.sellRecommendations || 0,
        averageScore: response.data.averageScore || 0,
        highScoreCount: response.data.highScoreCount || 0
      }
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    // 计算本地统计
    calculateLocalStats()
  }
}

const buildFilters = () => {
  const filters: Record<string, any> = {}
  
  if (searchForm.keyword) filters.keyword = searchForm.keyword
  if (searchForm.minScore > 0) filters.min_score = searchForm.minScore
  if (searchForm.maxScore < 5) filters.max_score = searchForm.maxScore
  if (searchForm.recommendation) filters.recommendation = searchForm.recommendation
  if (searchForm.industry) filters.industry = searchForm.industry
  if (searchForm.minPrice) filters.min_price = Number(searchForm.minPrice)
  if (searchForm.maxPrice) filters.max_price = Number(searchForm.maxPrice)
  if (searchForm.minPE) filters.min_pe = Number(searchForm.minPE)
  if (searchForm.maxPE) filters.max_pe = Number(searchForm.maxPE)
  if (searchForm.minPB) filters.min_pb = Number(searchForm.minPB)
  if (searchForm.maxPB) filters.max_pb = Number(searchForm.maxPB)
  
  return filters
}

const addCandidate = () => {
  editingCandidate.value = {
    stock_code: '',
    stock_name: '',
    price: 0,
    change_pct: 0,
    volume: 0,
    score: 3.0,
    recommendation: 'hold',
    notes: ''
  }
  editDialogVisible.value = true
}

const editCandidate = (candidate: CandidateStock) => {
  editingCandidate.value = { ...candidate }
  editDialogVisible.value = true
}

const saveCandidate = async () => {
  try {
    loading.value = true
    
    if (editingCandidate.value.id) {
      // 更新现有候选股票
      const response = await unifiedHttpClient.candidates.updateCandidate(
        editingCandidate.value.id,
        editingCandidate.value
      )
      ElMessage.success('候选股票已更新')
    } else {
      // 添加新候选股票
      const response = await unifiedHttpClient.candidates.addCandidate(editingCandidate.value)
      ElMessage.success('候选股票已添加')
    }
    
    editDialogVisible.value = false
    await refreshCandidates()
    await refreshStats()
  } catch (error) {
    console.error('Failed to save candidate:', error)
    ElMessage.error('保存候选股票失败')
  } finally {
    loading.value = false
  }
}

const deleteCandidate = async (candidate: CandidateStock) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除候选股票 ${candidate.stock_name}(${candidate.stock_code}) 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    if (candidate.id) {
      await unifiedHttpClient.candidates.deleteCandidate(candidate.id)
      ElMessage.success('候选股票已删除')
      
      await refreshCandidates()
      await refreshStats()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete candidate:', error)
      ElMessage.error('删除候选股票失败')
    }
  }
}

const batchDelete = async () => {
  if (selectedCandidates.value.length === 0) {
    ElMessage.warning('请先选择要删除的候选股票')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCandidates.value.length} 个候选股票吗？`,
      '确认批量删除',
      { type: 'warning' }
    )
    
    const ids = selectedCandidates.value.map(c => c.id).filter(Boolean) as number[]
    await unifiedHttpClient.candidates.batchOperation('delete', ids)
    
    ElMessage.success(`已删除 ${ids.length} 个候选股票`)
    selectedCandidates.value = []
    
    await refreshCandidates()
    await refreshStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to batch delete:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

const batchUpdate = async () => {
  if (batchForm.selectedIds.length === 0) {
    ElMessage.warning('请先选择要更新的候选股票')
    return
  }
  
  try {
    const updateData = { [batchForm.field]: batchForm.value }
    await unifiedHttpClient.candidates.batchOperation('update', batchForm.selectedIds, updateData)
    
    ElMessage.success(`已更新 ${batchForm.selectedIds.length} 个候选股票`)
    batchOperationVisible.value = false
    
    await refreshCandidates()
    await refreshStats()
  } catch (error) {
    console.error('Failed to batch update:', error)
    ElMessage.error('批量更新失败')
  }
}

const refreshData = async () => {
  try {
    loading.value = true
    
    const selectedIds = selectedCandidates.value.map(c => c.id).filter(Boolean) as number[]
    if (selectedIds.length > 0) {
      await unifiedHttpClient.candidates.refreshData(selectedIds)
      ElMessage.success(`已刷新 ${selectedIds.length} 个候选股票的数据`)
    } else {
      await unifiedHttpClient.candidates.refreshData()
      ElMessage.success('已刷新所有候选股票的数据')
    }
    
    await refreshCandidates()
  } catch (error) {
    console.error('Failed to refresh data:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

const exportCandidates = async (format: 'csv' | 'excel' = 'csv') => {
  try {
    loading.value = true
    const blob = await unifiedHttpClient.candidates.exportCandidates(format)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `candidates_${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('候选股票数据已导出')
  } catch (error) {
    console.error('Failed to export candidates:', error)
    ElMessage.error('导出数据失败')
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  currentPage.value = 1
  await refreshCandidates()
  filterPanelVisible.value = false
}

const clearFilters = () => {
  Object.assign(searchForm, {
    keyword: '',
    minScore: 0,
    maxScore: 5,
    recommendation: '',
    industry: '',
    minPrice: '',
    maxPrice: '',
    minPE: '',
    maxPE: '',
    minPB: '',
    maxPB: ''
  })
  applyFilters()
}

const handleSelectionChange = (selection: CandidateStock[]) => {
  selectedCandidates.value = selection
  batchForm.selectedIds = selection.map(c => c.id).filter(Boolean) as number[]
}

const handleSortChange = (sort: { prop: string, order: string }) => {
  if (sort.prop) {
    sortBy.value = sort.prop
    sortOrder.value = sort.order === 'ascending' ? 'asc' : 'desc'
    refreshCandidates()
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  refreshCandidates()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  refreshCandidates()
}

// 计算本地统计数据
const calculateLocalStats = () => {
  const total = candidates.value.length
  const buyCount = candidates.value.filter(c => c.recommendation === 'buy').length
  const holdCount = candidates.value.filter(c => c.recommendation === 'hold').length
  const sellCount = candidates.value.filter(c => c.recommendation === 'sell').length
  const averageScore = total > 0 
    ? candidates.value.reduce((sum, c) => sum + c.score, 0) / total 
    : 0
  const highScoreCount = candidates.value.filter(c => c.score >= 4.0).length
  
  stats.value = {
    total,
    buyRecommendations: buyCount,
    holdRecommendations: holdCount,
    sellRecommendations: sellCount,
    averageScore: Math.round(averageScore * 10) / 10,
    highScoreCount
  }
}

// 加载候选股票数据 - 使用真实API
const loadCandidates = async () => {
  try {
    loading.value = true
    
    const response = await unifiedHttpClient.candidates.getCandidates({
      page: currentPage.value,
      limit: pageSize.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
      filter_status: filterStatus.value,
      search_keyword: searchKeyword.value
    })
    
    if (response.data) {
      candidates.value = response.data.candidates || []
      total.value = response.data.total || 0
      calculateLocalStats()
    } else {
      ElMessage.error('获取候选股票失败')
      candidates.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载候选股票失败:', error)
    ElMessage.error('加载候选股票失败，请检查网络连接')
    candidates.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 工具方法
const formatMarketCap = (value: number) => {
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}亿`
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}万`
  return value.toString()
}

const formatVolume = (value: number) => {
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}亿`
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}万`
  return value.toString()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getRecommendationTagType = (recommendation: string) => {
  switch (recommendation) {
    case 'buy': return 'success'
    case 'watch': return 'warning'
    case 'reject': return 'danger'
    default: return 'info'
  }
}

const getRecommendationText = (recommendation: string) => {
  switch (recommendation) {
    case 'buy': return '推荐买入'
    case 'watch': return '观望'
    case 'reject': return '不推荐'
    default: return '未知'
  }
}

// 事件处理方法
const importFromScreening = (stocks: any[]) => {
  console.log('导入筛选结果:', stocks)
  ElMessage.success(`已导入 ${stocks.length} 只股票`)
}

const batchAnalysis = (selectedIds: number[]) => {
  console.log('批量分析:', selectedIds)
  ElMessage.success(`已启动 ${selectedIds.length} 只股票的批量分析`)
}

const viewCandidateDetail = (candidate: CandidateStock) => {
  selectedCandidate.value = candidate
  candidateDetailVisible.value = true
}

const removeCandidate = async (candidateId: number) => {
  try {
    await unifiedHttpClient.candidates.deleteCandidate(candidateId)
    ElMessage.success('删除成功')
    refreshCandidates()
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  refreshCandidates()
}

// 设置WebSocket事件监听
const setupWebSocketListeners = () => {
  const unsubscribe = websocketEventBus.subscribe({
    id: 'candidate_selection_subscriber',
    handler: (event) => {
      console.log('📡 Candidate event:', event)
      
      // 根据事件类型更新候选池
      switch (event.event) {
        case 'candidate_added':
        case 'candidate_updated':
        case 'candidate_removed':
          refreshCandidates()
          refreshStats()
          break
      }
    }
  })
  
  return unsubscribe
}

// 生命周期
onMounted(async () => {
  console.log('🚀 Initializing Candidate Selection View...')
  
  // 设置WebSocket监听
  const unsubscribe = setupWebSocketListeners()
  
  // 初始加载数据
  loading.value = true
  try {
    await Promise.all([
      refreshCandidates(),
      refreshStats()
    ])
    console.log('✅ Candidate Selection View initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Candidate Selection View:', error)
  } finally {
    loading.value = false
  }
  
  // 清理函数
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style lang="scss" scoped>
.candidate-selection {
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
  
  .candidate-detail {
    .financial-analysis,
    .technical-analysis {
      max-height: 300px; // 限制最大高度
      overflow-y: auto; // 添加滚动条
      
      h4 {
        margin: 0 0 12px 0;
        color: #303133;
        font-size: 14px;
      }
    }
    
    .evaluation-history {
      max-height: 300px; // 限制最大高度
      overflow-y: auto; // 添加滚动条
      
      h4 {
        margin: 0 0 4px 0;
        color: #303133;
        font-size: 14px;
      }
      
      p {
        margin: 0;
        color: #606266;
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 768px) {
  .candidate-selection {
    padding: 12px;
  }
}
</style> 