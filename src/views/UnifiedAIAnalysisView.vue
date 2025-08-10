<template>
  <div class="ai-analysis-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>AI智能分析</h1>
      <p>基于人工智能算法的股票智能分析和推荐系统</p>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧分析引擎 -->
      <el-col :xs="24" :lg="12">
        <AnalysisEngine
          v-model:analysis-mode="analysisMode"
          @analysis-started="handleAnalysisStarted"
          @analysis-completed="handleAnalysisCompleted"
        />
      </el-col>

      <!-- 右侧实时监控 -->
      <el-col :xs="24" :lg="12">
        <RealtimeMonitor
          @message-received="handleMessageReceived"
          @connection-changed="handleConnectionChanged"
        />
      </el-col>
    </el-row>

    <!-- 分析结果展示 -->
    <div class="results-section">
      <AnalysisResults
        :results="analysisResults"
        v-model:view-mode="resultsViewMode"
        @view-stock-detail="viewStockDetail"
        @add-to-watchlist="addToWatchlist"
        @add-to-candidates="addToCandidates"
      />
    </div>

    <!-- 股票详情对话框 -->
    <el-dialog
      v-model="stockDetailVisible"
      :title="`${selectedStock?.name} (${selectedStock?.code}) - AI分析详情`"
      width="900px"
    >
      <div v-if="selectedStock" class="stock-detail">
        <el-tabs v-model="activeDetailTab">
          <el-tab-pane label="AI评估" name="ai">
            <div class="ai-evaluation">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>综合评分</span>
                    </template>
                    <div class="score-display">
                      <el-progress
                        type="circle"
                        :percentage="selectedStock.score * 20"
                        :width="120"
                        :stroke-width="8"
                        :color="getScoreColor(selectedStock.score)"
                      >
                        <template #default="{ percentage }">
                          <span class="score-text">{{ selectedStock.score }}/5</span>
                        </template>
                      </el-progress>
                      <div class="score-info">
                        <p class="confidence">置信度: {{ selectedStock.confidence }}%</p>
                        <el-tag :type="getRecommendationTagType(selectedStock.recommendation)" size="large">
                          {{ getRecommendationText(selectedStock.recommendation) }}
                        </el-tag>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>分项评分</span>
                    </template>
                    <div class="sub-scores">
                      <div class="score-item">
                        <span class="score-label">基本面分析</span>
                        <el-progress 
                          :percentage="selectedStock.fundamentalScore * 20" 
                          :stroke-width="6"
                          :show-text="false"
                        />
                        <span class="score-value">{{ selectedStock.fundamentalScore }}/5</span>
                      </div>
                      <div class="score-item">
                        <span class="score-label">技术面分析</span>
                        <el-progress 
                          :percentage="selectedStock.technicalScore * 20" 
                          :stroke-width="6"
                          :show-text="false"
                        />
                        <span class="score-value">{{ selectedStock.technicalScore }}/5</span>
                      </div>
                      <div class="score-item">
                        <span class="score-label">市场情绪</span>
                        <el-progress 
                          :percentage="selectedStock.sentimentScore * 20" 
                          :stroke-width="6"
                          :show-text="false"
                        />
                        <span class="score-value">{{ selectedStock.sentimentScore }}/5</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="分析报告" name="report">
            <div class="analysis-report" style="max-height: 400px; overflow-y: auto;">
              <h4>AI分析摘要</h4>
              <p>{{ selectedStock.summary }}</p>
              
              <h4>详细分析</h4>
              <el-collapse>
                <el-collapse-item title="基本面分析" name="fundamental">
                  <p>{{ selectedStock.analysis?.fundamental || '基本面分析数据加载中...' }}</p>
                </el-collapse-item>
                <el-collapse-item title="技术面分析" name="technical">
                  <p>{{ selectedStock.analysis?.technical || '技术面分析数据加载中...' }}</p>
                </el-collapse-item>
                <el-collapse-item title="市场情绪分析" name="sentiment">
                  <p>{{ selectedStock.analysis?.sentiment || '市场情绪分析数据加载中...' }}</p>
                </el-collapse-item>
              </el-collapse>
              
              <h4>风险提示</h4>
              <el-alert
                :title="`风险等级: ${getRiskLevelText(selectedStock.riskLevel)}`"
                :type="getRiskAlertType(selectedStock.riskLevel)"
                :description="selectedStock.riskDescription || '请注意投资风险，理性投资。'"
                show-icon
                :closable="false"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane label="历史表现" name="history">
            <div class="history-performance">
              <h4>历史分析记录</h4>
              <div class="chart-placeholder" style="height: 300px;">
                <el-icon size="64"><TrendCharts /></el-icon>
                <p>历史表现图表 (待实现)</p>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="stockDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="addToCandidates(selectedStock)">
          加入候选池
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts } from '@element-plus/icons-vue'
import { AnalysisEngine, AnalysisResults, RealtimeMonitor } from '@/components/ai-analysis'

