<template>
  <el-card class="recommendation-list">
    <template #header>
      <div class="card-header">
        <span>智能推荐列表</span>
        <div class="header-actions">
          <el-select 
            :model-value="selectedStrategy" 
            @update:model-value="$emit('update:selectedStrategy', $event)"
            placeholder="推荐策略" 
            size="small" 
            style="width: 120px; margin-right: 10px"
          >
            <el-option label="综合推荐" value="comprehensive" />
            <el-option label="价值投资" value="value" />
            <el-option label="成长投资" value="growth" />
            <el-option label="技术分析" value="technical" />
          </el-select>
          <el-button size="small" @click="$emit('export-recommendations')">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
    </template>

    <div class="recommendation-content">
      <div v-if="isLoading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else class="stock-recommendations" style="max-height: 800px; overflow-y: auto;">
        <div v-for="(stock, index) in recommendations" :key="stock.code" class="recommendation-item">
          <div class="item-rank">
            <div class="rank-number" :class="getRankClass(index + 1)">{{ index + 1 }}</div>
          </div>

          <div class="item-content">
            <div class="stock-header">
              <div class="stock-info">
                <h3>{{ stock.name }} ({{ stock.code }})</h3>
                <el-tag :type="getIndustryTagType(stock.industry)" size="small">{{ stock.industry }}</el-tag>
              </div>
              <div class="recommendation-badge">
                <el-tag :type="getRecommendationTagType(stock.recommendation)" size="large">
                  {{ getRecommendationText(stock.recommendation) }}
                </el-tag>
              </div>
            </div>

            <div class="stock-metrics">
              <el-row :gutter="16">
                <el-col :span="4">
                  <div class="metric-item">
                    <span class="metric-label">最新价</span>
                    <span class="metric-value" :class="getPriceChangeClass(stock.change_pct)">
                      ¥{{ stock.price }}
                    </span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="metric-item">
                    <span class="metric-label">涨跌幅</span>
                    <span class="metric-value" :class="getPriceChangeClass(stock.change_pct)">
                      {{ stock.change_pct > 0 ? '+' : '' }}{{ stock.change_pct }}%
                    </span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="metric-item">
                    <span class="metric-label">AI评分</span>
                    <span class="metric-value score">{{ stock.ai_score }}</span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="metric-item">
                    <span class="metric-label">目标价</span>
                    <span class="metric-value target">¥{{ stock.target_price }}</span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="metric-item">
                    <span class="metric-label">预期收益</span>
                    <span class="metric-value" :class="stock.expected_return > 0 ? 'price-up' : 'price-down'">
                      {{ stock.expected_return > 0 ? '+' : '' }}{{ stock.expected_return }}%
                    </span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="metric-actions">
                    <el-button-group size="small">
                      <el-button @click="$emit('view-stock-detail', stock)">
                        <el-icon><View /></el-icon>
                      </el-button>
                      <el-button @click="$emit('add-to-watchlist', stock)">
                        <el-icon><Star /></el-icon>
                      </el-button>
                      <el-button @click="$emit('add-to-candidate-pool', stock)">
                        <el-icon><Plus /></el-icon>
                      </el-button>
                    </el-button-group>
                  </div>
                </el-col>
              </el-row>
            </div>

            <div class="recommendation-reason">
              <el-collapse>
                <el-collapse-item :title="`推荐理由 (置信度: ${stock.confidence}%)`" name="reason">
                  <div class="reason-content">
                    <el-tag v-for="reason in stock.reasons" :key="reason" type="info" size="small" style="margin: 2px">
                      {{ reason }}
                    </el-tag>
                    <p class="reason-text">{{ stock.analysis }}</p>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Download, View, Star, Plus } from '@element-plus/icons-vue'

// 接口定义
interface StockRecommendation {
  code: string
  name: string
  industry: string
  price: number
  change_pct: number
  ai_score: number
  target_price: number
  expected_return: number
  recommendation: string
  confidence: number
  reasons: string[]
  analysis: string
  [key: string]: any
}

// Props
defineProps<{
  recommendations: StockRecommendation[]
  selectedStrategy: string
  isLoading: boolean
}>()

// Emits
defineEmits<{
  'update:selectedStrategy': [value: string]
  'export-recommendations': []
  'view-stock-detail': [stock: StockRecommendation]
  'add-to-watchlist': [stock: StockRecommendation]
  'add-to-candidate-pool': [stock: StockRecommendation]
}>()

// 工具函数
const getRankClass = (rank: number) => {
  if (rank <= 3) return 'top-rank'
  if (rank <= 10) return 'good-rank'
  return 'normal-rank'
}

const getIndustryTagType = (industry: string) => {
  const tagTypes = ['', 'success', 'info', 'warning', 'danger']
  return tagTypes[industry.length % tagTypes.length]
}

const getRecommendationTagType = (recommendation: string) => {
  const types: Record<string, string> = {
    strong_buy: 'danger',
    buy: 'success',
    hold: 'warning',
    sell: 'info'
  }
  return types[recommendation] || 'info'
}

const getRecommendationText = (recommendation: string) => {
  const texts: Record<string, string> = {
    strong_buy: '强烈推荐',
    buy: '推荐买入',
    hold: '持有观望',
    sell: '建议卖出'
  }
  return texts[recommendation] || recommendation
}

const getPriceChangeClass = (changePct: number) => {
  if (changePct > 0) return 'price-up'
  if (changePct < 0) return 'price-down'
  return 'price-flat'
}
</script>

<style lang="scss" scoped>
.recommendation-list {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .recommendation-content {
    .loading-container {
      padding: 40px 0;
    }

    .stock-recommendations {
      .recommendation-item {
        display: flex;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        margin-bottom: 16px;
        background: #fff;
        overflow: hidden;

        &:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .item-rank {
          width: 60px;
          background: #f5f7fa;
          display: flex;
          align-items: center;
          justify-content: center;

          .rank-number {
            font-size: 20px;
            font-weight: bold;

            &.top-rank {
              color: #f56c6c;
            }

            &.good-rank {
              color: #e6a23c;
            }

            &.normal-rank {
              color: #909399;
            }
          }
        }

        .item-content {
          flex: 1;
          padding: 16px;

          .stock-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .stock-info {
              h3 {
                margin: 0 0 4px 0;
                color: #303133;
                font-size: 18px;
              }
            }
          }

          .stock-metrics {
            margin-bottom: 12px;

            .metric-item {
              text-align: center;

              .metric-label {
                display: block;
                font-size: 12px;
                color: #909399;
                margin-bottom: 4px;
              }

              .metric-value {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #303133;

                &.price-up {
                  color: #f56c6c;
                }

                &.price-down {
                  color: #67c23a;
                }

                &.price-flat {
                  color: #909399;
                }

                &.score {
                  color: #e6a23c;
                }

                &.target {
                  color: #409eff;
                }
              }
            }

            .metric-actions {
              display: flex;
              justify-content: center;
              align-items: center;
            }
          }

          .recommendation-reason {
            .reason-content {
              .reason-text {
                margin: 12px 0 0 0;
                color: #606266;
                font-size: 14px;
                line-height: 1.5;
              }
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .recommendation-list {
    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .header-actions {
        justify-content: center;
      }
    }
    
    .recommendation-item {
      flex-direction: column;

      .item-rank {
        width: 100%;
        height: 40px;
      }

      .stock-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  }
}
</style> 