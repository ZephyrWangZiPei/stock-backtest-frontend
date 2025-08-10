<template>
  <el-row :gutter="20" class="candidate-stats">
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><DataBoard /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总候选股票</div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon buy">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.buyRecommended }}</div>
            <div class="stat-label">推荐买入</div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon score">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.avgScore.toFixed(1) }}</div>
            <div class="stat-label">平均评分</div>
          </div>
        </div>
      </el-card>
    </el-col>
    
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon new">
            <el-icon><Plus /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayAdded }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { DataBoard, TrendCharts, Star, Plus } from '@element-plus/icons-vue'
import type { CandidateStats } from '../../types/candidate'

// Props
defineProps<{
  stats: CandidateStats
}>()
</script>

<style lang="scss" scoped>
.candidate-stats {
  margin-bottom: 20px;
  
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      padding: 8px 0;
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        color: white;
        
        &.total {
          background: linear-gradient(135deg, #409eff 0%, #2979ff 100%);
        }
        
        &.buy {
          background: linear-gradient(135deg, #67c23a 0%, #4caf50 100%);
        }
        
        &.score {
          background: linear-gradient(135deg, #e6a23c 0%, #ff9800 100%);
        }
        
        &.new {
          background: linear-gradient(135deg, #f56c6c 0%, #e91e63 100%);
        }
      }
      
      .stat-info {
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .stat-label {
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .candidate-stats {
    .stat-card {
      margin-bottom: 12px;
      
      .stat-content {
        .stat-icon {
          width: 40px;
          height: 40px;
          margin-right: 12px;
        }
        
        .stat-info {
          .stat-value {
            font-size: 20px;
          }
          
          .stat-label {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style> 