<template>
  <el-card class="recommendation-overview">
    <template #header>
      <div class="card-header">
        <span>今日AI推荐</span>
        <el-button size="small" @click="$emit('refresh-recommendations')">
          <el-icon><Refresh /></el-icon>
          刷新推荐
        </el-button>
      </div>
    </template>

    <div class="overview-content">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="6">
          <div class="overview-item">
            <div class="item-icon strong-buy">
              <el-icon size="24"><TrendCharts /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-value">{{ stats.strongBuy }}</div>
              <div class="item-label">强烈推荐</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="overview-item">
            <div class="item-icon buy">
              <el-icon size="24"><Top /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-value">{{ stats.buy }}</div>
              <div class="item-label">推荐买入</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="overview-item">
            <div class="item-icon hold">
              <el-icon size="24"><Star /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-value">{{ stats.hold }}</div>
              <div class="item-label">持有观望</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="overview-item">
            <div class="item-icon hot">
              <el-icon size="24"><Lightning /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-value">{{ stats.hot }}</div>
              <div class="item-label">热门关注</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Refresh, TrendCharts, Top, Star, Lightning } from '@element-plus/icons-vue'

// 接口定义
interface RecommendationStats {
  strongBuy: number
  buy: number
  hold: number
  hot: number
}

// Props
defineProps<{
  stats: RecommendationStats
}>()

// Emits
defineEmits<{
  'refresh-recommendations': []
}>()
</script>

<style lang="scss" scoped>
.recommendation-overview {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .overview-content {
    .overview-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;

      .item-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        color: white;

        &.strong-buy {
          background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
        }

        &.buy {
          background: linear-gradient(135deg, #2ed573 0%, #1dd1a1 100%);
        }

        &.hold {
          background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
        }

        &.hot {
          background: linear-gradient(135deg, #5352ed 0%, #3742fa 100%);
        }
      }

      .item-content {
        .item-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
          margin-bottom: 4px;
        }

        .item-label {
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .recommendation-overview {
    .overview-content {
      .overview-item {
        .item-icon {
          width: 40px;
          height: 40px;
        }

        .item-content {
          .item-value {
            font-size: 20px;
          }
        }
      }
    }
  }
}
</style> 