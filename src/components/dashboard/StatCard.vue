<template>
  <el-card class="stat-card">
    <div class="stat-content">
      <div class="stat-icon">
        <el-icon>
          <component :is="icon" />
        </el-icon>
      </div>
      <div class="stat-info">
        <div class="stat-value" :class="valueClass">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  value: string | number
  label: string
  icon: string
  type?: 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info'
})

// Computed
const valueClass = computed(() => {
  const classMap = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: ''
  }
  return classMap[props.type]
})
</script>

<style scoped>
.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  font-size: 2.5rem;
  color: #409eff;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #c0c4cc;
}

.text-green-600 {
  color: #67c23a;
}

.text-yellow-600 {
  color: #e6a23c;
}

.text-red-600 {
  color: #f56c6c;
}
</style> 
