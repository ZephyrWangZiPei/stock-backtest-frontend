<template>
  <div class="ps-search">
    <el-row :gutter="16">
      <el-col :xs="24" :md="8">
        <el-card>
          <template #header><span>相似K线检索</span></template>
          <el-form label-width="96px" :model="form">
            <el-form-item label="股票代码">
              <el-select v-model="form.stock_code" filterable remote clearable default-first-option reserve-keyword placeholder="请选择股票" :remote-method="fetchStocks" :loading="stockLoading" style="width:100%">
                <el-option v-for="s in stockOptions" :key="s.code" :label="`${s.code} ${s.name || ''}`" :value="s.code" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间区间">
              <el-date-picker v-model="form.range" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item label="Top-N">
              <el-input-number v-model="form.top_n" :min="1" :max="100" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="runSearch">开始检索</el-button>
              <el-button @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
          <el-progress :percentage="progress" style="margin-top:8px" />

          <el-divider content-position="left">AI 融合预测</el-divider>
          <div style="display:flex; gap:8px; align-items:center;">
            <span>H:</span>
            <el-input-number v-model="aiHorizon" :min="1" :max="20" :step="1" size="small" />
            <el-button size="small" type="success" :loading="aiLoading" :disabled="!currentRunId" @click="startAIForecast">生成AI预测</el-button>
            <span v-if="aiConf !== null" style="color:#909399;font-size:12px;">conf={{ aiConf?.toFixed(2) }} ({{ aiSource }})</span>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="16">
        <el-card style="margin-bottom:12px;">
          <template #header>
            <span>价格K线与预测</span>
            <el-button text style="float:right; padding:0 4px;" @click="helpVisible=true">功能说明</el-button>
          </template>
          <SimilarityChart :kline="kline" :predLine="overlayLines.find(l=>l.id==='ai_pred')?.data || []" :bandP25="overlayLines.find(l=>l.id==='ai_p25')?.data || []" :bandP75="overlayLines.find(l=>l.id==='ai_p75')?.data || []" :highlightRange="predRange" />
          <div class="legend">
            <span class="dot ai"></span>
            <span class="text">紫色粗虚线：AI融合预测主线（LLM×机械p50 加权）</span>
            <span class="dot band"></span>
            <span class="text">浅紫细虚线：机械不确定带（p25/p75）</span>
          </div>
        </el-card>

        <el-card>
          <template #header><span>检索结果（Top {{ form.top_n }}）</span></template>
          <el-table :data="matches" height="420" size="small">
            <el-table-column prop="rank" label="#" width="48" />
            <el-table-column prop="stock" label="股票" width="110" />
            <el-table-column label="区间">
              <template #default="{ row }">{{ row.start }} 至 {{ row.end }}</template>
            </el-table-column>
            <el-table-column prop="score" label="相似度" width="90">
              <template #default="{ row }">{{ Number(row.score).toFixed(3) }}</template>
            </el-table-column>
            <el-table-column label="5/10/20/60日">
              <template #default="{ row }">
                <el-tag size="small" :type="retTagType(row.futureReturns?.['5d'])">{{ fmtPct(row.futureReturns?.['5d']) }}</el-tag>
                <el-tag size="small" :type="retTagType(row.futureReturns?.['10d'])">{{ fmtPct(row.futureReturns?.['10d']) }}</el-tag>
                <el-tag size="small" :type="retTagType(row.futureReturns?.['20d'])">{{ fmtPct(row.futureReturns?.['20d']) }}</el-tag>
                <el-tag size="small" :type="retTagType(row.futureReturns?.['60d'])">{{ fmtPct(row.futureReturns?.['60d']) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="走势" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="openPreview(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="60%">
      <SimilarityChart :kline="previewKline" :previewOverlays="previewOverlays" />
    </el-drawer>

    <el-dialog v-model="helpVisible" title="AI 融合预测功能说明" width="680px">
      <div class="help">
        <p><strong>可视化：</strong>图中紫色粗虚线为融合后的预测主线；上下两条浅紫细虚线为基于相似样本统计得到的不确定带（p25/p75）。</p>
        <p><strong>流程：</strong>先进行相似K线检索（TopN），再点击“生成AI预测”。系统会融合检索结果与数据库可用信息，生成未来逐日价格路径。</p>
        <p><strong>输入给AI的主要参数（简要）：</strong></p>
        <ul>
          <li>mechanicalDaily：由 TopN 样本的 5/10/20/60 日锚点分位拆分得到的逐日分位（p25/p50/p75）</li>
          <li>similaritySummary：相似样本 score 分布、行业分布、波动率差均值、TopK 元信息</li>
          <li>fundamentals：行业、板块、PE/PB、市值、上市日期</li>
          <li>technicals（近60日）：MA5/10/20/60、20日波动率、量能5/20日均值、均线趋势</li>
          <li>instituteHold：最近报告期的机构持股比例与变动</li>
          <li>analyst（近90天）：评级数量与分布、目标价均值、情绪均值</li>
          <li>constraints：未来交易日序列、日波动上限等</li>
        </ul>
        <p><strong>融合与置信度：</strong>模型输出逐日收益与置信度 conf；最终主线=LLM×w + 机械p50×(1-w)。conf 越高，w 越大。</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="helpVisible=false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { unifiedWebSocketManager } from '../utils/unifiedWebSocketManager'
import unifiedHttpClient from '../utils/unifiedHttpClient'
import SimilarityChart from '../components/backtest/SimilarityChart.vue'

const form = ref({ stock_code: '', range: [] as any[], top_n: 5 })
const loading = ref(false)
const progress = ref(0)
const matches = ref<any[]>([])
const stockOptions = ref<any[]>([])
const stockLoading = ref(false)
const currentRunId = ref<string | null>(null)
const expectingStart = ref(false)
const isRunning = ref(false)
const NS = '/backtest'

// 图与AI状态
const kline = ref<any[]>([])
const overlayLines = ref<{ id: string; data: { time: string; value: number }[]; color?: string; title?: string }[]>([])
const aiHorizon = ref(5)
const aiLoading = ref(false)
const aiConf = ref<number | null>(null)
const aiSource = ref<string>('')

// 预览抽屉
const drawerVisible = ref(false)
const drawerTitle = ref('相似区间走势')
const previewKline = ref<any[]>([])
const previewOverlays = ref<{ id: string; data: { time: string; value: number }[]; color?: string; title?: string }[]>([])

// 预测区间高亮范围（由 pred 首尾日期推导，ai结果到达后设置）
const predRange = ref<[string, string] | null>(null)
const helpVisible = ref(false)

const fmtPct = (v?: number | null) => (typeof v === 'number' ? (v * 100).toFixed(2) + '%' : '--')
const retTagType = (v?: number | null) => { if (typeof v !== 'number') return ''; if (v > 0.005) return 'success'; if (v < -0.005) return 'danger'; return 'info' }

function aiPendingKey(runId: string) { return `ps_ai_pending_${runId}` }

async function fetchStocks(query: string) {
  stockLoading.value = true
  try {
    const res = await unifiedHttpClient.dataCollection.getStocksList({ limit: 20, search: query || '' })
    const payload = (res as any)?.data?.data ?? (res as any)?.data ?? {}
    const rawList = payload.stock_list ?? payload.list ?? payload.items ?? []
    const list = rawList.map((x: any) => ({ code: x.stock_code ?? x.code ?? x.symbol ?? x.ticker, name: x.stock_name ?? x.name ?? x.title ?? '' }))
    stockOptions.value = list
  } finally {
    stockLoading.value = false
  }
}

function isForCurrentRun(data: any): boolean {
  const rid = data?.runId
  if (!rid) return currentRunId.value == null
  if (currentRunId.value == null) return true
  return String(rid) === String(currentRunId.value)
}

function cleanupOrphanFlags() {
  try {
    const last = sessionStorage.getItem('ps_last_run_id')
    const mapRaw = sessionStorage.getItem('ps_runs')
    const map = mapRaw ? JSON.parse(mapRaw) : {}
    if (last) {
      const runId = String(last)
      const hasParams = !!map[runId]
      const hasAiPending = sessionStorage.getItem(aiPendingKey(runId)) === '1'
      if (!hasParams && !hasAiPending) {
        sessionStorage.removeItem('ps_last_run_id')
      }
    }
    const keys = Object.keys(map || {})
    let changed = false
    for (const k of keys) {
      const hasAi = sessionStorage.getItem(aiPendingKey(k)) === '1'
      if (String(last || '') !== k && !hasAi) {
        delete map[k]
        changed = true
      }
    }
    if (changed) sessionStorage.setItem('ps_runs', JSON.stringify(map))
  } catch {}
}

function registerWsListeners() {
  unifiedWebSocketManager.on(NS, 'pattern_similarity_started', (data: any) => {
    if (!data?.runId) return
    if (expectingStart.value || currentRunId.value == null) {
      currentRunId.value = String(data.runId)
      try {
        sessionStorage.setItem('ps_last_run_id', String(data.runId))
        // 绑定本次入参到 runId
        const pending = sessionStorage.getItem('ps_pending_params')
        if (pending) {
          const params = JSON.parse(pending)
          const mapRaw = sessionStorage.getItem('ps_runs')
          const map = mapRaw ? JSON.parse(mapRaw) : {}
          map[String(data.runId)] = params
          sessionStorage.setItem('ps_runs', JSON.stringify(map))
          sessionStorage.removeItem('ps_pending_params')
        }
      } catch {}
      expectingStart.value = false
    }
    isRunning.value = true
    loading.value = true
  })
  unifiedWebSocketManager.on(NS, 'pattern_similarity_progress', (data: any) => {
    if (!isForCurrentRun(data)) return
    progress.value = Number(data?.progress || 0)
    // 仅在运行中保持loading
    if (data?.stage === 'FINISHED' || data?.stage === 'FAILED' || progress.value >= 100) {
      isRunning.value = false
      loading.value = false
    } else if (isRunning.value) {
      loading.value = true
    }
  })
  unifiedWebSocketManager.on(NS, 'pattern_similarity_result', (data: any) => {
    if (!isForCurrentRun(data)) return
    matches.value = (data?.matches || []).map((m: any, i: number) => ({ rank: i + 1, ...m }))
    isRunning.value = false
    loading.value = false
    progress.value = 100
    // 任务完成，清理run映射与last_run_id
    try {
      const mapRaw = sessionStorage.getItem('ps_runs')
      if (mapRaw && currentRunId.value) {
        const map = JSON.parse(mapRaw)
        delete map[String(currentRunId.value)]
        sessionStorage.setItem('ps_runs', JSON.stringify(map))
      }
      // 清理AI pending标记
      if (currentRunId.value) sessionStorage.removeItem(aiPendingKey(String(currentRunId.value)))
      sessionStorage.removeItem('ps_last_run_id')
    } catch {}
    // 保持currentRunId以便生成AI预测
  })
  // AI 事件
  unifiedWebSocketManager.on(NS, 'ai_forecast_started', (data: any) => {
    if (!isForCurrentRun(data)) return
    aiLoading.value = true
  })
  unifiedWebSocketManager.on(NS, 'ai_forecast_progress', (data: any) => {
    if (!isForCurrentRun(data)) return
  })
  unifiedWebSocketManager.on(NS, 'ai_forecast_result', (data: any) => {
    if (!isForCurrentRun(data)) return
    aiLoading.value = false
    if (currentRunId.value) sessionStorage.removeItem(aiPendingKey(String(currentRunId.value)))
    aiConf.value = Number(data?.conf ?? 0)
    aiSource.value = String(data?.source || '')
    // 构建预测虚线与p25/p75线
    const baseClose = Number(data?.baseClose || 0)
    const pred = Array.isArray(data?.pred) ? data.pred : []
    const p25 = Array.isArray(data?.band?.p25) ? data.band.p25 : []
    const p75 = Array.isArray(data?.band?.p75) ? data.band.p75 : []
    const predLine = pred.map((p: any) => ({ time: p.date, value: Number(p.close || 0) }))
    const toCloseLine = (rets: number[]) => {
      const arr: { time: string; value: number }[] = []
      let last = baseClose
      for (let i = 0; i < rets.length; i++) {
        last = last * (1 + Number(rets[i] || 0))
        const t = pred[i]?.date
          ? String(pred[i].date)
          : (arr.length > 0 ? arr[arr.length - 1].time : '')
        arr.push({ time: t, value: Number(last.toFixed(2)) })
      }
      return arr
    }
    const p25Line = toCloseLine(p25)
    const p75Line = toCloseLine(p75)
    overlayLines.value = [
      { id: 'ai_pred', data: predLine, color: '#A020F0' },
      { id: 'ai_p25', data: p25Line, color: 'rgba(160,32,240,0.35)' },
      { id: 'ai_p75', data: p75Line, color: 'rgba(160,32,240,0.35)' }
    ]
    // 设置高亮区间
    if (pred.length >= 2) predRange.value = [String(pred[0].date), String(pred[pred.length-1].date)]
  })
  unifiedWebSocketManager.on(NS, 'ai_forecast_error', (data: any) => {
    if (!isForCurrentRun(data)) return
    aiLoading.value = false
    if (currentRunId.value) sessionStorage.removeItem(aiPendingKey(String(currentRunId.value)))
    ElMessage.error('AI预测失败')
  })
}

async function ensureWsConnected() {
  if (!unifiedWebSocketManager.isConnected(NS)) {
    try { await unifiedWebSocketManager.connect(NS) } catch (e) { console.warn('WS连接失败，将在socket.io层自动重连', e) }
  }
}

async function loadBasePath() {
  if (!form.value.stock_code || form.value.range.length !== 2) return
  try {
    const res = await unifiedHttpClient.patternSimilarity.getPath({ stock: form.value.stock_code, start: form.value.range[0], end: form.value.range[1], extendDays: 0 })
    const data = (res as any)?.data?.data ?? (res as any)?.data?.data ?? []
    kline.value = (data || []).map((d: any) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }))
  } catch (e) { console.warn('加载基础K线失败', e) }
}

