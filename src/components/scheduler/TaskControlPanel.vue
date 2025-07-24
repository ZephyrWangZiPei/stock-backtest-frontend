<template>
  <div class="task-control-panel">
    <el-card class="border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl">
      <template #header>
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 bg-blue-400 rounded-md animate-pulse"></div>
          <span class="font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            任务控制
          </span>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 数据更新任务组 -->
        <TaskGroup title="数据更新" icon="fas fa-database">
          <TaskControlItem
            title="智能数据更新"
            description="智能更新每日股票数据"
            icon="fas fa-brain"
            color="green"
            :loading="loadingStates.smartData"
            @click="handleSmartUpdateDailyData"
          />
          
          <TaskControlItem
            title="股票基础信息"
            description="更新股票代码、名称、状态等基础信息"
            icon="fas fa-list"
            color="orange"
            :loading="loadingStates.stockBasicInfo"
            @click="handleUpdateStockBasicInfo"
          />
          
          <TaskControlItem
            title="股票详细信息"
            description="补充股票行业、板块、概念等详细信息"
            icon="fas fa-info-circle"
            color="blue"
            :loading="loadingStates.stockDetails"
            @click="handleUpdateStockDetails"
          />
          
          <TaskControlItem
            title="基本面数据"
            description="补充股票PE、PB、市值等估值数据"
            icon="fas fa-chart-line"
            color="purple"
            :loading="loadingStates.stockFundamentals"
            @click="handleUpdateStockFundamentals"
          />
        </TaskGroup>
        
        <!-- 资金面数据任务组 -->
        <TaskGroup title="资金面数据" icon="fas fa-money-bill-wave">
          <TaskControlItem
            title="资金流向数据"
            description="收集个股资金流向数据（主力、散户、大单等）"
            icon="fas fa-chart-area"
            color="cyan"
            :loading="loadingStates.fundFlowData"
            @click="handleCollectFundFlowData"
          />
          
          <TaskControlItem
            title="机构持股数据"
            description="收集多个报告期的机构持股历史数据"
            icon="fas fa-building"
            color="blue"
            :loading="loadingStates.multiPeriodInstituteHoldData"
            @click="handleCollectMultiPeriodInstituteHoldData"
          />
        </TaskGroup>
        
        <!-- 情绪面数据任务组 -->
        <TaskGroup title="情绪面数据" icon="fas fa-smile">
          <TaskControlItem
            title="分析师评级"
            description="收集分析师评级数据（评级、目标价、情绪评分等）"
            icon="fas fa-star"
            color="orange"
            :loading="loadingStates.analystRatingData"
            @click="handleCollectAnalystRatingData"
          />
        </TaskGroup>

        <!-- 分析任务组 -->
        <TaskGroup title="数据分析" icon="fas fa-chart-bar">
          <TaskControlItem
            title="潜力股海选"
            description="筛选潜力股票"
            icon="fas fa-search"
            color="cyan"
            :loading="loadingStates.candidatePool"
            @click="handleCandidatePool"
          />
        </TaskGroup>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSchedulerStore } from '@/store/scheduler'
import TaskGroup from './TaskGroup.vue'
import TaskControlItem from './TaskControlItem.vue'

const store = useSchedulerStore()

