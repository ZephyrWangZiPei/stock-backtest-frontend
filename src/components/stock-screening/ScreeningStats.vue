<template>
  <div v-if="stats" class="screening-stats">
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon><DataBoard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">筛选结果</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-icon excellent">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.excellent }}</div>
            <div class="stat-label">优质股票</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-icon score">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.avgScore.toFixed(1) }}</div>
            <div class="stat-label">平均评分</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-icon time">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.duration }}</div>
            <div class="stat-label">筛选用时(ms)</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { DataBoard, Trophy, Star, Timer } from '@element-plus/icons-vue'

// Props
interface ScreeningStats {
  total: number
  excellent: number
  avgScore: number
  duration: number
}

defineProps<{
  stats: ScreeningStats | null
}>()
</script>

<style lang="scss" scoped>
.screening-stats {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  
  .stat-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      background: #409eff;
      color: white;
      
      &.excellent {
        background: #67c23a;
      }
      
      &.score {
        background: #e6a23c;
      }
      
      &.time {
        background: #909399;
      }
    }
    
    .stat-content {
      .stat-value {
        font-size: 20px;
        font-weight: bold;
        color: #303133;
        line-height: 1;
        margin-bottom: 4px;
      }
      
      .stat-label {
        color: #909399;
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 768px) {
  .screening-stats {
    .stat-item {
      flex-direction: column;
      text-align: center;
      padding: 8px;
      
      .stat-icon {
        margin-right: 0;
        margin-bottom: 8px;
        width: 32px;
        height: 32px;
      }
      
      .stat-content {
        .stat-value {
          font-size: 16px;
        }
      }
    }
  }
}
</style> 