async function openPreview(row: any) {
  try {
    drawerTitle.value = `相似走势：${row.stock} (${row.start}～${row.end})`
    const resp = await unifiedHttpClient.patternSimilarity.getPath({ stock: row.stock, start: row.start, end: row.end, extendDays: 5 })
    const d = (resp as any)?.data || {}
    const series = (d.data || []).concat(d.next || [])
    previewKline.value = series.map((x: any) => ({ time: x.time, open: x.open, high: x.high, low: x.low, close: x.close }))
    previewOverlays.value = []
    drawerVisible.value = true
  } catch (e) {
    ElMessage.error('加载相似走势失败')
  }
}

async function runSearch() {
  if (!form.value.stock_code || form.value.range.length !== 2) { ElMessage.warning('请先选择股票与时间区间'); return }
  isRunning.value = true
  loading.value = true
  progress.value = 0
  matches.value = []
  overlayLines.value = []
  expectingStart.value = true
  aiConf.value = null
  aiSource.value = ''
  try {
    await ensureWsConnected()
    const params = {
      stock: form.value.stock_code,
      startDate: form.value.range[0],
      endDate: form.value.range[1],
      topN: form.value.top_n
    }
    unifiedWebSocketManager.emit(NS, 'run_pattern_similarity', params)
    // 持久化当前表单与待绑定入参
    try {
      sessionStorage.setItem('ps_last_form', JSON.stringify(form.value))
      sessionStorage.setItem('ps_pending_params', JSON.stringify(params))
    } catch {}
    await loadBasePath()
    ElMessage.success('已发起检索')
  } catch (e) {
    isRunning.value = false
    loading.value = false
    expectingStart.value = false
    ElMessage.error('检索启动失败')
  }
}

