<template>
  <el-card class="ps-card">
    <template #header>
      <div class="ps-header">
        <span>相似K线</span>
        <div class="actions">
          <el-button size="small" @click="$emit('clearOverlays')">清除叠加</el-button>
        </div>
      </div>
    </template>

    <!-- 进度/概要 -->
    <div class="ps-progress">
      <div class="row">
        <span class="label">阶段</span>
        <el-tag :type="stageTagType" size="small">{{ stageLabel }}</el-tag>
      </div>
      <el-progress :percentage="Number(progress.progress) || 0" :status="progress.stage==='FAILED' ? 'exception' : undefined" />
      <div class="meta">
        <span>目标股票：{{ progress.stock || progress.currentStock || '-' }}</span>
        <span>窗口长度(日)：{{ progress.windowLength || '-' }}</span>
        <span>候选Top-N：{{ progress.topN || '-' }}</span>
        <span v-if="progress.candidates">候选集：{{ progress.candidates }}</span>
        <span v-if="progress.scanned && progress.total">扫描进度：{{ progress.scanned }}/{{ progress.total }}</span>
        <span v-if="progress.stockIndex && progress.totalStocks">股票进度：{{ progress.stockIndex }}/{{ progress.totalStocks }}</span>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 左：Top-N 匹配列表 -->
      <el-col :span="14">
        <el-table v-if="matches.length" :data="matches" height="340" size="small" @row-click="handleRowClick">
          <el-table-column prop="rank" label="#" width="48" />
          <el-table-column prop="stock" label="股票代码" width="110" />
          <el-table-column label="匹配区间" min-width="180">
            <template #default="{ row }">{{ row.start }} 至 {{ row.end }}</template>
          </el-table-column>
          <el-table-column label="相似度" width="90">
            <template #header>
              <span>相似度</span>
              <el-tooltip content="综合评分（相关性/波动/权重等）" placement="top">
                <el-icon style="margin-left:4px; color:#909399"><i class="el-icon-info"></i></el-icon>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ Number(row.score).toFixed(3) }}</template>
          </el-table-column>
          <el-table-column label="5日" width="80">
            <template #default="{ row }"><el-tag size="small" :type="retTagType(row.futureReturns?.['5d'])">{{ fmtPct(row.futureReturns?.['5d']) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="10日" width="80">
            <template #default="{ row }"><el-tag size="small" :type="retTagType(row.futureReturns?.['10d'])">{{ fmtPct(row.futureReturns?.['10d']) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="20日" width="80">
            <template #default="{ row }"><el-tag size="small" :type="retTagType(row.futureReturns?.['20d'])">{{ fmtPct(row.futureReturns?.['20d']) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="60日" width="80">
            <template #default="{ row }"><el-tag size="small" :type="retTagType(row.futureReturns?.['60d'])">{{ fmtPct(row.futureReturns?.['60d']) }}</el-tag></template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无匹配结果，等待任务完成或调整参数后重试" />
      </el-col>

      <!-- 右：Top-N 汇总统计 -->
      <el-col :span="10">
        <div class="agg">
          <div class="title">样本总体未来收益统计（Top-N）</div>
          <div class="hint">P25/P50/P75 为分位数，Mean 为样本均值</div>
          <div v-for="h in horizons" :key="h" class="agg-row">
            <div class="h">{{ h }}日</div>
            <div class="vals">
              <el-tag size="small" type="info">P25: {{ fmtPct(aggregate?.percentiles?.[h]?.p25) }}</el-tag>
              <el-tag size="small" type="primary">P50: {{ fmtPct(aggregate?.percentiles?.[h]?.p50) }}</el-tag>
              <el-tag size="small" type="success">P75: {{ fmtPct(aggregate?.percentiles?.[h]?.p75) }}</el-tag>
              <el-tag size="small">Mean: {{ fmtPct(aggregate?.percentiles?.[h]?.mean) }}</el-tag>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { unifiedWebSocketManager } from '../../utils/unifiedWebSocketManager'

const props = defineProps<{ runId?: string }>()
const emit = defineEmits<{ (e: 'overlay', line: { id: string; data: { time: string; value: number }[]; color?: string }): void; (e: 'clearOverlays'): void }>()

const progress = ref<any>({})
const matches = ref<any[]>([])
const aggregate = ref<any>(null)
const horizons = ref<number[]>([5, 10, 20, 60])

const stageLabel = computed(() => {
  const map: Record<string, string> = {
    INIT: '初始化',
    STARTED: '开始',
    RECALLING: '候选召回',
    RERANKING: '重排序',
    AGGREGATING: '统计汇总',
    FINISHED: '完成',
    FAILED: '失败'
  }
  return map[progress.value?.stage] || '-'
})
const stageTagType = computed(() => {
  switch (progress.value?.stage) {
    case 'FINISHED': return 'success'
    case 'FAILED': return 'danger'
    case 'RECALLING':
    case 'RERANKING':
    case 'AGGREGATING': return 'warning'
    default: return ''
  }
})

const fmtPct = (v?: number | null) => (typeof v === 'number' ? (v * 100).toFixed(2) + '%' : '--')
const retTagType = (v?: number | null) => {
  if (typeof v !== 'number') return ''
  if (v > 0.005) return 'success'
  if (v < -0.005) return 'danger'
  return 'info'
}

function handleRowClick(row: any) {
  // 叠加相对价格线（若后端返回 pathRef 可据此请求真实路径）
  const id = `ps_${row.stock}_${row.start}_${row.end}`
  if (!row || !row.pathRef) {
    ElMessage.info('已选中匹配区间，等待后端提供历史路径以在图表上叠加')
    emit('overlay', { id, data: [], color: '#A020F0' })
    return
  }
  emit('overlay', { id, data: [], color: '#A020F0' })
}

onMounted(() => {
  const ns = '/backtest'
  unifiedWebSocketManager.connect(ns).catch(() => {})
  unifiedWebSocketManager.on(ns, 'pattern_similarity_progress', (data: any) => {
    progress.value = { ...progress.value, ...data }
  })
  unifiedWebSocketManager.on(ns, 'pattern_similarity_result', (data: any) => {
    matches.value = (data?.matches || []).map((m: any, i: number) => ({ rank: i + 1, ...m }))
    aggregate.value = data?.aggregate || null
  })
})
</script>

<style scoped>
.ps-card { margin-top: 16px; }
.ps-header { display: flex; justify-content: space-between; align-items: center; }
.ps-progress { margin-bottom: 12px; }
.ps-progress .row { margin-bottom: 6px; display: flex; gap: 8px; align-items: center; }
.ps-progress .label { color: #909399; font-size: 12px; }
.ps-progress .meta { margin-top: 6px; display: flex; gap: 12px; color: #606266; font-size: 12px; flex-wrap: wrap; }
.agg .title { font-weight: 600; margin-bottom: 6px; }
.agg .hint { color: #909399; font-size: 12px; margin-bottom: 10px; }
.agg-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.agg-row .h { width: 48px; color: #606266; }
.agg-row .vals { display: flex; gap: 6px; flex-wrap: wrap; }
</style> 