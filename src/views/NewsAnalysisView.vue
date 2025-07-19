<template>
  <div class="news-analysis-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-container">
        <div class="header-content">
          <div class="header-left">
            <div class="title-section">
              <div class="title-icon">
                <el-icon
                  size="32"
                  class="text-blue-400"
                >
                  <Document />
                </el-icon>
              </div>
              <div class="title-text">
                <h1 class="page-title">股票新闻分析</h1>
                <p class="page-subtitle">智能新闻采集与情感分析系统</p>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="connection-status">
              <el-tag
                :type="isConnected ? 'success' : 'danger'"
                size="large"
                class="status-tag"
                effect="dark"
              >
                <el-icon class="status-icon">
                  <component :is="isConnected ? 'CircleCheck' : 'CircleClose'" />
                </el-icon>
                {{ isConnected ? '已连接' : '未连接' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <div class="content-container">
        <!-- 配置组件 -->
        <div class="config-section">
          <div class="relative group">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"
            ></div>
            <div
              class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
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
            </div>
          </div>
        </div>

        <!-- 进度组件 -->
        <div
          v-if="isAnalyzing || analysisLogs.length > 0"
          class="progress-section"
        >
          <div class="relative group">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"
            ></div>
            <div
              class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-green-500/10 transition-all duration-300"
            >
              <ProgressCard
                :title="'⚡ 分析进度'"
                :status="getProgressStatus()"
                :percentage="progress"
                :logs="analysisLogs"
                :icon="'Lightning'"
              />
            </div>
          </div>
        </div>

        <!-- 分析结果 -->
        <div
          v-if="analysisResult"
          class="result-section"
        >
          <div class="relative group">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"
            ></div>
            <div
              class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <div class="p-6">
                <!-- 结果头部 -->
                <div class="result-header">
                  <div class="header-left">
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-indigo-400 rounded-md animate-pulse"></div>
                      <span
                        class="font-bold text-xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent"
                      >分析结果</span>
                    </div>
                  </div>
                  <div class="header-actions">
                    <el-button
                      type="primary"
                      size="small"
                      @click="handleExportNews"
                      :icon="Download"
                      effect="dark"
                      class="hover:bg-indigo-600 transition-colors"
                    >
                      导出结果
                    </el-button>
                  </div>
                </div>

                <!-- 相关股票 -->
                <div
                  v-if="analysisResult.relatedStocks && analysisResult.relatedStocks.length > 0"
                  class="related-stocks-section"
                >
                  <div class="section-header">
                    <h3 class="section-title">
                      <div class="flex items-center space-x-3">
                        <div class="w-2 h-2 bg-purple-400 rounded-md"></div>
                        <span
                          class="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                        >相关股票</span>
                      </div>
                    </h3>
                    <span class="section-count">{{ analysisResult.relatedStocks.length }} 只</span>
                  </div>
                  <div class="stocks-grid">
                    <div
                      v-for="stock in analysisResult.relatedStocks"
                      :key="stock.code"
                      class="stock-card group"
                    >
                      <div class="stock-content">
                        <div class="stock-code">{{ stock.code }}</div>
                        <div class="stock-name">{{ stock.name }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 新闻列表 -->
                <div
                  v-if="analysisResult.news && analysisResult.news.length > 0"
                  class="news-section"
                >
                  <NewsList
                    :news="analysisResult.news"
                    :show-all-news="showAllNews"
                    @toggle-show-all="toggleShowAllNews"
                    @export="handleExportNews"
                  />
                </div>

                <!-- 情感分析汇总 -->
                <div
                  v-if="analysisResult.sentimentSummary"
                  class="sentiment-section"
                >
                  <SentimentSummary :summary="analysisResult.sentimentSummary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  CircleCheck,
  CircleClose,
  Download
} from '@element-plus/icons-vue'
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
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.news-analysis-container {
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

.page-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: white;
    padding: $spacing-xxxl 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    
      .header-container {
        max-width: $container-max-width;
        margin: 0 auto;
        padding: 0 $container-padding;
      }
    
      .header-content {
        @include flex(row, space-between, center);
        }
        
        .header-left {
          .title-section {
              @include flex(row, flex-start, center);
              gap: $spacing-lg;
          
              .title-icon {
                background: rgba(59, 130, 246, 0.2);
                border-radius: 50%;
                padding: $spacing-md;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(59, 130, 246, 0.3);
              }
          
              .title-text {
                .page-title {
                  margin: 0 0 $spacing-xs 0;
                  font-size: $font-size-extra-large + 8px;
                  font-weight: $font-weight-bold;
                  line-height: 1.2;
                  background: linear-gradient(135deg, #60a5fa, #3b82f6);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                }
          
                .page-subtitle {
                  margin: 0;
                  font-size: $font-size-medium;
                  opacity: 0.8;
                  font-weight: $font-weight-normal;
                  color: #94a3b8;
                }
              }
            }
          }
          
          .header-right {
            .connection-status {
              .status-tag {
                @include flex(row, center, center);
                gap: $spacing-xs;
                padding: $spacing-md $spacing-lg;
                border-radius: $card-border-radius * 2;
                font-weight: $font-weight-medium;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
          
                .status-icon {
                  font-size: $font-size-medium;
                }
              }
            }
          }
          }
          
          .page-content {
            padding: $spacing-xxxl 0;
            height: 100%;
            overflow: auto;
          
            .content-container {
              max-width: $container-max-width;
              margin: 0 auto;
              padding: 0 $container-padding;
            }
          
            .config-section {
              margin-bottom: $spacing-xxl;
            }
          
            .progress-section {
              margin-bottom: $spacing-xxl;
            }
          
            .result-section {
              .result-header {
                @include flex(row, space-between, center);
                margin-bottom: $spacing-xl;
                padding-bottom: $spacing-lg;
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
          
                .header-left {
                  @include flex(row, flex-start, center);
                  gap: $spacing-sm;
                }
          
                .header-actions {
                  @include flex(row, flex-end, center);
                  gap: $spacing-sm;
                }
              }
          
              .related-stocks-section {
                margin-bottom: $spacing-xxl;
          
                .section-header {
                  @include flex(row, space-between, center);
                  margin-bottom: $spacing-lg;
          
                  .section-title {
                    @include flex(row, flex-start, center);
                    margin: 0;
                    font-size: $font-size-large;
                    font-weight: $font-weight-bold;
                    color: #e2e8f0;
                  }
          
                  .section-count {
                    font-size: $font-size-small;
                    color: #94a3b8;
                    background: rgba(148, 163, 184, 0.1);
                    padding: $spacing-xs $spacing-sm;
                    border-radius: $card-border-radius;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                  }
                }
          
                .stocks-grid {
                  @include grid(auto-fit, $spacing-md);
                  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          
                  .stock-card {
                    @include card-base;
                    padding: $spacing-lg;
                    text-align: center;
                    transition: all $transition-base $ease-in-out;
                    cursor: pointer;
                    background: rgba(51, 65, 85, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: $card-border-radius;
          
                    &:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                      border-color: rgba(147, 51, 234, 0.5);
                      background: rgba(51, 65, 85, 0.7);
                    }
          
                    .stock-content {
                      .stock-code {
                        font-size: $font-size-large;
                        font-weight: $font-weight-bold;
                        color: #60a5fa;
                        margin-bottom: $spacing-xs;
                      }
          
                      .stock-name {
                        font-size: $font-size-base;
                        color: #94a3b8;
                        @include text-truncate(2);
                      }
                    }
                  }
                }
              }
          
              .news-section {
                margin-bottom: $spacing-xxl;
              }
          
              .sentiment-section {
                // 情感分析部分样式
              }
            }
          }
          
          // 响应式设计
          @include respond-to(sm) {
            .page-header {
              .header-content {
                flex-direction: column;
                gap: $spacing-lg;
                text-align: center;
              }
            }
          
            .page-content {
              .content-container {
                padding: 0 $spacing-md;
              }
            }
          }
          
          @include respond-to(xs) {
            .page-header {
              padding: $spacing-xxl 0;
          
              .title-section {
                flex-direction: column;
                gap: $spacing-md;
              }
            }
          
            .page-content {
              padding: $spacing-xxl 0;
            }
}
</style>