<template>
  <div class="news-analysis-header">
    <div class="header-content">
      <div class="header-left">
        <el-icon size="24" class="header-icon">
          <Document />
        </el-icon>
        <div class="header-text">
          <h1 class="page-title">股票新闻分析</h1>
          <p class="page-subtitle">智能新闻采集与情感分析系统</p>
        </div>
      </div>
      
      <div class="header-right">
        <el-tag
          :type="isConnected ? 'success' : 'danger'"
          size="large"
          effect="dark"
        >
          <el-icon class="status-icon">
            <component :is="isConnected ? 'CircleCheck' : 'CircleClose'" />
          </el-icon>
          {{ isConnected ? '已连接' : '未连接' }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, CircleCheck, CircleClose } from '@element-plus/icons-vue'

interface Props {
  isConnected: boolean
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
.news-analysis-header {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .header-icon {
      color: var(--el-color-primary);
    }
    
    .header-text {
      .page-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .page-subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }
  }
  
  .header-right {
    .status-icon {
      margin-right: 4px;
    }
  }
  
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
  }
}
</style> 