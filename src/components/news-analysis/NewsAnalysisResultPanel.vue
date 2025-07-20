<template>
  <div class="news-analysis-result-panel">
    <!-- 结果头部 -->
    <div class="result-header">
      <div class="header-left">
        <h2 class="result-title">分析结果</h2>
        <p class="result-subtitle" v-if="analysisResult">
          共分析 {{ analysisResult.news?.length || 0 }} 条新闻
        </p>
      </div>
      
      <div class="header-actions" v-if="analysisResult?.news?.length">
        <el-button
          type="primary"
          @click="handleExportNews"
          :icon="Download"
        >
          导出结果
        </el-button>
      </div>
    </div>

    <!-- 结果内容 -->
    <div class="result-content">
      <!-- 新闻列表 -->
      <div
        v-if="analysisResult?.news?.length"
        class="news-section"
      >
        <el-card class="news-card">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>新闻列表</span>
            </div>
          </template>
          
          <NewsList
            :news="analysisResult.news"
            :show-all-news="showAllNews"
            @toggle-show-all="toggleShowAllNews"
            @export="handleExportNews"
          />
        </el-card>
      </div>

      <!-- 情感分析汇总 -->
      <div
        v-if="analysisResult?.sentimentSummary"
        class="sentiment-section"
      >
        <el-card class="sentiment-card">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>情感分析汇总</span>
            </div>
          </template>
          
          <SentimentSummary :summary="analysisResult.sentimentSummary" />
        </el-card>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!analysisResult"
        class="empty-state"
      >
        <el-empty
          description="暂无分析结果"
          :image-size="120"
        >
          <template #image>
            <el-icon size="120" color="var(--el-text-color-placeholder)">
              <Document />
            </el-icon>
          </template>
          <p class="empty-text">
            请选择股票并开始分析以查看结果
          </p>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Download, DataAnalysis } from '@element-plus/icons-vue'
import NewsList from './NewsList.vue'
import SentimentSummary from './SentimentSummary.vue'

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
  analysisResult: AnalysisResult | null
  showAllNews: boolean
}

interface Emits {
  (e: 'toggle-show-all'): void
  (e: 'export'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toggleShowAllNews = () => {
  emit('toggle-show-all')
}

const handleExportNews = () => {
  emit('export')
}
</script>

<style lang="scss" scoped>
.news-analysis-result-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .result-header {
    padding: 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color-page);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      .result-title {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .result-subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .result-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .news-section,
    .sentiment-section {
      .news-card,
      .sentiment-card {
        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
      }
    }
    
    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .empty-text {
        margin-top: 16px;
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }
  }
}
</style> 