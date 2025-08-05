<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1 class="dashboard-title">📊 仪表板</h1>
      <p class="dashboard-subtitle">系统状态监控与数据总览</p>
    </div>

    <div class="dashboard-content">
      <!-- 核心指标卡片 -->
      <el-row :gutter="20" class="mb-6">
        <el-col :span="6">
          <StatCard
            :value="dataStatus.totalStocks || '--'"
            label="股票总数"
            icon="TrendCharts"
          />
        </el-col>
        <el-col :span="6">
          <StatCard
            :value="`${dataStatus.overallCompleteness || '--'}%`"
            label="综合完整度"
            icon="DataAnalysis"
          />
        </el-col>
        <el-col :span="6">
          <StatCard
            :value="dataStatus.totalCandidates || '--'"
            label="候选股票"
            icon="Star"
          />
        </el-col>
        <el-col :span="6">
          <StatCard
            :value="dataStatus.todayUpdated ? '今日已更新' : '今日未更新'"
            label="今日状态"
            icon="Refresh"
            :type="dataStatus.todayUpdated ? 'success' : 'danger'"
          />
        </el-col>
      </el-row>

      <!-- 数据库综合概览 -->
      <el-row :gutter="20" class="mb-6">
        <el-col :span="24">
          <DataOverviewChart
            :data-status="dataStatus"
            @refresh="refreshDataStatus"
          />
        </el-col>
      </el-row>

      <!-- 详细数据统计 -->
      <el-row :gutter="20" class="mb-6">
        <el-col :span="8">
          <DataDetailCard
            title="日线数据"
            :items="[
              { label: '覆盖率', value: `${dataStatus.dailyDataCoverage || '--'}%` },
              { label: '股票数', value: dataStatus.stocksWithDailyData || '--' },
              { label: '最后更新', value: dataStatus.lastDailyUpdate || '--' },
              { label: '今日数据', value: `${dataStatus.todayDailyCount || '--'}条` }
            ]"
          />
        </el-col>
        <el-col :span="8">
          <DataDetailCard
            title="资金流向数据"
            :items="[
              { label: '覆盖率', value: `${dataStatus.fundFlowCoverage || '--'}%` },
              { label: '股票数', value: dataStatus.stocksWithFundFlow || '--' },
              { label: '最后更新', value: dataStatus.lastFundFlowUpdate || '--' },
              { label: '今日数据', value: `${dataStatus.todayFundFlowCount || '--'}条` }
            ]"
          />
        </el-col>
        <el-col :span="8">
          <DataDetailCard
            title="机构持股数据"
            :items="[
              { label: '覆盖率', value: `${dataStatus.instituteHoldCoverage || '--'}%` },
              { label: '股票数', value: dataStatus.stocksWithInstituteHold || '--' },
              { label: '最后更新', value: dataStatus.lastInstituteHoldUpdate || '--' }
            ]"
          />
        </el-col>
      </el-row>

      <!-- 分析师评级和评分数据 -->
      <el-row :gutter="20" class="mb-6">
        <el-col :span="8">
          <DataDetailCard
            title="分析师评级数据"
            :items="[
              { label: '覆盖率', value: `${dataStatus.analystRatingCoverage || '--'}%` },
              { label: '股票数', value: dataStatus.stocksWithAnalystRating || '--' },
              { label: '最后更新', value: dataStatus.lastAnalystRatingUpdate || '--' },
              { label: '今日数据', value: `${dataStatus.todayAnalystRatingCount || '--'}条` }
            ]"
          />
        </el-col>
        <el-col :span="8">
          <DataDetailCard
            title="股票评分数据"
            :items="[
              { label: '覆盖率', value: `${dataStatus.scoreCoverage || '--'}%` },
              { label: '股票数', value: dataStatus.stocksWithScore || '--' },
              { label: '最后更新', value: dataStatus.lastScoreUpdate || '--' }
            ]"
          />
        </el-col>
      </el-row>

      <!-- 最近任务 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <RecentTasksTable
            :tasks="recentTasks"
            :loading="loading"
            @refresh="refreshTasks"
          />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataOverviewChart from '@/components/dashboard/DataOverviewChart.vue'
import DataDetailCard from '@/components/dashboard/DataDetailCard.vue'
import RecentTasksTable from '@/components/dashboard/RecentTasksTable.vue'
import { useDashboard } from '@/composables/useDashboard'
import { useWebSocket } from '@/composables/useWebSocket'

// 使用composables
const {
  loading,
  recentTasks,
  dataStatus,
  refreshDataStatus,
  refreshTasks,
  handleTaskUpdate
} = useDashboard()

const {
  addTaskEventListeners,
  removeTaskEventListeners
} = useWebSocket()

// 生命周期
onMounted(async () => {
  console.log('🚀 仪表盘组件挂载，初始化数据...')

  // 添加任务事件监听器
  addTaskEventListeners({
    taskUpdate: handleTaskUpdate
  })

  // 初始加载数据
  await Promise.all([
    refreshDataStatus(),
    refreshTasks()
  ])

  console.log('✅ 仪表盘初始化完成')
})

onUnmounted(() => {
  // 清理事件监听器
  removeTaskEventListeners({
    taskUpdate: handleTaskUpdate
  })
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
  text-align: center;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
}

.dashboard-subtitle {
  font-size: 1rem;
  color: #909399;
  margin: 0;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.mb-6 {
  margin-bottom: 20px;
}
</style> 