<template>
  <div class="p-4">
    <div class="bg-gray-800 shadow-lg rounded-lg p-6">
      <h1 class="text-3xl font-bold text-white mb-4">
        欢迎来到 Stock Scan 平台
      </h1>
      <p class="text-gray-300">
        请使用左侧的导航菜单来探索不同功能：
      </p>
      <ul class="list-disc list-inside mt-4 text-gray-400 space-y-2">
        <li><b>仪表盘:</b> 您当前所在的概览页面。</li>
        <li><b>策略回测:</b> 测试和评估您的交易策略表现。</li>
        <li><b>自选股:</b> 管理和跟踪您感兴趣的股票。</li>
        <li><b>任务调度:</b> 查看和管理数据更新等后台任务。</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// No script logic needed for this static view yet
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}
</style> 