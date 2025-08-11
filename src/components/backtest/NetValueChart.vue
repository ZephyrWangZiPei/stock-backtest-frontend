<template>
  <div class="lw-container">
    <div ref="containerRef" class="lw-chart"></div>
    <div class="lw-legend" v-if="hoverInfo.time">
      <div class="row"><span class="label">日期</span><span class="val">{{ hoverInfo.time }}</span></div>
      <div class="row"><span class="label">收盘</span><span class="val">{{ hoverInfo.close?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA5</span><span class="val">{{ hoverInfo.ma5?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA10</span><span class="val">{{ hoverInfo.ma10?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">MA20</span><span class="val">{{ hoverInfo.ma20?.toFixed(2) }}</span></div>
      <div class="row"><span class="label">净值</span><span class="val">{{ hoverInfo.equity?.toFixed(2) }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, defineExpose, onBeforeMount, onUnmounted } from 'vue'
import { createChart, ColorType } from 'lightweight-charts'

interface TradePoint {
  date: string
  stock: string
  action: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  reason?: string
}

interface KLineBar { time: string; open: number; high: number; low: number; close: number; volume?: number }

const props = defineProps<{
  portfolioHistory?: { date: string; total_value: number }[]
  trades: TradePoint[]
  kline?: KLineBar[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let chart: any = null
let areaEquity: any
let candle: any
let ma5Series: any
let ma10Series: any
let ma20Series: any
let resizeObserver: ResizeObserver | null = null

// 悬浮信息
const hoverInfo = ref<{ time?: string; close?: number; ma5?: number; ma10?: number; ma20?: number; equity?: number }>({})

// 排序/转换
const sortAscByTime = <T extends { time?: string; date?: string }>(arr: T[]) =>
  [...arr].sort((a, b) => new Date((a as any).time || (a as any).date).getTime() - new Date((b as any).time || (b as any).date).getTime())

const toEquitySeries = (history: { date: string; total_value: number }[]) =>
  sortAscByTime(history).map(p => ({ time: p.date as any, value: Number(p.total_value || 0) }))

const toCandleSeries = (bars: KLineBar[]) =>
  sortAscByTime(bars).map(b => ({ time: b.time as any, open: b.open, high: b.high, low: b.low, close: b.close }))

const computeMA = (bars: KLineBar[], period: number) => {
  const sorted = sortAscByTime(bars)
  const result: { time: any; value: number }[] = []
  let sum = 0
  for (let i = 0; i < sorted.length; i++) {
    sum += sorted[i].close
    if (i >= period) sum -= sorted[i - period].close
    const val = i >= period - 1 ? (sum / period) : sorted[i].close
    result.push({ time: sorted[i].time as any, value: Number(val.toFixed(4)) })
  }
  return result
}

const buildMarkers = (trades: TradePoint[]) => {
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return sortedTrades.map(t => ({
    time: t.date as any,
    position: t.action === 'buy' ? 'belowBar' : 'aboveBar',
    color: t.action === 'buy' ? '#67C23A' : '#F56C6C',
    shape: t.action === 'buy' ? 'arrowUp' : 'arrowDown',
    text: `${t.action === 'buy' ? '买' : '卖'} ${Math.round((t.quantity||0)/100)}手`
  }))
}

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return

  try {
    chart = createChart(containerRef.value, {
      layout: {
        textColor: '#2B2F36',
        background: { type: ColorType.Solid, color: 'transparent' },
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, Arial, sans-serif'
      },
      height: 380,
      timeScale: {
        rightOffset: 4,
        fixLeftEdge: true,
        fixRightEdge: false,
        borderVisible: true,
        timeVisible: true,
        secondsVisible: false
      },
      rightPriceScale: { borderVisible: true, autoScale: true },
      leftPriceScale: { borderVisible: true, autoScale: true },
      grid: {
        horzLines: { color: 'rgba(0,0,0,0.08)' },
        vertLines: { color: 'rgba(0,0,0,0.04)' }
      },
      crosshair: {
        vertLine: { color: 'rgba(60,70,90,0.65)', width: 1, style: 1 },
        horzLine: { color: 'rgba(60,70,90,0.35)', width: 1, style: 1 }
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      localization: { locale: 'zh-CN' }
    })

    // K线（右轴）- 红涨绿跌
    candle = chart.addCandlestickSeries({
      priceScaleId: 'right',
      upColor: '#F56C6C',
      downColor: '#26A69A',
      borderUpColor: '#F56C6C',
      borderDownColor: '#26A69A',
      wickUpColor: '#F56C6C',
      wickDownColor: '#26A69A'
    })

    // 均线（右轴）
    ma5Series = chart.addLineSeries({ priceScaleId: 'right', color: '#FFD166', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })
    ma10Series = chart.addLineSeries({ priceScaleId: 'right', color: '#06D6A0', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })
    ma20Series = chart.addLineSeries({ priceScaleId: 'right', color: '#118AB2', lineWidth: 1.5, lastValueVisible: false, priceLineVisible: false })

    // 净值曲线（左轴）
    areaEquity = chart.addAreaSeries({ priceScaleId: 'left', lineColor: '#409EFF', topColor: 'rgba(64,158,255,0.25)', bottomColor: 'rgba(64,158,255,0.02)', lineWidth: 2 })

    // 初始数据
    if (props.kline?.length) {
      const candles = toCandleSeries(props.kline)
      candle.setData(candles)
      ma5Series.setData(computeMA(props.kline, 5))
      ma10Series.setData(computeMA(props.kline, 10))
      ma20Series.setData(computeMA(props.kline, 20))
    }

    if (props.portfolioHistory?.length) {
      areaEquity.setData(toEquitySeries(props.portfolioHistory))
    }

    if (props.trades?.length) {
      candle.setMarkers(buildMarkers(props.trades))
    }

    // 悬浮信息
    chart.subscribeCrosshairMove((param: any) => {
      if (!param || !param.time) { hoverInfo.value = {}; return }
      const seriesMap = param.seriesData || new Map()
      const candlePoint: any = seriesMap.get(candle)
      const ma5Point: any = seriesMap.get(ma5Series)
      const ma10Point: any = seriesMap.get(ma10Series)
      const ma20Point: any = seriesMap.get(ma20Series)
      const equityPoint: any = seriesMap.get(areaEquity)
      hoverInfo.value = {
        time: typeof param.time === 'string' ? param.time : (param.time?.year ? `${param.time.year}-${String(param.time.month).padStart(2,'0')}-${String(param.time.day).padStart(2,'0')}` : undefined),
        close: candlePoint?.close ?? candlePoint?.value,
        ma5: ma5Point?.value,
        ma10: ma10Point?.value,
        ma20: ma20Point?.value,
        equity: equityPoint?.value
      }
    })

    // 自适应
    resizeObserver = new ResizeObserver(() => {
      if (!containerRef.value || !chart) return
      const { width, height } = containerRef.value.getBoundingClientRect()
      chart.applyOptions({ width: Math.floor(width), height: Math.max(320, Math.floor(height)) })
      chart.timeScale().fitContent()
    })
    resizeObserver.observe(containerRef.value)

    chart.timeScale().fitContent()
  } catch (error) {
    console.error('图表初始化失败:', error)
  }
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
  } catch (e) { console.error('更新K线失败:', e) }
}, { deep: true })

watch(() => props.portfolioHistory, (val) => {
  if (!val || !val.length || !areaEquity) return
  try {
    areaEquity.setData(toEquitySeries(val))
  } catch (e) { console.error('更新净值失败:', e) }
}, { deep: true })

watch(() => props.trades, (val) => {
  if (!val || !candle) return
  try {
    candle.setMarkers(buildMarkers(val))
  } catch (e) { console.error('更新标注失败:', e) }
}, { deep: true })

// 暴露方法
function updateEquityPoint(point: { date: string; total_value: number }) {
  if (!areaEquity) return
  try {
    areaEquity.update({ time: point.date as any, value: Number(point.total_value || 0) })
  } catch (e) { console.error('追加净值点失败:', e) }
}

defineExpose({ updateEquityPoint })
</script>

<style scoped>
.lw-container { position: relative; width: 100%; height: 100%; min-height: 340px; }
.lw-chart { width: 100%; height: 100%; }
.lw-legend {
  position: absolute; left: 12px; top: 12px; padding: 8px 10px; border-radius: 6px;
  background: rgba(0, 0, 0, 0.35); color: #E5EAF3; font-size: 12px; line-height: 1.4;
  backdrop-filter: blur(2px);
}
.lw-legend .row { display: flex; justify-content: space-between; gap: 8px; }
.lw-legend .label { color: #000000; margin-right: 8px; }
.lw-legend .val { color: #E5EAF3; font-variant-numeric: tabular-nums; }
</style> 