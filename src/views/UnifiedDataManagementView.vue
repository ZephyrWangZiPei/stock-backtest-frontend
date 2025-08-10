<template>
  <div class="unified-data-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>数据管理中心</h1>
      <p>统一管理股票数据收集、处理和监控</p>
    </div>

    <!-- 数据统计概览 -->
    <DataStatsOverview :stats="dataStats" :source-stats="sourceStats" />

    <!-- 数据收集控制面板 -->
    <DataCollectionPanel
      :is-collecting="isCollecting"
      :tasks="allTasks"
      @refresh-tasks="refreshTasks"
      @quick-collect="handleQuickCollect"
      @custom-collect="handleCustomCollect"
      @batch-operation="handleBatchOperation"
    />

    <!-- 任务监控 -->
    <TaskMonitor
      :tasks="allTasks"
      :view-mode="taskViewMode"
      @update:view-mode="taskViewMode = $event"
      @pause-task="pauseTask"
      @resume-task="resumeTask"
      @cancel-task="cancelTask"
      @view-task-detail="viewTaskDetail"
    />

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="taskDetailVisible"
      :title="`任务详情 - ${selectedTask?.name}`"
      width="700px"
    >
      <div v-if="selectedTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ selectedTask.id }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ selectedTask.type }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedTask.status)">
              {{ getStatusText(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">{{ selectedTask.progress }}%</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatTime(selectedTask.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="预计完成">{{ getEstimatedTime(selectedTask) }}</el-descriptions-item>
        </el-descriptions>

        <div class="task-logs" style="margin-top: 20px; max-height: 300px; overflow-y: auto;">
          <h4>任务日志</h4>
          <div class="log-content">
            <div v-for="log in taskLogs" :key="log.id" class="log-item">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="taskDetailVisible = false">关闭</el-button>
        <el-button 
          v-if="selectedTask?.status === 'running'" 
          type="warning" 
          @click="pauseTask(selectedTask.id)"
        >
          暂停任务
        </el-button>
        <el-button 
          v-if="selectedTask?.status === 'paused'" 
          type="primary" 
          @click="resumeTask(selectedTask.id)"
        >
          继续任务
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, 
  Delete, 
  Download,
  View,
  Setting,
  Timer
} from '@element-plus/icons-vue'

// 导入组件
import { DataCollectionPanel, DataStatsOverview, TaskMonitor } from '../components/data-management'

// 导入API客户端和WebSocket服务
import unifiedHttpClient from '../utils/unifiedHttpClient'
import type { DatabaseStats, DataCollectionTask, RunningTask } from '../utils/unifiedHttpClient'
import { websocketEventBus } from '../utils/websocketEventBus'
import { realtimeDataService } from '../services/realtimeDataService'

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const activeTab = ref('overview')
const isCollecting = ref(false)
const taskViewMode = ref<'list' | 'timeline'>('list')
const taskDetailVisible = ref(false)
const selectedTask = ref<any>(null)

// 数据库统计信息
const databaseStats = ref<DatabaseStats>({
  total_stocks: 0,
  stocks_with_daily_data: 0,
  daily_data_completeness: 0,
  last_daily_update: '无数据',
  stocks_with_fund_flow: 0,
  fund_flow_coverage: 0,
  last_fund_flow_update: '无数据',
  stocks_with_institute_hold: 0,
  institute_hold_coverage: 0,
  last_institute_hold_update: '无数据',
  stocks_with_analyst_rating: 0,
  analyst_rating_coverage: 0,
  last_analyst_rating_update: '无数据',
  total_stock_scores: 0,
  total_strategies: 0,
  total_backtest_results: 0,
  total_candidate_stocks: 0,
  total_top_strategy_stocks: 0
})

// 运行中的任务
const runningTasks = ref<RunningTask[]>([])

// 数据采集任务
const dataCollectionTasks = ref<DataCollectionTask[]>([])

// 任务历史
const taskHistory = ref<DataCollectionTask[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalTasks = ref(0)

// 新任务表单
const newTaskForm = reactive({
  data_source: 'akshare',
  data_type: 'daily_data',
  stock_codes: [] as string[],
  start_date: '',
  end_date: '',
  visible: false
})

// 计算属性
const overallHealthScore = computed(() => {
  const completenessScore = (
    databaseStats.value.daily_data_completeness +
    databaseStats.value.fund_flow_coverage +
    databaseStats.value.institute_hold_coverage +
    databaseStats.value.analyst_rating_coverage
  ) / 4
  return Math.round(completenessScore)
})

const healthScoreColor = computed(() => {
  const score = overallHealthScore.value
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  if (score >= 40) return '#f56c6c'
  return '#909399'
})

const healthScoreStatus = computed(() => {
  const score = overallHealthScore.value
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '较差'
})

// 计算属性 - 添加缺失的
const dataStats = computed(() => {
  const s: any = databaseStats.value || {}
  const total = Number(s.total_stocks || 0)
  const dailyCov = Number(s.daily_data_coverage || 0)
  const fundFlowCov = Number(s.fund_flow_coverage || 0)
  const instHoldCov = Number(s.institute_hold_coverage || 0)
  const analystCov = Number(s.analyst_rating_coverage || 0)
  const scoreCov = Number(s.score_coverage || 0)
  const technicalCov = Number(
    s.technical_indicators_coverage !== undefined
      ? s.technical_indicators_coverage
      : (scoreCov || analystCov || 0)
  )

  // todayAdded: 汇总今日新增的多类数据（如存在）
  const todayAdded = Number(s.today_daily_count || 0) + Number(s.today_fund_flow_count || 0) + Number(s.today_analyst_rating_count || 0)

  // dataDelay: 距离最近日线更新时间的小时数
  let dataDelay = 0
  try {
    if (s.last_daily_update) {
      const last = new Date(s.last_daily_update).getTime()
      const now = Date.now()
      dataDelay = Math.max(0, Math.round((now - last) / 3600000))
    }
  } catch {}

  // dataQuality: 取可用覆盖率的平均（包含技术指标覆盖率）
  const covs = [dailyCov, fundFlowCov, instHoldCov, analystCov, technicalCov].filter(v => typeof v === 'number' && !isNaN(v))
  const dataQuality = covs.length > 0 ? Math.round(covs.reduce((a, b) => a + b, 0) / covs.length) : 0

  return {
    totalStocks: total,
    dailyDataCompleteness: dailyCov,
    fundamentalCompleteness: fundFlowCov,
    technicalCompleteness: technicalCov,
    lastUpdateTime: s.last_daily_update || '无数据',
    todayAdded,
    dataDelay,
    dataQuality
  }
})

// 为 DataStatsOverview 提供数据源统计（基于现有统计字段估算）
const sourceStats = computed(() => {
  const s: any = databaseStats.value || {}
  const total = Number(s.total_stocks || 0) || 1
  const baostockCount = Number(s.stocks_with_daily_data || 0)
  const akshareCount = Number(s.stocks_with_fund_flow || 0)
  const tushareCount = 0
  return [
    { name: 'Baostock', count: baostockCount, percentage: Math.round((baostockCount / total) * 100) },
    { name: 'AkShare', count: akshareCount, percentage: Math.round((akshareCount / total) * 100) },
    { name: 'Tushare', count: tushareCount, percentage: 0 }
  ]
})

const allTasks = computed(() => {
  console.log('🔄 [allTasks] 计算属性被调用:', {
    runningTasksLength: runningTasks.value.length,
    taskHistoryLength: taskHistory.value.length,
    runningTasks: runningTasks.value.map(t => ({ id: t.id, name: t.name, status: t.status, current_count: t.current_count, total_count: t.total_count })),
    taskHistory: taskHistory.value.map(t => ({ id: t.id, data_type: t.data_type, status: t.status }))
  })
  
  const tasks = [...runningTasks.value, ...taskHistory.value].map(task => {
    // 处理不同类型的任务对象
    if ('name' in task) {
      // RunningTask 类型
      const mappedTask = {
        id: task.id,
        name: task.name,
        type: 'unknown',
        status: task.status,
        progress: task.progress,
        startTime: task.start_time || new Date().toISOString(),
        endTime: task.end_time,
        // 使用详细进度信息，如果没有则回退到进度百分比
        processed: task.current_count || Math.floor((task.progress || 0) * 1),
        total: task.total_count || 100,
        description: task.message || ''
      }
      
      // 调试日志
      if (task.current_count || task.total_count) {
        console.log('📊 RunningTask 映射:', {
          id: task.id,
          original: { current_count: task.current_count, total_count: task.total_count, progress: task.progress },
          mapped: { processed: mappedTask.processed, total: mappedTask.total }
        })
      }
      
      return mappedTask
    } else {
      // DataCollectionTask 类型
      const mappedTask = {
        id: task.id,
        name: task.data_type || '未知任务',
        type: task.data_source || 'unknown',
        status: task.status,
        progress: task.progress,
        startTime: task.start_time || new Date().toISOString(),
        endTime: task.end_time,
        // 使用详细进度信息，如果没有则回退到进度百分比
        processed: task.current_count || Math.floor((task.progress || 0) * 1),
        total: task.total_count || 100,
        description: task.message || ''
      }
      
      // 调试日志
      if (task.current_count || task.total_count) {
        console.log('📊 DataCollectionTask 映射:', {
          id: task.id,
          original: { current_count: task.current_count, total_count: task.total_count, progress: task.progress },
          mapped: { processed: mappedTask.processed, total: mappedTask.total }
        })
      }
      
      return mappedTask
    }
  })
  
  // 调试日志：显示所有任务的进度信息
  const runningTasksWithProgress = tasks.filter(task => task.status === 'running')
  if (runningTasksWithProgress.length > 0) {
    console.log('🏃 运行中任务进度:', runningTasksWithProgress.map(t => ({
      id: t.id,
      name: t.name,
      processed: t.processed,
      total: t.total,
      progress: t.progress
    })))
  }
  
  return tasks
})

const taskLogs = ref<any[]>([])

// 数据源选项
const dataSourceOptions = [
  { label: 'AKShare', value: 'akshare' },
  { label: 'BaoStock', value: 'baostock' },
  { label: 'TuShare', value: 'tushare' }
]

// 数据类型选项
const dataTypeOptions = [
  { label: '日线数据', value: 'daily_data' },
  { label: '资金流向', value: 'fund_flow' },
  { label: '机构持股', value: 'institute_hold' },
  { label: '分析师评级', value: 'analyst_rating' },
  { label: '基本面数据', value: 'fundamental' }
]

// 方法
const refreshDatabaseStats = async () => {
  try {
    refreshing.value = true
    const response = await unifiedHttpClient.dataCollection.getDatabaseStats()
    databaseStats.value = response.data
    console.log('📊 Database stats updated:', response.data)
  } catch (error) {
    console.error('Failed to fetch database stats:', error)
    ElMessage.error('获取数据库统计失败')
  } finally {
    refreshing.value = false
  }
}

const refreshRunningTasks = async () => {
  console.log('🔄 [refreshRunningTasks] 开始刷新运行中任务...')
  try {
    const response = await unifiedHttpClient.dataCollection.getRunningTasks()
    console.log('📡 [refreshRunningTasks] API 响应:', response)
    
    const oldLength = runningTasks.value.length
    runningTasks.value = response.data || []
    const newLength = runningTasks.value.length
    
    console.log('📝 [refreshRunningTasks] 任务列表已更新:', {
      oldLength,
      newLength,
      tasks: runningTasks.value
    })
    
    // 如果没有运行中的任务，重置收集状态
    if (!runningTasks.value || runningTasks.value.length === 0) {
      console.log('📝 [refreshRunningTasks] 没有运行中任务，设置 isCollecting = false')
      isCollecting.value = false
    } else {
      console.log('📝 [refreshRunningTasks] 有运行中任务，保持 isCollecting = true')
    }
  } catch (error) {
    console.error('❌ [refreshRunningTasks] API 调用失败:', error)
    // 如果API调用失败，使用实时数据服务的数据
    const oldLength = runningTasks.value.length
    runningTasks.value = realtimeDataService.getTasksByType('data_collection')
    const newLength = runningTasks.value.length
    
    console.log('📝 [refreshRunningTasks] 使用本地数据更新:', {
      oldLength,
      newLength,
      tasks: runningTasks.value
    })
    
    // 同样检查是否有运行中的任务
    if (!runningTasks.value || runningTasks.value.length === 0) {
      console.log('📝 [refreshRunningTasks] 本地数据也没有运行中任务，设置 isCollecting = false')
      isCollecting.value = false
    }
  }
}

// 更新任务的详细进度信息
const updateTaskDetailedProgress = (progressData: any) => {
  const { task_id, progress, message, current, total, success_count, error_count } = progressData
  
  console.log('🔄 更新任务进度:', {
    task_id,
    progress,
    current,
    total,
    success_count,
    error_count
  })
  
  // 更新运行中任务的进度
  const taskIndex = runningTasks.value.findIndex(task => task.id === task_id)
  if (taskIndex !== -1) {
    console.log('📝 找到任务，更新进度:', runningTasks.value[taskIndex])
    
    runningTasks.value[taskIndex] = {
      ...runningTasks.value[taskIndex],
      progress: progress || 0,
      message: message || '',
      // 添加详细进度信息
      current_count: current,
      total_count: total,
      success_count: success_count,
      error_count: error_count
    }
    
    console.log('✅ 任务进度已更新:', runningTasks.value[taskIndex])
    
    // 强制触发响应式更新
    runningTasks.value = [...runningTasks.value]
    
    // 调试：检查 allTasks 是否更新
    console.log('🔍 强制更新后，runningTasks 长度:', runningTasks.value.length)
    console.log('🔍 强制更新后，allTasks 计算属性应该重新计算')
    
    // 手动触发 nextTick 确保 DOM 更新
    nextTick(() => {
      console.log('🔄 nextTick 后，检查 allTasks 是否已更新')
    })
  } else {
    console.log('⚠️ 未找到任务:', task_id, '当前运行中任务:', runningTasks.value)
  }
  
  // 如果进度达到100%，自动刷新任务状态
  if (progress >= 100) {
    setTimeout(() => {
      refreshRunningTasks()
      refreshTaskHistory()
    }, 1000)
  }
}

// 任务日志辅助：将事件写入任务详情对话框日志
const appendTaskLog = (payload: { task_id?: string; message?: string; level?: 'info'|'success'|'warning'|'error' }) => {
  const taskId = payload.task_id
  if (!selectedTask.value || !taskDetailVisible.value || !taskId) return
  const currentId = selectedTask.value.id || selectedTask.value.task_id
  if (currentId !== taskId) return
  taskLogs.value.push({
    id: Date.now(),
    timestamp: new Date(),
    level: payload.level || 'info',
    message: payload.message || ''
  })
}

const refreshTaskHistory = async () => {
  try {
    const response = await unifiedHttpClient.dataCollection.getHistory({
      page: currentPage.value,
      limit: pageSize.value
    })
    
    if (response.data) {
      taskHistory.value = response.data.tasks || []
      totalTasks.value = response.data.total || 0
    }
    console.log('📋 Task history updated:', response.data)
  } catch (error) {
    console.error('Failed to fetch task history:', error)
    // 如果API调用失败，使用本地数据
    const allTasks = realtimeDataService.getTaskHistory()
    const dataCollectionTasks = allTasks.filter(task => task.type === 'data_collection')
    const startIndex = (currentPage.value - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value
    taskHistory.value = dataCollectionTasks.slice(startIndex, endIndex) as any[]
    totalTasks.value = dataCollectionTasks.length
  }
}

const startDataCollection = async (params: {
  data_source: string
  data_type: string
  stock_codes?: string[]
  start_date?: string
  end_date?: string
}) => {
  try {
    loading.value = true
    const response = await unifiedHttpClient.dataCollection.startCollection(params)
    
    if (response.data) {
      ElMessage.success(`数据采集任务已启动: ${response.data.id}`)
      // 刷新任务列表
      await Promise.all([
        refreshRunningTasks(),
        refreshTaskHistory()
      ])
    }
  } catch (error) {
    console.error('Failed to start data collection:', error)
    ElMessage.error('启动数据采集失败')
  } finally {
    loading.value = false
  }
}

const stopDataCollection = async (taskId: string) => {
  try {
    await ElMessageBox.confirm('确定要停止这个数据采集任务吗？', '确认停止', {
      type: 'warning'
    })
    
    await unifiedHttpClient.dataCollection.stopCollection(taskId)
    ElMessage.success('数据采集任务已停止')
    
    // 刷新任务列表
    await refreshRunningTasks()
    
    // 手动重置收集状态，确保UI更新
    isCollecting.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to stop data collection:', error)
      ElMessage.error('停止数据采集失败')
    }
  }
}

const calculateScores = async () => {
  try {
    loading.value = true
    await unifiedHttpClient.dataCollection.calculateScores()
    ElMessage.success('股票评分计算已启动')
    
    // 刷新统计数据
    await refreshDatabaseStats()
  } catch (error) {
    console.error('Failed to calculate scores:', error)
    ElMessage.error('股票评分计算失败')
  } finally {
    loading.value = false
  }
}

const showNewTaskDialog = () => {
  // 重置表单
  Object.assign(newTaskForm, {
    data_source: 'akshare',
    data_type: 'daily_data',
    stock_codes: [],
    start_date: '',
    end_date: '',
    visible: true
  })
}

const submitNewTask = async () => {
  try {
    const params = {
      data_source: newTaskForm.data_source,
      data_type: newTaskForm.data_type,
      ...(newTaskForm.stock_codes.length > 0 && { stock_codes: newTaskForm.stock_codes }),
      ...(newTaskForm.start_date && { start_date: newTaskForm.start_date }),
      ...(newTaskForm.end_date && { end_date: newTaskForm.end_date })
    }
    
    await startDataCollection(params)
    newTaskForm.visible = false
  } catch (error) {
    console.error('Failed to submit new task:', error)
  }
}

const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'primary'
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'paused': return 'warning'
    default: return 'info'
  }
}

const getTaskStatusText = (status: string) => {
  switch (status) {
    case 'running': return '运行中'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'paused': return '已暂停'
    case 'pending': return '等待中'
    default: return status
  }
}

const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return '--'
  return new Date(dateTime).toLocaleString()
}

