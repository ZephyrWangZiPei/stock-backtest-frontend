import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import unifiedHttpClient from '@/utils/unifiedHttpClient'

// 数据采集任务定义
export const dataCollectionTasks = ref([
  {
    id: 'basic_data',
    name: '基础数据采集',
    description: '采集股票基础信息，包括股票代码、名称、行业等',
    data_type: 'stock_basic',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'daily_data',
    name: '日线数据采集',
    description: '采集股票日线行情数据，包括开盘价、收盘价、成交量等',
    data_type: 'daily_data',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'news_data',
    name: '新闻数据采集',
    description: '采集股票相关新闻资讯数据',
    data_type: 'news_data',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'fundamental',
    name: '基本面数据采集',
    description: '采集股票基本面数据，包括财务指标等',
    data_type: 'fundamental',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'technical',
    name: '技术指标采集',
    description: '计算并采集股票技术指标数据',
    data_type: 'technical',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'fund_flow',
    name: '资金流向采集',
    description: '采集股票资金流向数据',
    data_type: 'fund_flow',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'institute_hold',
    name: '机构持股采集',
    description: '采集机构持股数据',
    data_type: 'institute_hold',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'analyst_rating',
    name: '分析师评级采集',
    description: '采集分析师评级数据',
    data_type: 'analyst_rating',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  },
  {
    id: 'stock_score',
    name: '股票评分计算',
    description: '计算股票综合评分',
    data_type: 'stock_score',
    progress: 0,
    status: 'idle',
    loading: false,
    message: ''
  }
])

export const useDataCollection = () => {
  const loading = ref(false)

  // 刷新任务列表
  const refreshTasks = async () => {
    try {
      loading.value = true
      const response = await unifiedHttpClient.dataCollection.getRunningTasks()
      // 更新现有任务的运行状态
      const runningTasks = response.data || []
      dataCollectionTasks.value.forEach(task => {
        const runningTask = runningTasks.find((rt: any) => rt.data_type === task.data_type)
        if (runningTask) {
          task.progress = runningTask.progress || 0
          task.status = runningTask.status || 'idle'
          task.loading = runningTask.status === 'running'
        } else {
          task.progress = 0
          task.status = 'idle'
          task.loading = false
        }
      })
      ElMessage.success('任务列表已刷新')
    } catch (error) {
      console.error('获取任务列表失败:', error)
      ElMessage.error('刷新任务列表失败')
    } finally {
      loading.value = false
    }
  }

  // 启动数据采集任务
  const startDataCollection = async (task: any) => {
    try {
      task.loading = true
      task.status = 'running'
      task.progress = 0
      
      // 根据数据类型选择合适的数据源和时间范围
      let dataSource = 'baostock' // 默认使用baostock
      let startDate = new Date().toISOString().split('T')[0]
      let endDate = new Date().toISOString().split('T')[0]
      
      if (['news_data', 'fund_flow', 'institute_hold', 'analyst_rating'].includes(task.data_type)) {
        dataSource = 'akshare' // 这些数据类型使用akshare
      }
      
      // 为日线数据采集设置更合理的时间范围（最近30天）
      if (task.data_type === 'daily_data') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        startDate = thirtyDaysAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      }
      
      const response = await unifiedHttpClient.dataCollection.startCollection({
        data_type: task.data_type,
        data_source: dataSource,
        stock_codes: [],
        start_date: startDate,
        end_date: endDate
      })
      
      if (response.data?.success) {
        ElMessage.success(`${task.name}已启动`)
      } else {
        task.status = 'idle'
        task.loading = false
        ElMessage.error(response.data?.message || `${task.name}启动失败`)
      }
    } catch (error) {
      console.error(`启动${task.name}失败:`, error)
      task.status = 'idle'
      task.loading = false
      ElMessage.error(`${task.name}启动失败`)
    }
  }

  // 处理任务更新
  const handleTaskUpdate = (data: any) => {
    console.log('🔔 收到WebSocket事件:', data)
    
    // 后端发送的数据格式可能为{task: {...}} 或直接是任务数据
    const taskData = data.task || data
    
    console.log('📊 处理任务数据:', taskData)
    
    // 根据数据类型更新对应的任务状态
    const task = dataCollectionTasks.value.find(t => t.data_type === taskData.data_type)
    if (task) {
      console.log('🔄 更新任务状态', taskData.data_type)
      
      // 更新任务状态
      task.progress = taskData.progress || 0
      task.status = taskData.status || 'idle'
      task.loading = taskData.status === 'running'
      task.message = taskData.message || ''
      
      // 根据事件类型进行特殊处理
      if (data.event_type === 'started') {
        task.status = 'running'
        task.loading = true
        task.progress = 0
        console.log('🚀 任务已启动', taskData.data_type)
      } else if (data.event_type === 'completed') {
        task.status = 'completed'
        task.loading = false
        task.progress = 100
        console.log('任务已完成', taskData.data_type)
      } else if (data.event_type === 'failed' || data.event_type === 'error') {
        task.status = 'failed'
        task.loading = false
        console.log('任务失败:', taskData.data_type)
      }
      
      console.log('📈 任务进度更新:', taskData.data_type, task.progress + '%')
    } else {
      console.warn('⚠️ 未找到对应的任务:', taskData.data_type)
    }
    
    console.log('任务状态已更新')
  }

  return {
    dataCollectionTasks,
    loading,
    refreshTasks,
    startDataCollection,
    handleTaskUpdate
  }
} 
