<template>
  <div class="sentiment-summary">
    <!-- 简洁的标题 -->
    <div class="summary-header">
      <h4 class="summary-title">情感分析汇总</h4>
      <span class="summary-subtitle">AI深度学习分析结果</span>
    </div>

    <!-- 紧凑的统计卡片 -->
    <div class="summary-stats">
      <div class="stat-card positive">
        <div class="stat-icon">
          <el-icon>
            <CircleCheck />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-count">{{ summary.positive_count }}</div>
          <div class="stat-label">正面</div>
          <div class="stat-percent">{{ getPercentage(summary.positive_count) }}%</div>
        </div>
      </div>

      <div class="stat-card negative">
        <div class="stat-icon">
          <el-icon>
            <CircleClose />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-count">{{ summary.negative_count }}</div>
          <div class="stat-label">负面</div>
          <div class="stat-percent">{{ getPercentage(summary.negative_count) }}%</div>
        </div>
      </div>

      <div class="stat-card neutral">
        <div class="stat-icon">
          <el-icon>
            <Warning />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-count">{{ summary.neutral_count }}</div>
          <div class="stat-label">中性</div>
          <div class="stat-percent">{{ getPercentage(summary.neutral_count) }}%</div>
        </div>
      </div>
    </div>

    <!-- 简洁的指标 -->
    <div class="summary-metrics">
      <div class="metric-item">
        <el-icon class="metric-icon">
          <TrendCharts />
        </el-icon>
        <span class="metric-label">平均得分</span>
        <span class="metric-value">{{ formatScore(summary.avg_sentiment_score) }}</span>
      </div>
      <div class="metric-item">
        <el-icon class="metric-icon">
          <DataBoard />
        </el-icon>
        <span class="metric-label">市场指数</span>
        <span class="metric-value">{{ formatScore(summary.market_sentiment_index) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleClose, Warning, TrendCharts, DataBoard } from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/format'

/**
 * 情感分析汇总接口
 */
export interface SentimentSummary {
  positive_count: number
  negative_count: number
  neutral_count: number
  avg_sentiment_score: number
  market_sentiment_index: number
}

/**
 * 组件属性
 */
interface Props {
  /** 情感分析汇总数据 */
  summary: SentimentSummary
}

const props = defineProps<Props>()

// 计算属性
const totalCount = computed(() => {
  return props.summary.positive_count + props.summary.negative_count + props.summary.neutral_count
})

// 方法
const formatScore = (score: number | undefined): string => {
  if (score === undefined || score === null) return 'N/A'
  return formatNumber(score, { decimals: 2 })
}

const getPercentage = (count: number): string => {
  if (totalCount.value === 0) return '0'
  return ((count / totalCount.value) * 100).toFixed(1)
}
</script>

<style lang="scss" scoped>
.sentiment-summary {
  .summary-header {
      margin-bottom: 16px;
  
      .summary-title {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
  
      .summary-subtitle {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }
  
    .summary-stats {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
  
      .stat-card {
        flex: 1;
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--el-border-color-light);
        background: var(--el-bg-color-page);
  
        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          margin-right: 8px;
          color: white;
          font-size: 16px;
        }
  
        .stat-info {
          flex: 1;
  
          .stat-count {
            font-size: 18px;
            font-weight: 600;
            line-height: 1;
            margin-bottom: 2px;
          }
  
          .stat-label {
            font-size: 12px;
            color: var(--el-text-color-regular);
            margin-bottom: 2px;
          }
  
          .stat-percent {
            font-size: 11px;
            color: var(--el-text-color-placeholder);
          }
        }
  
        &.positive {
          .stat-icon {
            background: var(--el-color-success);
          }
  
          .stat-count {
            color: var(--el-color-success);
          }
        }
  
        &.negative {
          .stat-icon {
            background: var(--el-color-danger);
          }
  
          .stat-count {
            color: var(--el-color-danger);
          }
        }
  
        &.neutral {
          .stat-icon {
            background: var(--el-color-info);
          }
  
          .stat-count {
            color: var(--el-color-info);
          }
        }
      }
    }
  
    .summary-metrics {
      display: flex;
      gap: 16px;
  
      .metric-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: var(--el-bg-color-page);
        border-radius: 6px;
        border: 1px solid var(--el-border-color-lighter);
  
        .metric-icon {
          color: var(--el-color-primary);
          font-size: 14px;
        }
  
        .metric-label {
          font-size: 12px;
          color: var(--el-text-color-regular);
        }
  
        .metric-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }
  
    @media (max-width: 768px) {
      .summary-stats {
        flex-direction: column;
        gap: 8px;
      }
  
      .summary-metrics {
        flex-direction: column;
        gap: 8px;
    }
  }
}
</style> 