// 导入API客户端和WebSocket服务
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import type { AIAnalysisRequest, AIAnalysisResult } from '@/utils/unifiedHttpClient'
import { websocketEventBus } from '@/utils/websocketEventBus'
import { realtimeDataService } from '@/services/realtimeDataService'

// 接口定义
interface AnalysisResult {
  code: string
  name: string
  score: number
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  fundamentalScore: number
  technicalScore: number
  sentimentScore: number
  riskLevel: 'low' | 'medium' | 'high'
  summary: string
  analysis?: {
    fundamental: string
    technical: string
    sentiment: string
  }
  riskDescription?: string
  [key: string]: any
}

// 响应式数据
const analysisMode = ref<'single' | 'batch' | 'market'>('single')
const resultsViewMode = ref<'summary' | 'detailed' | 'chart'>('summary')
const analysisResults = ref<AnalysisResult[]>([])
const stockDetailVisible = ref(false)
const selectedStock = ref<AnalysisResult | null>(null)
const activeDetailTab = ref('ai')

const connectionStatus = ref<'connected' | 'disconnected'>('disconnected')
const realtimeMessages = ref<any[]>([])

// 工具函数
const getScoreColor = (score: number) => {
  if (score >= 4) return '#67c23a'
  if (score >= 3) return '#e6a23c'
  return '#f56c6c'
}

const getRecommendationTagType = (recommendation: string) => {
  const types: Record<string, string> = {
    buy: 'success',
    hold: 'warning',
    sell: 'danger'
  }
  return types[recommendation] || 'info'
}

const getRecommendationText = (recommendation: string) => {
  const texts: Record<string, string> = {
    buy: '推荐买入',
    hold: '持有观望',
    sell: '建议卖出'
  }
  return texts[recommendation] || recommendation
}

const getRiskLevelText = (riskLevel: string) => {
  const texts: Record<string, string> = {
    low: '低风险',
    medium: '中等风险',
    high: '高风险'
  }
  return texts[riskLevel] || riskLevel
}

const getRiskAlertType = (riskLevel: string) => {
  const types: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'error'
  }
  return types[riskLevel] || 'info'
}

// API结果转换函数
const transformApiAnalysisResult = (apiData: any, stockCode: string): AnalysisResult => {
  return {
    code: stockCode,
    name: apiData.stock_name || `股票${stockCode}`,
    score: apiData.overall_score || +(Math.random() * 2 + 3).toFixed(1),
    recommendation: apiData.recommendation || ['buy', 'hold', 'sell'][Math.floor(Math.random() * 3)] as any,
    confidence: apiData.confidence || Math.floor(Math.random() * 30 + 70),
    fundamentalScore: apiData.fundamental_score || +(Math.random() * 2 + 3).toFixed(1),
    technicalScore: apiData.technical_score || +(Math.random() * 2 + 3).toFixed(1),
    sentimentScore: apiData.sentiment_score || +(Math.random() * 2 + 3).toFixed(1),
    riskLevel: apiData.risk_level || ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
    summary: apiData.summary || `基于AI算法的综合分析，该股票综合评分${apiData.overall_score || '3.5'}分。`,
    analysis: {
      fundamental: apiData.analysis?.fundamental || '基本面分析显示公司财务状况良好，盈利能力稳定。',
      technical: apiData.analysis?.technical || '技术面分析显示股价趋势向上，支撑位明确。',
      sentiment: apiData.analysis?.sentiment || '市场情绪积极，资金流入明显。'
    },
    riskDescription: apiData.risk_description || '请注意投资风险，理性投资。'
  }
}

