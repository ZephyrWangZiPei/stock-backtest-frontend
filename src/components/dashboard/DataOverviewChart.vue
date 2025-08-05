<template>
  <el-card class="chart-card">
    <template #header>
      <div class="card-header">
        <span>数据库综合概览</span>
        <el-button @click="$emit('refresh')" size="small" type="primary">
          刷新数据
        </el-button>
      </div>
    </template>
    <div class="chart-container">
      <div ref="chartRef" class="chart"></div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

// Props
interface Props {
  dataStatus: Record<string, any>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  refresh: []
}>()

// Refs
const chartRef = ref<HTMLElement>()

// 更新图表
const updateChart = async () => {
  await nextTick()

  if (chartRef.value) {
    const databaseStats = [
      // 基础数据统计
      { name: '股票总数', value: parseInt(props.dataStatus.totalStocks) || 0, color: '#67c23a', unit: '只', group: '基础数据' },
      { name: '日线数据', value: parseInt(props.dataStatus.stocksWithDailyData) || 0, color: '#409eff', unit: '只', group: '基础数据' },
      { name: '资金流向', value: parseInt(props.dataStatus.stocksWithFundFlow) || 0, color: '#e6a23c', unit: '只', group: '基础数据' },
      { name: '机构持股', value: parseInt(props.dataStatus.stocksWithInstituteHold) || 0, color: '#f56c6c', unit: '只', group: '基础数据' },
      { name: '分析师评级', value: parseInt(props.dataStatus.stocksWithAnalystRating) || 0, color: '#909399', unit: '只', group: '基础数据' },
      { name: '股票评分', value: parseInt(props.dataStatus.stocksWithScore) || 0, color: '#9c27b0', unit: '只', group: '基础数据' },

      // 策略统计
      { name: '策略总数', value: parseInt(props.dataStatus.totalStrategies) || 0, color: '#ff9800', unit: '个', group: '策略统计' },
      { name: '候选股票', value: parseInt(props.dataStatus.totalCandidates) || 0, color: '#607d8b', unit: '只', group: '策略统计' },

      // 今日数据更新
      { name: '今日日线', value: parseInt(props.dataStatus.todayDailyCount) || 0, color: '#4caf50', unit: '条', group: '今日更新' },
      { name: '今日资金流向', value: parseInt(props.dataStatus.todayFundFlowCount) || 0, color: '#8bc34a', unit: '条', group: '今日更新' },
      { name: '今日分析师评级', value: parseInt(props.dataStatus.todayAnalystRatingCount) || 0, color: '#cddc39', unit: '条', group: '今日更新' }
    ]

    // 按分组组织数据
    const groupedStats = {
      '基础数据': databaseStats.filter(item => item.group === '基础数据'),
      '策略统计': databaseStats.filter(item => item.group === '策略统计'),
      '今日更新': databaseStats.filter(item => item.group === '今日更新')
    }

    chartRef.value.innerHTML = `
      <div style="padding: 20px; height: 100%; overflow-y: auto;">
        ${Object.entries(groupedStats).map(([groupName, items]) => `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: #e4e7ed; margin-bottom: 10px; padding-left: 5px; border-left: 3px solid #409eff;">
              ${groupName}
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
              ${items.map(item => `
                <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid ${item.color}; min-height: 70px; display: flex; flex-direction: column; justify-content: center;">
                  <div style="font-size: 16px; font-weight: bold; color: ${item.color}; margin-bottom: 4px;">
                    ${item.value.toLocaleString()}${item.unit}
                  </div>
                  <div style="font-size: 10px; color: #909399; line-height: 1.2;">
                    ${item.name}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #909399;">
          数据库总览 - 最后更新: ${new Date().toLocaleString('zh-CN')}
        </div>
      </div>
    `
  }
}

// 监听数据变化
watch(() => props.dataStatus, updateChart, { deep: true })

// 初始化
updateChart()
</script>

<style scoped>
.chart-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 400px;
  overflow: hidden;
}

.chart {
  width: 100%;
  height: 100%;
}
</style> 
