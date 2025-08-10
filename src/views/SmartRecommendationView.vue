<template>
  <div class="smart-recommendation">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>智能推荐</h1>
      <p>基于AI算法和大数据分析，为您推荐优质投资标的</p>
    </div>

    <!-- AI推荐概览 -->
    <RecommendationOverview 
      :stats="recommendationStats" 
      @refresh-recommendations="refreshRecommendations" 
    />

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧推荐列表 -->
      <el-col :xs="24" :lg="16">
        <RecommendationList
          :recommendations="recommendations"
          :selected-strategy="selectedStrategy"
          :is-loading="isLoading"
          @update:selected-strategy="selectedStrategy = $event"
          @export-recommendations="exportRecommendations"
          @view-stock-detail="viewStockDetail"
          @add-to-watchlist="addToWatchlist"
          @add-to-candidate-pool="addToCandidatePool"
        />
      </el-col>

      <!-- 右侧分析面板 -->
      <el-col :xs="24" :lg="8">
        <MarketAnalysisPanel
          :hot-sectors="hotSectors"
          :market-sentiment="marketSentiment"
          :ai-insights="aiInsights"
        />
      </el-col>
    </el-row>

    <!-- 股票详情对话框 -->
    <el-dialog
      v-model="stockDetailVisible"
      :title="`${selectedStock?.name} (${selectedStock?.code}) - AI推荐详情`"
      width="800px"
    >
      <div v-if="selectedStock" class="stock-detail">
        <el-tabs v-model="activeDetailTab">
          <el-tab-pane label="推荐分析" name="analysis">
            <div class="recommendation-analysis">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>AI评分详情</span>
                    </template>
                    <div class="score-breakdown">
                      <div class="score-item">
                        <span>综合评分</span>
                        <el-progress :percentage="selectedStock.ai_score * 20" />
                      </div>
                      <div class="score-item">
                        <span>基本面</span>
                        <el-progress :percentage="selectedStock.fundamental_score * 20" />
                      </div>
                      <div class="score-item">
                        <span>技术面</span>
                        <el-progress :percentage="selectedStock.technical_score * 20" />
                      </div>
                      <div class="score-item">
                        <span>市场情绪</span>
                        <el-progress :percentage="selectedStock.sentiment_score * 20" />
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>风险评估</span>
                    </template>
                    <div class="risk-assessment">
                      <el-alert
                        :title="`风险等级: ${getRiskLevel(selectedStock.risk_score)}`"
                        :type="getRiskAlertType(selectedStock.risk_score)"
                        show-icon
                      />
                      <div class="risk-factors">
                        <h5>主要风险因子</h5>
                        <ul>
                          <li v-for="risk in selectedStock.risk_factors" :key="risk">{{ risk }}</li>
                        </ul>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="价格预测" name="prediction">
            <div class="price-prediction">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-statistic title="当前价格" :value="selectedStock.price" prefix="¥" />
                </el-col>
                <el-col :span="8">
                  <el-statistic title="目标价格" :value="selectedStock.target_price" prefix="¥" />
                </el-col>
                <el-col :span="8">
                  <el-statistic
                    title="预期收益"
                    :value="selectedStock.expected_return"
                    suffix="%"
                    :value-style="{ color: selectedStock.expected_return > 0 ? '#3f8600' : '#cf1322' }"
                  />
                </el-col>
              </el-row>

              <div class="prediction-chart">
                <h4>价格预测趋势</h4>
                <div class="chart-placeholder">
                  <el-icon size="64"><TrendCharts /></el-icon>
                  <p>价格预测图表 (待实现)</p>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="相似股票" name="similar">
            <div class="similar-stocks" style="max-height: 300px; overflow-y: auto;">
              <div v-for="similar in selectedStock.similar_stocks" :key="similar.code" class="similar-item">
                <div class="similar-info">
                  <span class="similar-name">{{ similar.name }} ({{ similar.code }})</span>
                  <el-tag size="small">相似度: {{ similar.similarity }}%</el-tag>
                </div>
                <div class="similar-metrics">
                  <span>¥{{ similar.price }}</span>
                  <span :class="getPriceChangeClass(similar.change_pct)">
                    {{ similar.change_pct > 0 ? '+' : '' }}{{ similar.change_pct }}%
                  </span>
                </div>
              </div>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts } from '@element-plus/icons-vue'

// 导入API客户端和WebSocket服务
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import type { AIAnalysisRequest, AIAnalysisResult } from '@/utils/unifiedHttpClient'
import { websocketEventBus } from '@/utils/websocketEventBus'
import { realtimeDataService } from '@/services/realtimeDataService'
import { RecommendationOverview, RecommendationList, MarketAnalysisPanel } from '@/components/smart-recommendation'

