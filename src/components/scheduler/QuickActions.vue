<template>
  <div class="quick-actions">
    <h3 class="text-lg font-semibold mb-4 text-gray-200 flex items-center">
      <div class="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-md mr-3"></div>
      快捷操作
    </h3>
    <div class="grid grid-cols-1 gap-3">
      <button
        @click="handleSmartUpdateDailyData"
        :disabled="loading.smartData"
        class="action-button action-button-success group"
      >
        <div class="flex items-center justify-center space-x-3">
          <div
            class="w-10 h-10 bg-green-500/20 rounded-sm flex items-center justify-center group-hover:bg-green-500/30 transition-colors"
          >
            <div class="w-5 h-5 bg-green-400 rounded-xs"></div>
          </div>
          <span class="font-medium">
            {{ loading.smartData ? '智能更新中...' : '智能数据更新' }}
          </span>
        </div>
        <div
          v-if="loading.smartData"
          class="absolute inset-0 bg-green-500/10 rounded-md animate-pulse"
        ></div>
      </button>

      <button
        @click="handleUpdateStockList"
        :disabled="loading.stockList"
        class="action-button action-button-warning group"
      >
        <div class="flex items-center justify-center space-x-3">
          <div
            class="w-10 h-10 bg-orange-500/20 rounded-sm flex items-center justify-center group-hover:bg-orange-500/30 transition-colors"
          >
            <div class="w-5 h-5 bg-orange-400 rounded-xs"></div>
          </div>
          <span class="font-medium">
            {{ loading.stockList ? '更新中...' : '更新股票列表' }}
          </span>
        </div>
        <div
          v-if="loading.stockList"
          class="absolute inset-0 bg-orange-500/10 rounded-md animate-pulse"
        ></div>
      </button>

      <button
        @click="handleResetJobs"
        :disabled="loading.reset"
        class="action-button action-button-danger group"
      >
        <div class="flex items-center justify-center space-x-3">
          <div
            class="w-10 h-10 bg-red-500/20 rounded-sm flex items-center justify-center group-hover:bg-red-500/30 transition-colors"
          >
            <div class="w-5 h-5 bg-red-400 rounded-xs"></div>
          </div>
          <span class="font-medium">
            {{ loading.reset ? '重置中...' : '重置任务' }}
          </span>
        </div>
        <div
          v-if="loading.reset"
          class="absolute inset-0 bg-red-500/10 rounded-md animate-pulse"
        ></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSchedulerStore } from '@/store/scheduler'

const store = useSchedulerStore()

// 根据任务状态计算加载状态
const loading = computed(() => {
  const smartTask = store.taskStatus['update_daily_data_smart']
  const stockListTask = store.taskStatus['update_stock_list']
  
  return {
    // 只有当任务存在且有进度更新时才显示loading状态
    smartData: smartTask && smartTask.success === undefined && smartTask.current_date_progress !== undefined,
    stockList: stockListTask && stockListTask.success === undefined && stockListTask.current_date_progress !== undefined,
    reset: false // 重置任务通常很快，不需要长时间禁用
  }
})

const handleSmartUpdateDailyData = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }
  
  // 检查任务是否正在运行
  const smartTask = store.taskStatus['update_daily_data_smart']
  if (smartTask && smartTask.success === undefined) {
    ElMessage.warning('智能数据更新任务正在运行中，请稍候...')
    return
  }
  
  store.socket.emit('manual_smart_update_daily_data', {})
  ElMessage.info('已发送智能数据更新请求')
}

const handleUpdateStockList = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }
  
  // 检查任务是否正在运行
  const stockListTask = store.taskStatus['update_stock_list']
  if (stockListTask && stockListTask.success === undefined) {
    ElMessage.warning('股票列表更新任务正在运行中，请稍候...')
    return
  }
  
  store.socket.emit('manual_update_stock_list', {})
  ElMessage.info('已发送股票列表更新请求')
}

const handleResetJobs = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法重置任务。')
    return
  }

  ElMessageBox.confirm('确定要重置所有任务到默认设置吗？此操作不可逆。', '警告', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    store.socket?.emit('setup_jobs', {})
    ElMessage.info('已发送重置任务请求')
  })
}
</script>

<style scoped>
.action-button {
  @apply relative w-full px-4 py-3 rounded-lg border border-gray-600/50 bg-gray-700/50 backdrop-blur-sm text-white font-medium transition-all duration-300 hover:border-gray-500/70 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-button-success {
  @apply hover:border-green-500/50 hover:bg-green-500/10;
}

.action-button-warning {
  @apply hover:border-orange-500/50 hover:bg-orange-500/10;
}

.action-button-danger {
  @apply hover:border-red-500/50 hover:bg-red-500/10;
}
</style> 