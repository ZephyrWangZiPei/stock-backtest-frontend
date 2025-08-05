import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import unifiedHttpClient from '@/utils/unifiedHttpClient'

export const useScheduledTasks = () => {
  const scheduledTasks = ref<any[]>([])
  const scheduledTasksLoading = ref(false)
  const newScheduledTaskDialogVisible = ref(false)
  const creatingScheduledTask = ref(false)

  // 刷新定时任务列表
  const refreshScheduledTasks = async () => {
    try {
      scheduledTasksLoading.value = true
      const response = await unifiedHttpClient.scheduler.getScheduledJobs()
      scheduledTasks.value = response.data || []
      ElMessage.success('定时任务列表已刷新')
    } catch (error) {
      ElMessage.error('刷新定时任务列表失败')
    } finally {
      scheduledTasksLoading.value = false
    }
  }

  // 显示新建任务对话框
  const showNewScheduledTaskDialog = () => {
    newScheduledTaskDialogVisible.value = true
  }

  // 创建新定时任务
  const createNewScheduledTask = async (taskData: any) => {
    try {
      creatingScheduledTask.value = true
      await unifiedHttpClient.scheduler.createScheduledJob(taskData)
      ElMessage.success('定时任务创建成功')
      newScheduledTaskDialogVisible.value = false
      refreshScheduledTasks()
    } catch (error) {
      ElMessage.error('创建定时任务失败')
    } finally {
      creatingScheduledTask.value = false
    }
  }

  // 切换任务状态
  const toggleScheduledTask = async (task: any) => {
    try {
      const action = task.status === 'active' ? '暂停' : '启动'
      await ElMessageBox.confirm(
        `确定要${action}任务 "${task.name}" 吗？`,
        `确认${action}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      if (task.status === 'active') {
        await unifiedHttpClient.scheduler.pauseScheduledJob(task.id)
      } else {
        await unifiedHttpClient.scheduler.resumeScheduledJob(task.id)
      }
      
      ElMessage.success(`${action}任务请求已发送`)
      refreshScheduledTasks()
    } catch (error) {
      // 用户取消或API调用失败
    }
  }

  // 删除定时任务
  const deleteScheduledTask = async (task: any) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除任务 "${task.name}" 吗？此操作不可恢复！`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      await unifiedHttpClient.scheduler.deleteScheduledJob(task.id)
      ElMessage.success('删除任务请求已发送')
      refreshScheduledTasks()
    } catch (error) {
      // 用户取消或API调用失败
    }
  }

  // 处理调度器事件
  const handleScheduledTasksUpdate = (data: any) => {
    console.log('🔔 收到调度器任务更新事件', data)
    if (data.jobs) {
      scheduledTasks.value = data.jobs
    }
  }

  const handleScheduledTaskEvent = (data: any) => {
    console.log('🔔 收到调度器任务事件', data)
    if (data.success) {
      ElMessage.success(data.message)
      refreshScheduledTasks()
    } else {
      ElMessage.error(data.message || '操作失败')
    }
  }

  return {
    scheduledTasks,
    scheduledTasksLoading,
    newScheduledTaskDialogVisible,
    creatingScheduledTask,
    refreshScheduledTasks,
    showNewScheduledTaskDialog,
    createNewScheduledTask,
    toggleScheduledTask,
    deleteScheduledTask,
    handleScheduledTasksUpdate,
    handleScheduledTaskEvent
  }
} 
