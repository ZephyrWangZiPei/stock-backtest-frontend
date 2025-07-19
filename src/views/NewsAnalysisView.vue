<template>
  <div class="news-analysis-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <div class="title-icon">📰</div>
            股票新闻分析
          </h1>
          <p class="page-subtitle">智能新闻采集与情感分析系统</p>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <!-- 配置组件 -->
      <NewsAnalysisConfig
        :is-connected="isConnected"
        :disabled="isAnalyzing"
        :loading="isAnalyzing"
        :selected-stock="selectedStock"
        :analysis-date="analysisDate"
        @start-analysis="handleStartAnalysis"
        @stock-select="handleStockSelect"
        @stock-clear="handleStockClear"
      />

      <!-- 进度组件 -->
      <ProgressCard
        v-if="isAnalyzing || analysisLogs.length > 0"
        :title="'⚡ 分析进度'"
        :status="getProgressStatus()"
        :percentage="progress"
        :logs="analysisLogs"
        :icon="'Lightning'"
      />

      <!-- 分析结果 -->
      <el-card
        v-if="analysisResult"
        class="result-card"
      >
        <template #header>
          <div class="card-header">
            <span>📈 分析结果</span>
          </div>
        </template>

        <!-- 相关股票 -->
        <div
          v-if="analysisResult.relatedStocks && analysisResult.relatedStocks.length > 0"
          class="related-stocks-section"
        >
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
        <NewsList
          v-if="analysisResult.news && analysisResult.news.length > 0"
          :news="analysisResult.news"
          :show-all-news="showAllNews"
          @toggle-show-all="toggleShowAllNews"
          @export="handleExportNews"
        />

        <!-- 情感分析汇总 -->
        <SentimentSummary
          v-if="analysisResult.sentimentSummary"
          :summary="analysisResult.sentimentSummary"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useWebSocket } from '@/composables/useWebSocket'
import NewsAnalysisConfig from '@/components/news-analysis/NewsAnalysisConfig.vue'
import ProgressCard from '@/components/common/ProgressCard.vue'
import NewsList from '@/components/news-analysis/NewsList.vue'
import SentimentSummary from '@/components/news-analysis/SentimentSummary.vue'
import type { LogItem } from '@/components/common/ProgressCard.vue'
import type { NewsItem } from '@/components/news-analysis/NewsList.vue'
import type { SentimentSummary as SentimentSummaryType } from '@/components/news-analysis/SentimentSummary.vue'
import type { Stock } from '@/types/api'

// 接口定义
interface RelatedStock {
  code: string
  name: string
}

interface AnalysisResult {
  relatedStocks: RelatedStock[]
  news: NewsItem[]
  sentimentSummary: SentimentSummaryType
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
      console.log('WebSocket连接成功')
    },
    onDisconnect: () => {
      console.log('WebSocket连接断开')
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
    step,
    message,
    type,
    timestamp: new Date(),
    details
  })
}

const getProgressStatus = () => {
  if (isAnalyzing.value) return 'running'
  if (analysisResult.value) return 'completed'
  if (analysisLogs.value.some(log => log.type === 'error')) return 'error'
  return 'pending'
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
    addLog('分析错误', data.error, 'error')
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
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

.news-analysis-page {
  .page-header {
    background: linear-gradient(135deg, $primary-color, $primary-dark);
    color: white;
    padding: $spacing-xxl 0;
    margin-bottom: $spacing-xxl;

    .header-content {
      @include container;

      .header-left {
        .page-title {
          @include flex(row, flex-start, center);
            margin: 0 0 $spacing-sm 0;
            font-size: $font-size-extra-large;
            font-weight: $font-weight-bold;
          
            .title-icon {
              font-size: $font-size-extra-large;
                margin-right: $spacing-md;
              }
              }
              
              .page-subtitle {
                margin: 0;
                font-size: $font-size-medium;
                opacity: 0.9;
              }
              }
              }
              }
              
              .page-content {
                @include container;
              
                .result-card {
                  @include card-base;
              
                  .card-header {
                    @include flex(row, space-between, center);
                    font-weight: $font-weight-medium;
                    color: $text-primary;
                  }
              
                  .related-stocks-section {
                    margin-bottom: $spacing-xxl;
              
                    .section-title {
                      @include flex(row, flex-start, center);
                      margin: 0 0 $spacing-lg 0;
                      font-size: $font-size-large;
                      font-weight: $font-weight-medium;
                      color: $text-primary;
                    }
              
                    .stocks-grid {
                      @include flex(row, flex-start, center);
                      gap: $spacing-sm;
                      flex-wrap: wrap;
              
                      .stock-tag {
                        font-size: $font-size-small;
                      }
                    }
                  }
                }
              }
              }
              
              // 响应式设计
              @include respond-to(sm) {
                .news-analysis-page {
                  .page-header {
                    padding: $spacing-xl 0;
              
                    .header-content {
                      .header-left {
                        .page-title {
                          font-size: $font-size-large;
                          flex-direction: column;
                          text-align: center;
              
                          .title-icon {
                            margin-right: 0;
                            margin-bottom: $spacing-sm;
                          }
                        }
                      }
                    }
                  }
              
                  .page-content {
                    .result-card {
                      .related-stocks-section {
                        .stocks-grid {
                          justify-content: center;
                        }
                      }
                    }
                  }
                }
}
</style>