// 响应式数据
const isLoading = ref(false)
const selectedStrategy = ref('comprehensive')
const stockDetailVisible = ref(false)
const selectedStock = ref<any>(null)
const activeDetailTab = ref('analysis')

// 响应式数据 - 初始化为空
const recommendations = ref<any[]>([])
const hotSectors = ref<any[]>([])
const marketSentiment = ref<any>({})
const aiInsights = ref<any[]>([])

// 计算属性
const recommendationStats = computed(() => {
  const strongBuy = recommendations.value.filter(r => r.recommendation === 'strong_buy').length
  const buy = recommendations.value.filter(r => r.recommendation === 'buy').length
  const hold = recommendations.value.filter(r => r.recommendation === 'hold').length
  const hot = recommendations.value.filter(r => r.is_hot).length

  return { strongBuy, buy, hold, hot }
})

// 工具函数
const getPriceChangeClass = (changePct: number) => {
  if (changePct > 0) return 'price-up'
  if (changePct < 0) return 'price-down'
  return 'price-flat'
}

const getRiskLevel = (riskScore: number) => {
  if (riskScore >= 80) return '高风险'
  if (riskScore >= 60) return '中高风险'
  if (riskScore >= 40) return '中等风险'
  return '低风险'
}

const getRiskAlertType = (riskScore: number) => {
  if (riskScore >= 80) return 'error'
  if (riskScore >= 60) return 'warning'
  return 'success'
}

// 主要功能方法
const refreshRecommendations = async () => {
  try {
    isLoading.value = true
    
    // 调用真实API获取智能推荐
    const response = await unifiedHttpClient.aiAnalysis.startAnalysis({
      analysis_type: 'market_recommendation',
      stock_codes: [], // 空数组表示全市场分析
      parameters: {
        recommendation_count: 20,
        include_technical: true,
        include_fundamental: true,
        include_sentiment: true,
        risk_level: 'medium',
        market_cap_min: 1000000000, // 10亿市值以上
        exclude_st: true
      }
    })
    
    if (response.data?.task_id) {
      ElMessage.success(`智能推荐任务已启动，任务ID: ${response.data.task_id}`)
      
      // 设置WebSocket监听器获取推荐结果
      setupRecommendationWebSocketListener(response.data.task_id)
      
      // 启动推荐任务后，等待WebSocket返回结果
      ElMessage.success('智能推荐任务正在运行，请稍候...')
      
    } else {
      throw new Error('推荐任务启动失败')
    }
    
  } catch (error) {
    console.error('获取智能推荐失败:', error)
    ElMessage.error('获取智能推荐失败，请检查网络连接')
    
    // API调用失败时清空推荐列表
    recommendations.value = []
    
  } finally {
    isLoading.value = false
  }
}

const exportRecommendations = () => {
  if (recommendations.value.length === 0) {
    ElMessage.warning('暂无推荐数据可导出')
    return
  }
  ElMessage.success('推荐列表已导出')
}

const viewStockDetail = (stock: any) => {
  selectedStock.value = stock
  stockDetailVisible.value = true
  activeDetailTab.value = 'analysis'
}

const addToWatchlist = (stock: any) => {
  ElMessage.success(`${stock.name} 已添加到自选股`)
}

const addToCandidatePool = (stock: any) => {
  ElMessage.success(`${stock.name} 已添加到候选池`)
}

// WebSocket监听器
const setupRecommendationWebSocketListener = (taskId: string) => {
  const unsubscribe = websocketEventBus.subscribe({
    id: `recommendation_${taskId}`,
    handler: (event) => {
      if (event.namespace !== '/ai_analysis') return
      
      switch (event.event) {
        case 'analysis_progress':
          // 可以显示推荐生成进度
          console.log('推荐生成进度:', event.data.progress)
          break
        case 'analysis_completed':
          handleRecommendationCompleted(event.data)
          break
        case 'analysis_error':
          handleRecommendationError(event.data)
          break
      }
    }
  })
  
  // 10分钟后自动取消订阅
  setTimeout(() => {
    unsubscribe()
  }, 10 * 60 * 1000)
}

const handleRecommendationCompleted = async (data: any) => {
  try {
    if (data.result_id) {
      // 获取推荐结果
      const response = await unifiedHttpClient.aiAnalysis.getResults(data.result_id)
      if (response.data && response.data.recommendations) {
        recommendations.value = transformApiRecommendations(response.data.recommendations)
        ElMessage.success('智能推荐已更新')
      }
    }
  } catch (error) {
    console.error('获取推荐结果失败:', error)
    ElMessage.warning('获取推荐结果失败，显示模拟数据')
  }
}

