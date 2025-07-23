<template>
  <div class="task-group">
    <div class="group-header">
      <div class="flex items-center space-x-2 mb-3">
        <i :class="icon" class="text-gray-400 text-sm"></i>
        <h3 class="text-lg font-semibold text-gray-200">{{ title }}</h3>
      </div>
    </div>
    
    <div class="group-content space-y-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  icon: string
}>()
</script>

<style scoped>
.task-group {
  @apply p-4 bg-gray-700/30 rounded-lg border border-gray-600/30;
}

.group-header {
  @apply border-b border-gray-600/30 pb-2;
}

.group-content {
  @apply pt-2;
}
</style> 