const formatDuration = (startTime?: string, endTime?: string) => {
  if (!startTime) return '--'
  
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
  
  if (duration < 60) return `${duration}秒`
  if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`
  return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分`
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  refreshTaskHistory()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  refreshTaskHistory()
}

// 设置WebSocket事件监听
const setupWebSocketListeners = () => {
  // 监听数据采集相关事件
  const unsubscribe = websocketEventBus.subscribe({
    id: 'data_management_subscriber',
    namespace: '/data_collection',
    handler: (event) => {
      // 全面记录所有 WebSocket 事件
      console.log('🔌 [WebSocket] 收到数据采集事件:', {
        event: event.event,
        data: event.data,
        timestamp: new Date().toISOString(),
        eventType: typeof event.event,
        dataType: typeof event.data,
        fullEvent: event
      })
      
      // 根据事件类型更新UI
      switch (event.event) {
        // 任务生命周期事件
        case 'task_started':
          console.log('🚀 [WebSocket] 任务开始:', event.data)
          console.log('📝 [WebSocket] 设置 isCollecting = true')
          isCollecting.value = true
          // 使用实时数据服务的更新，不触发HTTP刷新
          appendTaskLog({ task_id: event.data?.task_id || event.data?.task?.id, level: 'info', message: event.data?.message || '任务开始' })
          break
          
        case 'task_progress':
          console.log('📊 [WebSocket] 任务进度更新:', event.data)
          // 使用实时数据服务的更新，不触发HTTP刷新
          appendTaskLog({ task_id: event.data?.task?.id || event.data?.task_id, level: 'info', message: event.data?.task?.message || event.data?.message })
          break
          
        case 'task_completed':
          console.log('✅ [WebSocket] 任务完成:', event.data)
          console.log('📝 [WebSocket] 设置 isCollecting = false')
          isCollecting.value = false
          console.log('🔄 [WebSocket] 调用 refreshRunningTasks()')
          refreshRunningTasks()
          console.log('🔄 [WebSocket] 调用 refreshTaskHistory()')
          refreshTaskHistory()
          console.log('🔄 [WebSocket] 调用 refreshDatabaseStats()')
          refreshDatabaseStats()
          appendTaskLog({ task_id: event.data?.task_id || event.data?.task?.id, level: 'success', message: '任务完成' })
          break
          
        case 'task_failed':
          console.log('❌ [WebSocket] 任务失败:', event.data)
          console.log('📝 [WebSocket] 设置 isCollecting = false')
          isCollecting.value = false
          console.log('🔄 [WebSocket] 调用 refreshRunningTasks()')
          refreshRunningTasks()
          console.log('🔄 [WebSocket] 调用 refreshTaskHistory()')
          refreshTaskHistory()
          console.log('🔄 [WebSocket] 调用 refreshDatabaseStats()')
          refreshDatabaseStats()
          appendTaskLog({ task_id: event.data?.task_id || event.data?.task?.id, level: 'error', message: event.data?.error || event.data?.message || '任务失败' })
          break
          
        // 详细进度事件
        case 'task_progress_detailed':
          console.log('📈 [WebSocket] 详细进度:', event.data)
          console.log('🔄 [WebSocket] 调用 updateTaskDetailedProgress()')
          // 更新特定任务的详细进度
          updateTaskDetailedProgress(event.data)
          appendTaskLog({ task_id: event.data?.task_id, level: 'info', message: event.data?.message })
          break
          
        // 阶段/更新类事件写日志
        case 'task_phase_start':
        case 'task_phase_complete':
        case 'task_fetching':
        case 'task_no_data':
          appendTaskLog({ task_id: event.data?.task_id, level: 'info', message: event.data?.message })
          break
        case 'task_pe_pb_updated':
        case 'task_financial_updated':
        case 'task_technical_updated':
        case 'task_fund_flow_updated':
        case 'task_institute_hold_updated':
        case 'task_analyst_rating_updated':
        case 'task_data_updated':
        case 'task_news_found':
          appendTaskLog({ task_id: event.data?.task_id, level: 'success', message: event.data?.message })
          break
          
        // 兼容旧的事件名称
        case 'collection_started':
          console.log('🚀 [WebSocket] 数据采集开始 (兼容):', event.data)
          console.log('📝 [WebSocket] 设置 isCollecting = true')
          isCollecting.value = true
          // 使用实时数据服务的更新，不触发HTTP刷新
          appendTaskLog({ task_id: event.data?.task_id, level: 'info', message: event.data?.message || '任务开始' })
          break
          
        case 'collection_progress':
          console.log('📊 [WebSocket] 数据采集进度 (兼容):', event.data)
          // 使用实时数据服务的更新，不触发HTTP刷新
          appendTaskLog({ task_id: event.data?.task_id, level: 'info', message: event.data?.message })
          break
          
        case 'collection_completed':
          console.log('✅ [WebSocket] 数据采集完成 (兼容):', event.data)
          console.log('📝 [WebSocket] 设置 isCollecting = false')
          isCollecting.value = false
          console.log('🔄 [WebSocket] 调用 refreshRunningTasks()')
          refreshRunningTasks()
          console.log('🔄 [WebSocket] 调用 refreshTaskHistory()')
          refreshTaskHistory()
          console.log('🔄 [WebSocket] 调用 refreshDatabaseStats()')
          refreshDatabaseStats()
          appendTaskLog({ task_id: event.data?.task_id, level: 'success', message: event.data?.message || '任务完成' })
          break
          
        case 'collection_error':
          console.log('❌ [WebSocket] 数据采集错误 (兼容):', event.data)
          console.log('📝 [WebSocket] 设置 isCollecting = false')
          isCollecting.value = false
          console.log('🔄 [WebSocket] 调用 refreshRunningTasks()')
          refreshRunningTasks()
          console.log('🔄 [WebSocket] 调用 refreshTaskHistory()')
          refreshTaskHistory()
          console.log('🔄 [WebSocket] 调用 refreshDatabaseStats()')
          refreshDatabaseStats()
          appendTaskLog({ task_id: event.data?.task_id, level: 'error', message: event.data?.message || '任务失败' })
          break
          
        default:
          console.log('🔍 未处理的事件类型:', event.event, event.data)
          break
      }
    }
  })
  
  // 添加全局事件监听器，专门监听 task_progress_detailed 事件
  const globalUnsubscribe = websocketEventBus.subscribe({
    id: 'data_management_global_subscriber',
    namespace: '/', // 全局命名空间
    handler: (event) => {
      // 专门处理 task_progress_detailed 事件
      if (event.event === 'task_progress_detailed') {
        console.log('🌍 [WebSocket] 全局接收到 task_progress_detailed 事件:', {
          event: event.event,
          data: event.data,
          timestamp: new Date().toISOString(),
          namespace: event.namespace || 'global'
        })
        
        console.log('🔄 [WebSocket] 调用 updateTaskDetailedProgress()')
        updateTaskDetailedProgress(event.data)
      }
    }
  })
  
  // 返回两个取消订阅函数的组合
  return () => {
    unsubscribe()
    globalUnsubscribe()
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 Initializing Data Management View...')
  
  // 设置WebSocket监听
  const unsubscribe = setupWebSocketListeners()

  // 订阅实时数据服务，直接驱动运行中任务列表（WS优先）
  const offRealtime = realtimeDataService.subscribe(tasks => {
    const dataCollectionTasks = tasks.filter(t => t.type === 'data_collection' || true)
    // 只映射必要字段到运行中任务结构
    runningTasks.value = dataCollectionTasks.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status,
      progress: t.progress,
      message: t.message,
      start_time: t.start_time,
      end_time: t.end_time,
      // 这些字段可能由详细进度事件补全
      current_count: (t as any).current_count,
      total_count: (t as any).total_count,
      success_count: (t as any).success_count,
      error_count: (t as any).error_count
    })) as any
  })
  
  // 初始加载数据
  loading.value = true
  try {
    await Promise.all([
      refreshDatabaseStats(),
      refreshRunningTasks(),
      refreshTaskHistory()
    ])
    console.log('✅ Data Management View initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Data Management View:', error)
  } finally {
    loading.value = false
  }
  
  // 清理函数
  onUnmounted(() => {
    unsubscribe()
    offRealtime()
  })
})