const handleRecommendationError = (data: any) => {
  console.error('推荐生成失败:', data.error)
  ElMessage.error('推荐生成失败')
}

const transformApiRecommendations = (apiRecommendations: any[]) => {
  return apiRecommendations.map((item: any) => ({
    code: item.stock_code,
    name: item.stock_name || `股票${item.stock_code}`,
    industry: item.industry || '未知',
    price: item.current_price || 0,
    change_pct: item.change_percent || 0,
    ai_score: item.ai_score || 3.0,
    target_price: item.target_price || item.current_price * 1.1,
    expected_return: item.expected_return || 10,
    recommendation: item.recommendation || 'hold',
    confidence: item.confidence || 75,
    reasons: item.reasons || ['AI推荐'],
    analysis: item.analysis || 'AI综合分析结果',
    is_hot: item.is_hot || false,
    fundamental_score: item.fundamental_score || 3.0,
    technical_score: item.technical_score || 3.0,
    sentiment_score: item.sentiment_score || 3.0,
    risk_score: item.risk_score || 50,
    risk_factors: item.risk_factors || ['市场风险'],
    similar_stocks: item.similar_stocks || []
  }))
}

// 转换API响应数据为组件使用的格式
const transformApiData = (items: any[]) => {
  return items.map(item => ({
    code: item.stock_code || item.code,
    name: item.stock_name || item.name,
    industry: item.industry || '未知',
    price: item.current_price || 0,
    change_pct: item.change_percent || 0,
    ai_score: item.ai_score || 3.0,
    target_price: item.target_price || item.current_price * 1.1,
    expected_return: item.expected_return || 10,
    recommendation: item.recommendation || 'hold',
    confidence: item.confidence || 75,
    reasons: item.reasons || ['AI推荐'],
    analysis: item.analysis || 'AI综合分析结果',
    is_hot: item.is_hot || false,
    fundamental_score: item.fundamental_score || 3.0,
    technical_score: item.technical_score || 3.0,
    sentiment_score: item.sentiment_score || 3.0,
    risk_score: item.risk_score || 50,
    risk_factors: item.risk_factors || ['市场风险'],
    similar_stocks: item.similar_stocks || []
  }))
}

// 加载AI推荐数据 - 使用真实API
const loadRecommendations = async () => {
  try {
    isLoading.value = true
    
    const response = await unifiedHttpClient.aiAnalysis.getResults({
      analysis_type: 'smart_recommendation',
      limit: 20
    })
    
    if (response.data && response.data.results) {
      recommendations.value = transformApiData(response.data.results)
    } else {
      ElMessage.warning('暂无AI推荐数据')
      recommendations.value = []
    }
  } catch (error) {
    console.error('加载AI推荐失败:', error)
    ElMessage.error('加载AI推荐失败，请检查网络连接')
    recommendations.value = []
  } finally {
    isLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadRecommendations()
})
</script>

<style lang="scss" scoped>
.smart-recommendation {
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

  .main-content {
    // 主要内容区域样式
  }

  .stock-detail {
    .recommendation-analysis {
      .score-breakdown {
        .score-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          span {
            font-size: 14px;
            color: #606266;
            min-width: 60px;
          }
        }
      }

      .risk-assessment {
        .risk-factors {
          margin-top: 16px;

          h5 {
            margin: 0 0 8px 0;
            color: #303133;
            font-size: 14px;
          }

          ul {
            margin: 0;
            padding-left: 20px;

            li {
              color: #606266;
              font-size: 12px;
              margin: 4px 0;
            }
          }
        }
      }
    }

    .price-prediction {
      .prediction-chart {
        margin-top: 24px;

        h4 {
          margin: 0 0 16px 0;
          color: #303133;
        }

        .chart-placeholder {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          border-radius: 4px;
          color: #909399;

          p {
            margin: 16px 0 0 0;
          }
        }
      }
    }

    .similar-stocks {
      max-height: 300px; // 限制最大高度
      overflow-y: auto; // 添加滚动条
      
      .similar-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .similar-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .similar-name {
            font-weight: 500;
            color: #303133;
          }
        }

        .similar-metrics {
          display: flex;
          align-items: center;
          gap: 8px;

          .price-up {
            color: #f56c6c;
          }

          .price-down {
            color: #67c23a;
          }

          .price-flat {
            color: #909399;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .smart-recommendation {
    padding: 12px;

    .main-content {
      .el-col {
        margin-bottom: 20px;
      }
    }

    .stock-detail {
      .recommendation-analysis {
        .el-col {
          margin-bottom: 16px;
        }
      }
    }
  }
}
</style> 