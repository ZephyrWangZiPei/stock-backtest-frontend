<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// 启用 Element Plus 暗黑主题
onMounted(() => {
  // 为 html 元素添加暗黑主题类
  document.documentElement.classList.add('dark')
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
.app-container {
  min-height: 100vh;
  width: 100%;
}

/* 全局字体样式 */
#app {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 简洁的滚动条样式 */
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

/* 基础工具类 */
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
