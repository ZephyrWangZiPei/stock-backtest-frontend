<template>
  <div class="news-analysis-layout">
    <!-- 左侧面板 -->
    <div class="left-panel">
      <slot name="left" />
    </div>
    
    <!-- 右侧面板 -->
    <div class="right-panel">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 左右布局组件
</script>

<style lang="scss" scoped>
.news-analysis-layout {
  display: flex;
  height: 100vh;
  background: var(--el-bg-color);
  
  .left-panel {
    width: 400px;
    border-right: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color-page);
    overflow-y: auto;
  }
  
  .right-panel {
    flex: 1;
    overflow-y: auto;
    background: var(--el-bg-color);
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    .left-panel {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--el-border-color-light);
    }
    
    .right-panel {
      flex: 1;
    }
  }
}
</style> 