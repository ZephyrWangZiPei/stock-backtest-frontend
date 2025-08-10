<template>
  <section class="grid">
    <div class="card stat">
      <h3>系统状态</h3>
      <p class="text-muted">后端API/WS连接、任务队列</p>
    </div>
    <div class="card stat">
      <h3>数据总览</h3>
      <p class="text-muted">股票/日线/新闻/策略 等数量</p>
    </div>
    <div class="card stat">
      <h3>最近任务</h3>
      <p class="text-muted">回测/采集/AI 最近执行</p>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}
.stat { padding: $space-4; }
</style> 