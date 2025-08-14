<template>
  <div class="lw-container">
    <div ref="containerRef" class="lw-chart"></div>
    <div v-if="highlightStyle" class="lw-highlight" :style="highlightStyle"></div>
    <div class="lw-controls">
      <label><input type="checkbox" v-model="toggles.showMA5" /> MA5</label>
      <label><input type="checkbox" v-model="toggles.showMA10" /> MA10</label>
      <label><input type="checkbox" v-model="toggles.showMA20" /> MA20</label>
      <label><input type="checkbox" v-model="toggles.showMA60" /> MA60</label>
      <label><input type="checkbox" v-model="toggles.showEquity" /> 净值</label>
    </div>
    <div class="lw-legend" v-if="hoverInfo.time || hoverInfo.close">
      <div class="row"><span class="label">日期</span><span class="val">{{ hoverInfo.time }}</span></div>
      <div class="row"><span class="label">收盘</span><span class="val">{{ hoverInfo.close?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA5</span><span class="val">{{ hoverInfo.ma5?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA10</span><span class="val">{{ hoverInfo.ma10?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA20</span><span class="val">{{ hoverInfo.ma20?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA60</span><span class="val">{{ hoverInfo.ma60?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">净值</span><span class="val">{{ hoverInfo.equity?.toFixed(2) }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { createChart, CandlestickSeries, AreaSeries, LineSeries, ColorType, createSeriesMarkers } from 'lightweight-charts'

interface KLineBar { time: string | any; open: number; high: number; low: number; close: number }
interface EquityPoint { date: string; total_value: number }
interface TradePoint { id?: number; date: string; stock?: string; action: 'buy' | 'sell'; price?: number; quantity?: number; amount?: number; reason?: string }

const props = defineProps<{ kline?: KLineBar[]; portfolioHistory?: EquityPoint[]; trades?: TradePoint[] }>()

const containerRef = ref<HTMLDivElement | null>(null)
const highlightStyle = ref<Record<string, string> | null>(null)
const hoverInfo = ref<{ time?: string; close?: number; ma5?: number; ma10?: number; ma20?: number; ma60?: number; equity?: number }>({})
const toggles = ref({ showMA5: true, showMA10: true, showMA20: true, showMA60: true, showEquity: true, showMarkers: true })

let chart: any = null
let candle: any = null
let areaEquity: any = null
let ma5Series: any = null
let ma10Series: any = null
let ma20Series: any = null
let ma60Series: any = null
let candleTimes: string[] = []

function setMarkersCompat(series: any, markers: any[]) {
  if (!series || !markers) return
  if (typeof series.setMarkers === 'function') return series.setMarkers(markers)
  if (typeof createSeriesMarkers === 'function') return (createSeriesMarkers as any)(series, markers)
}

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

const toBusinessDay = (d: string | any): { year: number; month: number; day: number } => {
  if (typeof d === 'object' && d?.year && d?.month && d?.day) return { year: Number(d.year), month: Number(d.month), day: Number(d.day) }
  const s = normalizeDate(d)
  const [y, m, day] = s.split('-').map(n => Number(n))
  return { year: y, month: m, day }
}

const toCandleSeries = (bars: KLineBar[]) =>
  sortAscByTime(bars)
    .map(b => ({ time: toBusinessDay(b.time as any) as any, open: b.open, high: b.high, low: b.low, close: b.close }))

const toEquitySeries = (history: EquityPoint[]) =>
  [...history]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(p => ({ time: toBusinessDay(p.date as any) as any, value: Number(p.total_value || 0) }))

function computeMA(bars: KLineBar[], period: number) {
  const sorted = sortAscByTime(bars)
  const result: { time: any; value: number }[] = []
  let sum = 0
  for (let i = 0; i < sorted.length; i++) {
    sum += sorted[i].close
    if (i >= period) sum -= sorted[i - period].close
    const val = i >= period - 1 ? sum / period : sorted[i].close
    result.push({ time: toBusinessDay(sorted[i].time as any) as any, value: Number(val.toFixed(4)) })
  }
  return result
}

function applySeriesVisibility() {
  try {
    ma5Series?.applyOptions({ visible: !!toggles.value.showMA5 })
    ma10Series?.applyOptions({ visible: !!toggles.value.showMA10 })
    ma20Series?.applyOptions({ visible: !!toggles.value.showMA20 })
    ma60Series?.applyOptions({ visible: !!toggles.value.showMA60 })
    areaEquity?.applyOptions({ visible: !!toggles.value.showEquity })
  } catch {}
}

function refreshMarkers() {
  if (!candle) return
  if (!toggles.value.showMarkers) { setMarkersCompat(candle, []); return }
  if (props.trades?.length) setMarkersCompat(candle, buildTradeMarkers(props.trades))
  else if (candleTimes.length) {
    const lastStr = candleTimes[candleTimes.length - 1]
    setMarkersCompat(candle, [{ time: toBusinessDay(lastStr) as any, position: 'belowBar', color: '#2196F3', shape: 'arrowUp', text: 'Buy @ Demo' } as any])
  }
}

// 根据 trades 生成图表标记，自动吸附到不大于交易日期的最近一根K线
function buildTradeMarkers(trades?: TradePoint[]) {
  if (!trades || !trades.length) return [] as any[]
  const snapToBar = (d: string): string | null => {
    const nd = normalizeDate(d)
    if (candleTimes.includes(nd)) return nd
    for (let i = candleTimes.length - 1; i >= 0; i--) {
      if (candleTimes[i] <= nd) return candleTimes[i]
    }
    return candleTimes.length ? candleTimes[0] : null
  }
  return sortAscByTime(trades).map(t => {
    const snapped = snapToBar(t.date)
    const time = toBusinessDay(snapped || t.date)
    const isBuy = t.action === 'buy'
    return {
      time: time as any,
      position: isBuy ? 'belowBar' : 'aboveBar',
      color: isBuy ? '#67C23A' : '#F56C6C',
      shape: isBuy ? 'arrowUp' : 'arrowDown',
      text: `${isBuy ? '买' : '卖'} ${t.price ? t.price.toFixed(2) : ''}`.trim()
    }
  })
}

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return
  chart = createChart(containerRef.value, {
    layout: { textColor: '#2B2F36', background: { type: ColorType.Solid, color: 'transparent' } },
    height: 380,
    timeScale: { rightOffset: 2, timeVisible: true, secondsVisible: false },
    rightPriceScale: { visible: true, borderVisible: true },
    leftPriceScale: { visible: true, borderVisible: true },
    grid: { horzLines: { color: 'rgba(0,0,0,0.08)' }, vertLines: { color: 'rgba(0,0,0,0.04)' } },
    localization: { locale: 'zh-CN' }
  })

  candle = chart.addSeries(CandlestickSeries, {
    upColor: '#F56C6C', downColor: '#26A69A', borderUpColor: '#F56C6C', borderDownColor: '#26A69A', wickUpColor: '#F56C6C', wickDownColor: '#26A69A'
  })

  // 均线（右轴）
  ma5Series = chart.addSeries(LineSeries, { priceScaleId: 'right', color: '#FFD166', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })
  ma10Series = chart.addSeries(LineSeries, { priceScaleId: 'right', color: '#06D6A0', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })
  ma20Series = chart.addSeries(LineSeries, { priceScaleId: 'right', color: '#118AB2', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })
  ma60Series = chart.addSeries(LineSeries, { priceScaleId: 'right', color: '#8E44AD', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })

  areaEquity = chart.addSeries(AreaSeries, {
    priceScaleId: 'left',
    lineColor: '#409EFF',
    topColor: 'rgba(64,158,255,0.25)',
    bottomColor: 'rgba(64,158,255,0.02)',
    lineWidth: 2,
    lastValueVisible: true,
    priceLineVisible: false,
    priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
  })

  let candleData: any[] = []
  if (props.kline?.length) {
    candleData = toCandleSeries(props.kline)
  } else {
    // 开发演示：若无外部数据，使用极小Demo数据集
    const demo = [
      { time: toBusinessDay('2024-08-14') as any, open: 12.5, high: 12.8, low: 12.3, close: 12.6 },
      { time: toBusinessDay('2024-08-15') as any, open: 12.6, high: 12.9, low: 12.4, close: 12.85 },
      { time: toBusinessDay('2024-08-16') as any, open: 12.85, high: 13.1, low: 12.7, close: 13.0 },
    ]
    candleData = demo
  }
  candle.setData(candleData)
  // 维护字符串形式的K线日期用于吸附
  candleTimes = sortAscByTime((props.kline || []).map(b => ({ time: (b as any).time })) as any).map(x => normalizeDate((x as any).time))
  // 初始化均线
  if (props.kline?.length) {
    ma5Series.setData(computeMA(props.kline, 5))
    ma10Series.setData(computeMA(props.kline, 10))
    ma20Series.setData(computeMA(props.kline, 20))
    ma60Series.setData(computeMA(props.kline, 60))
  }
  chart.timeScale().fitContent()

  // 标注：优先使用真实 trades，否则放一个演示标记
  if (props.trades?.length) {
    setMarkersCompat(candle, buildTradeMarkers(props.trades))
  } else {
    const last = candleData[candleData.length - 1]
    setMarkersCompat(candle, [{ time: last.time, position: 'belowBar', color: '#2196F3', shape: 'arrowUp', text: 'Buy @ Demo' } as any])
  }

  if (props.portfolioHistory?.length) {
    areaEquity.setData(toEquitySeries(props.portfolioHistory))
  }

  applySeriesVisibility()

  chart.subscribeCrosshairMove((param: any) => {
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
    const p5: any = seriesMap.get(ma5Series)
    const p10: any = seriesMap.get(ma10Series)
    const p20: any = seriesMap.get(ma20Series)
    const p60: any = seriesMap.get(ma60Series)
    const equityPoint: any = seriesMap.get(areaEquity)
    hoverInfo.value = {
      time: toTimeStr(param.time),
      close: candlePoint?.close ?? candlePoint?.value,
      ma5: p5?.value,
      ma10: p10?.value,
      ma20: p20?.value,
      ma60: p60?.value,
      equity: equityPoint?.value
    }
  })
})

watch(() => props.kline, (val) => {
  if (!val || !val.length || !candle) return
  const cd = toCandleSeries(val)
  candle.setData(cd)
  candleTimes = sortAscByTime(val.map(v => ({ time: (v as any).time })) as any).map(x => normalizeDate((x as any).time))
  ma5Series?.setData(computeMA(val, 5))
  ma10Series?.setData(computeMA(val, 10))
  ma20Series?.setData(computeMA(val, 20))
  ma60Series?.setData(computeMA(val, 60))
  // 更新演示标记到最新bar或根据交易刷新
  refreshMarkers()
  chart?.timeScale().fitContent()
}, { deep: true })

watch(() => props.portfolioHistory, (val) => {
  if (!val || !val.length || !areaEquity) return
  areaEquity.setData(toEquitySeries(val))
}, { deep: true })

watch(() => props.trades, () => { refreshMarkers() }, { deep: true })
watch(() => toggles.value, () => { applySeriesVisibility(); refreshMarkers() }, { deep: true })
</script>

<style scoped>
.lw-container { position: relative; width: 100%; height: 100%; min-height: 340px; }
.lw-chart { width: 100%; height: 100%; }
.lw-highlight { position: absolute; pointer-events: none; }
.lw-controls {
  position: absolute; right: 52px; top: 12px; display: flex; gap: 8px; flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.6); padding: 6px 8px; border-radius: 6px; font-size: 12px;
  z-index: 1001; pointer-events: auto;
}
.lw-controls label { display: inline-flex; align-items: center; gap: 4px; }
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