// 添加缺失的方法
const refreshTasks = () => {
  refreshRunningTasks()
  refreshTaskHistory()
}

const handleQuickCollect = async (taskType: string) => {
  try {
    console.log('快速采集:', taskType)
    
    // 根据任务类型设置默认参数
    let params: any = {
      data_source: 'akshare',
      data_type: taskType,
      start_date: new Date().toISOString().split('T')[0], // 今天
      end_date: new Date().toISOString().split('T')[0]   // 今天
    }
    
    // 特殊处理某些数据类型
    if (taskType === 'daily_data') {
      // 日线数据：获取最近5个交易日
      const today = new Date()
      const daysToSubtract = 5
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - daysToSubtract)
      params.start_date = startDate.toISOString().split('T')[0]
    }
    
    await startDataCollection(params)
    ElMessage.success(`已启动${taskType}数据采集`)
    isCollecting.value = true
    
    // 刷新任务列表
    await refreshRunningTasks()
  } catch (error) {
    console.error('快速采集失败:', error)
    ElMessage.error('快速采集失败')
  }
}

const handleCustomCollect = async (config: any) => {
  try {
    console.log('自定义采集:', config)
    
    const params = {
      data_source: config.data_source || 'akshare',
      data_type: config.data_type || 'daily_data',
      stock_codes: config.stock_codes || [],
      start_date: config.start_date || new Date().toISOString().split('T')[0],
      end_date: config.end_date || new Date().toISOString().split('T')[0]
    }
    
    await startDataCollection(params)
    ElMessage.success('已启动自定义数据采集')
    isCollecting.value = true
    
    // 刷新任务列表
    await refreshRunningTasks()
  } catch (error) {
    console.error('自定义采集失败:', error)
    ElMessage.error('自定义采集失败')
  }
}

