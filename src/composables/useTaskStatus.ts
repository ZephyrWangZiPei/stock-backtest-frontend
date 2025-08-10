import { ref, onMounted, onUnmounted } from 'vue'
import { websocketEventBus } from '@/utils/websocketEventBus'

export const useTaskStatus = () => {
  const totalTasks = ref(0)
  const runningTasks = ref(0)

  // 更新任务状态
  const updateTaskStatus = async () => {
    // 这个方法现在只用于初始化，后续通过WebSocket更新
    // 如果需要手动刷新，可以调用这个方法
  }

  // 处理任务更新事件
  const handleTaskUpdate = (event: any) => {
    // 通过WebSocket事件更新任务计数
    const data = event.data
    if (data.event_type === 'started') {
      runningTasks.value++
    } else if (data.event_type === 'completed' || data.event_type === 'failed') {
      if (runningTasks.value > 0) {
        runningTasks.value--
      }
    }
    
    // 更新总任务数（如果有提供）
    if (data.total_tasks !== undefined) {
      totalTasks.value = data.total_tasks
    }
  }

  // 生命周期
  onMounted(() => {
    // 监听数据采集WebSocket事件来更新任务状态
    const unsubscribe = websocketEventBus.subscribe({
      id: 'task-status-updater',
      namespace: '/data_collection',
      handler: handleTaskUpdate
    })

    // 监听全局任务事件
    const globalUnsubscribe = websocketEventBus.subscribe({
      id: 'global-task-status-updater',
      handler: handleTaskUpdate
    })

    // 保存取消订阅函数
    onUnmounted(() => {
      unsubscribe()
      globalUnsubscribe()
    })
  })

  return {
    totalTasks,
    runningTasks,
    updateTaskStatus,
    handleTaskUpdate
  }
} 
