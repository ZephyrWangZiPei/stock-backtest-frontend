<template>
  <div class="news-center">
    <el-card class="news-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Document /></el-icon>
            新闻中心
          </span>
          <div class="header-actions">
            <el-button type="primary" @click="refreshNews" :loading="loading">
              刷新新闻
            </el-button>
            <el-button @click="showSearchDialog = true">
              高级搜索
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索新闻标题、内容或关键词"
          clearable
          @keyup.enter="searchNews"
          style="width: 300px; margin-right: 16px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="selectedCategory" placeholder="选择分类" style="width: 150px; margin-right: 16px">
          <el-option label="全部" value="" />
          <el-option label="财经新闻" value="finance" />
          <el-option label="公司公告" value="announcement" />
          <el-option label="行业动态" value="industry" />
          <el-option label="政策解读" value="policy" />
          <el-option label="市场分析" value="analysis" />
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 250px; margin-right: 16px"
        />
        
        <el-button type="primary" @click="searchNews" :loading="searching">
          搜索
        </el-button>
      </div>

      <!-- 新闻统计 -->
      <div class="news-stats">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ newsStats.total }}</div>
              <div class="stat-label">总新闻数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ newsStats.today }}</div>
              <div class="stat-label">今日新闻</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ newsStats.positive }}</div>
              <div class="stat-label">正面新闻</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ newsStats.negative }}</div>
              <div class="stat-label">负面新闻</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 新闻列表 -->
      <div class="news-list">
        <el-table 
          :data="newsList" 
          stripe 
          v-loading="loading"
          @row-click="showNewsDetail"
          style="cursor: pointer"
        >
          <el-table-column prop="title" label="标题" min-width="300">
            <template #default="{ row }">
              <div class="news-title">
                <span class="title-text">{{ row.title }}</span>
                <el-tag 
                  v-if="row.category" 
                  :type="getCategoryTagType(row.category)" 
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getCategoryName(row.category) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="source" label="来源" width="120" />
          
          <el-table-column prop="publishTime" label="发布时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.publishTime) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="sentiment" label="情感倾向" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getSentimentTagType(row.sentiment)" 
                size="small"
              >
                {{ getSentimentText(row.sentiment) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="relevance" label="相关度" width="100">
            <template #default="{ row }">
              <el-rate 
                v-model="row.relevance" 
                disabled 
                show-score 
                text-color="#ff9900" 
                :max="5"
                :score-template="row.relevance + '分'"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="text" 
                size="small" 
                @click.stop="showNewsDetail(row)"
              >
                查看详情
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click.stop="analyzeNews(row)"
              >
                情感分析
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 新闻详情对话框 -->
    <el-dialog
      v-model="newsDetailVisible"
      title="新闻详情"
      width="70%"
      :before-close="closeNewsDetail"
    >
      <div v-if="selectedNews" class="news-detail">
        <div class="news-header">
          <h2>{{ selectedNews.title }}</h2>
          <div class="news-meta">
            <span class="source">来源: {{ selectedNews.source }}</span>
            <span class="time">发布时间: {{ formatTime(selectedNews.publishTime) }}</span>
            <el-tag 
              v-if="selectedNews.category" 
              :type="getCategoryTagType(selectedNews.category)"
            >
              {{ getCategoryName(selectedNews.category) }}
            </el-tag>
          </div>
        </div>
        
        <div class="news-content">
          <div class="summary" v-if="selectedNews.summary">
            <h4>摘要</h4>
            <p>{{ selectedNews.summary }}</p>
          </div>
          
          <div class="content">
            <h4>正文</h4>
            <div v-html="selectedNews.content"></div>
          </div>
          
          <div class="keywords" v-if="selectedNews.keywords && selectedNews.keywords.length">
            <h4>关键词</h4>
            <div class="keyword-tags">
              <el-tag 
                v-for="keyword in selectedNews.keywords" 
                :key="keyword"
                size="small"
                style="margin-right: 8px; margin-bottom: 8px"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>
          
          <div class="sentiment-analysis" v-if="selectedNews.sentimentAnalysis">
            <h4>情感分析</h4>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="情感倾向">
                <el-tag :type="getSentimentTagType(selectedNews.sentiment)">
                  {{ getSentimentText(selectedNews.sentiment) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="置信度">
                {{ (selectedNews.sentimentAnalysis.confidence * 100).toFixed(1) }}%
              </el-descriptions-item>
              <el-descriptions-item label="相关度">
                <el-rate 
                  v-model="selectedNews.relevance" 
                  disabled 
                  show-score 
                  text-color="#ff9900" 
                  :max="5"
                />
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="closeNewsDetail">关闭</el-button>
        <el-button type="primary" @click="analyzeNews(selectedNews)">情感分析</el-button>
      </template>
    </el-dialog>

    <!-- 高级搜索对话框 -->
    <el-dialog
      v-model="showSearchDialog"
      title="高级搜索"
      width="60%"
    >
      <el-form :model="advancedSearchForm" label-width="100px">
        <el-form-item label="关键词">
          <el-input 
            v-model="advancedSearchForm.keywords" 
            placeholder="输入关键词，多个关键词用逗号分隔"
          />
        </el-form-item>
        
        <el-form-item label="新闻分类">
          <el-checkbox-group v-model="advancedSearchForm.categories">
            <el-checkbox label="finance">财经新闻</el-checkbox>
            <el-checkbox label="announcement">公司公告</el-checkbox>
            <el-checkbox label="industry">行业动态</el-checkbox>
            <el-checkbox label="policy">政策解读</el-checkbox>
            <el-checkbox label="analysis">市场分析</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="情感倾向">
          <el-radio-group v-model="advancedSearchForm.sentiment">
            <el-radio label="">全部</el-radio>
            <el-radio label="positive">正面</el-radio>
            <el-radio label="neutral">中性</el-radio>
            <el-radio label="negative">负面</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="advancedSearchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="相关度">
          <el-slider
            v-model="advancedSearchForm.minRelevance"
            :min="0"
            :max="5"
            :step="0.5"
            show-input
            input-size="small"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSearchDialog = false">取消</el-button>
        <el-button type="primary" @click="performAdvancedSearch">搜索</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Search } from '@element-plus/icons-vue'

// 导入API客户端和WebSocket服务
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import type { NewsSearchRequest, NewsAnalysisResult } from '@/utils/unifiedHttpClient'
import { websocketEventBus } from '@/utils/websocketEventBus'
import { realtimeDataService } from '@/services/realtimeDataService'

// 响应式数据
const loading = ref(false)
const searching = ref(false)
const newsDetailVisible = ref(false)
const showSearchDialog = ref(false)
const selectedNews = ref<any>(null)

const searchKeyword = ref('')
const selectedCategory = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const newsList = ref<any[]>([])
const newsStats = reactive({
  total: 0,
  today: 0,
  positive: 0,
  negative: 0
})

const advancedSearchForm = reactive({
  keywords: '',
  categories: [] as string[],
  sentiment: '',
  dateRange: null as [Date, Date] | null,
  minRelevance: 0
})

// 新闻数据
const mockNewsData: any[] = []

// 计算属性
const filteredNews = computed(() => {
  let filtered = newsList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(news => 
      news.title.toLowerCase().includes(keyword) ||
      news.content.toLowerCase().includes(keyword) ||
      news.keywords.some((k: string) => k.toLowerCase().includes(keyword))
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(news => news.category === selectedCategory.value)
  }

  if (dateRange.value) {
    const [start, end] = dateRange.value
    filtered = filtered.filter(news => {
      const publishDate = new Date(news.publishTime)
      return publishDate >= start && publishDate <= end
    })
  }

  return filtered
})

// 方法
const getCategoryTagType = (category: string) => {
  const types: Record<string, string> = {
    'finance': 'primary',
    'announcement': 'warning',
    'industry': 'success',
    'policy': 'danger',
    'analysis': 'info'
  }
  return types[category] || 'info'
}

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'finance': '财经新闻',
    'announcement': '公司公告',
    'industry': '行业动态',
    'policy': '政策解读',
    'analysis': '市场分析'
  }
  return names[category] || category
}

const getSentimentTagType = (sentiment: string) => {
  const types: Record<string, string> = {
    'positive': 'success',
    'neutral': 'info',
    'negative': 'danger'
  }
  return types[sentiment] || 'info'
}

const getSentimentText = (sentiment: string) => {
  const texts: Record<string, string> = {
    'positive': '正面',
    'neutral': '中性',
    'negative': '负面'
  }
  return texts[sentiment] || sentiment
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

const refreshNews = async () => {
  loading.value = true
  try {
    // 调用真实API获取新闻列表
    const response = await unifiedHttpClient.newsAnalysis.getNews({
      page: currentPage.value,
      limit: pageSize.value,
      keywords: searchKeyword.value || undefined,
      category: selectedCategory.value || undefined,
      start_date: dateRange.value ? dateRange.value[0].toISOString().split('T')[0] : undefined,
      end_date: dateRange.value ? dateRange.value[1].toISOString().split('T')[0] : undefined
    })
    
    if (response.data) {
      newsList.value = response.data.news || []
      total.value = response.data.total || 0
      updateStats()
      ElMessage.success('新闻数据已刷新')
    } else {
      throw new Error('API返回数据为空')
    }
    
  } catch (error) {
    console.error('获取新闻失败:', error)
    ElMessage.error('获取新闻失败，请检查网络连接')
    
    // API调用失败时清空数据
    newsList.value = []
    total.value = 0
    updateStats()
  } finally {
    loading.value = false
  }
}

const searchNews = async () => {
  searching.value = true
  try {
    // 调用真实API搜索新闻
    await loadNews()
    currentPage.value = 1
    ElMessage.success('搜索完成')
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    searching.value = false
  }
}

const performAdvancedSearch = async () => {
  showSearchDialog.value = false
  searching.value = true
  try {
    // 调用真实API进行高级搜索
    await loadNews()
    currentPage.value = 1
    ElMessage.success('高级搜索完成')
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    searching.value = false
  }
}

const showNewsDetail = (news: any) => {
  selectedNews.value = news
  newsDetailVisible.value = true
}

const closeNewsDetail = () => {
  newsDetailVisible.value = false
  selectedNews.value = null
}

const analyzeNews = async (news: any) => {
  try {
    ElMessage.info(`正在分析新闻: ${news.title}`)
    
    // 调用真实API进行新闻情感分析
    const response = await unifiedHttpClient.newsAnalysis.startAnalysis({
      news_id: news.id,
      content: news.content || news.summary,
      title: news.title,
      include_sentiment: true,
      include_keywords: true,
      include_entities: true
    })
    
    if (response.data) {
      // 更新新闻对象的分析结果
      const analysisResult = response.data
      news.sentimentAnalysis = {
        confidence: analysisResult.sentiment_confidence || 0.8,
        sentiment: analysisResult.sentiment || 'neutral',
        keywords: analysisResult.keywords || [],
        entities: analysisResult.entities || []
      }
      news.sentiment = analysisResult.sentiment || 'neutral'
      news.keywords = analysisResult.keywords || news.keywords || []
      
      ElMessage.success('新闻分析完成')
      
      // 如果当前新闻是选中的新闻，更新详情显示
      if (selectedNews.value && selectedNews.value.id === news.id) {
        selectedNews.value = { ...news }
      }
      
    } else {
      throw new Error('分析结果为空')
    }
    
  } catch (error) {
    console.error('新闻分析失败:', error)
    ElMessage.warning('分析失败，请稍后重试')
    
    // API调用失败时不显示分析结果
    ElMessage.error('新闻分析失败')
  }
}

const updateStats = () => {
  newsStats.total = newsList.value.length
  newsStats.today = newsList.value.filter(news => {
    const today = new Date().toDateString()
    return new Date(news.publishTime).toDateString() === today
  }).length
  newsStats.positive = newsList.value.filter(news => news.sentiment === 'positive').length
  newsStats.negative = newsList.value.filter(news => news.sentiment === 'negative').length
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
  const unsubscribe = websocketEventBus.subscribe({
    id: 'news_center_view_subscriber',
    namespace: '/news_analysis',
    handler: async (event) => {
      console.log('🔌 [/news_analysis] 事件:', event.event, event.data)
      switch (event.event) {
        case 'news_analysis_started':
        case 'news_analysis_progress':
        case 'progress': {
          // 可以在页面上展示通知/轻量提示，这里暂记日志
          break
        }
        case 'news_analysis_completed':
        case 'completed': {
          // 完成后刷新一次新闻列表
          await refreshNews()
          break
        }
        case 'news_analysis_failed':
        case 'failed': {
          // 失败后也刷新一次，以便状态一致
          await refreshNews()
          break
        }
      }
    }
  })

  // 页面原有 mounted 逻辑
  refreshNews()

  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style lang="scss" scoped>
.news-center {
  padding: 20px;
  
  .news-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
          color: #409eff;
        }
      }
    }
  }
  
  .search-bar {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
  
  .news-stats {
    margin-bottom: 24px;
    
    .stat-item {
      text-align: center;
      padding: 20px;
      background-color: #f5f7fa;
      border-radius: 4px;
      
      .stat-number {
        font-size: 28px;
        font-weight: 600;
        color: #409eff;
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
  
  .news-list {
    .news-title {
      display: flex;
      align-items: center;
      
      .title-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .pagination-wrapper {
      margin-top: 20px;
      text-align: center;
    }
  }
}

.news-detail {
  .news-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    
    h2 {
      margin: 0 0 12px 0;
      color: #303133;
      font-size: 20px;
    }
    
    .news-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      color: #909399;
      font-size: 14px;
    }
  }
  
  .news-content {
    .summary,
    .content,
    .keywords,
    .sentiment-analysis {
      margin-bottom: 24px;
      
      h4 {
        margin: 0 0 12px 0;
        color: #303133;
        font-size: 16px;
        border-left: 4px solid #409eff;
        padding-left: 12px;
      }
    }
    
    .keyword-tags {
      display: flex;
      flex-wrap: wrap;
    }
    
    .content {
      line-height: 1.8;
      color: #606266;
    }
  }
}
</style> 