const handleBatchOperation = async (operation: string, items: any[]) => {
  try {
    console.log('批量操作:', operation, items)
    
    if (operation === 'delete') {
      // 批量删除任务
      await ElMessageBox.confirm(`确定要删除选中的 ${items.length} 个任务吗？`, '确认删除', {
        type: 'warning'
      })
      
      // 这里可以调用批量删除API
      // await unifiedHttpClient.dataCollection.batchDelete(items.map(item => item.id))
      
      ElMessage.success(`已删除 ${items.length} 个任务`)
      await refreshTaskHistory()
    } else if (operation === 'stop') {
      // 批量停止任务
      await ElMessageBox.confirm(`确定要停止选中的 ${items.length} 个运行中任务吗？`, '确认停止', {
        type: 'warning'
      })
      
      // 批量停止任务
      for (const item of items) {
        if (item.status === 'running') {
          await unifiedHttpClient.dataCollection.stopCollection(item.id)
        }
      }
      
      ElMessage.success(`已停止 ${items.length} 个任务`)
      await refreshRunningTasks()
      
      // 批量停止后重置收集状态
      isCollecting.value = false
    } else if (operation === 'retry') {
      // 批量重试失败的任务
      const failedTasks = items.filter(item => item.status === 'failed')
      if (failedTasks.length === 0) {
        ElMessage.warning('没有失败的任务需要重试')
        return
      }
      
      await ElMessageBox.confirm(`确定要重试选中的 ${failedTasks.length} 个失败任务吗？`, '确认重试', {
        type: 'warning'
      })
      
      // 这里可以调用批量重试API
      // await unifiedHttpClient.dataCollection.batchRetry(failedTasks.map(item => item.id))
      
      ElMessage.success(`已重试 ${failedTasks.length} 个任务`)
      await refreshTaskHistory()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量操作失败:', error)
      ElMessage.error('批量操作失败')
    }
  }
}

