<template>
  <div class="task-status">
    <h3 class="text-lg font-semibold mb-4 text-gray-200 flex items-center">
      <div class="w-1 h-6 bg-gradient-to-b from-green-400 to-blue-400 rounded-md mr-3"></div>
      任务状态
    </h3>

    <div class="space-y-4">
      <!-- 智能数据更新状态 -->
      <div class="task-status-card">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span class="font-medium text-gray-200">智能数据更新</span>
          </div>
          <div class="text-xs text-gray-400">
            上次更新: {{ lastUpdateTimes.smart_data ? formatDate(lastUpdateTimes.smart_data, 'YYYY-MM-DD HH:mm:ss') : '从未'
            }}
          </div>
        </div>

        <div
          v-if="smartUpdateTask"
          class="space-y-3"
        >
          <!-- 总体进度 -->
          <div class="progress-layer">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span class="text-sm text-gray-300">总体进度</span>
              </div>
              <span class="text-sm font-medium text-green-400">{{
                (smartUpdateTask?.current_date_progress || 0).toFixed(2) }}%</span>
            </div>
            <div class="progress-bg">
              <div
                class="progress-fill progress-fill-green"
                :style="{ width: `${smartUpdateTask?.current_date_progress || 0}%` }"
                :class="smartUpdateTask?.success === false ? 'progress-fill-error' : ''"
              ></div>
            </div>
          </div>

          <!-- 扫描进度 -->
          <div
            v-if="smartUpdateTask?.scan_progress !== undefined"
            class="progress-layer"
          >
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                <span class="text-sm text-gray-300">扫描进度</span>
              </div>
              <span class="text-sm font-medium text-blue-400">{{
  smartUpdateTask.scan_progress.toFixed(2) }}%</span>
            </div>
            <div class="progress-bg">
              <div
                class="progress-fill progress-fill-blue"
                :style="{ width: `${smartUpdateTask.scan_progress}%` }"
              ></div>
            </div>
          </div>

          <!-- 更新进度 -->
          <div
            v-if="smartUpdateTask?.update_progress !== undefined"
            class="progress-layer"
          >
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                <span class="text-sm text-gray-300">更新进度</span>
              </div>
              <span class="text-sm font-medium text-yellow-400">{{
                smartUpdateTask.update_progress.toFixed(2) }}%</span>
            </div>
            <div class="progress-bg">
              <div
                class="progress-fill progress-fill-yellow"
                :style="{ width: `${smartUpdateTask.update_progress}%` }"
              ></div>
            </div>
          </div>

          <!-- 详细进度信息 -->
          <div
            v-if="smartUpdateTask?.phase"
            class="mt-4 pt-3 border-t border-gray-600/30"
          >
            <div class="space-y-3">
              <!-- 阶段信息 -->
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400">当前阶段:</span>
                <span
                  class="text-xs font-medium px-2 py-1 rounded"
                  :class="{
                    'bg-blue-500/20 text-blue-400': smartUpdateTask.phase === 'scanning',
                    'bg-yellow-500/20 text-yellow-400': smartUpdateTask.phase === 'updating',
                    'bg-green-500/20 text-green-400': smartUpdateTask.phase === 'complete',
                    'bg-red-500/20 text-red-400': smartUpdateTask.phase === 'error'
                  }"
                >
                  {{ getPhaseText(smartUpdateTask.phase) }}
                </span>
              </div>

              <!-- 当前处理的股票 -->
              <div
                v-if="smartUpdateTask?.current_stock"
                class="flex justify-between items-center"
              >
                <span class="text-xs text-gray-400">当前股票:</span>
                <span class="text-xs text-white font-medium">{{ smartUpdateTask.current_stock }}</span>
              </div>

              <!-- 扫描详情 -->
              <div
                v-if="smartUpdateTask?.completed_scans !== undefined && smartUpdateTask?.total_stocks !== undefined"
                class="flex justify-between items-center"
              >
                <span class="text-xs text-gray-400">扫描进度:</span>
                <span class="text-xs text-white font-medium">
                  {{ smartUpdateTask.completed_scans }}/{{ smartUpdateTask.total_stocks }}
                </span>
              </div>

              <!-- 缺失日期数量 -->
              <div
                v-if="smartUpdateTask?.missing_dates_count !== undefined"
                class="flex justify-between items-center"
              >
                <span class="text-xs text-gray-400">缺失日期:</span>
                <span class="text-xs text-white font-medium">{{ smartUpdateTask.missing_dates_count }} 个</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 状态消息 -->
        <div
          v-if="smartUpdateTask?.message"
          class="mt-3 p-2 bg-gray-700/50 rounded text-sm text-gray-300"
        >
          {{ smartUpdateTask.message }}
        </div>
      </div>

      <!-- 股票列表更新状态 -->
      <div class="task-status-card">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span class="font-medium text-gray-200">股票列表更新</span>
          </div>
          <div class="text-xs text-gray-400">
            上次更新: {{ lastUpdateTimes.stock_list ? formatDate(lastUpdateTimes.stock_list, 'YYYY-MM-DD HH:mm:ss') : '从未'
            }}
          </div>
        </div>

        <div
          v-if="stockListTask"
          class="space-y-3"
        >
          <!-- 进度条 -->
          <div class="progress-layer">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                <span class="text-sm text-gray-300">更新进度</span>
              </div>
              <span class="text-sm font-medium text-orange-400">{{
                (stockListTask?.current_date_progress || 0).toFixed(2) }}%</span>
            </div>
            <div class="progress-bg">
              <div
                class="progress-fill progress-fill-orange"
                :style="{ width: `${stockListTask?.current_date_progress || 0}%` }"
                :class="stockListTask?.success === false ? 'progress-fill-error' : ''"
              ></div>
            </div>
          </div>

          <!-- 状态消息 -->
          <div
            v-if="stockListTask?.message"
            class="mt-3 p-2 bg-gray-700/50 rounded text-sm text-gray-300"
          >
            {{ stockListTask.message }}
          </div>
        </div>
      </div>

      <!-- 潜力股海选状态 -->
      <div class="task-status-card">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span class="font-medium text-gray-200">潜力股海选</span>
          </div>
          <div class="text-xs text-gray-400">
            上次更新: {{ lastUpdateTimes.candidate_pool ? formatDate(lastUpdateTimes.candidate_pool, 'YYYY-MM-DD HH:mm:ss')
              : '从未' }}
          </div>
        </div>

        <div
          v-if="candidatePoolTask"
          class="space-y-3"
        >
          <!-- 进度条 -->
          <div class="progress-layer">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-cyan-400 rounded-full mr-2"></div>
                <span class="text-sm text-gray-300">海选进度</span>
              </div>
              <span class="text-sm font-medium text-cyan-400">{{
                (candidatePoolTask?.current_date_progress || 0).toFixed(2) }}%</span>
            </div>
            <div class="progress-bg">
              <div
                class="progress-fill progress-fill-cyan"
                :style="{ width: `${candidatePoolTask?.current_date_progress || 0}%` }"
                :class="candidatePoolTask?.success === false ? 'progress-fill-error' : ''"
              ></div>
            </div>
          </div>

          <!-- 状态消息 -->
          <div
            v-if="candidatePoolTask?.message"
            class="mt-3 p-2 bg-gray-700/50 rounded text-sm text-gray-300"
          >
            {{ candidatePoolTask.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSchedulerStore } from '@/store/scheduler'
import { formatDate } from '@/utils/format'
import type { TaskStatus } from '@/types/api'

const store = useSchedulerStore()

const lastUpdateTimes = computed(() => store.last_update_times)

const smartUpdateTask = computed(() => {
  const task = store.taskStatus['update_daily_data_smart']
  if (!task) return null

  const isRunning = task.success === undefined

  return {
    isRunning,
    current_date_progress: task.current_date_progress || 0,
    message: task.message || (isRunning ? '正在执行...' : '已完成'),
    success: task.success,
    phase: task.phase,
    current_stock: task.current_stock,
    scan_progress: task.scan_progress,
    update_progress: task.update_progress,
    completed_scans: task.completed_scans,
    total_stocks: task.total_stocks,
    missing_dates_count: task.missing_dates_count
  }
})

const stockListTask = computed(() => {
  const task = store.taskStatus['update_stock_list']
  if (!task) return null

  const isRunning = task.success === undefined

  return {
    isRunning,
    current_date_progress: task.current_date_progress || 0,
    message: task.message || (isRunning ? '正在执行...' : '已完成'),
    success: task.success
  }
})

const candidatePoolTask = computed(() => {
  const task = store.taskStatus['candidate_pool']
  if (!task) return null

  const isRunning = task.success === undefined

  return {
    isRunning,
    current_date_progress: task.current_date_progress || 0,
    message: task.message || (isRunning ? '正在执行...' : '已完成'),
    success: task.success
  }
})

const getPhaseText = (phase: string) => {
  const phaseMap: Record<string, string> = {
    'scanning': '扫描中',
    'updating': '更新中',
    'complete': '已完成',
    'error': '错误'
  }
  return phaseMap[phase] || phase
}
</script>

<style scoped>
.task-status-card {
  @apply p-4 bg-gray-700/30 rounded-lg border border-gray-600/30;
}

.progress-layer {
  @apply mb-3;
}

.progress-bg {
  @apply w-full h-2 bg-gray-600/50 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300 ease-out;
}

.progress-fill-green {
  @apply bg-gradient-to-r from-green-400 to-green-500;
}

.progress-fill-blue {
  @apply bg-gradient-to-r from-blue-400 to-blue-500;
}

.progress-fill-yellow {
  @apply bg-gradient-to-r from-yellow-400 to-yellow-500;
}

.progress-fill-orange {
  @apply bg-gradient-to-r from-orange-400 to-orange-500;
}

.progress-fill-cyan {
  @apply bg-gradient-to-r from-cyan-400 to-cyan-500;
}
.progress-fill-error {
  @apply bg-gradient-to-r from-red-400 to-red-500;
}
</style> 