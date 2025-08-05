<template>
  <el-card shadow="never" class="h-full">
    <template #header>
      <div class="text-sm font-medium">{{ title }}</div>
    </template>
    <div class="space-y-2">
      <div class="flex justify-between" v-for="item in items" :key="item.label">
        <span class="text-sm text-gray-600">{{ item.label }}:</span>
        <span class="text-sm font-medium">{{ item.value }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
// Props
interface DataItem {
  label: string
  value: string | number
}

interface Props {
  title: string
  items: DataItem[]
}

defineProps<Props>()
</script>

<style scoped>
.h-full {
  height: 100%;
}

.space-y-2 > * + * {
  margin-top: 8px;
}

.text-sm {
  font-size: 14px;
}

.font-medium {
  font-weight: 500;
  color: #ffffff;
}

.text-gray-600 {
  color: #c0c4cc;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}
</style> 
