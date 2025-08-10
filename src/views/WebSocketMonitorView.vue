<template>
  <div class="websocket-monitor-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>WebSocket 连接监控</h1>
      <p>实时监控 WebSocket 连接状态、任务进度和错误信息</p>
    </div>

    <!-- WebSocket 监控组件 -->
    <WebSocketMonitor />
  </div>
</template>

<script setup lang="ts">
import WebSocketMonitor from '../components/websocket/WebSocketMonitor.vue'
</script>

<style lang="scss" scoped>
.websocket-monitor-view {
  padding: 20px;
  min-height: calc(100vh - 70px);
  
  .page-header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }
}
</style> 