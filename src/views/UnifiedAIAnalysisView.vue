<template>
  <div class="unified-ai-analysis-container">
    <div class="ai-analysis-header">
      <h1 class="ai-analysis-title">🤖 统一AI分析</h1>
      <p class="ai-analysis-subtitle">智能股票分析与投资建议 - 统一服务版本</p>
    </div>

    <div class="ai-analysis-content">
      <!-- 连接状态 -->
      <el-card class="connection-status-card">
        <template #header>
          <div class="card-header">
            <span>服务连接状态</span>
            <el-button @click="checkConnectionStatus" size="small" type="primary">
              检查连接
            </el-button>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="4" v-for="(status, service) in connectionStatus" :key="service">
            <div class="status-indicator" :class="{ connected: status }">
              <el-icon :class="{ 'is-success': status, 'is-danger': !status }">
                <CircleCheck v-if="status" />
                <CircleClose v-else />
              </el-icon>
              <span class="service-name">{{ getServiceDisplayName(service) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 分析配置 -->
      <el-card class="analysis-config-card">
        <template #header>
          <div class="card-header">
            <span>分析配置</span>
          </div>
        </template>
        <el-form :model="analysisConfig" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分析类型" required>
                <el-select v-model="analysisConfig.analysis_type" placeholder="选择分析类型">
                  <el-option label="技术分析" value="technical_analysis" />
                  <el-option label="基本面分析" value="fundamental_analysis" />
                  <el-option label="情感分析" value="sentiment_analysis" />
                  <el-option label="风险分析" value="risk_analysis" />
                  <el-option label="趋势分析" value="trend_analysis" />
                  <el-option label="投资建议" value="investment_advice" />
                  <el-option label="综合分析" value="comprehensive_analysis" />
                  <el-option label="组合分析" value="portfolio_analysis" />
                  <el-option label="市场分析" value="market_analysis" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="股票代码" required>
                <el-input
                  v-model="analysisConfig.stock_codes"
                  placeholder="输入股票代码，多个用逗号分隔"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分析深度">
                <el-select v-model="analysisConfig.depth" placeholder="选择分析深度">
                  <el-option label="基础分析" value="basic" />
                  <el-option label="深度分析" value="deep" />
                  <el-option label="全面分析" value="comprehensive" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="analysisConfig.date_range"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="primary" @click="startAnalysis" :loading="startingAnalysis">
              开始分析
            </el-button>
            <el-button @click="resetConfig">重置配置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 快速分析操作 -->
      <el-card class="quick-actions-card">
        <template #header>
          <div class="card-header">
            <span>快速分析操作</span>
          </div>
        </template>
        <div class="quick-actions">
          <el-button 
            v-for="action in quickActions" 
            :key="action.type"
            @click="quickAnalysis(action)"
            :type="action.type === 'comprehensive' ? 'primary' : 'default'"
            size="large"
          >
            <el-icon><component :is="action.icon" /></el-icon>
            {{ action.label }}
          </el-button>
        </div>
      </el-card>

      <!-- 分析结果 -->
      <el-card v-if="analysisResults.length > 0" class="analysis-results-card">
        <template #header>
          <div class="card-header">
            <span>分析结果</span>
            <el-button @click="exportResults" size="small" type="success">
              导出结果
            </el-button>
          </div>
        </template>
        <div class="analysis-results">
          <div 
            v-for="result in analysisResults" 
            :key="result.id"
            class="analysis-result-item"
          >
            <div class="result-header">
              <h3>{{ result.stock_code }} - {{ result.stock_name }}</h3>
              <el-tag :type="getResultType(result.status)">{{ result.status }}</el-tag>
            </div>
            <div class="result-content">
              <p>{{ result.summary }}</p>
            </div>
            <div class="result-actions">
              <el-button size="small" @click="viewDetail(result)">查看详情</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { CircleCheck, CircleClose, DataAnalysis, TrendCharts, Warning } from '@element-plus/icons-vue'
import { useWebSocket } from '@/composables/useWebSocket'

// 定义分析结果类型
interface AnalysisResult {
  id: string
  stock_code: string
  stock_name: string
  status: string
  summary: string
  analysis_type: string
  created_at: string
}

const {
  connectionStatus,
  initWebSockets,
  cleanupWebSockets,
  addTaskEventListeners,
  removeTaskEventListeners
} = useWebSocket()

const analysisConfig = reactive({
  analysis_type: 'comprehensive_analysis',
  stock_codes: '',
  depth: 'deep',
  date_range: null as any
})

const startingAnalysis = ref(false)
const analysisResults = ref<AnalysisResult[]>([])

const quickActions = [
  { type: 'comprehensive', label: '综合分析', icon: 'DataAnalysis' },
  { type: 'technical', label: '技术分析', icon: 'TrendCharts' },
  { type: 'risk', label: '风险分析', icon: 'Warning' },
  { type: 'advice', label: '投资建议', icon: 'CircleCheck' }
]

const getServiceDisplayName = (service: string) => {
  const names: Record<string, string> = {
    dataCollection: '数据采集',
    aiAnalysis: 'AI分析',
    newsAnalysis: '新闻分析',
    backtest: '回测服务',
    scheduler: '调度服务'
  }
  return names[service] || service
}

const getResultType = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'running': return 'primary'
    case 'failed': return 'danger'
    case 'pending': return 'info'
    default: return 'info'
  }
}

const checkConnectionStatus = () => {
  console.log('检查连接状态:', connectionStatus)
}

const startAnalysis = () => {
  console.log('开始分析:', analysisConfig)
  startingAnalysis.value = true
  // 这里添加分析逻辑
}

const resetConfig = () => {
  Object.assign(analysisConfig, {
    analysis_type: 'comprehensive_analysis',
    stock_codes: '',
    depth: 'deep',
    date_range: null
  })
}

const quickAnalysis = (action: any) => {
  console.log('快速分析:', action)
  // 这里添加快速分析逻辑
}

const exportResults = () => {
  console.log('导出结果')
  // 这里添加导出逻辑
}

const viewDetail = (result: AnalysisResult) => {
  console.log('查看详情:', result)
  // 这里添加查看详情逻辑
}

onMounted(() => {
  console.log('统一AI分析组件已挂载')
  initWebSockets()
})

onUnmounted(() => {
  cleanupWebSockets()
})
</script>

<style scoped>
.unified-ai-analysis-container {
  padding: 20px;
}

.ai-analysis-header {
  margin-bottom: 30px;
  text-align: center;
}

.ai-analysis-title {
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
}

.ai-analysis-subtitle {
  font-size: 1rem;
  color: #909399;
  margin: 0;
}

.ai-analysis-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.connection-status-card,
.analysis-config-card,
.quick-actions-card,
.analysis-results-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.status-indicator.connected {
  background-color: #f0f9ff;
}

.service-name {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.analysis-result-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.result-header h3 {
  margin: 0;
  color: #303133;
}

.result-content {
  margin-bottom: 10px;
}

.result-content p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.result-actions {
  text-align: right;
}
</style> 
