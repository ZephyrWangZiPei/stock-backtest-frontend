<template>
  <div class="technical-analysis">
    <!-- 技术指标概览 -->
    <el-card class="indicators-overview">
      <template #header>
        <div class="card-header">
          <span>技术指标分析</span>
          <el-button @click="refreshAnalysis" :loading="isAnalyzing" size="small" type="primary">
            {{ isAnalyzing ? '分析中...' : '刷新分析' }}
          </el-button>
        </div>
      </template>
      
      <div class="overview-content">
        <el-row :gutter="20">
          <el-col :span="6" v-for="indicator in indicatorSummary" :key="indicator.name">
            <el-card class="indicator-card" shadow="hover">
              <div class="indicator-icon">
                <el-icon :size="24" :color="indicator.color">
                  <component :is="indicator.icon" />
                </el-icon>
              </div>
              <div class="indicator-name">{{ indicator.name }}</div>
              <div class="indicator-value" :style="{ color: indicator.color }">
                {{ indicator.value }}
              </div>
              <div class="indicator-signal">{{ indicator.signal }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 详细指标分析 -->
    <el-card class="detailed-analysis">
      <template #header>
        <div class="card-header">
          <span>详细指标分析</span>
          <el-select v-model="selectedIndicator" placeholder="选择指标" style="width: 150px">
            <el-option label="移动平均线" value="ma" />
            <el-option label="MACD" value="macd" />
            <el-option label="RSI" value="rsi" />
            <el-option label="KDJ" value="kdj" />
            <el-option label="布林带" value="bollinger" />
            <el-option label="成交量" value="volume" />
          </el-select>
        </div>
      </template>
      
      <div class="analysis-content">
        <!-- 指标图表 -->
        <div class="indicator-chart" v-if="selectedIndicator">
          <div class="chart-container">
            <div ref="chartContainer" class="chart-area"></div>
          </div>
        </div>
        
        <!-- 指标详情 -->
        <div class="indicator-details" v-if="selectedIndicator">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前值">
              {{ getIndicatorValue(selectedIndicator) }}
            </el-descriptions-item>
            <el-descriptions-item label="信号">
              <el-tag :type="getSignalType(selectedIndicator)">
                {{ getSignalText(selectedIndicator) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="趋势">
              {{ getTrendText(selectedIndicator) }}
            </el-descriptions-item>
            <el-descriptions-item label="强度">
              <el-progress 
                :percentage="getStrengthValue(selectedIndicator)" 
                :color="getStrengthColor(selectedIndicator)"
              />
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider content-position="left">分析说明</el-divider>
          <div class="analysis-description">
            {{ getAnalysisDescription(selectedIndicator) }}
          </div>
          
          <el-divider content-position="left">操作建议</el-divider>
          <div class="operation-advice">
            <el-alert 
              :title="getAdviceTitle(selectedIndicator)" 
              :type="getAdviceType(selectedIndicator)"
              :description="getAdviceDescription(selectedIndicator)"
              show-icon
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 形态识别 -->
    <el-card class="pattern-recognition">
      <template #header>
        <div class="card-header">
          <span>形态识别</span>
          <el-button @click="scanPatterns" :loading="isScanning" size="small" type="success">
            {{ isScanning ? '扫描中...' : '扫描形态' }}
          </el-button>
        </div>
      </template>
      
      <div class="patterns-content">
        <el-table :data="detectedPatterns" style="width: 100%">
          <el-table-column prop="name" label="形态名称" width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'bullish' ? 'success' : 'danger'" size="small">
                {{ scope.row.type === 'bullish' ? '看涨' : '看跌' }}
              </el-tag>
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
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="target" label="目标价" width="100">
            <template #default="scope">
              ¥{{ scope.row.target?.toFixed(2) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button @click="viewPatternDetail(scope.row)" size="small" type="primary">
                详情
              </el-button>
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
interface IndicatorSummary {
  name: string
  value: string
  signal: string
  color: string
  icon: string
}

interface Pattern {
  id: string
  name: string
  type: 'bullish' | 'bearish'
  confidence: number
  description: string
  target?: number
  startDate: Date
  endDate: Date
}

// Props
interface Props {
  stockData?: any[]
  stockCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  stockData: () => [],
  stockCode: ''
})

// Emits
const emit = defineEmits<{
  'analysis-complete': [analysis: any]
  'pattern-detected': [patterns: Pattern[]]
}>()

// 响应式数据
const isAnalyzing = ref(false)
const isScanning = ref(false)
const selectedIndicator = ref('ma')
const detectedPatterns = ref<Pattern[]>([])
const chartContainer = ref<HTMLElement>()

// 模拟指标数据
const indicatorData = reactive({
  ma: { value: 112.50, signal: '买入', trend: '上升', strength: 75 },
  macd: { value: 0.85, signal: '买入', trend: '金叉', strength: 80 },
  rsi: { value: 35.2, signal: '超卖', trend: '反弹', strength: 65 },
  kdj: { value: 'K:25 D:30 J:15', signal: '买入', trend: '金叉', strength: 70 },
  bollinger: { value: '中轨:112.5', signal: '买入', trend: '突破', strength: 85 },
  volume: { value: '1.2M', signal: '放量', trend: '增加', strength: 60 }
})

// 计算属性
const indicatorSummary = computed(() => [
  {
    name: 'MA',
    value: indicatorData.ma.value.toFixed(2),
    signal: indicatorData.ma.signal,
    color: '#67c23a',
    icon: 'TrendCharts'
  },
  {
    name: 'MACD',
    value: indicatorData.macd.value.toFixed(2),
    signal: indicatorData.macd.signal,
    color: '#409eff',
    icon: 'DataAnalysis'
  },
  {
    name: 'RSI',
    value: indicatorData.rsi.value.toFixed(1),
    signal: indicatorData.rsi.signal,
    color: '#e6a23c',
    icon: 'Histogram'
  },
  {
    name: 'KDJ',
    value: '金叉',
    signal: indicatorData.kdj.signal,
    color: '#f56c6c',
    icon: 'PieChart'
  }
])

// 方法
const refreshAnalysis = async () => {
  try {
    isAnalyzing.value = true
    ElMessage.info('正在刷新技术分析...')
    
    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新指标数据
    updateIndicatorData()
    
    ElMessage.success('技术分析刷新完成')
    emit('analysis-complete', indicatorData)
  } catch (error) {
    ElMessage.error('技术分析刷新失败')
  } finally {
    isAnalyzing.value = false
  }
}

const updateIndicatorData = () => {
  // 模拟数据更新
  indicatorData.ma.value += Math.random() * 2 - 1
  indicatorData.macd.value += Math.random() * 0.2 - 0.1
  indicatorData.rsi.value += Math.random() * 10 - 5
}

const getIndicatorValue = (indicator: string) => {
  const data = indicatorData[indicator as keyof typeof indicatorData]
  return data?.value || '-'
}

const getSignalType = (indicator: string) => {
  const data = indicatorData[indicator as keyof typeof indicatorData]
  if (!data) return 'info'
  
  if (data.signal.includes('买入') || data.signal.includes('金叉')) return 'success'
  if (data.signal.includes('卖出') || data.signal.includes('死叉')) return 'danger'
  if (data.signal.includes('超买')) return 'warning'
  if (data.signal.includes('超卖')) return 'info'
  return 'info'
}

const getSignalText = (indicator: string) => {
  const data = indicatorData[indicator as keyof typeof indicatorData]
  return data?.signal || '-'
}

const getTrendText = (indicator: string) => {
  const data = indicatorData[indicator as keyof typeof indicatorData]
  return data?.trend || '-'
}

const getStrengthValue = (indicator: string) => {
  const data = indicatorData[indicator as keyof typeof indicatorData]
  return data?.strength || 0
}

const getStrengthColor = (indicator: string) => {
  const strength = getStrengthValue(indicator)
  if (strength >= 80) return '#67c23a'
  if (strength >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getAnalysisDescription = (indicator: string) => {
  const descriptions: Record<string, string> = {
    ma: '移动平均线显示当前股价处于上升趋势，短期均线上穿长期均线，形成买入信号。',
    macd: 'MACD指标显示快线上穿慢线，形成金叉信号，表明上涨动能增强。',
    rsi: 'RSI指标处于超卖区域，显示股价可能即将反弹，建议关注买入机会。',
    kdj: 'KDJ指标显示K线上穿D线，形成金叉，短期上涨概率较大。',
    bollinger: '股价突破布林带中轨，显示上涨趋势确立，建议买入。',
    volume: '成交量明显放大，显示资金流入，支撑股价上涨。'
  }
  return descriptions[indicator] || '暂无分析数据'
}

const getAdviceTitle = (indicator: string) => {
  const titles: Record<string, string> = {
    ma: '建议买入',
    macd: '建议买入',
    rsi: '关注反弹',
    kdj: '建议买入',
    bollinger: '建议买入',
    volume: '关注放量'
  }
  return titles[indicator] || '暂无建议'
}

const getAdviceType = (indicator: string) => {
  const types: Record<string, string> = {
    ma: 'success',
    macd: 'success',
    rsi: 'info',
    kdj: 'success',
    bollinger: 'success',
    volume: 'warning'
  }
  return types[indicator] || 'info'
}

const getAdviceDescription = (indicator: string) => {
  const descriptions: Record<string, string> = {
    ma: '移动平均线显示买入信号，建议在回调时分批建仓。',
    macd: 'MACD金叉确认上涨趋势，可适当加仓。',
    rsi: 'RSI超卖可能反弹，建议设置止损位。',
    kdj: 'KDJ金叉显示短期机会，建议短线操作。',
    bollinger: '突破中轨确认趋势，建议持有。',
    volume: '放量显示资金关注，建议关注后续走势。'
  }
  return descriptions[indicator] || '暂无建议'
}

const scanPatterns = async () => {
  try {
    isScanning.value = true
    ElMessage.info('正在扫描形态...')
    
    // 模拟扫描过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成模拟形态数据
    const mockPatterns: Pattern[] = [
      {
        id: '1',
        name: '双底形态',
        type: 'bullish',
        confidence: 0.85,
        description: '股价形成双底形态，显示底部支撑较强',
        target: 120.50,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      {
        id: '2',
        name: '头肩底形态',
        type: 'bullish',
        confidence: 0.78,
        description: '经典头肩底形态，突破颈线后上涨概率大',
        target: 125.00,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      {
        id: '3',
        name: '上升三角形',
        type: 'bullish',
        confidence: 0.72,
        description: '上升三角形整理形态，突破上轨后继续上涨',
        target: 118.00,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }
    ]
    
    detectedPatterns.value = mockPatterns
    ElMessage.success(`发现 ${mockPatterns.length} 个形态`)
    emit('pattern-detected', mockPatterns)
  } catch (error) {
    ElMessage.error('形态扫描失败')
  } finally {
    isScanning.value = false
  }
}

const viewPatternDetail = (pattern: Pattern) => {
  ElMessage.info(`查看形态详情 ${pattern.name}`)
  // 这里可以打开详情对话框
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#67c23a'
  if (confidence >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

// 监听指标选择变化
watch(selectedIndicator, (newIndicator) => {
  if (newIndicator) {
    // 这里可以更新图表显示
    console.log('选择指标:', newIndicator)
  }
})

// 暴露方法给父组件
defineExpose({
  refreshAnalysis,
  scanPatterns,
  detectedPatterns: computed(() => detectedPatterns.value)
})
</script>

<style scoped>
.technical-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.indicators-overview,
.detailed-analysis,
.pattern-recognition {
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

.indicator-card {
  text-align: center;
  padding: 20px;
  transition: all 0.3s ease;
}

.indicator-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.indicator-icon {
  margin-bottom: 10px;
}

.indicator-name {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  margin-bottom: 5px;
}

.indicator-value {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.indicator-signal {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.analysis-content {
  padding: 10px 0;
}

.indicator-chart {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
}

.chart-area {
  width: 100%;
  height: 100%;
  background-color: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
}

.analysis-description {
  padding: 15px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  line-height: 1.6;
  margin: 15px 0;
}

.operation-advice {
  margin: 15px 0;
}

.patterns-content {
  padding: 10px 0;
}

:deep(.el-progress-bar__outer) {
  background-color: var(--el-border-color-light);
}

:deep(.el-progress-bar__inner) {
  transition: all 0.3s ease;
}
</style> 
