<template>
  <div class="sentiment-analysis">
    <!-- 情绪分析概览 -->
    <el-card class="sentiment-overview-card">
      <template #header>
        <div class="card-header">
          <span>情绪分析概览</span>
          <el-button @click="refreshSentiment" :loading="isAnalyzing" size="small" type="primary">
            {{ isAnalyzing ? '分析中...' : '刷新分析' }}
          </el-button>
        </div>
      </template>
      
      <div class="overview-content">
        <el-row :gutter="20">
          <el-col :span="6" v-for="metric in sentimentMetrics" :key="metric.name">
            <el-card class="metric-card" shadow="hover">
              <div class="metric-icon" :style="{ color: metric.color }">
                <el-icon :size="24">
                  <component :is="metric.icon" />
                </el-icon>
              </div>
              <div class="metric-value" :style="{ color: metric.color }">
                {{ metric.value }}
              </div>
              <div class="metric-label">{{ metric.label }}</div>
              <div class="metric-trend" :class="metric.trend">
                {{ metric.trendText }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 情绪趋势分析 -->
    <el-card class="sentiment-trend-card">
      <template #header>
        <div class="card-header">
          <span>情绪趋势分析</span>
          <el-select v-model="selectedTimeframe" placeholder="选择时间框架" style="width: 120px">
            <el-option label="1天" value="1d" />
            <el-option label="3天" value="3d" />
            <el-option label="1周" value="1w" />
            <el-option label="1月" value="1m" />
          </el-select>
        </div>
      </template>
      
      <div class="trend-content">
        <div class="chart-container">
          <div ref="trendChartContainer" class="trend-chart-area"></div>
        </div>
        
        <div class="trend-stats">
          <el-row :gutter="20">
            <el-col :span="8" v-for="trend in trendStats" :key="trend.name">
              <div class="trend-item">
                <div class="trend-name">{{ trend.name }}</div>
                <div class="trend-value" :style="{ color: trend.color }">
                  {{ trend.value }}
                </div>
                <div class="trend-description">{{ trend.description }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 情绪分布详情 -->
    <el-card class="sentiment-distribution-card">
      <template #header>
        <div class="card-header">
          <span>情绪分布详情</span>
        </div>
      </template>
      
      <div class="distribution-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="distribution-chart">
              <div ref="pieChartContainer" class="pie-chart-area"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="distribution-details">
              <div class="detail-item" v-for="detail in sentimentDetails" :key="detail.type">
                <div class="detail-header">
                  <div class="detail-color" :style="{ backgroundColor: detail.color }"></div>
                  <div class="detail-label">{{ detail.label }}</div>
                  <div class="detail-value">{{ detail.value }}</div>
                </div>
                <div class="detail-bar">
                  <div 
                    class="detail-progress" 
                    :style="{ 
                      width: `${detail.percentage}%`, 
                      backgroundColor: detail.color 
                    }"
                  ></div>
                </div>
                <div class="detail-percentage">{{ detail.percentage }}%</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 情绪关键词分析 -->
    <el-card class="sentiment-keywords-card">
      <template #header>
        <div class="card-header">
          <span>情绪关键词分析</span>
        </div>
      </template>
      
      <div class="keywords-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="positive-keywords">
              <h4>正面关键词</h4>
              <div class="keywords-list">
                <el-tag 
                  v-for="keyword in positiveKeywords" 
                  :key="keyword.word"
                  :type="getKeywordType(keyword.weight)"
                  size="small"
                  style="margin: 5px;"
                >
                  {{ keyword.word }} ({{ keyword.weight.toFixed(2) }})
                </el-tag>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="negative-keywords">
              <h4>负面关键词</h4>
              <div class="keywords-list">
                <el-tag 
                  v-for="keyword in negativeKeywords" 
                  :key="keyword.word"
                  :type="getKeywordType(keyword.weight)"
                  size="small"
                  style="margin: 5px;"
                >
                  {{ keyword.word }} ({{ keyword.weight.toFixed(2) }})
                </el-tag>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 情绪影响分析 -->
    <el-card class="sentiment-impact-card">
      <template #header>
        <div class="card-header">
          <span>情绪对股价影响分析</span>
        </div>
      </template>
      
      <div class="impact-content">
        <el-table :data="impactAnalysis" style="width: 100%">
          <el-table-column prop="factor" label="影响因素" width="150" />
          <el-table-column prop="impact" label="影响程度" width="120">
            <template #default="scope">
              <el-progress 
                :percentage="Math.abs(scope.row.impact * 100)" 
                :color="getImpactColor(scope.row.impact)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="direction" label="影响方向" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.impact > 0 ? 'success' : 'danger'" size="small">
                {{ scope.row.impact > 0 ? '正面' : '负面' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="confidence" label="置信度" width="120">
            <template #default="scope">
              <el-progress 
                :percentage="scope.row.confidence * 100" 
                :stroke-width="6"
              />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="影响描述" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  TrendCharts, 
  DataAnalysis, 
  Histogram, 
  PieChart
} from '@element-plus/icons-vue'

// 类型定义
interface SentimentMetric {
  name: string
  value: string
  label: string
  color: string
  icon: string
  trend: string
  trendText: string
}

interface SentimentDetail {
  type: string
  label: string
  value: number
  percentage: number
  color: string
}

interface Keyword {
  word: string
  weight: number
  frequency: number
}

interface ImpactFactor {
  factor: string
  impact: number
  direction: string
  confidence: number
  description: string
}

// Props
interface Props {
  newsData?: any[]
  sentimentData?: any
  stockCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  newsData: () => [],
  sentimentData: null,
  stockCode: ''
})

// Emits
const emit = defineEmits<{
  'sentiment-updated': [sentiment: any]
  'impact-analyzed': [impact: ImpactFactor[]]
}>()

// 响应式数据
const isAnalyzing = ref(false)
const selectedTimeframe = ref('1w')
const trendChartContainer = ref<HTMLElement>()
const pieChartContainer = ref<HTMLElement>()

// 模拟数据
const sentimentMetrics = ref<SentimentMetric[]>([
  {
    name: 'overall',
    value: '0.65',
    label: '整体情绪',
    color: '#67c23a',
    icon: 'TrendCharts',
    trend: 'up',
    trendText: '+0.12'
  },
  {
    name: 'positive',
    value: '68%',
    label: '正面情绪',
    color: '#409eff',
    icon: 'DataAnalysis',
    trend: 'up',
    trendText: '+5%'
  },
  {
    name: 'negative',
    value: '15%',
    label: '负面情绪',
    color: '#f56c6c',
    icon: 'Histogram',
    trend: 'down',
    trendText: '-3%'
  },
  {
    name: 'volatility',
    value: '0.23',
    label: '情绪波动',
    color: '#e6a23c',
    icon: 'PieChart',
    trend: 'down',
    trendText: '-0.05'
  }
])

const sentimentDetails = ref<SentimentDetail[]>([
  {
    type: 'positive',
    label: '正面情绪',
    value: 34,
    percentage: 68,
    color: '#67c23a'
  },
  {
    type: 'neutral',
    label: '中性情绪',
    value: 8,
    percentage: 16,
    color: '#e6a23c'
  },
  {
    type: 'negative',
    label: '负面情绪',
    value: 8,
    percentage: 16,
    color: '#f56c6c'
  }
])

const positiveKeywords = ref<Keyword[]>([
  { word: '上涨', weight: 0.85, frequency: 12 },
  { word: '利好', weight: 0.78, frequency: 8 },
  { word: '增长', weight: 0.72, frequency: 15 },
  { word: '突破', weight: 0.68, frequency: 6 },
  { word: '看好', weight: 0.65, frequency: 10 }
])

const negativeKeywords = ref<Keyword[]>([
  { word: '下跌', weight: 0.82, frequency: 5 },
  { word: '利空', weight: 0.75, frequency: 3 },
  { word: '风险', weight: 0.68, frequency: 8 },
  { word: '担忧', weight: 0.62, frequency: 4 },
  { word: '调整', weight: 0.58, frequency: 6 }
])

const impactAnalysis = ref<ImpactFactor[]>([
  {
    factor: '新闻情绪',
    impact: 0.65,
    direction: '正面',
    confidence: 0.85,
    description: '整体新闻情绪偏向正面，对股价有积极影响'
  },
  {
    factor: '市场关注度',
    impact: 0.45,
    direction: '正面',
    confidence: 0.72,
    description: '市场关注度较高，有利于股价表现'
  },
  {
    factor: '行业情绪',
    impact: 0.32,
    direction: '正面',
    confidence: 0.68,
    description: '所属行业整体情绪良好'
  },
  {
    factor: '政策影响',
    impact: -0.15,
    direction: '负面',
    confidence: 0.55,
    description: '相关政策存在一定不确定性'
  }
])

const trendStats = ref([
  {
    name: '情绪稳定性',
    value: '0.78',
    color: '#67c23a',
    description: '情绪波动较小，市场预期稳定'
  },
  {
    name: '情绪强度',
    value: '0.65',
    color: '#409eff',
    description: '情绪强度适中，有利于理性投资'
  },
  {
    name: '情绪一致性',
    value: '0.82',
    color: '#e6a23c',
    description: '各方情绪较为一致，减少分歧'
  }
])

// 方法
const refreshSentiment = async () => {
  try {
    isAnalyzing.value = true
    ElMessage.info('正在刷新情绪分析...')
    
    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新分析结果
    updateSentimentAnalysis()
    
    ElMessage.success('情绪分析刷新完成')
    emit('sentiment-updated', {
      metrics: sentimentMetrics.value,
      details: sentimentDetails.value,
      keywords: {
        positive: positiveKeywords.value,
        negative: negativeKeywords.value
      }
    })
  } catch (error) {
    ElMessage.error('情绪分析刷新失败')
  } finally {
    isAnalyzing.value = false
  }
}

const updateSentimentAnalysis = () => {
  // 模拟数据更新
  sentimentMetrics.value.forEach(metric => {
    if (metric.name === 'overall') {
      metric.value = (Math.random() * 0.4 + 0.5).toFixed(2)
    }
  })
  
  // 更新影响分析
  impactAnalysis.value.forEach(impact => {
    impact.impact = Math.random() * 0.8 - 0.4
    impact.confidence = Math.random() * 0.3 + 0.6
  })
  
  emit('impact-analyzed', impactAnalysis.value)
}

const getKeywordType = (weight: number) => {
  if (weight >= 0.8) return 'danger'
  if (weight >= 0.6) return 'warning'
  return 'info'
}

const getImpactColor = (impact: number) => {
  if (impact > 0.5) return '#67c23a'
  if (impact > 0.2) return '#409eff'
  if (impact > -0.2) return '#e6a23c'
  if (impact > -0.5) return '#f56c6c'
  return '#909399'
}

// 监听时间框架变化
watch(selectedTimeframe, (newTimeframe) => {
  console.log('时间框架变化:', newTimeframe)
  // 这里可以更新趋势图
})

// 监听新闻数据变化
watch(() => props.newsData, (newData) => {
  if (newData && newData.length > 0) {
    console.log('新闻数据更新，重新分析情绪...')
    // 这里可以根据新闻数据重新计算情绪指标
  }
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  refreshSentiment,
  sentimentMetrics: computed(() => sentimentMetrics.value),
  impactAnalysis: computed(() => impactAnalysis.value)
})
</script>

<style scoped>
.sentiment-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sentiment-overview-card,
.sentiment-trend-card,
.sentiment-distribution-card,
.sentiment-keywords-card,
.sentiment-impact-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-content {
  padding: 10px 0;
}

.metric-card {
  text-align: center;
  padding: 20px;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  margin-bottom: 10px;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  margin-bottom: 5px;
}

.metric-trend {
  font-size: 0.8rem;
  font-weight: bold;
}

.metric-trend.up {
  color: var(--el-color-success);
}

.metric-trend.down {
  color: var(--el-color-danger);
}

.trend-content {
  padding: 10px 0;
}

.chart-container {
  height: 300px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 20px;
}

.trend-chart-area {
  width: 100%;
  height: 100%;
  background-color: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
}

.trend-stats {
  margin-top: 20px;
}

.trend-item {
  text-align: center;
  padding: 15px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.trend-name {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  margin-bottom: 5px;
}

.trend-value {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.trend-description {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.distribution-content {
  padding: 10px 0;
}

.distribution-chart {
  height: 300px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
}

.pie-chart-area {
  width: 100%;
  height: 100%;
  background-color: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
}

.distribution-details {
  padding: 20px;
}

.detail-item {
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.detail-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

.detail-label {
  flex: 1;
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
}

.detail-value {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.detail-bar {
  height: 8px;
  background-color: var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.detail-progress {
  height: 100%;
  transition: width 0.3s ease;
}

.detail-percentage {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  text-align: right;
}

.keywords-content {
  padding: 10px 0;
}

.positive-keywords,
.negative-keywords {
  padding: 15px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.positive-keywords h4,
.negative-keywords h4 {
  margin: 0 0 15px 0;
  color: var(--el-text-color-primary);
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.impact-content {
  padding: 10px 0;
}

:deep(.el-progress-bar__outer) {
  background-color: var(--el-border-color-light);
}

:deep(.el-progress-bar__inner) {
  transition: all 0.3s ease;
}
</style> 