// 根据任务状态计算加载状态
const loadingStates = computed(() => {
  const smartTask = store.taskStatus['update_daily_data_smart']
  const stockBasicInfoTask = store.taskStatus['update_stock_basic_info']
  const stockDetailsTask = store.taskStatus['update_stock_details']
  const stockFundamentalsTask = store.taskStatus['update_stock_fundamentals']
  const candidatePoolTask = store.taskStatus['candidate_pool']
  const fundFlowDataTask = store.taskStatus['collect_fund_flow_data']
  const multiPeriodInstituteHoldDataTask = store.taskStatus['collect_multi_period_institute_hold_data']
  const analystRatingDataTask = store.taskStatus['collect_analyst_rating_data']

  return {
    smartData: smartTask && smartTask.success === undefined && smartTask.current_date_progress !== undefined && smartTask.current_date_progress < 100,
    stockBasicInfo: stockBasicInfoTask && stockBasicInfoTask.success === undefined && stockBasicInfoTask.current_date_progress !== undefined && stockBasicInfoTask.current_date_progress < 100,
    stockDetails: stockDetailsTask && stockDetailsTask.success === undefined && stockDetailsTask.current_date_progress !== undefined && stockDetailsTask.current_date_progress < 100,
    stockFundamentals: stockFundamentalsTask && stockFundamentalsTask.success === undefined && stockFundamentalsTask.current_date_progress !== undefined && stockFundamentalsTask.current_date_progress < 100,
    candidatePool: candidatePoolTask && candidatePoolTask.success === undefined && candidatePoolTask.current_date_progress !== undefined && candidatePoolTask.current_date_progress < 100,
    fundFlowData: fundFlowDataTask && fundFlowDataTask.success === undefined && fundFlowDataTask.current_date_progress !== undefined && fundFlowDataTask.current_date_progress < 100,
    multiPeriodInstituteHoldData: multiPeriodInstituteHoldDataTask && multiPeriodInstituteHoldDataTask.success === undefined && multiPeriodInstituteHoldDataTask.current_date_progress !== undefined && multiPeriodInstituteHoldDataTask.current_date_progress < 100,
    analystRatingData: analystRatingDataTask && analystRatingDataTask.success === undefined && analystRatingDataTask.current_date_progress !== undefined && analystRatingDataTask.current_date_progress < 100
  }
})

// 任务处理函数
const handleSmartUpdateDailyData = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const smartTask = store.taskStatus['update_daily_data_smart']
  if (smartTask && smartTask.success === undefined) {
    ElMessage.warning('智能数据更新任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('manual_smart_update_daily_data', {})
  ElMessage.info('已发送智能数据更新请求')
}

const handleUpdateStockBasicInfo = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const stockBasicInfoTask = store.taskStatus['update_stock_basic_info']
  if (stockBasicInfoTask && stockBasicInfoTask.success === undefined) {
    ElMessage.warning('股票基础信息更新任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('manual_update_stock_basic_info', {})
  ElMessage.info('已发送股票基础信息更新请求')
}

const handleUpdateStockDetails = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const stockDetailsTask = store.taskStatus['update_stock_details']
  if (stockDetailsTask && stockDetailsTask.success === undefined) {
    ElMessage.warning('股票详细信息更新任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('manual_update_stock_details', {})
  ElMessage.info('已发送股票详细信息更新请求')
}

const handleUpdateStockFundamentals = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const stockFundamentalsTask = store.taskStatus['update_stock_fundamentals']
  if (stockFundamentalsTask && stockFundamentalsTask.success === undefined) {
    ElMessage.warning('股票基本面数据更新任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('manual_update_stock_fundamentals', {})
  ElMessage.info('已发送股票基本面数据更新请求')
}

const handleCandidatePool = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const candidatePoolTask = store.taskStatus['candidate_pool']
  if (candidatePoolTask && candidatePoolTask.success === undefined) {
    ElMessage.warning('潜力股海选任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('run_job_manually', { job_id: 'candidate_pool' })
  ElMessage.info('已发送潜力股海选请求')
}

const handleCollectFundFlowData = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const fundFlowDataTask = store.taskStatus['collect_fund_flow_data']
  if (fundFlowDataTask && fundFlowDataTask.success === undefined) {
    ElMessage.warning('资金流向数据收集任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('manual_collect_fund_flow_data', { days_back: 30 })
  ElMessage.info('已发送资金流向数据收集请求')
}

const handleCollectMultiPeriodInstituteHoldData = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const multiPeriodInstituteHoldDataTask = store.taskStatus['collect_multi_period_institute_hold_data']
  if (multiPeriodInstituteHoldDataTask && multiPeriodInstituteHoldDataTask.success === undefined) {
    ElMessage.warning('机构持股数据收集任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('manual_collect_multi_period_institute_hold_data', {})
  ElMessage.info('已发送机构持股数据收集请求')
}

const handleCollectAnalystRatingData = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。')
    return
  }

  const analystRatingDataTask = store.taskStatus['collect_analyst_rating_data']
  if (analystRatingDataTask && analystRatingDataTask.success === undefined) {
    ElMessage.warning('分析师评级数据收集任务正在运行中，请稍候...')
    return
  }

  store.socket.emit('manual_collect_analyst_rating_data', { days_back: 30 })
  ElMessage.info('已发送分析师评级数据收集请求')
}




</script>

<style scoped>
.task-control-panel {
  @apply w-full;
}

:deep(.el-card__body) {
  @apply overflow-auto;
}
</style> 