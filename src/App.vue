<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'

// 使用WebSocket composable
const {
  initWebSockets,
  cleanupWebSockets
} = useWebSocket()

// 启用 Element Plus 暗黑主题
onMounted(() => {
  // �?html 元素添加暗黑主题�?  document.documentElement.classList.add('dark')
  
  // 初始化WebSocket连接
  console.log('🚀 应用启动，初始化WebSocket连接...')
  initWebSockets()
})

onUnmounted(() => {
  // 清理WebSocket连接
  console.log('🔌 应用卸载，清理WebSocket连接...')
  cleanupWebSockets()
})
</script>

<style>
/* 基础重置样式 */
body, html, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
}

/* 应用容器 */
#app {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
    width: 100vw;
}

/* 简洁的滚动条样�?*/
* {
  scrollbar-width: thin;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-hover);
}

/* 基础工具�?*/
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
