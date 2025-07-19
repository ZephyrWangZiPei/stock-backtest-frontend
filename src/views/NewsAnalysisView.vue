<template>
  <div class="news-analysis-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <div class="title-icon">
              📰
            </div>
            股票新闻分析
          </h1>
          <p class="page-subtitle">智能新闻采集与情感分析系统</p>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <!-- 配置卡片 -->
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>📊 分析配置</span>
            <el-tag v-if="isConnected" type="success" size="small">已连接</el-tag>
            <el-tag v-else type="danger" size="small">未连接</el-tag>
          </div>
        </template>

        <el-form label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="股票搜索">
                <div class="stock-search-container">
                  <el-input
                    v-model="stockSearchKeyword"
                    placeholder="输入股票代码或名称"
                    :disabled="isAnalyzing"
                    @input="debouncedSearchStocks"
                    @focus="showStockDropdown = true"
                    @blur="handleInputBlur"
                  >
                    <template #suffix>
                      <el-icon v-if="isSearching" class="is-loading">
                        <Loading />
                      </el-icon>
                    </template>
                  </el-input>

                  <!-- 股票搜索下拉框 -->
                  <div v-if="showStockDropdown && stockSearchResults.length > 0"
                       class="stock-dropdown">
                    <div
                      v-for="stock in stockSearchResults"
                      :key="stock.code"
                      @mousedown="selectStock(stock)"
                      class="stock-option"
                    >
                      <div class="stock-info">
                        <div class="stock-code">{{ stock.code }}</div>
                        <div class="stock-name">{{ stock.name }}</div>
                      </div>
                      <div class="stock-market">{{ stock.market }}</div>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="已选股票">
                <div v-if="selectedStock" class="selected-stock">
                  <el-tag type="primary" closable @close="clearSelectedStock">
                    {{ selectedStock.code }} - {{ selectedStock.name }}
                  </el-tag>
                </div>
                <div v-else class="no-stock-selected">
                  <span class="placeholder-text">请先搜索并选择股票</span>
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="分析日期">
                <el-date-picker
                  v-model="analysisDate"
                  type="date"
                  placeholder="选择分析日期"
                  :disabled="isAnalyzing"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item>
            <el-button
              type="primary"
              @click="startAnalysis"
              :disabled="!canStartAnalysis || isAnalyzing"
              :loading="isAnalyzing"
              size="large"
            >
              {{ isAnalyzing ? '分析中...' : '🔍 开始新闻分析' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 进度卡片 -->
      <el-card v-if="isAnalyzing || analysisLogs.length > 0" class="progress-card">
        <template #header>
          <div class="card-header">
            <span>⚡ 分析进度</span>
            <el-tag v-if="isAnalyzing" type="primary" size="small">进行中</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>

        <!-- 进度条 -->
        <div v-if="isAnalyzing" class="progress-section">
          <el-progress
            :percentage="progress"
            :status="progress === 100 ? 'success' : undefined"
            :stroke-width="8"
          />
          <div class="progress-text">{{ progress }}% 完成</div>
        </div>

        <!-- 实时日志 -->
        <div class="logs-container">
          <h4 class="logs-title">📋 分析日志</h4>
          <div class="logs-list">
            <div
              v-for="(log, index) in analysisLogs"
              :key="index"
              class="log-item"
              :class="getLogClass(log.type)"
            >
              <div class="log-content">
                <div class="log-header">
                  <div class="log-step">
                    <div class="log-dot" :class="getLogDotClass(log.type)"></div>
                    <span class="step-text">{{ log.step }}</span>
                  </div>
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                </div>
                <div class="log-message">{{ log.message }}</div>
                <div v-if="log.details" class="log-details">
                  <pre>{{ log.details }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 分析结果卡片 -->
      <el-card v-if="analysisResult" class="result-card">
        <template #header>
          <div class="card-header">
            <span>📈 分析结果</span>
            <div class="result-actions">
              <el-button @click="exportNews" size="small" type="success">
                导出新闻
              </el-button>
            </div>
          </div>
        </template>

        <!-- 相关股票 -->
        <div v-if="analysisResult.relatedStocks && analysisResult.relatedStocks.length > 0" class="related-stocks-section">
          <h3 class="section-title">🏢 相关股票</h3>
          <div class="stocks-grid">
            <el-tag
              v-for="stock in analysisResult.relatedStocks"
              :key="stock.code"
              type="info"
              size="large"
              class="stock-tag"
            >
              {{ stock.code }} - {{ stock.name }}
            </el-tag>
          </div>
        </div>

        <!-- 新闻列表 -->
        <div v-if="analysisResult.news && analysisResult.news.length > 0" class="news-section">
          <div class="news-header">
            <h3 class="section-title">📰 相关新闻 ({{ analysisResult.news.length }} 条)</h3>
            <div class="news-actions">
              <el-button
                @click="showAllNews = !showAllNews"
                size="small"
                type="primary"
                :icon="showAllNews ? 'ArrowUp' : 'ArrowDown'"
              >
                {{ showAllNews ? '收起详情' : '展开详情' }}
              </el-button>
            </div>
          </div>

          <!-- 新闻统计 -->
          <div class="news-stats">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value positive">{{ getNewsCountBySource('CCTV') }}</div>
                <div class="stat-label">CCTV新闻</div>
              </div>
              <div class="stat-item">
                <div class="stat-value primary">{{ getNewsCountBySource('百度经济') }}</div>
                <div class="stat-label">百度经济</div>
              </div>
              <div class="stat-item">
                <div class="stat-value warning">{{ getNewsCountBySource('东方财富') }}</div>
                <div class="stat-label">东方财富</div>
              </div>
              <div class="stat-item">
                <div class="stat-value info">{{ getNewsCountBySource('市场新闻') }}</div>
                <div class="stat-label">市场新闻</div>
              </div>
            </div>
          </div>

          <!-- 新闻列表 -->
          <div class="news-list">
            <div
              v-for="(news, index) in analysisResult.news"
              :key="index"
              class="news-item"
            >
              <el-card class="news-card" shadow="hover">
                <div class="news-content">
                  <div class="news-header">
                    <h4 class="news-title">{{ news.title }}</h4>
                    <div class="news-meta">
                      <el-tag size="small" type="info">{{ news.source }}</el-tag>
                      <span class="news-time">{{ formatDate(news.publish_time) }}</span>
                      <span class="news-length">{{ news.content.length }} 字符</span>
                    </div>
                  </div>

                  <div class="news-sentiment">
                    <el-tag
                      :type="getSentimentTagType(news.sentiment)"
                      size="small"
                    >
                      {{ getSentimentText(news.sentiment) }}
                    </el-tag>
                    <span class="sentiment-score">
                      得分: {{ news.sentiment_score?.toFixed(2) || 'N/A' }}
                    </span>
                  </div>

                  <!-- 新闻内容 -->
                  <div class="news-body">
                    <p class="news-text">
                      {{ expandedNews[index] || showAllNews ? news.content : getTruncatedContent(news.content) }}
                    </p>
                    <el-button
                      v-if="news.content.length > 200"
                      @click="toggleNewsContent(index)"
                      type="primary"
                      link
                      size="small"
                    >
                      {{ expandedNews[index] ? '收起' : '展开全文' }}
                    </el-button>
                  </div>

                  <!-- 新闻标签 -->
                  <div class="news-tags">
                    <el-tag size="small">{{ news.source }}</el-tag>
                    <el-tag
                      size="small"
                      :type="getSentimentTagType(news.sentiment)"
                    >
                      {{ getSentimentText(news.sentiment) }}
                    </el-tag>
                    <el-tag size="small" type="info">{{ formatDate(news.publish_time) }}</el-tag>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <!-- 情感分析汇总 -->
        <div v-if="analysisResult.sentimentSummary" class="sentiment-summary">
          <h3 class="section-title">💭 情感分析汇总</h3>
          <div class="summary-content">
            <div class="summary-stats">
              <div class="summary-item positive">
                <div class="summary-value">{{ analysisResult.sentimentSummary.positive_count }}</div>
                <div class="summary-label">正面新闻</div>
              </div>
              <div class="summary-item negative">
                <div class="summary-value">{{ analysisResult.sentimentSummary.negative_count }}</div>
                <div class="summary-label">负面新闻</div>
              </div>
              <div class="summary-item neutral">
                <div class="summary-value">{{ analysisResult.sentimentSummary.neutral_count }}</div>
                <div class="summary-label">中性新闻</div>
              </div>
            </div>
            <div class="summary-details">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="平均情感得分">
                  {{ analysisResult.sentimentSummary.avg_sentiment_score?.toFixed(2) || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item label="市场情感指数">
                  {{ analysisResult.sentimentSummary.market_sentiment_index?.toFixed(2) || 'N/A' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>
    </el-card>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { Loading } from '@element-plus/icons-vue'

interface AnalysisLog {
  step: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  timestamp: Date
  details?: string
}

interface RelatedStock {
  code: string
  name: string
}

interface NewsItem {
  title: string
  content: string
  source: string
  publish_time: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentiment_score: number
}

interface SentimentSummary {
  positive_count: number
  negative_count: number
  neutral_count: number
  avg_sentiment_score: number
  market_sentiment_index: number
}

interface AnalysisResult {
  relatedStocks: RelatedStock[]
  news: NewsItem[]
  sentimentSummary: SentimentSummary
}

// 响应式数据
const stockCode = ref('')
const analysisDate = ref('')
const isAnalyzing = ref(false)
const progress = ref(0)
const analysisLogs = ref<AnalysisLog[]>([])
const analysisResult = ref<AnalysisResult | null>(null)
const showAllNews = ref(false)
const expandedNews = ref<{ [key: number]: boolean }>({})

// 股票搜索相关
const stockSearchKeyword = ref('')
const stockSearchResults = ref<any[]>([])
const selectedStock = ref<any>(null)
const showStockDropdown = ref(false)
const isSearching = ref(false)
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// WebSocket连接
const socket = ref<Socket | null>(null)
const isConnected = ref(false)

// 计算属性
const canStartAnalysis = computed(() => {
  return selectedStock.value && analysisDate.value && isConnected.value
})

// 方法
const startAnalysis = () => {
  if (!canStartAnalysis.value) return

  // 重置状态
  isAnalyzing.value = true
  progress.value = 0
  analysisLogs.value = []
  analysisResult.value = null

  // 添加初始日志
  addLog('开始分析', '开始股票新闻分析流程', 'info')

  // 发送分析请求
  if (socket.value && isConnected.value) {
    socket.value.emit('start_news_analysis', {
      stock_code: stockCode.value.trim(),
      analysis_date: analysisDate.value
    })
  } else {
    addLog('连接错误', 'WebSocket连接未建立，请刷新页面重试', 'error')
    isAnalyzing.value = false
  }
}

const addLog = (step: string, message: string, type: 'info' | 'success' | 'error' | 'warning', details?: string) => {
  analysisLogs.value.push({
    step,
    message,
    type,
    timestamp: new Date(),
    details
  })
}

const getLogClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border border-green-200'
    case 'error':
      return 'bg-red-50 border border-red-200'
    case 'warning':
      return 'bg-yellow-50 border border-yellow-200'
    default:
      return 'bg-blue-50 border border-blue-200'
  }
}

const getLogDotClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-500'
    case 'error':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    default:
      return 'bg-blue-500'
  }
}

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 text-green-800'
    case 'negative':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getSentimentText = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return '正面'
    case 'negative':
      return '负面'
    default:
      return '中性'
  }
}

const getSentimentTagType = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'success'
    case 'negative':
      return 'danger'
    default:
      return 'info'
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

// 新闻相关方法
const getNewsCountBySource = (source: string) => {
  if (!analysisResult.value?.news) return 0
  return analysisResult.value.news.filter(news => news.source === source).length
}

const getTruncatedContent = (content: string) => {
  return content.length > 200 ? content.substring(0, 200) + '...' : content
}

const toggleNewsContent = (index: number) => {
  expandedNews.value[index] = !expandedNews.value[index]
}

const exportNews = () => {
  if (!analysisResult.value?.news) return
  
  const newsData = analysisResult.value.news.map(news => ({
    标题: news.title,
    内容: news.content,
    来源: news.source,
    发布时间: news.publish_time,
    情感: getSentimentText(news.sentiment),
    情感得分: news.sentiment_score
  }))
  
  const csvContent = [
    Object.keys(newsData[0]).join(','),
    ...newsData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `新闻分析结果_${stockCode.value}_${analysisDate.value}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 股票搜索相关方法
const searchStocks = async () => {
  if (!stockSearchKeyword.value.trim()) {
    stockSearchResults.value = []
    return
  }
  
  isSearching.value = true
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    const response = await fetch(`${baseUrl}/api/stocks/?keyword=${encodeURIComponent(stockSearchKeyword.value)}&per_page=10&stock_type=stock`)
    const data = await response.json()
    
    if (data.code === 200 && data.data && data.data.items) {
      stockSearchResults.value = data.data.items
    } else {
      stockSearchResults.value = []
    }
  } catch (error) {
    console.error('搜索股票失败:', error)
    stockSearchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 防抖搜索
const debouncedSearchStocks = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    searchStocks()
  }, 300)
}

// 处理输入框失焦
const handleInputBlur = () => {
  // 延迟隐藏下拉框，给用户时间点击选项
  setTimeout(() => {
    showStockDropdown.value = false
  }, 200)
}

const selectStock = (stock: any) => {
  selectedStock.value = stock
  stockCode.value = stock.code
  stockSearchKeyword.value = stock.name
  showStockDropdown.value = false
  stockSearchResults.value = []
}

const clearSelectedStock = () => {
  selectedStock.value = null
  stockCode.value = ''
  stockSearchKeyword.value = ''
  stockSearchResults.value = []
}

// WebSocket事件监听
const setupWebSocketListeners = () => {
  if (!socket.value) return

  // 分析进度更新
  socket.value.on('news_analysis_progress', (data: { step: string; message: string; progress: number; details?: string }) => {
    progress.value = data.progress
    addLog(data.step, data.message, 'info', data.details)
  })

  // 分析成功
  socket.value.on('news_analysis_success', (data: AnalysisResult) => {
    progress.value = 100
    analysisResult.value = data
    addLog('分析完成', '新闻分析已完成', 'success')
    isAnalyzing.value = false
  })

  // 分析错误
  socket.value.on('news_analysis_error', (data: { error: string }) => {
    addLog('分析失败', data.error, 'error')
    isAnalyzing.value = false
  })

  // 连接状态变化
  socket.value.on('connect', () => {
    addLog('连接状态', 'WebSocket连接已建立', 'success')
  })

  socket.value.on('disconnect', () => {
    addLog('连接状态', 'WebSocket连接已断开', 'warning')
  })
}

// 初始化WebSocket连接
const initWebSocket = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  
  try {
    socket.value = io(`${baseUrl}/news_analysis`, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    socket.value.on('connect', () => {
      console.log('新闻分析WebSocket连接成功')
      isConnected.value = true
      addLog('连接状态', 'WebSocket连接已建立', 'success')
    })

    socket.value.on('disconnect', () => {
      console.log('新闻分析WebSocket连接断开')
      isConnected.value = false
      addLog('连接状态', 'WebSocket连接已断开', 'warning')
    })

    socket.value.on('connect_error', (error) => {
      console.error('新闻分析WebSocket连接错误:', error)
      isConnected.value = false
      addLog('连接状态', `WebSocket连接错误: ${error.message}`, 'error')
    })

    socket.value.on('connect_timeout', () => {
      console.error('新闻分析WebSocket连接超时')
      isConnected.value = false
      addLog('连接状态', 'WebSocket连接超时', 'error')
    })

    setupWebSocketListeners()
  } catch (error) {
    console.error('初始化WebSocket失败:', error)
    addLog('连接状态', '初始化WebSocket失败', 'error')
  }
}

// 生命周期
onMounted(() => {
  // 设置默认日期为今天
  const today = new Date()
  analysisDate.value = today.toISOString().split('T')[0]
  
  initWebSocket()
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.off('news_analysis_progress')
    socket.value.off('news_analysis_success')
    socket.value.off('news_analysis_error')
  }
})
</script>

<style scoped>
/* 页面布局 */
.news-analysis-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
}

/* 页面头部 */
.page-header {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.title-icon {
  font-size: 32px;
  margin-right: 12px;
}

.page-subtitle {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

/* 主要内容区域 */
.page-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

/* 卡片样式 */
.config-card, .progress-card, .result-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

/* 股票搜索 */
.stock-search-container {
  position: relative;
}

.stock-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.stock-option {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.stock-option:hover {
  background-color: #f5f7fa;
}

.stock-option:last-child {
  border-bottom: none;
}

.stock-info {
  display: flex;
  flex-direction: column;
}

.stock-code {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.stock-name {
  color: #606266;
  font-size: 12px;
  margin-top: 2px;
}

.stock-market {
  color: #909399;
  font-size: 12px;
  align-self: flex-end;
}

.selected-stock {
  display: flex;
  align-items: center;
}

.no-stock-selected {
  color: #c0c4cc;
  font-style: italic;
}

.placeholder-text {
  font-size: 14px;
}

/* 进度相关 */
.progress-section {
  margin-bottom: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  color: #606266;
  font-size: 14px;
}

/* 日志样式 */
.logs-container {
  margin-top: 20px;
}

.logs-title {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
}

.logs-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafafa;
}

.log-item {
  border-bottom: 1px solid #ebeef5;
  animation: fadeIn 0.3s ease-in-out;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.info {
  background: #f0f9ff;
  border-left: 4px solid #409eff;
}

.log-item.success {
  background: #f0f9f0;
  border-left: 4px solid #67c23a;
}

.log-item.warning {
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
}

.log-item.error {
  background: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.log-content {
  padding: 12px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-step {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.log-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.log-dot.info { background: #409eff; }
.log-dot.success { background: #67c23a; }
.log-dot.warning { background: #e6a23c; }
.log-dot.error { background: #f56c6c; }

.step-text {
  font-size: 14px;
}

.log-time {
  color: #909399;
  font-size: 12px;
}

.log-message {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.log-details {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
}

.log-details pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 结果相关 */
.related-stocks-section {
  margin-bottom: 30px;
}

.section-title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.stocks-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stock-tag {
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 10px;
}

/* 新闻相关 */
.news-section {
  margin-top: 30px;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.news-actions {
  display: flex;
  gap: 10px;
}

.news-stats {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-value.positive { color: #67c23a; }
.stat-value.primary { color: #409eff; }
.stat-value.warning { color: #e6a23c; }
.stat-value.info { color: #909399; }

.stat-label {
  color: #606266;
  font-size: 14px;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.news-item {
  width: 100%;
}

.news-card {
  transition: all 0.3s ease;
}

.news-card:hover {
  transform: translateY(-2px);
}

.news-content {
  padding: 0;
}

.news-header {
  margin-bottom: 16px;
}

.news-title {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.news-time, .news-length {
  color: #909399;
  font-size: 12px;
}

.news-sentiment {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.sentiment-score {
  color: #606266;
  font-size: 12px;
}

.news-body {
  margin-bottom: 16px;
}

.news-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.news-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 情感分析汇总 */
.sentiment-summary {
  margin-top: 30px;
}

.summary-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: white;
}

.summary-item.positive {
  border-left: 4px solid #67c23a;
}

.summary-item.negative {
  border-left: 4px solid #f56c6c;
}

.summary-item.neutral {
  border-left: 4px solid #909399;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.summary-item.positive .summary-value { color: #67c23a; }
.summary-item.negative .summary-value { color: #f56c6c; }
.summary-item.neutral .summary-value { color: #909399; }

.summary-label {
  color: #606266;
  font-size: 14px;
}

.summary-details {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .news-analysis-page {
    padding: 10px;
  }

  .page-header {
    padding: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .title-icon {
    font-size: 28px;
  }

  .stats-grid, .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .news-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 滚动条样式 */
.page-content::-webkit-scrollbar,
.logs-list::-webkit-scrollbar,
.news-list::-webkit-scrollbar,
.stock-dropdown::-webkit-scrollbar {
  width: 6px;
}

.page-content::-webkit-scrollbar-track,
.logs-list::-webkit-scrollbar-track,
.news-list::-webkit-scrollbar-track,
.stock-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.page-content::-webkit-scrollbar-thumb,
.logs-list::-webkit-scrollbar-thumb,
.news-list::-webkit-scrollbar-thumb,
.stock-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.page-content::-webkit-scrollbar-thumb:hover,
.logs-list::-webkit-scrollbar-thumb:hover,
.news-list::-webkit-scrollbar-thumb:hover,
.stock-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>