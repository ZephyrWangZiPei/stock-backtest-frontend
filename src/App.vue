<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 全局样式已在main.ts中导入
</script>

<style lang="scss">
@use './assets/styles/variables.scss';
@use './assets/styles/global.scss';

#app {
  height: 100vh;
  overflow: auto; // 允许滚动
}
</style>