const pauseTask = async (taskId: string) => {
  try {
    // 检查后端是否支持暂停功能
    // 目前数据收集模块可能不支持暂停，使用停止代替
    await ElMessageBox.confirm('数据收集任务不支持暂停，是否要停止任务？', '确认操作', {
      type: 'warning'
    })
    
    await unifiedHttpClient.dataCollection.stopCollection(taskId)
    ElMessage.success('任务已停止')
    
    // 刷新任务列表
    await refreshRunningTasks()
    
    // 停止任务后重置收集状态
    isCollecting.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('暂停任务失败:', error)
      ElMessage.error('暂停任务失败')
    }
  }
}

const resumeTask = async (taskId: string) => {
  try {
    // 数据收集任务不支持恢复，提示用户重新启动
    ElMessage.warning('数据收集任务不支持恢复，请重新启动任务')
    
    // 可以尝试重新启动任务
    // 这里需要获取原任务的配置信息
    const taskDetail = await unifiedHttpClient.dataCollection.getTaskDetail(taskId)
    if (taskDetail.data) {
      const task = taskDetail.data
      const params = {
        data_source: task.data_source,
        data_type: task.data_type,
        stock_codes: task.stock_codes || [],
        start_date: task.start_date,
        end_date: task.end_date
      }
      
      await startDataCollection(params)
      ElMessage.success('已重新启动任务')
      await refreshRunningTasks()
    }
  } catch (error) {
    console.error('恢复任务失败:', error)
    ElMessage.error('恢复任务失败')
  }
}

