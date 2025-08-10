// 候选股票接口定义
export interface Candidate {
  id?: number
  code: string
  name: string
  price: number
  change_pct: number
  volume: number
  pe: number | null
  pb: number | null
  roe: number | null
  growth_rate: number | null
  rsi: number | null
  macd: number | null
  kdj: number | null
  turnover: number | null
  market_cap: number | null
  industry: string
  notes?: string
  last_updated?: string
  // 评估相关字段
  score: number
  recommendation: string
  added_date: string
  // 技术指标字段
  bollinger?: string | null
  amplitude?: number | null
  volume_ratio?: number | null
  // 财务指标字段
  ps?: number | null
  roa?: number | null
  gross_margin?: number | null
  revenue_growth?: number | null
  profit_growth?: number | null
  eps_growth?: number | null
  debt_ratio?: number | null
  // 其他字段
  selected?: boolean
  [key: string]: any
}

// 候选池统计信息
export interface CandidateStats {
  total: number
  buyRecommended: number
  avgScore: number
  todayAdded: number
} 