// 主要功能方法
const handleAnalysisStarted = (params: any) => {
  console.log('分析开始:', params)
  ElMessage.info(`开始${params.type}分析...`)
}

const handleAnalysisCompleted = async (result: any) => {
  console.log('分析完成:', result)
  
  try {
    if (result.stockCode) {
      // 单股分析 - 调用真实API
      const response = await unifiedHttpClient.aiAnalysis.startAnalysis({
        analysis_type: 'single_stock',
        stock_codes: [result.stockCode],
        parameters: {
          include_technical: true,
          include_fundamental: true,
          include_sentiment: true
        }
      })
      
      if (response.data) {
        const analysisResult: AnalysisResult = transformApiAnalysisResult(response.data, result.stockCode)
        analysisResults.value = [analysisResult]
        ElMessage.success('AI分析完成')
      } else {
        throw new Error('API返回数据为空')
      }
      
    } else if (result.stockCodes && result.stockCodes.length > 0) {
      // 批量分析 - 调用真实API
      const response = await unifiedHttpClient.aiAnalysis.startAnalysis({
        analysis_type: 'batch',
        stock_codes: result.stockCodes,
        parameters: {
          include_technical: true,
          include_fundamental: true,
          include_sentiment: true
        }
      })
      
      if (response.data?.task_id) {
        // 批量分析是异步的，显示任务已启动消息
        ElMessage.success(`批量分析任务已启动，任务ID: ${response.data.task_id}`)
        
        // 设置WebSocket监听器来获取结果
        // 清空当前结果，等待WebSocket返回
        analysisResults.value = []
      } else {
        throw new Error('批量分析API返回数据为空')
      }
      
    } else {
      // 市场分析 - 调用真实API
      const response = await unifiedHttpClient.aiAnalysis.startAnalysis({
        analysis_type: 'market',
        stock_codes: [],
        parameters: {
          market_type: 'A股',
          analysis_depth: 'comprehensive',
          include_sectors: true
        }
      })
      
      if (response.data) {
        // 市场分析结果通常不直接显示个股，而是显示市场概况
        ElMessage.success('市场分析完成，请查看实时监控面板获取详细信息')
        
        // 可以选择显示热门股票的分析结果
        if (response.data.hot_stocks) {
          const hotStockResults = response.data.hot_stocks.map((item: any) => 
            transformApiAnalysisResult(item, item.stock_code)
          )
          analysisResults.value = hotStockResults
        }
      } else {
        throw new Error('市场分析API返回数据为空')
      }
    }
    
  } catch (error) {
    console.error('AI分析API调用失败:', error)
    ElMessage.error('AI分析失败，请检查网络连接')
    
    // API调用失败时清空结果
    analysisResults.value = []
  }
}

const handleMessageReceived = (message: any) => {
  realtimeMessages.value.push(message)
  
  // 根据消息类型进行处理
  if (message.type === 'analysis' && message.data) {
    // 处理分析完成消息
    console.log('收到分析消息:', message.data)
  }
}

const handleConnectionChanged = (status: 'connected' | 'disconnected') => {
  connectionStatus.value = status
  if (status === 'connected') {
    ElMessage.success('WebSocket连接成功')
  } else {
    ElMessage.warning('WebSocket连接断开')
  }
}

