<template>
  <div class="lw-container">
    <div ref="containerRef" class="lw-chart"></div>
    <div v-if="highlightStyle" class="lw-highlight" :style="highlightStyle"></div>
    <div class="lw-legend" v-if="hoverInfo.time || hoverInfo.close">
      <div class="row"><span class="label">日期</span><span class="val">{{ hoverInfo.time }}</span></div>
      <div class="row"><span class="label">收盘</span><span class="val">{{ hoverInfo.close?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA5</span><span class="val">{{ hoverInfo.ma5?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA10</span><span class="val">{{ hoverInfo.ma10?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA20</span><span class="val">{{ hoverInfo.ma20?.toFixed(2) }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, defineExpose } from 'vue'
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts'

interface KLineBar { time: string; open: number; high: number; low: number; close: number; volume?: number }

const props = defineProps<{
  kline?: KLineBar[]
  predLine?: { time: string; value: number }[]
  bandP25?: { time: string; value: number }[]
  bandP75?: { time: string; value: number }[]
  highlightRange?: [string, string] | null
  previewOverlays?: { id: string; data: { time: string; value: number }[]; color?: string; title?: string }[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const highlightStyle = ref<Record<string, string> | null>(null)
let chart: any = null
let candle: any
let ma5Series: any
let ma10Series: any
let ma20Series: any
let overlayPred: any
let overlayP25: any
let overlayP75: any
const overlaySeriesMap: Map<string, any> = new Map()
let resizeObserver: ResizeObserver | null = null

const hoverInfo = ref<{ time?: string; close?: number; ma5?: number; ma10?: number; ma20?: number }>({})

const sortAscByTime = <T extends { time?: string; date?: string }>(arr: T[]) =>
  [...arr].sort((a, b) => new Date((a as any).time || (a as any).date).getTime() - new Date((b as any).time || (b as any).date).getTime())

const normalizeDate = (d: string | any): string => {
  if (!d) return ''
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  if (typeof d === 'object' && d.year && d.month && d.day) {
    const y = d.year; const m = String(d.month).padStart(2, '0'); const day = String(d.day).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const dt = new Date(String(d))
  if (isNaN(dt.getTime())) return String(d)
  const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, '0'); const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const toCandleSeries = (bars: KLineBar[]) =>
  sortAscByTime(bars).map(b => ({ time: normalizeDate(b.time) as any, open: b.open, high: b.high, low: b.low, close: b.close }))

const computeMA = (bars: KLineBar[], period: number) => {
  const sorted = sortAscByTime(bars)
  const result: { time: any; value: number }[] = []
  let sum = 0
  for (let i = 0; i < sorted.length; i++) {
    sum += sorted[i].close
    if (i >= period) sum -= sorted[i - period].close
    const val = i >= period - 1 ? (sum / period) : sorted[i].close
    result.push({ time: normalizeDate(sorted[i].time as any) as any, value: Number(val.toFixed(4)) })
  }
  return result
}

function addCandlestickSeriesCompat(chartApi: any, options: any) {
  if (typeof chartApi?.addCandlestickSeries === 'function') return chartApi.addCandlestickSeries(options)
  if (typeof chartApi?.addSeries === 'function') return chartApi.addSeries(CandlestickSeries, options)
  throw new Error('lightweight-charts: cannot add candlestick series')
}
function addLineSeriesCompat(chartApi: any, options: any) {
  if (typeof chartApi?.addLineSeries === 'function') return chartApi.addLineSeries(options)
  if (typeof chartApi?.addSeries === 'function') return chartApi.addSeries(LineSeries, options)
  throw new Error('lightweight-charts: cannot add line series')
}
function removeSeriesCompat(chartApi: any, series: any) {
  if (typeof chartApi?.removeSeries === 'function') return chartApi.removeSeries(series)
  if (typeof series?.remove === 'function') return series.remove()
}

function updateHighlight() {
  try {
    if (!chart || !props.highlightRange || !containerRef.value) { highlightStyle.value = null; return }
    const [s, e] = props.highlightRange
    const ts = chart.timeScale()
    const x1 = ts.timeToCoordinate(s as any)
    const x2 = ts.timeToCoordinate(e as any)
    if (x1 == null || x2 == null) { highlightStyle.value = null; return }
    const left = Math.min(x1, x2)
    const width = Math.max(2, Math.abs(x2 - x1))
    const rect = containerRef.value.getBoundingClientRect()
    highlightStyle.value = { left: `${left}px`, width: `${width}px`, top: '0px', height: `${rect.height}px`, background: 'rgba(170, 0, 255, 0.10)', position: 'absolute' }
  } catch { highlightStyle.value = null }
}

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return

  try {
    chart = createChart(containerRef.value, {
      layout: { textColor: '#2B2F36', background: { type: ColorType.Solid, color: 'transparent' }, fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, Arial, sans-serif' },
      height: 380,
      timeScale: { rightOffset: 4, fixLeftEdge: true, fixRightEdge: false, borderVisible: true, timeVisible: true, secondsVisible: false },
      rightPriceScale: { visible: true, borderVisible: true, autoScale: true, scaleMargins: { top: 0.1, bottom: 0.1 } },
      grid: { horzLines: { color: 'rgba(0,0,0,0.08)' }, vertLines: { color: 'rgba(0,0,0,0.04)' } },
      crosshair: { vertLine: { color: 'rgba(60,70,90,0.65)', width: 1, style: 1 }, horzLine: { color: 'rgba(60,70,90,0.35)', width: 1, style: 1 } },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      localization: { locale: 'zh-CN' }
    })

    // K线
    candle = addCandlestickSeriesCompat(chart, { priceScaleId: 'right', upColor: '#F56C6C', downColor: '#26A69A', borderUpColor: '#F56C6C', borderDownColor: '#26A69A', wickUpColor: '#F56C6C', wickDownColor: '#26A69A' })

    // MA
    ma5Series = addLineSeriesCompat(chart, { priceScaleId: 'right', color: '#FFD166', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })
    ma10Series = addLineSeriesCompat(chart, { priceScaleId: 'right', color: '#06D6A0', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })
    ma20Series = addLineSeriesCompat(chart, { priceScaleId: 'right', color: '#118AB2', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })

    // 初始数据
    if (props.kline?.length) {
      const candles = toCandleSeries(props.kline)
      candle.setData(candles)
      ma5Series.setData(computeMA(props.kline, 5))
      ma10Series.setData(computeMA(props.kline, 10))
      ma20Series.setData(computeMA(props.kline, 20))
      chart.timeScale().fitContent()
    }

    // 预测与带
    overlayPred = addLineSeriesCompat(chart, { priceScaleId: 'right', color: '#A020F0', lineWidth: 3, lineStyle: 1, lastValueVisible: false, priceLineVisible: false })
    overlayP25 = addLineSeriesCompat(chart, { priceScaleId: 'right', color: 'rgba(160,32,240,0.35)', lineWidth: 1, lineStyle: 1, lastValueVisible: false, priceLineVisible: false })
    overlayP75 = addLineSeriesCompat(chart, { priceScaleId: 'right', color: 'rgba(160,32,240,0.35)', lineWidth: 1, lineStyle: 1, lastValueVisible: false, priceLineVisible: false })

    // 悬浮信息
    chart.subscribeCrosshairMove((param: any) => {
      if (!param || (!param.time && !param.seriesData)) { hoverInfo.value = {}; return }
      const toTimeStr = (t: any): string | undefined => {
        if (!t && t !== 0) return undefined
        if (typeof t === 'string') return normalizeDate(t)
        if (typeof t === 'number') {
          const dt = new Date(t * 1000)
          if (isNaN(dt.getTime())) return undefined
          const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, '0'); const d = String(dt.getDate()).padStart(2, '0')
          return `${y}-${m}-${d}`
        }
        if (typeof t === 'object' && t.year && t.month && t.day) {
          return `${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')}`
        }
        return undefined
      }
      const seriesMap = param.seriesData || new Map()
      const candlePoint: any = seriesMap.get(candle)
      const ma5Point: any = seriesMap.get(ma5Series)
      const ma10Point: any = seriesMap.get(ma10Series)
      const ma20Point: any = seriesMap.get(ma20Series)
      hoverInfo.value = { time: toTimeStr(param.time), close: candlePoint?.close ?? candlePoint?.value, ma5: ma5Point?.value, ma10: ma10Point?.value, ma20: ma20Point?.value }
    })

    // 自适应
    resizeObserver = new ResizeObserver(() => {
      if (!containerRef.value || !chart) return
      const { width, height } = containerRef.value.getBoundingClientRect()
      chart.applyOptions({ width: Math.floor(width), height: Math.max(320, Math.floor(height)) })
      chart.timeScale().fitContent()
      updateHighlight()
    })
    resizeObserver.observe(containerRef.value)

    chart.timeScale().fitContent()
  } catch (e) { console.error('图表初始化失败:', e) }
})

onBeforeUnmount(() => {
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value)
  if (chart && typeof chart.remove === 'function') chart.remove()
})

watch(() => props.kline, (val) => {
  if (!val || !val.length || !candle) return
  try {
    const candles = toCandleSeries(val)
    candle.setData(candles)
    ma5Series.setData(computeMA(val, 5))
    ma10Series.setData(computeMA(val, 10))
    ma20Series.setData(computeMA(val, 20))
    chart.timeScale().fitContent()
    updateHighlight()
  } catch (e) { console.error('更新K线失败:', e) }
}, { deep: true })

watch(() => props.predLine, (val) => {
  if (!overlayPred) return
  try {
    const sorted = sortAscByTime(val || [])
    overlayPred.setData(sorted.map(p => ({ time: normalizeDate(p.time) as any, value: Number(p.value) })))
  } catch (e) { console.error('更新预测线失败:', e) }
}, { deep: true })

watch(() => props.bandP25, (val) => {
  if (!overlayP25) return
  try {
    const sorted = sortAscByTime(val || [])
    overlayP25.setData(sorted.map(p => ({ time: normalizeDate(p.time) as any, value: Number(p.value) })))
  } catch (e) { console.error('更新p25失败:', e) }
}, { deep: true })

watch(() => props.bandP75, (val) => {
  if (!overlayP75) return
  try {
    const sorted = sortAscByTime(val || [])
    overlayP75.setData(sorted.map(p => ({ time: normalizeDate(p.time) as any, value: Number(p.value) })))
  } catch (e) { console.error('更新p75失败:', e) }
}, { deep: true })

watch(() => props.previewOverlays, (val) => {
  if (!chart) return
  try {
    const incomingIds = new Set((val || []).map(l => l.id))
    for (const [id, series] of overlaySeriesMap.entries()) {
      if (!incomingIds.has(id)) { removeSeriesCompat(chart, series); overlaySeriesMap.delete(id) }
    }
    ;(val || []).forEach(line => {
      let series = overlaySeriesMap.get(line.id)
      const opts = { priceScaleId: 'right', color: line.color || '#999', lineWidth: 1.2, lineStyle: 0, lastValueVisible: false, priceLineVisible: false }
      if (!series) { series = addLineSeriesCompat(chart, opts); overlaySeriesMap.set(line.id, series) }
      else { series.applyOptions(opts) }
      const sorted = sortAscByTime(line.data)
      series.setData(sorted.map(p => ({ time: normalizeDate(p.time) as any, value: Number(p.value) })))
    })
    updateHighlight()
  } catch (e) { console.error('更新预览叠加失败:', e) }
}, { deep: true })

watch(() => props.highlightRange, () => updateHighlight(), { deep: true })
</script>

<script lang="ts">
export default {}
</script>

<style scoped>
.lw-container { position: relative; width: 100%; height: 100%; min-height: 340px; }
.lw-chart { width: 100%; height: 100%; }
.lw-highlight { position: absolute; pointer-events: none; }
.lw-legend {
  position: absolute; left: 12px; top: 12px; padding: 8px 10px; border-radius: 6px;
  background: rgba(0, 0, 0, 0.35); color: #E5EAF3; font-size: 12px; line-height: 1.4;
  backdrop-filter: blur(2px);
  z-index: 999;
  pointer-events: none;
}
.lw-legend .row { display: flex; justify-content: space-between; gap: 8px; }
.lw-legend .label { color: #000000; margin-right: 8px; }
.lw-legend .val { color: #E5EAF3; font-variant-numeric: tabular-nums; }
</style> 