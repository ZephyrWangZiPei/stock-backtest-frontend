<template>
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>系统信息</span>
      </div>
    </template>
    <div class="info-content">
      <div class="info-item">
        <span class="label">CPU使用率:</span>
        <el-progress :percentage="cpuUsage" />
      </div>
      <div class="info-item">
        <span class="label">内存使用:</span>
        <el-progress :percentage="memoryUsage" status="success" />
      </div>
      <div class="info-item">
        <span class="label">磁盘空间:</span>
        <el-progress :percentage="diskUsage" status="warning" />
      </div>
      <div class="info-item">
        <span class="label">网络状态:</span>
        <el-tag type="success">正常</el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cpuUsage = ref(45)
const memoryUsage = ref(68)
const diskUsage = ref(82)
</script>

<style lang="scss" scoped>
.box-card {
  height: 400px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      font-weight: 600;
      color: #303133;
    }
  }
  
  .info-content {
    .info-item {
      margin-bottom: 20px;
      
      .label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style> 