const cancelTask = async (taskId: string) => {
  try {
    await ElMessageBox.confirm('确定要取消这个任务吗？', '确认取消', {
      type: 'warning'
    })
    
    // 数据收集任务使用停止功能
    await unifiedHttpClient.dataCollection.stopCollection(taskId)
    ElMessage.success('任务已取消')
    
    // 刷新任务列表
    await refreshRunningTasks()
    
    // 取消任务后重置收集状态
    isCollecting.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消任务失败:', error)
      ElMessage.error('取消任务失败')
    }
  }
}

const viewTaskDetail = async (task: any) => {
  try {
    selectedTask.value = task
    taskDetailVisible.value = true
    
    // 获取任务详情和日志
    if (task.id) {
      const taskDetail = await unifiedHttpClient.dataCollection.getTaskDetail(task.id)
      if (taskDetail.data) {
        selectedTask.value = { ...task, ...taskDetail.data }
      }
      
      // 模拟加载任务日志（实际应该从后端获取）
      taskLogs.value = [
        { id: 1, timestamp: new Date(task.start_time || task.startTime), level: 'info', message: '任务开始执行' },
        { id: 2, timestamp: new Date(), level: 'info', message: '正在处理数据...' },
        { id: 3, timestamp: new Date(), level: 'info', message: `当前进度: ${task.progress}%` }
      ]
      
      // 如果任务已完成，添加完成日志
      if (task.status === 'completed') {
        taskLogs.value.push({
          id: 4,
          timestamp: new Date(task.end_time || new Date()),
          level: 'info',
          message: '任务执行完成'
        })
      } else if (task.status === 'failed') {
        taskLogs.value.push({
          id: 4,
          timestamp: new Date(task.end_time || new Date()),
          level: 'error',
          message: `任务执行失败: ${task.error_message || '未知错误'}`
        })
      }
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
    ElMessage.error('获取任务详情失败')
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'running': return 'success'
    case 'paused': return 'warning'
    case 'completed': return 'success'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'running': return '运行中'
    case 'paused': return '已暂停'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'pending': return '等待中'
    default: return '未知'
  }
}

const formatTime = (time: string | Date) => {
  if (!time) return '--'
  return new Date(time).toLocaleString('zh-CN')
}

const getEstimatedTime = (task: any) => {
  if (!task || !task.progress) return '--'
  if (task.progress >= 100) return '已完成'
  
  // 简单估算剩余时间
  const elapsed = Date.now() - new Date(task.startTime || task.start_time).getTime()
  const estimated = (elapsed / task.progress) * (100 - task.progress)
  const minutes = Math.round(estimated / 60000)
  
  if (minutes < 1) return '即将完成'
  if (minutes < 60) return `约${minutes}分钟`
  return `约${Math.round(minutes / 60)}小时`
}
</script>

<style lang="scss" scoped>
.unified-data-management {
  padding: 20px;
  min-height: calc(100vh - 70px); // 确保最小高度
  overflow-y: auto; // 允许垂直滚动
  
  .page-header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 28px;
    }
    
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }
  
  .task-detail {
    .task-logs {
      h4 {
        margin: 0 0 12px 0;
        color: #303133;
      }
      
      .log-content {
        background: #f8f9fa;
        border-radius: 4px;
        padding: 12px;
        font-family: 'Courier New', monospace;
        
        .log-item {
          display: flex;
          margin-bottom: 4px;
          font-size: 12px;
          
          .log-time {
            color: #909399;
            margin-right: 8px;
            min-width: 120px;
          }
          
          .log-level {
            margin-right: 8px;
            min-width: 50px;
            font-weight: bold;
            
            &.info {
              color: #409eff;
            }
            
            &.warn {
              color: #e6a23c;
            }
            
            &.error {
              color: #f56c6c;
            }
          }
          
          .log-message {
            color: #303133;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .unified-data-management {
    padding: 12px;
  }
}
</style> 