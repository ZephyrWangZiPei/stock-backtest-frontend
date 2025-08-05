<template>
  <div class="prediction-visualization">
    <!-- 预测趋势图 -->
    <el-card class="trend-chart-card">
      <template #header>
        <div class="card-header">
          <span>预测趋势分析</span>
          <el-select v-model="selectedTimeframe" placeholder="选择时间框架" style="width: 120px">
            <el-option label="1天" value="1d" />
            <el-option label="3天" value="3d" />
            <el-option label="1周" value="1w" />
            <el-option label="1月" value="1m" />
          </el-select>
        </div>
      </template>
      
      <div class="chart-container">
        <div ref="trendChartContainer" class="trend-chart-area"></div>
      </div>
    </el-card>

    <!-- 置信度分析 -->
    <el-card class="confidence-distribution-card">
      <template #header>
        <div class="card-header">
          <span>预测置信度分析</span>
        </div>
      </template>
      
      <div class="confidence-content">
        <el-row :gutter="20">
          <el-col :span="8" v-for="confidence in confidenceDistribution" :key="confidence.range">
            <div class="confidence-item">
              <div class="confidence-range">{{ confidence.range }}</div>
              <div class="confidence-count">{{ confidence.count }}</div>
              <div class="confidence-percentage">{{ confidence.percentage }}%</div>
              <el-progress 
                :percentage="confidence.percentage" 
                :color="confidence.color"
                :stroke-width="8"
              />
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 预测准确率统计 -->
    <el-card class="accuracy-stats-card">
      <template #header>
        <div class="card-header">
          <span>预测准确率统计</span>
          <el-button @click="refreshAccuracyStats" size="small" type="primary">刷新统计</el-button>
        </div>
      </template>
      
      <div class="accuracy-content">
        <el-row :gutter="20">
          <el-col :span="6" v-for="stat in accuracyStats" :key="stat.name">
            <div class="accuracy-stat">
              <div class="stat-icon">
                <el-icon :size="24" :color="stat.color">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-name">{{ stat.name }}</div>
              <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
              <div class="stat-trend" :class="stat.trend">
                {{ stat.trendText }}
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 预测历史记录 -->
    <el-card class="prediction-history-card">
      <template #header>
        <div class="card-header">
          <span>预测历史记录</span>
          <el-button @click="exportHistory" size="small" type="success">导出历史</el-button>
        </div>
      </template>
      
      <div class="history-content">
        <el-table :data="predictionHistory" style="width: 100%" height="300">
          <el-table-column prop="date" label="预测日期" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.date) }}
            </template>
          </el-table-column>
          <el-table-column prop="type" label="预测类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'buy' ? 'success' : 'danger'" size="small">
                {{ scope.row.type === 'buy' ? '买入' : '卖出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="predictedPrice" label="预测价格" width="120">
            <template #default="scope">
              ¥{{ scope.row.predictedPrice.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="actualPrice" label="实际价格" width="120">
            <template #default="scope">
              ¥{{ scope.row.actualPrice?.toFixed(2) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="accuracy" label="准确率" width="120">
            <template #default="scope">
              <el-progress 
                :percentage="scope.row.accuracy * 100" 
                :color="getAccuracyColor(scope.row.accuracy)"
                :stroke-width="6"
              />
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="盈亏" width="100">
            <template #default="scope">
              <span :class="scope.row.profit >= 0 ? 'profit-positive' : 'profit-negative'">
                {{ scope.row.profit ? `¥${scope.row.profit.toFixed(2)}` : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
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
interface ConfidenceDistribution {
  range: string
  count: number
  percentage: number
  color: string
}

interface AccuracyStat {
  name: string
  value: string
  color: string
  icon: string
  trend: string
  trendText: string
}

interface PredictionHistory {
  id: string
  date: Date
  type: 'buy' | 'sell'
  predictedPrice: number
  actualPrice?: number
  accuracy: number
  profit?: number
  status: 'pending' | 'correct' | 'incorrect' | 'partial'
}

// Props
interface Props {
  predictions?: any[]
  stockCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  predictions: () => [],
  stockCode: ''
})

// Emits
const emit = defineEmits<{
  'accuracy-updated': [accuracy: number]
  'history-exported': [history: PredictionHistory[]]
}>()

// 响应式数据
const selectedTimeframe = ref('1w')
const trendChartContainer = ref<HTMLElement>()

// 模拟数据
const predictionHistory = ref<PredictionHistory[]>([
  {
    id: '1',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    type: 'buy',
    predictedPrice: 115.50,
    actualPrice: 118.20,
    accuracy: 0.85,
    profit: 2.70,
    status: 'correct'
  },
  {
    id: '2',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    type: 'sell',
    predictedPrice: 120.00,
    actualPrice: 122.50,
    accuracy: 0.72,
    profit: -2.50,
    status: 'incorrect'
  },
  {
    id: '3',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    type: 'buy',
    predictedPrice: 110.00,
    actualPrice: 112.00,
    accuracy: 0.78,
    profit: 2.00,
    status: 'correct'
  }
])

// 计算属性
const confidenceDistribution = computed(() => [
  {
    range: '80-100%',
    count: 15,
    percentage: 30,
    color: '#67c23a'
  },
  {
    range: '60-80%',
    count: 25,
    percentage: 50,
    color: '#e6a23c'
  },
  {
    range: '40-60%',
    count: 10,
    percentage: 20,
    color: '#f56c6c'
  }
])

const accuracyStats = computed(() => [
  {
    name: '总体准确率',
    value: '78.5%',
    color: '#67c23a',
    icon: 'TrendCharts',
    trend: 'up',
    trendText: '+2.3%'
  },
  {
    name: '买入准确率',
    value: '82.1%',
    color: '#409eff',
    icon: 'DataAnalysis',
    trend: 'up',
    trendText: '+1.8%'
  },
  {
    name: '卖出准确率',
    value: '74.9%',
    color: '#e6a23c',
    icon: 'Histogram',
    trend: 'down',
    trendText: '-0.5%'
  },
  {
    name: '平均收益',
    value: '¥2.45',
    color: '#67c23a',
    icon: 'PieChart',
    trend: 'up',
    trendText: '+0.8'
  }
])

// 方法
const refreshAccuracyStats = async () => {
  try {
    ElMessage.info('正在刷新准确率统计...')
    
    // 模拟刷新过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新统计数据
    updateAccuracyStats()
    
    ElMessage.success('准确率统计刷新完成')
    emit('accuracy-updated', 0.785)
  } catch (error) {
    ElMessage.error('准确率统计刷新失败')
  }
}

const updateAccuracyStats = () => {
  // 模拟数据更新
  console.log('更新准确率统计')
}

const exportHistory = () => {
  const dataStr = JSON.stringify(predictionHistory.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `prediction_history_${props.stockCode}_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('预测历史已导出')
  emit('history-exported', predictionHistory.value)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString()
}

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 0.8) return '#67c23a'
  if (accuracy >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'correct': return 'success'
    case 'incorrect': return 'danger'
    case 'partial': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'correct': return '正确'
    case 'incorrect': return '错误'
    case 'partial': return '部分'
    case 'pending': return '待验证'
    default: return '未知'
  }
}

// 监听时间框架变化
watch(selectedTimeframe, (newTimeframe) => {
  console.log('时间框架变化:', newTimeframe)
  // 这里可以更新趋势图
})

// 暴露方法给父组件
defineExpose({
  refreshAccuracyStats,
  exportHistory,
  predictionHistory: computed(() => predictionHistory.value)
})
</script>

<style scoped>
.prediction-visualization {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trend-chart-card,
.confidence-distribution-card,
.accuracy-stats-card,
.prediction-history-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 400px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
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

.confidence-content {
  padding: 20px 0;
}

.confidence-item {
  text-align: center;
  padding: 15px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  margin-bottom: 10px;
}

.confidence-range {
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 5px;
}

.confidence-count {
  font-size: 1.2rem;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.confidence-percentage {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
}

.accuracy-content {
  padding: 20px 0;
}

.accuracy-stat {
  text-align: center;
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.accuracy-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  margin-bottom: 10px;
}

.stat-name {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-trend {
  font-size: 0.8rem;
  font-weight: bold;
}

.stat-trend.up {
  color: var(--el-color-success);
}

.stat-trend.down {
  color: var(--el-color-danger);
}

.history-content {
  padding: 10px 0;
}

.profit-positive {
  color: var(--el-color-success);
  font-weight: bold;
}

.profit-negative {
  color: var(--el-color-danger);
  font-weight: bold;
}

:deep(.el-progress-bar__outer) {
  background-color: var(--el-border-color-light);
}

:deep(.el-progress-bar__inner) {
  transition: all 0.3s ease;
}
</style> 
