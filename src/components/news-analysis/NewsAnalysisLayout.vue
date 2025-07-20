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
  height: calc(100vh - 150px);
    /* 减去头部高度 */
    background: var(--el-bg-color);
  
    .left-panel {
      height: calc(100% - 25px);
      width: 400px;
      border-right: 1px solid var(--el-border-color-light);
      background: var(--el-bg-color-page);
      overflow-y: auto;
      overflow-x: hidden;
  
      /* 确保滚动条样式 */
      &::-webkit-scrollbar {
        width: 6px;
      }
  
      &::-webkit-scrollbar-track {
        background: var(--el-border-color-lighter);
      }
  
      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 3px;
      }
  
      &::-webkit-scrollbar-thumb:hover {
        background: var(--el-border-color-dark);
      }
    }
  
    .right-panel {
      height: calc(100% - 25px);
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--el-bg-color);
  
      /* 确保滚动条样式 */
      &::-webkit-scrollbar {
        width: 6px;
      }
  
      &::-webkit-scrollbar-track {
        background: var(--el-border-color-lighter);
      }
  
      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 3px;
      }
  
      &::-webkit-scrollbar-thumb:hover {
        background: var(--el-border-color-dark);
      }
    }
  
    @media (max-width: 768px) {
      flex-direction: column;
      height: calc(100vh - 120px);
      /* 移动端头部可能更高 */
  
      .left-panel {
        width: 100%;
        height: auto;
        max-height: 50vh;
        border-right: none;
        border-bottom: 1px solid var(--el-border-color-light);
      }
  
      .right-panel {
        flex: 1;
        min-height: 0;
        /* 确保flex子元素可以收缩 */
    }
  }
}
</style> 