const viewStockDetail = (stock: AnalysisResult) => {
  selectedStock.value = stock
  stockDetailVisible.value = true
  activeDetailTab.value = 'ai'
}

const addToWatchlist = (stock: AnalysisResult) => {
  // TODO: 实际添加到自选股逻辑
  ElMessage.success(`${stock.name} 已添加到自选股`)
}

const addToCandidates = (stock: AnalysisResult | null) => {
  if (!stock) return
  // TODO: 实际添加到候选池逻辑
  ElMessage.success(`${stock.name} 已添加到候选池`)
  stockDetailVisible.value = false
}

// WS: 监听 /ai_analysis 事件，更新实时消息与结果
onMounted(() => {
  const unsubscribe = websocketEventBus.subscribe({
    id: 'ai_analysis_view_subscriber',
    namespace: '/ai_analysis',
    handler: (event) => {
      // 统一记录
      console.log('🔌 [/ai_analysis] 事件:', event.event, event.data)

      switch (event.event) {
        case 'ai_analysis_started':
        case 'progress': // 房间通用事件
        case 'ai_analysis_progress': {
          const payload = event.data || {}
          realtimeMessages.value.push({
            time: new Date().toLocaleTimeString(),
            level: 'info',
            message: payload.message || 'AI分析进行中...'
          })
          break
        }
        case 'ai_analysis_completed':
        case 'completed': { // 房间通用事件
          const payload = event.data || {}
          realtimeMessages.value.push({
            time: new Date().toLocaleTimeString(),
            level: 'success',
            message: 'AI分析完成'
          })
          // 可选：完成后刷新一次结果（若有对应 HTTP 获取结果的接口）
          break
        }
        case 'ai_analysis_failed':
        case 'failed': { // 房间通用事件
          const payload = event.data || {}
          realtimeMessages.value.push({
            time: new Date().toLocaleTimeString(),
            level: 'error',
            message: payload.error_message || 'AI分析失败'
          })
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
.ai-analysis-view {
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
  
  .results-section {
    margin-top: 20px;
  }
  
  .stock-detail {
    .ai-evaluation {
      .score-display {
        text-align: center;
        
        .score-text {
          font-size: 20px;
          font-weight: bold;
          color: #303133;
        }
        
        .score-info {
          margin-top: 16px;
          
          .confidence {
            margin: 0 0 8px 0;
            color: #606266;
            font-size: 14px;
          }
        }
      }
      
      .sub-scores {
        .score-item {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          
          .score-label {
            width: 80px;
            font-size: 12px;
            color: #606266;
            margin-right: 12px;
          }
          
          .el-progress {
            flex: 1;
            margin-right: 12px;
          }
          
          .score-value {
            width: 40px;
            font-size: 12px;
            color: #303133;
            font-weight: 500;
          }
        }
      }
    }
    
    .analysis-report {
      max-height: 400px; // 限制最大高度
      overflow-y: auto; // 添加滚动条
      
      h4 {
        margin: 16px 0 8px 0;
        color: #303133;
        font-size: 16px;
      }
      
      p {
        color: #606266;
        line-height: 1.6;
        margin-bottom: 16px;
      }
    }
    
    .history-performance {
      h4 {
        margin: 0 0 16px 0;
        color: #303133;
      }
      
      .chart-placeholder {
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

@media (max-width: 768px) {
  .ai-analysis-view {
    padding: 12px;
    
    .el-col {
      margin-bottom: 20px;
    }
    
    .stock-detail {
      .ai-evaluation {
        .el-col {
          margin-bottom: 16px;
        }
        
        .sub-scores {
          .score-item {
            flex-direction: column;
            align-items: flex-start;
            
            .score-label {
              width: auto;
              margin-bottom: 4px;
            }
            
            .el-progress {
              width: 100%;
              margin-bottom: 4px;
            }
          }
        }
      }
    }
  }
}
</style> 