async function startAIForecast() {
  if (!currentRunId.value) { ElMessage.warning('请先完成一次检索'); return }
  try {
    aiLoading.value = true
    // 标记预测进行中（用于刷新后恢复条件）
    try { sessionStorage.setItem(aiPendingKey(String(currentRunId.value)), '1') } catch {}
    await unifiedHttpClient.patternSimilarity.requestAIForecast({ runId: currentRunId.value, horizon: aiHorizon.value })
    // 结果将通过WS推送
  } catch (e) {
    aiLoading.value = false
    ElMessage.error('AI预测请求失败')
  }
}

function reset() { form.value = { stock_code: '', range: [], top_n: 5 }; matches.value = []; progress.value = 0; overlayLines.value = []; aiConf.value = null; aiSource.value = '' }

onMounted(async () => {
  const end = new Date()
  const start = new Date(); start.setFullYear(end.getFullYear() - 1)
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  form.value.range = [fmt(start), fmt(end)]
  fetchStocks('')
  await ensureWsConnected()
  registerWsListeners()
  // 清理孤儿标记，避免误回显
  cleanupOrphanFlags()
  try { const last = sessionStorage.getItem('ps_last_run_id'); if (last) currentRunId.value = last } catch {}
  // 刷新恢复：仅当存在正在进行的检索或AI预测进行中时才回显与加载K线
  try {
    if (currentRunId.value) {
      const runId = String(currentRunId.value)
      const mapRaw = sessionStorage.getItem('ps_runs')
      const map = mapRaw ? JSON.parse(mapRaw) : {}
      const params = map[runId]
      const aiPending = sessionStorage.getItem(aiPendingKey(runId)) === '1'
      const shouldRestore = !!params || aiPending
      if (shouldRestore) {
        if (params && params.stock && params.startDate && params.endDate) {
          form.value.stock_code = params.stock
          form.value.range = [params.startDate, params.endDate]
        }
        loading.value = !!params // 仅检索进行中显示loading
        await loadBasePath()
        if (aiPending) {
          try {
            const resp = await unifiedHttpClient.patternSimilarity.getAIForecastSilent(runId)
            const data = (resp as any)?.data || (resp as any)
            if (data && data.pred && data.band) {
              aiConf.value = Number(data?.conf ?? 0)
              aiSource.value = String(data?.source || '')
              const baseClose = Number(data?.baseClose || 0)
              const pred = Array.isArray(data?.pred) ? data.pred : []
              const p25 = Array.isArray(data?.band?.p25) ? data.band.p25 : []
              const p75 = Array.isArray(data?.band?.p75) ? data.band.p75 : []
              const predLine = pred.map((p: any) => ({ time: p.date, value: Number(p.close || 0) }))
              const toCloseLine = (rets: number[]) => {
                const arr: { time: string; value: number }[] = []
                let last = baseClose
                for (let i = 0; i < rets.length; i++) {
                  last = last * (1 + Number(rets[i] || 0))
                  const t = pred[i]?.date ? String(pred[i].date) : (arr.length > 0 ? arr[arr.length - 1].time : '')
                  arr.push({ time: t, value: Number(last.toFixed(2)) })
                }
                return arr
              }
              overlayLines.value = [
                { id: 'ai_pred', data: predLine, color: '#A020F0' },
                { id: 'ai_p25', data: toCloseLine(p25), color: 'rgba(160,32,240,0.35)' },
                { id: 'ai_p75', data: toCloseLine(p75), color: 'rgba(160,32,240,0.35)' }
              ]
            }
          } catch {}
        }
      }
    }
  } catch {}
})

onBeforeUnmount(() => { /* 依赖全局连接与监听 */ })
</script>

<style scoped>
.ps-search { padding: 4px 8px; }
.legend { margin-top: 6px; font-size: 12px; color: #606266; display: flex; align-items: center; gap: 12px; }
.legend .dot { width: 14px; height: 4px; display: inline-block; border-top: 3px dotted #bbb; }
.legend .dot.ai { border-color: #A020F0; border-top-width: 3px; }
.legend .dot.band { border-color: rgba(160,32,240,0.6); border-top-width: 1px; }
.legend .text { margin-left: 2px; }
.help p { margin: 6px 0; }
.help ul { margin: 6px 0 0 18px; }
</style> 