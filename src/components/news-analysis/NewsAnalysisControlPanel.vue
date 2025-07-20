<template>
  <div class="news-analysis-control-panel">
    <!-- 配置区域 -->
    <div class="config-section">
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <el-icon><Setting /></el-icon>
            <span>分析配置</span>
          </div>
        </template>
        
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
      </el-card>
    </div>

    <!-- 进度区域 -->
    <div
      v-if="isAnalyzing || analysisLogs.length > 0"
      class="progress-section"
    >
      <el-card class="progress-card">
        <template #header>
          <div class="card-header">
            <el-icon><Loading /></el-icon>
            <span>分析进度</span>
          </div>
        </template>
        
        <div class="progress-content">
          <el-progress
            :percentage="progress"
            :status="getProgressStatus()"
            :stroke-width="8"
            class="progress-bar"
          />
          
          <div class="progress-logs">
            <div
              v-for="log in analysisLogs.slice(-5)"
              :key="log.id"
              class="log-item"
              :class="`log-${log.type}`"
            >
              <el-icon class="log-icon">
                <component :is="getLogIcon(log.type)" />
              </el-icon>
              <span class="log-message">{{ log.message }}</span>
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 相关股票区域 -->
    <div
      v-if="analysisResult?.relatedStocks?.length"
      class="related-stocks-section"
    >
      <el-card class="stocks-card">
        <template #header>
          <div class="card-header">
            <el-icon><Connection /></el-icon>
            <span>相关股票 ({{ analysisResult.relatedStocks.length }})</span>
          </div>
        </template>
        
        <div class="stocks-list">
          <el-tag
            v-for="stock in analysisResult.relatedStocks"
            :key="stock.code"
            class="stock-tag"
            size="large"
            effect="plain"
          >
            {{ stock.code }} {{ stock.name }}
          </el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Setting, Loading, Connection, InfoFilled, SuccessFilled, WarningFilled, CircleClose } from '@element-plus/icons-vue'
import NewsAnalysisConfig from './NewsAnalysisConfig.vue'
import type { Stock } from '@/types/api'

// 定义日志项类型
interface LogItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  details?: string
}

interface RelatedStock {
  code: string
  name: string
}

interface AnalysisResult {
  relatedStocks: RelatedStock[]
  news: any[]
  sentimentSummary: any
}

interface Props {
  isConnected: boolean
  isAnalyzing: boolean
  selectedStock: Stock | null
  analysisDate: string
  progress: number
  analysisLogs: LogItem[]
  analysisResult: AnalysisResult | null
}

interface Emits {
  (e: 'start-analysis', data: { stockCode: string; analysisDate: string }): void
  (e: 'stock-select', stock: Stock): void
  (e: 'stock-clear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleStartAnalysis = (data: { stockCode: string; analysisDate: string }) => {
  emit('start-analysis', data)
}

const handleStockSelect = (stock: Stock) => {
  emit('stock-select', stock)
}

const handleStockClear = () => {
  emit('stock-clear')
}

const getProgressStatus = () => {
  if (props.isAnalyzing) return 'warning'
  if (props.analysisResult) return 'success'
  if (props.analysisLogs.some(log => log.type === 'error')) return 'exception'
  return undefined
}

const getLogIcon = (type: string) => {
  switch (type) {
    case 'success': return SuccessFilled
    case 'warning': return WarningFilled
    case 'error': return CircleClose
    default: return InfoFilled
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}
</script>

<style lang="scss" scoped>
.news-analysis-control-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .config-section,
  .progress-section,
  .related-stocks-section {
    .config-card,
    .progress-card,
    .stocks-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }
    }
  }
  
  .progress-section {
    .progress-content {
      .progress-bar {
        margin-bottom: 16px;
      }
      
      .progress-logs {
        max-height: 200px;
        overflow-y: auto;
        
        .log-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid var(--el-border-color-lighter);
          
          &:last-child {
            border-bottom: none;
          }
          
          .log-icon {
            font-size: 14px;
          }
          
          .log-message {
            flex: 1;
            font-size: 13px;
            color: var(--el-text-color-regular);
          }
          
          .log-time {
            font-size: 12px;
            color: var(--el-text-color-placeholder);
          }
          
          &.log-success .log-icon {
            color: var(--el-color-success);
          }
          
          &.log-warning .log-icon {
            color: var(--el-color-warning);
          }
          
          &.log-error .log-icon {
            color: var(--el-color-danger);
          }
          
          &.log-info .log-icon {
            color: var(--el-color-info);
          }
        }
      }
    }
  }
  
  .related-stocks-section {
    .stocks-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .stock-tag {
        margin: 0;
      }
    }
  }
}
</style> 