<template>
  <div class="sentiment-summary">
    <h3 class="section-title">
      <el-icon class="section-icon">
        <ChatDotRound />
      </el-icon>
      情感分析汇总
    </h3>
    
    <div class="summary-content">
      <div class="summary-stats">
        <div class="summary-item positive">
          <div class="summary-value">{{ summary.positive_count }}</div>
          <div class="summary-label">正面新闻</div>
        </div>
        <div class="summary-item negative">
          <div class="summary-value">{{ summary.negative_count }}</div>
          <div class="summary-label">负面新闻</div>
        </div>
        <div class="summary-item neutral">
          <div class="summary-value">{{ summary.neutral_count }}</div>
          <div class="summary-label">中性新闻</div>
        </div>
      </div>
      
      <div class="summary-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="平均情感得分">
            {{ formatScore(summary.avg_sentiment_score) }}
          </el-descriptions-item>
          <el-descriptions-item label="市场情感指数">
            {{ formatScore(summary.market_sentiment_index) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound } from '@element-plus/icons-vue'
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

// 方法
const formatScore = (score: number | undefined): string => {
  if (score === undefined || score === null) return 'N/A'
  return formatNumber(score, { decimals: 2 })
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

.sentiment-summary {
  .section-title {
    @include flex(row, flex-start, center);
    margin: 0 0 $spacing-lg 0;
    font-size: $font-size-large;
    font-weight: $font-weight-medium;
    color: $text-primary;

    .section-icon {
      margin-right: $spacing-sm;
    }
  }

  .summary-content {
    .summary-stats {
      @include grid(3, $spacing-lg);
      margin-bottom: $spacing-lg;

      .summary-item {
        @include flex(column, center, center);
        padding: $spacing-xl;
        border-radius: $card-border-radius;
        text-align: center;
        transition: transform $transition-base $ease-in-out;

        &:hover {
          transform: translateY(-2px);
        }

        &.positive {
          background: linear-gradient(135deg, rgba($success-color, 0.1), rgba($success-color, 0.05));
          border: 1px solid rgba($success-color, 0.2);

          .summary-value {
            color: $success-color;
          }
        }

        &.negative {
          background: linear-gradient(135deg, rgba($danger-color, 0.1), rgba($danger-color, 0.05));
          border: 1px solid rgba($danger-color, 0.2);

          .summary-value {
            color: $danger-color;
          }
        }

        &.neutral {
          background: linear-gradient(135deg, rgba($info-color, 0.1), rgba($info-color, 0.05));
          border: 1px solid rgba($info-color, 0.2);

          .summary-value {
            color: $info-color;
          }
        }

        .summary-value {
          font-size: $font-size-extra-large;
          font-weight: $font-weight-bold;
          margin-bottom: $spacing-sm;
        }

        .summary-label {
          color: $text-regular;
          font-size: $font-size-small;
          font-weight: $font-weight-medium;
        }
      }
    }

    .summary-details {
      .el-descriptions {
        .el-descriptions__label {
          font-weight: $font-weight-medium;
          color: $text-primary;
        }

        .el-descriptions__content {
          color: $text-regular;
        }
      }
    }
  }
}

// 响应式设计
@include respond-to(sm) {
  .sentiment-summary {
    .summary-content {
      .summary-stats {
        grid-template-columns: 1fr;
        gap: $spacing-md;
      }
    }
  }
}
</style> 