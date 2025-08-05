<template>
  <div class="ai-prediction-engine">
    <!-- 预测配置面板 -->
    <el-card class="prediction-config">
      <template #header>
        <div class="card-header">
          <span>AI预测配置</span>
          <el-button @click="startPrediction" :loading="isPredicting" size="small" type="primary">
            {{ isPredicting ? '预测中...' : '开始预测' }}
          </el-button>
        </div>
      </template>
      
      <el-form :model="predictionConfig" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预测周期">
              <el-select v-model="predictionConfig.period" placeholder="选择预测周期">
                <el-option label="1天" value="1d" />
                <el-option label="3天" value="3d" />
                <el-option label="1周" value="1w" />
                <el-option label="1月" value="1m" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
                         <el-form-item label="置信度阈值">
               <el-slider 
                 v-model="predictionConfig.confidenceThreshold" 
                 :min="0.5" 
                 :max="0.95" 
                 :step="0.05"
                 :format-tooltip="(val: number) => `${(val * 100).toFixed(0)}%`"
               />
             </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
                         <el-form-item label="数据源权重">
               <el-slider 
                 v-model="predictionConfig.dataWeight" 
                 :min="0.1" 
                 :max="1" 
                 :step="0.1"
                 :format-tooltip="(val: number) => `${(val * 100).toFixed(0)}%`"
               />
             </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型复杂度">
              <el-select v-model="predictionConfig.modelComplexity" placeholder="选择模型复杂度">
                <el-option label="简单" value="simple" />
                <el-option label="中等" value="medium" />
                <el-option label="复杂" value="complex" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 数据源选择 -->
        <el-form-item label="数据源">
          <el-checkbox-group v-model="predictionConfig.dataSources">
            <el-checkbox label="技术指标">技术指标</el-checkbox>
            <el-checkbox label="基本面">基本面</el-checkbox>
            <el-checkbox label="市场情绪">市场情绪</el-checkbox>
            <el-checkbox label="新闻资讯">新闻资讯</el-checkbox>
            <el-checkbox label="成交量">成交量</el-checkbox>
            <el-checkbox label="形态分析">形态分析</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <!-- 技术指标选择 -->
        <el-form-item label="技术指标" v-if="predictionConfig.dataSources.includes('技术指标')">
          <el-checkbox-group v-model="predictionConfig.technicalIndicators">
            <el-checkbox label="MA">MA</el-checkbox>
            <el-checkbox label="MACD">MACD</el-checkbox>
            <el-checkbox label="RSI">RSI</el-checkbox>
            <el-checkbox label="KDJ">KDJ</el-checkbox>
            <el-checkbox label="布林带">布林带</el-checkbox>
            <el-checkbox label="成交量">成交量</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预测结果展示 -->
    <el-card class="prediction-results" v-if="predictions.length > 0">
      <template #header>
        <div class="card-header">
          <span>AI预测结果</span>
          <div class="header-actions">
            <el-button @click="exportPredictions" size="small" type="success">导出结果</el-button>
            <el-button @click="clearPredictions" size="small" type="danger">清空</el-button>
          </div>
        </div>
      </template>
      
      <div class="results-content">
        <!-- 预测概览 -->
        <div class="prediction-overview">
          <el-row :gutter="20">
            <el-col :span="6" v-for="metric in predictionMetrics" :key="metric.key">
              <el-card class="metric-card" shadow="hover">
                <div class="metric-value">{{ metric.value }}</div>
                <div class="metric-label">{{ metric.label }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
        
        <!-- 预测详情表格 -->
        <el-table :data="predictions" style="width: 100%" height="400">
          <el-table-column prop="timestamp" label="预测时间" width="150">
            <template #default="scope">
              {{ formatTime(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="type" label="预测类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'buy' ? 'success' : 'danger'" size="small">
                {{ scope.row.type === 'buy' ? '买入' : '卖出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="预测价格" width="120">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="confidence" label="置信度" width="120">
            <template #default="scope">
              <el-progress 
                :percentage="scope.row.confidence * 100" 
                :color="getConfidenceColor(scope.row.confidence)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="factors" label="影响因素" width="200">
            <template #default="scope">
              <el-tag 
                v-for="factor in scope.row.factors" 
                :key="factor.name"
                size="small"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ factor.name }}: {{ factor.weight.toFixed(2) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reasoning" label="预测理由" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button @click="viewPredictionDetail(scope.row)" size="small" type="primary">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 预测详情对话框-->
    <el-dialog 
      v-model="showPredictionDetail" 
      title="预测详情" 
      width="800px"
      :before-close="closePredictionDetail"
    >
      <div v-if="selectedPrediction" class="prediction-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预测时间">
            {{ formatTime(selectedPrediction.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="预测类型">
            <el-tag :type="selectedPrediction.type === 'buy' ? 'success' : 'danger'">
              {{ selectedPrediction.type === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预测价格">
            ¥{{ selectedPrediction.price.toFixed(2) }}
          </el-descriptions-item>
          <el-descriptions-item label="置信度">
            {{ (selectedPrediction.confidence * 100).toFixed(1) }}%
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">影响因素分析</el-divider>
        <div class="factors-analysis">
          <div 
            v-for="factor in selectedPrediction.factors" 
            :key="factor.name"
            class="factor-item"
          >
            <div class="factor-header">
              <span class="factor-name">{{ factor.name }}</span>
              <span class="factor-weight">{{ (factor.weight * 100).toFixed(1) }}%</span>
            </div>
            <el-progress 
              :percentage="factor.weight * 100" 
              :color="getFactorColor(factor.weight)"
              :stroke-width="6"
            />
            <div class="factor-description">{{ factor.description }}</div>
          </div>
        </div>
        
        <el-divider content-position="left">预测理由</el-divider>
        <div class="prediction-reasoning">
          {{ selectedPrediction.reasoning }}
        </div>
        
        <el-divider content-position="left">风险评估</el-divider>
        <div class="risk-assessment">
          <el-alert 
            :title="selectedPrediction.riskLevel" 
            :type="getRiskType(selectedPrediction.riskLevel)"
            :description="selectedPrediction.riskDescription"
            show-icon
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 类型定义
interface PredictionConfig {
  period: string
  confidenceThreshold: number
  dataWeight: number
  modelComplexity: string
  dataSources: string[]
  technicalIndicators: string[]
}

interface PredictionFactor {
  name: string
  weight: number
  description: string
}

interface Prediction {
  id: string
  timestamp: Date
  type: 'buy' | 'sell'
  price: number
  confidence: number
  factors: PredictionFactor[]
  reasoning: string
  riskLevel: string
  riskDescription: string
}

// Props
interface Props {
  stockCode?: string
  stockData?: any[]
  newsData?: any[]
  sentimentData?: any
}

const props = withDefaults(defineProps<Props>(), {
  stockCode: '',
  stockData: () => [],
  newsData: () => [],
  sentimentData: null
})

// Emits
const emit = defineEmits<{
  'prediction-complete': [predictions: Prediction[]]
  'prediction-error': [error: string]
}>()

// 响应式数据
const isPredicting = ref(false)
const predictions = ref<Prediction[]>([])
const showPredictionDetail = ref(false)
const selectedPrediction = ref<Prediction | null>(null)

const predictionConfig = reactive<PredictionConfig>({
  period: '1w',
  confidenceThreshold: 0.7,
  dataWeight: 0.8,
  modelComplexity: 'medium',
  dataSources: ['技术指标', '基本面'],
  technicalIndicators: ['MA', 'MACD', 'RSI']
})

// 计算属性
const predictionMetrics = computed(() => [
  {
    key: 'total',
    label: '总预测数',
    value: predictions.value.length
  },
  {
    key: 'buy',
    label: '买入信号',
    value: predictions.value.filter(p => p.type === 'buy').length
  },
  {
    key: 'sell',
    label: '卖出信号',
    value: predictions.value.filter(p => p.type === 'sell').length
  },
  {
    key: 'avgConfidence',
    label: '平均置信度',
    value: predictions.value.length > 0 
      ? `${(predictions.value.reduce((sum, p) => sum + p.confidence, 0) / predictions.value.length * 100).toFixed(1)}%`
      : '0%'
  }
])

// 方法
const startPrediction = async () => {
  if (!props.stockCode) {
    ElMessage.warning('请先选择股票')
    return
  }
  
  try {
    isPredicting.value = true
    ElMessage.info('开始AI预测分析...')
    
    // 模拟AI预测过程
    await simulatePrediction()
    
    ElMessage.success('AI预测完成')
    emit('prediction-complete', predictions.value)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '预测失败'
    ElMessage.error(`AI预测失败: ${errorMsg}`)
    emit('prediction-error', errorMsg)
  } finally {
    isPredicting.value = false
  }
}

const simulatePrediction = async () => {
  // 模拟预测延迟
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // 分析新闻情绪数据
  let sentimentFactor = { name: '新闻情绪', weight: 0.15, description: '新闻情绪中性' }
  let newsFactor = { name: '新闻影响', weight: 0.1, description: '新闻影响较小' }
  
  if (props.newsData && props.newsData.length > 0) {
    const positiveNews = props.newsData.filter(n => n.sentiment === 'positive').length
    const negativeNews = props.newsData.filter(n => n.sentiment === 'negative').length
    const totalNews = props.newsData.length
    
    if (positiveNews > negativeNews) {
      sentimentFactor = { 
        name: '新闻情绪', 
        weight: 0.25, 
        description: `正面新闻${(positiveNews/totalNews*100).toFixed(1)}%，情绪积极` 
      }
      newsFactor = { 
        name: '新闻影响', 
        weight: 0.2, 
        description: '新闻对股价有积极影响' 
      }
    } else if (negativeNews > positiveNews) {
      sentimentFactor = { 
        name: '新闻情绪', 
        weight: 0.25, 
        description: `负面新闻${(negativeNews/totalNews*100).toFixed(1)}%，情绪消极` 
      }
      newsFactor = { 
        name: '新闻影响', 
        weight: 0.2, 
        description: '新闻对股价有消极影响' 
      }
    }
  }
  
  // 生成模拟预测结果
  const mockPredictions: Prediction[] = [
    {
      id: '1',
      timestamp: new Date(),
      type: 'buy',
      price: 115.50,
      confidence: 0.85,
      factors: [
        { name: '技术指标', weight: 0.35, description: 'MACD金叉，RSI超卖反弹' },
        { name: '基本面', weight: 0.25, description: '业绩增长，估值合理' },
        sentimentFactor,
        newsFactor,
        { name: '形态分析', weight: 0.1, description: '底部形态确认' }
      ],
      reasoning: '综合技术面、基本面和新闻情绪分析，该股票当前处于较好的买入时机。技术指标显示超卖反弹信号，基本面支撑股价上涨，新闻情绪积极，建议买入。',
      riskLevel: '中等风险',
      riskDescription: '市场波动可能影响短期表现，建议分批建仓，设置止损位。'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() + 86400000), // 明天
      type: 'sell',
      price: 118.20,
      confidence: 0.72,
      factors: [
        { name: '技术指标', weight: 0.4, description: 'KDJ死叉，布林带上轨压力' },
        { name: '成交量', weight: 0.25, description: '量能萎缩，上涨乏力' },
        sentimentFactor,
        { name: '市场情绪', weight: 0.15, description: '获利盘抛售' }
      ],
      reasoning: '技术指标显示短期调整信号，成交量配合度不高，新闻情绪影响有限，建议获利了结。',
      riskLevel: '低风险',
      riskDescription: '技术性调整，风险相对较小。'
    }
  ]
  
  predictions.value = mockPredictions
}

const exportPredictions = () => {
  const dataStr = JSON.stringify(predictions.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ai_predictions_${props.stockCode}_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('预测结果已导出')
}

const clearPredictions = () => {
  predictions.value = []
  ElMessage.success('预测结果已清空')
}

const viewPredictionDetail = (prediction: Prediction) => {
  selectedPrediction.value = prediction
  showPredictionDetail.value = true
}

const closePredictionDetail = () => {
  showPredictionDetail.value = false
  selectedPrediction.value = null
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleString()
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#67c23a'
  if (confidence >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const getFactorColor = (weight: number) => {
  if (weight >= 0.4) return '#67c23a'
  if (weight >= 0.2) return '#e6a23c'
  return '#909399'
}

const getRiskType = (riskLevel: string) => {
  switch (riskLevel) {
    case '低风险': return 'success'
    case '中等风险': return 'warning'
    case '高风险': return 'error'
    default: return 'info'
  }
}

// 暴露方法给父组件
defineExpose({
  startPrediction,
  clearPredictions,
  predictions: computed(() => predictions.value)
})
</script>

<style scoped>
.ai-prediction-engine {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prediction-config,
.prediction-results {
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

.prediction-overview {
  margin-bottom: 20px;
}

.metric-card {
  text-align: center;
  padding: 15px;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
}

.factors-analysis {
  margin: 15px 0;
}

.factor-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.factor-name {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.factor-weight {
  color: var(--el-color-primary);
  font-weight: bold;
}

.factor-description {
  margin-top: 5px;
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
}

.prediction-reasoning {
  padding: 15px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  line-height: 1.6;
  margin: 15px 0;
}

.risk-assessment {
  margin: 15px 0;
}

:deep(.el-progress-bar__outer) {
  background-color: var(--el-border-color-light);
}

:deep(.el-progress-bar__inner) {
  transition: all 0.3s ease;
}
</style> 
