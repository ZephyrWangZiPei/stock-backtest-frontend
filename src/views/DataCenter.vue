<template>
  <section class="grid">
    <div class="card panel">
      <h3>数据操作</h3>
      <el-button>更新股票列表</el-button>
      <el-button>缺口回补</el-button>
      <el-button>更新当日日线</el-button>
    </div>
    <div class="card panel">
      <h3>数据统计</h3>
      <p class="text-muted">stocks/daily/news/strategies</p>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: $space-4; }
.panel { padding: $space-4; }
</style> 