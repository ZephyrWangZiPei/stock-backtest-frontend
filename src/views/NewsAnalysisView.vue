<template>
  <div class="news-analysis-view">
    <!-- 页面头部 -->
    <NewsAnalysisHeader :is-connected="isConnected" />

    <!-- 主要内容区域 -->
    <NewsAnalysisLayout>
      <!-- 左侧控制面板 -->
      <template #left>
        <NewsAnalysisControlPanel
          :is-connected="isConnected"
          :is-analyzing="isAnalyzing"
          :selected-stock="selectedStock"
          :analysis-date="analysisDate"
          :progress="progress"
          :analysis-logs="analysisLogs"
          :analysis-result="analysisResult"
          @start-analysis="handleStartAnalysis"
          @stock-select="handleStockSelect"
          @stock-clear="handleStockClear"
        />
      </template>

      <!-- 右侧结果面板 -->
      <template #right>
        <NewsAnalysisResultPanel
          :analysis-result="analysisResult"
          :show-all-news="showAllNews"
          @toggle-show-all="toggleShowAllNews"
          @export="handleExportNews"
        />
      </template>
    </NewsAnalysisLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useWebSocket } from '@/composables/useWebSocket'
import NewsAnalysisLayout from '@/components/news-analysis/NewsAnalysisLayout.vue'
import NewsAnalysisHeader from '@/components/news-analysis/NewsAnalysisHeader.vue'
import NewsAnalysisControlPanel from '@/components/news-analysis/NewsAnalysisControlPanel.vue'
import NewsAnalysisResultPanel from '@/components/news-analysis/NewsAnalysisResultPanel.vue'
import type { Stock } from '@/types/api'

// 定义日志项类型
interface LogItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  details?: string
}

interface RelatedStock {
  code: string
  name: string
}

interface AnalysisResult {
  relatedStocks: RelatedStock[]
  news: any[]
  sentimentSummary: any
}

// 响应式数据
const selectedStock = ref<Stock | null>(null)
const analysisDate = ref('')
const isAnalyzing = ref(false)
const progress = ref(0)
const analysisLogs = ref<LogItem[]>([])
const analysisResult = ref<AnalysisResult | null>(null)
const showAllNews = ref(false)

// WebSocket连接
const { isConnected, emit, on, destroy } = useWebSocket(
  {
    url: 'http://127.0.0.1:5000',
    path: '/socket.io/',
    transports: ['websocket'],
    namespace: '/news_analysis',
    autoConnect: true
  },
  {
    onConnect: () => {
      // WebSocket连接成功
    },
    onDisconnect: () => {
      // WebSocket连接断开
    },
    onConnectError: (error) => {
      console.error('WebSocket连接错误:', error)
      ElMessage.error('WebSocket连接失败')
    }
  }
)

// 方法
const handleStockSelect = (stock: Stock) => {
  selectedStock.value = stock
}

const handleStockClear = () => {
  selectedStock.value = null
}

const handleStartAnalysis = (data: { stockCode: string; analysisDate: string }) => {
  if (!isConnected.value) {
    ElMessage.error('WebSocket未连接，请刷新页面重试')
    return
  }

  // 重置状态
  isAnalyzing.value = true
  progress.value = 0
  analysisLogs.value = []
  analysisResult.value = null

  // 添加初始日志
  addLog('开始分析', '开始股票新闻分析流程', 'info')

  // 发送分析请求
  emit('start_news_analysis', {
    stock_code: data.stockCode,
    analysis_date: data.analysisDate
  })
}

const addLog = (step: string, message: string, type: 'info' | 'success' | 'error' | 'warning', details?: string) => {
  analysisLogs.value.push({
    id: Date.now().toString(),
    message: `${step}: ${message}`,
    type,
    timestamp: new Date(),
    details
  })
}

const toggleShowAllNews = () => {
  showAllNews.value = !showAllNews.value
}

const handleExportNews = () => {
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
  link.setAttribute('download', `新闻分析结果_${selectedStock.value?.code}_${analysisDate.value}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('新闻数据导出成功')
}

const getSentimentText = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '正面'
    case 'negative': return '负面'
    default: return '中性'
  }
}

// WebSocket事件监听
const setupWebSocketListeners = () => {
  // 分析进度更新
  on('news_analysis_progress', (data: { step: string; message: string; progress: number; details?: string }) => {
    progress.value = data.progress
    addLog(data.step, data.message, 'info', data.details)
  })

  // 分析完成
  on('news_analysis_success', (data: AnalysisResult) => {
    isAnalyzing.value = false
    progress.value = 100
    analysisResult.value = data
    addLog('分析完成', '新闻分析已完成', 'success')
    ElMessage.success('新闻分析完成')
  })

  // 分析错误
  on('news_analysis_error', (data: { error: string }) => {
    isAnalyzing.value = false
    addLog('分析失败', data.error, 'error')
    ElMessage.error(`分析失败: ${data.error}`)
  })
}

// 生命周期
onMounted(() => {
  setupWebSocketListeners()
})

onUnmounted(() => {
  destroy()
})
</script>

<style lang="scss" scoped>
.news-analysis-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  overflow: hidden;
    /* 防止整体出现滚动条 */
}
</style>