# 相似K线融合预测 前端渲染与交互契约

> 本文作为前端实现相似K线融合预测（逐日价格）的 UI/UX 规格说明。

## 1. 页面结构
- 位置：`相似K线 → 相似走势检索`
- 布局：
  - 左侧：检索表单（股票、时间区间默认1年、窗口K、TopN、H）+ 操作按钮（开始检索 / 生成融合预测）+ 进度条。
  - 右上：Top-N 结果表（股票、区间、相似度、5/10/20/60日未来收益标签）。
  - 右下：K线图面板（lightweight-charts v5）。

## 2. 数据契约
```ts
export interface AIForecast {
  runId: string
  symbol: string
  baseDate: string     // YYYY-MM-DD
  baseClose: number
  horizonDays: number
  pred: { date: string; close: number; ret: number }[]
  band: { p25: number[]; p75: number[] }
  conf: number
  source: 'llm' | 'mechanical_fallback'
}
```

## 3. 接口/事件
- HTTP
  - `POST /api/v1/analysis/pattern-similarity/ai-forecast` → `AIForecast`
  - `GET  /api/v1/analysis/pattern-similarity/ai-forecast/{runId}` → `AIForecast`
  - `GET  /api/v1/analysis/pattern-similarity/path?stock=...&start=...&end=...&extendDays=5` → 相似区间K线 + 后续扩展天
- WebSocket（命名空间 `/backtest`）
  - `ai_forecast_started` / `ai_forecast_progress` / `ai_forecast_result` / `ai_forecast_error`

## 4. 图形渲染规范（lightweight-charts v5）
- 主图：CandlestickSeries（目标股票日K）
  - 均线：MA5/10/20/60 → LineSeries（不同颜色）
  - 选区高亮：在用户选定时间区间绘制背景矩形（overlay）
- 相似区间叠加（可选）：
  - 点击结果表条目 → 请求 `/path` → 将该区间“按时间对齐到目标区间末段”绘制灰色 LineSeries（收盘轨迹）
- 预测绘制：
  - 从 `baseDate` 的下一交易日起：
    - `pred`：虚线 LineSeries（橙色）
    - `band`：AreaSeries 填充 P25~P75 区间（同色浅，半透明）
  - 悬浮提示：日期、预测收盘价、当日收益 `ret`、置信度 `conf`
- 颜色建议：
  - MA5/10/20/60：#409EFF/#67C23A/#E6A23C/#909399
  - 预测线：#FF8C00（dashed: [4,4]）
  - 置信带：橙色 20% 透明度填充
  - 相似叠加：灰色 `#A0A0A0`

## 5. 交互
- 切换显示：仅机械/融合/仅LLM（三个开关）
- 相似条目操作：叠加/设为参考（影响融合权重上限）
- 导出：图快照 + 简要指标为 PNG/PDF
- 审核提示：当 `source='mechanical_fallback'` 时在图上角标记“机械回退”

## 6. 校验与降级
- 若 `pred.length !== horizonDays` 或日期不连续为交易日 → 弹错并不绘制预测
- 若 `conf < 0.5` → 在提示中标识“低置信度”
- WS 超时/断线 → 自动切换 HTTP 轮询获取 `ai-forecast` 结果

## 7. 性能
- 单页最多显示 1 条预测线 + 1 个置信带 + 3~5 条相似叠加线
- 图形复用同一 Chart 实例，动态增删 Series，避免频繁重建

## 8. 待办
- 预测结果的本地缓存（按 runId）
- 操作提示与引导文档 