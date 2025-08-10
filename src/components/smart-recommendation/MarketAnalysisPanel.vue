<template>
  <div class="market-analysis-panel">
    <!-- 热门板块 -->
    <el-card class="hot-sectors" style="margin-bottom: 20px">
      <template #header>
        <span>热门板块</span>
      </template>

      <div class="sector-list" style="max-height: 300px; overflow-y: auto;">
        <div v-for="sector in hotSectors" :key="sector.name" class="sector-item">
          <div class="sector-info">
            <span class="sector-name">{{ sector.name }}</span>
            <span class="sector-change" :class="getPriceChangeClass(sector.change_pct)">
              {{ sector.change_pct > 0 ? '+' : '' }}{{ sector.change_pct }}%
            </span>
          </div>
          <div class="sector-stocks">
            <el-tag v-for="stock in sector.hot_stocks" :key="stock" size="small" style="margin: 1px">
              {{ stock }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 市场情绪 -->
    <el-card class="market-sentiment" style="margin-bottom: 20px">
      <template #header>
        <span>市场情绪</span>
      </template>

      <div class="sentiment-content">
        <div class="sentiment-gauge">
          <el-progress
            type="dashboard"
            :percentage="marketSentiment.score"
            :color="getSentimentColor(marketSentiment.score)"
          />
          <div class="sentiment-label">
            <span class="sentiment-text">{{ getSentimentText(marketSentiment.score) }}</span>
            <span class="sentiment-desc">{{ marketSentiment.description }}</span>
          </div>
        </div>

        <div class="sentiment-factors">
          <h4>影响因子</h4>
          <div v-for="factor in marketSentiment.factors" :key="factor.name" class="factor-item">
            <span class="factor-name">{{ factor.name }}</span>
            <el-rate
              v-model="factor.impact"
              disabled
              show-score
              text-color="#ff9900"
              :max="5"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- AI分析洞察 -->
    <el-card class="ai-insights">
      <template #header>
        <span>AI洞察</span>
      </template>

      <div class="insights-content" style="max-height: 400px; overflow-y: auto;">
        <el-timeline>
          <el-timeline-item
            v-for="insight in aiInsights"
            :key="insight.id"
            :timestamp="insight.time"
            :type="insight.type"
          >
            <h4>{{ insight.title }}</h4>
            <p>{{ insight.content }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 接口定义
interface HotSector {
  name: string
  change_pct: number
  hot_stocks: string[]
}

interface MarketSentiment {
  score: number
  description: string
  factors: Array<{
    name: string
    impact: number
  }>
}

interface AIInsight {
  id: number
  time: string
  type: string
  title: string
  content: string
}

// Props
defineProps<{
  hotSectors: HotSector[]
  marketSentiment: MarketSentiment
  aiInsights: AIInsight[]
}>()

// 工具函数
const getPriceChangeClass = (changePct: number) => {
  if (changePct > 0) return 'price-up'
  if (changePct < 0) return 'price-down'
  return 'price-flat'
}

const getSentimentColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  if (score >= 40) return '#f56c6c'
  return '#909399'
}

const getSentimentText = (score: number) => {
  if (score >= 80) return '极度乐观'
  if (score >= 60) return '偏乐观'
  if (score >= 40) return '中性'
  return '悲观'
}
</script>

<style lang="scss" scoped>
.market-analysis-panel {
  .hot-sectors {
    .sector-list {
      .sector-item {
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .sector-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .sector-name {
            font-weight: 500;
            color: #303133;
          }

          .sector-change {
            font-weight: bold;

            &.price-up {
              color: #f56c6c;
            }

            &.price-down {
              color: #67c23a;
            }

            &.price-flat {
              color: #909399;
            }
          }
        }

        .sector-stocks {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
      }
    }
  }

  .market-sentiment {
    .sentiment-content {
      .sentiment-gauge {
        text-align: center;
        margin-bottom: 20px;

        .sentiment-label {
          margin-top: 12px;

          .sentiment-text {
            display: block;
            font-size: 16px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }

          .sentiment-desc {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .sentiment-factors {
        h4 {
          margin: 0 0 12px 0;
          color: #303133;
          font-size: 14px;
        }

        .factor-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .factor-name {
            font-size: 12px;
            color: #606266;
          }
        }
      }
    }
  }

  .ai-insights {
    .insights-content {
      h4 {
        margin: 0 0 4px 0;
        color: #303133;
        font-size: 14px;
      }

      p {
        margin: 0;
        color: #606266;
        font-size: 12px;
        line-height: 1.4;
      }
    }
  }
}

@media (max-width: 768px) {
  .market-analysis-panel {
    .hot-sectors,
    .market-sentiment,
    .ai-insights {
      margin-bottom: 16px;
    }
  }
}
</style> 