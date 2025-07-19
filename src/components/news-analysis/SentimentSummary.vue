<template>
  <div class="sentiment-summary">
    <div class="section-header">
      <h3 class="section-title">
        <el-icon class="section-icon">
          <ChatDotRound />
        </el-icon>
        情感分析汇总
      </h3>
      <div class="section-subtitle">基于AI深度学习的新闻情感分析结果</div>
    </div>

    <div class="summary-content">
      <div class="summary-stats">
        <div class="summary-item positive">
          <div class="item-icon">
            <el-icon>
              <CircleCheck />
            </el-icon>
          </div>
          <div class="item-content">
            <div class="summary-value">{{ summary.positive_count }}</div>
            <div class="summary-label">正面新闻</div>
            <div class="summary-percentage">
              {{ getPercentage(summary.positive_count) }}%
            </div>
          </div>
        </div>
        <div class="summary-item negative">
          <div class="item-icon">
            <el-icon>
              <CircleClose />
            </el-icon>
          </div>
          <div class="item-content">
            <div class="summary-value">{{ summary.negative_count }}</div>
            <div class="summary-label">负面新闻</div>
            <div class="summary-percentage">
              {{ getPercentage(summary.negative_count) }}%
            </div>
          </div>
        </div>
        <div class="summary-item neutral">
          <div class="item-icon">
            <el-icon>
              <Warning />
            </el-icon>
          </div>
          <div class="item-content">
            <div class="summary-value">{{ summary.neutral_count }}</div>
            <div class="summary-label">中性新闻</div>
            <div class="summary-percentage">
              {{ getPercentage(summary.neutral_count) }}%
            </div>
          </div>
        </div>
      </div>

      <div class="summary-details">
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-icon">
              <el-icon>
                <TrendCharts />
              </el-icon>
            </div>
            <div class="detail-content">
              <div class="detail-label">平均情感得分</div>
              <div class="detail-value">{{ formatScore(summary.avg_sentiment_score) }}</div>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-icon">
              <el-icon>
                <DataBoard />
              </el-icon>
            </div>
            <div class="detail-content">
              <div class="detail-label">市场情感指数</div>
              <div class="detail-value">{{ formatScore(summary.market_sentiment_index) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChatDotRound, CircleCheck, CircleClose, Warning, TrendCharts, DataBoard } from '@element-plus/icons-vue'
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
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.sentiment-summary {
  .section-header {
      margin-bottom: $spacing-xl;
  
      .section-title {
        @include flex(row, flex-start, center);
        margin: 0 0 $spacing-xs 0;
          font-size: $font-size-large;
          font-weight: $font-weight-bold;
            color: $text-primary;
          
            .section-icon {
              margin-right: $spacing-sm;
              color: $primary-color;
            }
          }
          
          .section-subtitle {
            font-size: $font-size-small;
            color: $text-secondary;
            font-weight: $font-weight-normal;
          }
          }
          
          .summary-content {
            .summary-stats {
              @include grid(3, $spacing-lg);
              margin-bottom: $spacing-xl;
          
              @include respond-to(md) {
                grid-template-columns: repeat(2, 1fr);
              }
          
              @include respond-to(sm) {
                grid-template-columns: 1fr;
              }
          
              .summary-item {
                @include flex(row, flex-start, center);
                padding: $spacing-xl;
                border-radius: $card-border-radius;
                transition: all $transition-base $ease-in-out;
                position: relative;
                overflow: hidden;
          
                &:hover {
                  transform: translateY(-2px);
                  box-shadow: $box-shadow;
                }
          
                &::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: linear-gradient(90deg, transparent, currentColor, transparent);
                  opacity: 0.6;
                }
          
                &.positive {
                  background: linear-gradient(135deg, rgba($success-color, 0.1), rgba($success-color, 0.05));
                  border: 1px solid rgba($success-color, 0.2);
          
                  .item-icon {
                    background: linear-gradient(135deg, $success-color, lighten($success-color, 10%));
                  }
          
                  .summary-value {
                    color: $success-color;
                  }
          
                  &::before {
                    color: $success-color;
                  }
                }
          
                &.negative {
                  background: linear-gradient(135deg, rgba($danger-color, 0.1), rgba($danger-color, 0.05));
                  border: 1px solid rgba($danger-color, 0.2);
          
                  .item-icon {
                    background: linear-gradient(135deg, $danger-color, lighten($danger-color, 10%));
                  }
          
                  .summary-value {
                    color: $danger-color;
                  }
          
                  &::before {
                    color: $danger-color;
                  }
                }
          
                &.neutral {
                  background: linear-gradient(135deg, rgba($info-color, 0.1), rgba($info-color, 0.05));
                  border: 1px solid rgba($info-color, 0.2);
          
                  .item-icon {
                    background: linear-gradient(135deg, $info-color, lighten($info-color, 10%));
                  }
          
                  .summary-value {
                    color: $info-color;
                  }
          
                  &::before {
                    color: $info-color;
                  }
                }
          
                .item-icon {
                  @include flex(row, center, center);
                  width: 48px;
                  height: 48px;
                  border-radius: 50%;
                  margin-right: $spacing-md;
                  color: white;
                  font-size: $font-size-large;
                }
          
                .item-content {
                  flex: 1;
          
                  .summary-value {
                    font-size: $font-size-extra-large;
                    font-weight: $font-weight-bold;
                    margin-bottom: $spacing-xs;
                    line-height: 1;
                  }
          
                  .summary-label {
                    color: $text-regular;
                    font-size: $font-size-base;
                    font-weight: $font-weight-medium;
                    margin-bottom: $spacing-xs;
                  }
          
                  .summary-percentage {
                    color: $text-secondary;
                    font-size: $font-size-small;
                    font-weight: $font-weight-medium;
                  }
                }
              }
            }
          
            .summary-details {
              .details-grid {
                @include grid(2, $spacing-lg);
          
                @include respond-to(sm) {
                  grid-template-columns: 1fr;
                }
          
                .detail-item {
                  @include flex(row, flex-start, center);
                  padding: $spacing-lg;
                  background: $bg-secondary;
                  border-radius: $card-border-radius;
                  border: 1px solid $border-light;
                  transition: all $transition-base $ease-in-out;
          
                  &:hover {
                    background: $bg-primary;
                    box-shadow: $box-shadow;
                  }
          
                  .detail-icon {
                    @include flex(row, center, center);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: $primary-color;
                    color: white;
                    margin-right: $spacing-md;
                    font-size: $font-size-medium;
                  }
          
                  .detail-content {
                    flex: 1;
          
                    .detail-label {
                      font-size: $font-size-small;
                      color: $text-secondary;
                      margin-bottom: $spacing-xs;
                      font-weight: $font-weight-medium;
                    }
          
                    .detail-value {
                      font-size: $font-size-large;
                      font-weight: $font-weight-bold;
                      color: $text-primary;
                    }
                  }
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
                  gap: $spacing-md;
                }
          
                .summary-details {
                  .details-grid {
                    gap: $spacing-md;
                  }
      }
    }
  }
}
</style> 