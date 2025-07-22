<template>
  <div class="control-panel">
    <div class="relative group flex-1">
      <div
        class="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"
      ></div>
      <el-card
        class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-blue-400 rounded-md animate-pulse"></div>
              <span
                class="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              >控制与状态</span>
            </div>
          </div>
        </template>

        <div class="h-full flex flex-col">
          <!-- 快捷操作 -->
          <QuickActions />
          
          <!-- 任务状态 -->
          <div class="flex-1 mt-6">
            <TaskStatus />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import QuickActions from './QuickActions.vue'
import TaskStatus from './TaskStatus.vue'
</script>

<style scoped>
.control-panel {
  @apply h-full;
}
</style> 