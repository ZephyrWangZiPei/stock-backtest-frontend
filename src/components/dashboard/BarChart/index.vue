<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>回测收益</h3>
    </div>
    <div class="chart-content">
      <div class="chart-placeholder">
        <el-icon size="48"><Histogram /></el-icon>
        <p>柱状图组件</p>
        <p>显示回测收益情况</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Histogram } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.chart-container {
  height: 300px;
  
  .chart-header {
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    
    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }
  
  .chart-content {
    height: calc(100% - 60px);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .chart-placeholder {
      text-align: center;
      color: #909399;
      
      p {
        margin: 8px 0;
        font-size: 14px;
      }
    }
  }
}
</style> 