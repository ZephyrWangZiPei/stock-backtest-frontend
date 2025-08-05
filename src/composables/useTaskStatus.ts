import { ref, onMounted, onUnmounted } from 'vue'
import { unifiedHttpClient } from '@/utils/unifiedHttpClient'

export const useTaskStatus = () => {
  const totalTasks = ref(0)
  const runningTasks = ref(0)
  const updateInterval = ref<NodeJS.Timeout | null>(null)

  // 更新任务状�?
  const updateTaskStatus = async () => {
    try {
      const response = await unifiedHttpClient.dataCollection.getRunningTasks()
      const tasks = response.data || []
      runningTasks.value = tasks.filter((task: any) => task.status === 'running').length
      totalTasks.value = tasks.length
    } catch (error) {
      console.error('获取任务状态失�?', error)
      // 使用模拟数据作为后备
      totalTasks.value = 5
      runningTasks.value = 2
    }
  }

  // 处理任务更新事件
  const handleTaskUpdate = (data: any) => {
    // 当任务状态发生变化时，更新计�?
    updateTaskStatus()
  }

  // 生命周期
  onMounted(() => {
    // 初始更新任务状�?
    updateTaskStatus()

    // 定时更新任务状�?
    updateInterval.value = setInterval(updateTaskStatus, 5000)

    // 监听任务更新事件
    // 这里可以添加WebSocket事件监听
  })

  onUnmounted(() => {
    // 清理定时�?
    if (updateInterval.value) {
      clearInterval(updateInterval.value)
      updateInterval.value = null
    }
  })

  return {
    totalTasks,
    runningTasks,
    updateTaskStatus,
    handleTaskUpdate
  }
} 
