<template>
  <div class="news-collection">
    <!-- 新闻采集配置 -->
    <el-card class="news-config-card">
      <template #header>
        <div class="card-header">
          <span>新闻采集配置</span>
          <el-button @click="startNewsCollection" :loading="isCollecting" size="small" type="primary">
            {{ isCollecting ? '采集中...' : '开始采集' }}
          </el-button>
        </div>
      </template>
      
      <el-form :model="newsConfig" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分析类型">
              <el-select v-model="newsConfig.analysisType" placeholder="选择分析类型">
                <el-option label="股票新闻" value="stock_news" />
                <el-option label="行业新闻" value="industry_news" />
                <el-option label="市场新闻" value="market_news" />
                <el-option label="情感分析" value="sentiment_analysis" />
                <el-option label="关键词提取" value="keyword_extraction" />
                <el-option label="趋势分析" value="trend_analysis" />
                <el-option label="综合分析" value="comprehensive_analysis" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大新闻数">
              <el-input-number 
                v-model="newsConfig.maxResults" 
                :min="10" 
                :max="200" 
                :step="10"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时间范围">
              <el-select v-model="newsConfig.timeRange" placeholder="选择时间范围">
                <el-option label="最近1天" value="1d" />
                <el-option label="最近3天" value="3d" />
                <el-option label="最近1周" value="1w" />
                <el-option label="最近1月" value="1m" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="情感阈值">
              <el-slider 
                v-model="newsConfig.sentimentThreshold" 
                :min="0.1" 
                :max="0.9" 
                :step="0.1"
                :format-tooltip="(val: number) => `${(val * 100).toFixed(0)}%`"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="关键词">
          <el-input 
            v-model="newsConfig.keywords" 
            placeholder="输入关键词，多个关键词用逗号分隔"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 新闻采集结果 -->
    <el-card class="news-results-card" v-if="newsResults.length > 0">
      <template #header>
        <div class="card-header">
          <span>新闻采集结果</span>
          <div class="header-actions">
            <el-button @click="exportNews" size="small" type="success">导出新闻</el-button>
            <el-button @click="clearNews" size="small" type="danger">清空</el-button>
          </div>
        </div>
      </template>
      
      <div class="results-content">
        <!-- 新闻统计 -->
        <div class="news-stats">
          <el-row :gutter="20">
            <el-col :span="6" v-for="stat in newsStats" :key="stat.name">
              <el-card class="stat-card" shadow="hover">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
        
        <!-- 情感分析概览 -->
        <div class="sentiment-overview" v-if="sentimentAnalysis">
          <el-card class="sentiment-card">
            <template #header>
              <span>情感分析概览</span>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="sentiment-item positive">
                  <div class="sentiment-icon">😊</div>
                  <div class="sentiment-label">正面</div>
                  <div class="sentiment-value">{{ sentimentAnalysis.positive_count }}</div>
                  <div class="sentiment-percentage">{{ (sentimentAnalysis.positive_count / sentimentAnalysis.total_count * 100).toFixed(1) }}%</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="sentiment-item neutral">
                  <div class="sentiment-icon">😐</div>
                  <div class="sentiment-label">中性</div>
                  <div class="sentiment-value">{{ sentimentAnalysis.neutral_count }}</div>
                  <div class="sentiment-percentage">{{ (sentimentAnalysis.neutral_count / sentimentAnalysis.total_count * 100).toFixed(1) }}%</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="sentiment-item negative">
                  <div class="sentiment-icon">😞</div>
                  <div class="sentiment-label">负面</div>
                  <div class="sentiment-value">{{ sentimentAnalysis.negative_count }}</div>
                  <div class="sentiment-percentage">{{ (sentimentAnalysis.negative_count / sentimentAnalysis.total_count * 100).toFixed(1) }}%</div>
                </div>
              </el-col>
            </el-row>
            
            <el-divider content-position="left">情感得分</el-divider>
            <div class="sentiment-score">
              <el-progress 
                :percentage="Math.abs(sentimentAnalysis.sentiment_score * 100)" 
                :color="getSentimentColor(sentimentAnalysis.sentiment_score)"
                :stroke-width="12"
              />
              <div class="score-text">
                情感得分: {{ (sentimentAnalysis.sentiment_score * 100).toFixed(1) }}
              </div>
            </div>
          </el-card>
        </div>
        
        <!-- 新闻列表 -->
        <div class="news-list">
          <el-table :data="newsResults" style="width: 100%" height="400">
            <el-table-column prop="title" label="标题" min-width="200">
              <template #default="scope">
                <el-link :href="scope.row.url" target="_blank" type="primary">
                  {{ scope.row.title }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="120" />
            <el-table-column prop="publish_time" label="发布时间" width="150">
              <template #default="scope">
                {{ formatTime(scope.row.publish_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="sentiment" label="情感" width="100">
              <template #default="scope">
                <el-tag :type="getNewsSentimentType(scope.row.sentiment)" size="small">
                  {{ getNewsSentimentText(scope.row.sentiment) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="relevance" label="相关度" width="100">
              <template #default="scope">
                <el-progress 
                  :percentage="scope.row.relevance * 100" 
                  :stroke-width="6"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button @click="viewNewsDetail(scope.row)" size="small" type="primary">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 新闻详情对话框 -->
    <el-dialog 
      v-model="showNewsDetail" 
      title="新闻详情" 
      width="800px"
      :before-close="closeNewsDetail"
    >
      <div v-if="selectedNews" class="news-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题" span="2">
            {{ selectedNews.title }}
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ selectedNews.source }}
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">
            {{ formatTime(selectedNews.publish_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="情感">
            <el-tag :type="getNewsSentimentType(selectedNews.sentiment)">
              {{ getNewsSentimentText(selectedNews.sentiment) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="相关度">
            {{ (selectedNews.relevance * 100).toFixed(1) }}%
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">新闻内容</el-divider>
        <div class="news-content">
          {{ selectedNews.content }}
        </div>
        
        <el-divider content-position="left">关键词</el-divider>
        <div class="news-keywords">
          <el-tag 
            v-for="keyword in selectedNews.keywords" 
            :key="keyword"
            size="small"
            style="margin-right: 5px; margin-bottom: 5px;"
          >
            {{ keyword }}
          </el-tag>
        </div>
        
        <el-divider content-position="left">操作</el-divider>
        <div class="news-actions">
          <el-button @click="openNewsUrl(selectedNews.url)" type="primary">
            查看原文
          </el-button>
          <el-button @click="addToFavorites(selectedNews)" type="success">
            收藏
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { unifiedHttpClient } from '@/utils/unifiedHttpClient'

// 类型定义
interface NewsConfig {
  analysisType: string
  maxResults: number
  timeRange: string
  sentimentThreshold: number
  keywords: string
}

interface NewsItem {
  id: string
  title: string
  content: string
  url: string
  source: string
  publish_time: string
  sentiment: 'positive' | 'neutral' | 'negative'
  relevance: number
  keywords: string[]
}

interface SentimentAnalysis {
  sentiment_score: number
  positive_count: number
  negative_count: number
  neutral_count: number
  total_count: number
}

// Props
interface Props {
  stockCode?: string
  stockName?: string
}

const props = withDefaults(defineProps<Props>(), {
  stockCode: '',
  stockName: ''
})

// Emits
const emit = defineEmits<{
  'news-collected': [news: NewsItem[], sentiment: SentimentAnalysis]
  'news-error': [error: string]
}>()

// 响应式数据
const isCollecting = ref(false)
const newsResults = ref<NewsItem[]>([])
const sentimentAnalysis = ref<SentimentAnalysis | null>(null)
const showNewsDetail = ref(false)
const selectedNews = ref<NewsItem | null>(null)

const newsConfig = reactive<NewsConfig>({
  analysisType: 'comprehensive_analysis',
  maxResults: 50,
  timeRange: '1w',
  sentimentThreshold: 0.6,
  keywords: ''
})

// 计算属性
const newsStats = computed(() => [
  {
    name: 'total',
    label: '总新闻数',
    value: newsResults.value.length
  },
  {
    name: 'positive',
    label: '正面新闻',
    value: newsResults.value.filter(n => n.sentiment === 'positive').length
  },
  {
    name: 'negative',
    label: '负面新闻',
    value: newsResults.value.filter(n => n.sentiment === 'negative').length
  },
  {
    name: 'avgRelevance',
    label: '平均相关度',
    value: newsResults.value.length > 0 
      ? `${(newsResults.value.reduce((sum, n) => sum + n.relevance, 0) / newsResults.value.length * 100).toFixed(1)}%`
      : '0%'
  }
])

// 方法
const startNewsCollection = async () => {
  if (!props.stockCode) {
    ElMessage.warning('请先选择股票')
    return
  }
  
  try {
    isCollecting.value = true
    ElMessage.info('开始新闻采集...')
    
    // 构建请求参数
    const requestData = {
      analysis_type: newsConfig.analysisType,
      stock_codes: [props.stockCode],
      keywords: newsConfig.keywords ? newsConfig.keywords.split(',').map(k => k.trim()) : [],
      parameters: {
        max_results: newsConfig.maxResults,
        time_range: newsConfig.timeRange,
        sentiment_threshold: newsConfig.sentimentThreshold
      }
    }
    
    // 调用后端API
    const response = await unifiedHttpClient.post('/api/v1/news-analysis/analyze', requestData)
    
    if (response.data.task_id) {
      // 监控任务进度
      await monitorNewsTask(response.data.task_id)
    } else {
      throw new Error('未获取到任务ID')
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '新闻采集失败'
    ElMessage.error(`新闻采集失败: ${errorMsg}`)
    emit('news-error', errorMsg)
  } finally {
    isCollecting.value = false
  }
}

const monitorNewsTask = async (taskId: string) => {
  const checkStatus = async () => {
    try {
      const response = await unifiedHttpClient.get(`/api/v1/news-analysis/tasks/${taskId}`)
      const task = response.data
      
      if (task.status === 'completed') {
        // 处理完成的任务
        processNewsResults(task.result)
        ElMessage.success('新闻采集完成')
        return
      } else if (task.status === 'failed') {
        throw new Error(task.error_message || '新闻采集失败')
      }
      
      // 继续监控
      setTimeout(checkStatus, 2000)
    } catch (error) {
      throw error
    }
  }
  
  await checkStatus()
}

const processNewsResults = (result: any) => {
  // 处理新闻结果
  if (result.news_result && result.news_result.news_list) {
    newsResults.value = result.news_result.news_list.map((news: any, index: number) => ({
      id: index.toString(),
      title: news.title || '',
      content: news.content || '',
      url: news.url || '',
      source: news.source || '',
      publish_time: news.publish_time || new Date().toISOString(),
      sentiment: news.sentiment || 'neutral',
      relevance: news.relevance || 0.5,
      keywords: news.keywords || []
    }))
  }
  
  // 处理情感分析结果
  if (result.sentiment_result) {
    sentimentAnalysis.value = {
      sentiment_score: result.sentiment_result.sentiment_score || 0,
      positive_count: result.sentiment_result.positive_count || 0,
      negative_count: result.sentiment_result.negative_count || 0,
      neutral_count: result.sentiment_result.neutral_count || 0,
      total_count: result.sentiment_result.total_count || 0
    }
  }
  
  emit('news-collected', newsResults.value, sentimentAnalysis.value!)
}

const exportNews = () => {
  const dataStr = JSON.stringify({
    news: newsResults.value,
    sentiment: sentimentAnalysis.value,
    config: newsConfig
  }, null, 2)
  
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `news_collection_${props.stockCode}_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('新闻数据已导出')
}

const clearNews = () => {
  newsResults.value = []
  sentimentAnalysis.value = null
  ElMessage.success('新闻数据已清空')
}

const viewNewsDetail = (news: NewsItem) => {
  selectedNews.value = news
  showNewsDetail.value = true
}

const closeNewsDetail = () => {
  showNewsDetail.value = false
  selectedNews.value = null
}

const openNewsUrl = (url: string) => {
  window.open(url, '_blank')
}

const addToFavorites = (news: NewsItem) => {
  ElMessage.success('已添加到收藏')
  // 这里可以实现收藏功能
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString()
}

const getSentimentColor = (score: number) => {
  if (score > 0.3) return '#67c23a'
  if (score < -0.3) return '#f56c6c'
  return '#e6a23c'
}

const getNewsSentimentType = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'success'
    case 'negative': return 'danger'
    default: return 'info'
  }
}

const getNewsSentimentText = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '正面'
    case 'negative': return '负面'
    default: return '中性'
  }
}

// 暴露方法给父组件
defineExpose({
  startNewsCollection,
  clearNews,
  newsResults: computed(() => newsResults.value),
  sentimentAnalysis: computed(() => sentimentAnalysis.value)
})
</script>

<style scoped>
.news-collection {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.news-config-card,
.news-results-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.results-content {
  padding: 10px 0;
}

.news-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 15px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
}

.sentiment-overview {
  margin-bottom: 20px;
}

.sentiment-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sentiment-item.positive {
  background-color: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.sentiment-item.neutral {
  background-color: rgba(230, 162, 60, 0.1);
  border: 1px solid rgba(230, 162, 60, 0.3);
}

.sentiment-item.negative {
  background-color: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.sentiment-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.sentiment-label {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  margin-bottom: 5px;
}

.sentiment-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.sentiment-percentage {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.sentiment-score {
  text-align: center;
  padding: 20px 0;
}

.score-text {
  margin-top: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.news-list {
  margin-top: 20px;
}

.news-content {
  padding: 15px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  line-height: 1.6;
  margin: 15px 0;
  max-height: 200px;
  overflow-y: auto;
}

.news-keywords {
  margin: 15px 0;
}

.news-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

:deep(.el-progress-bar__outer) {
  background-color: var(--el-border-color-light);
}

:deep(.el-progress-bar__inner) {
  transition: all 0.3s ease;
}
</style> 
