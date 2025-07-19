/**
 * 股票相关工具函数
 */

import { formatNumber, formatPercentage } from './format'

/**
 * 股票信息接口
 */
export interface StockInfo {
  code: string
  name: string
  market: string
  stock_type: string
}

/**
 * 股票价格信息接口
 */
export interface StockPrice {
  code: string
  name: string
  current_price: number
  change_amount: number
  change_rate: number
  open_price: number
  high_price: number
  low_price: number
  volume: number
  amount: number
  market_cap?: number
  pe_ratio?: number
  pb_ratio?: number
}

/**
 * 股票搜索选项
 */
export interface StockSearchOptions {
  keyword?: string
  market?: string
  stock_type?: string
  limit?: number
}

/**
 * 获取股票市场类型
 * @param code 股票代码
 * @returns 市场类型
 */
export function getStockMarket(code: string): 'SH' | 'SZ' | 'BJ' | 'unknown' {
  if (!code) return 'unknown'
  
  const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '')
  
  if (/^6\d{5}$/.test(cleanCode)) {
    return 'SH'
  } else if (/^[03]\d{5}$/.test(cleanCode)) {
    return 'SZ'
  } else if (/^8\d{5}$/.test(cleanCode)) {
    return 'BJ'
  }
  
  return 'unknown'
}

/**
 * 获取股票市场名称
 * @param market 市场代码
 * @returns 市场名称
 */
export function getMarketName(market: string): string {
  const marketMap: Record<string, string> = {
    'SH': '上海证券交易所',
    'SZ': '深圳证券交易所',
    'BJ': '北京证券交易所'
  }
  
  return marketMap[market] || '未知市场'
}

/**
 * 获取股票类型名称
 * @param stockType 股票类型代码
 * @returns 股票类型名称
 */
export function getStockTypeName(stockType: string): string {
  const typeMap: Record<string, string> = {
    'stock': '股票',
    'bond': '债券',
    'fund': '基金',
    'index': '指数'
  }
  
  return typeMap[stockType] || '未知类型'
}

/**
 * 格式化股票价格变化
 * @param changeAmount 变化金额
 * @param changeRate 变化率
 * @returns 格式化后的价格变化信息
 */
export function formatStockChange(
  changeAmount: number,
  changeRate: number
): { text: string; type: 'positive' | 'negative' | 'neutral' } {
  if (changeAmount === 0) {
    return {
      text: '0.00 (0.00%)',
      type: 'neutral'
    }
  }
  
  const amountText = formatNumber(changeAmount, { decimals: 2 })
  const rateText = formatPercentage(Math.abs(changeRate), 100, 2)
  const sign = changeAmount > 0 ? '+' : '-'
  
  return {
    text: `${sign}${amountText} (${sign}${rateText})`,
    type: changeAmount > 0 ? 'positive' : 'negative'
  }
}

/**
 * 格式化成交量
 * @param volume 成交量（手）
 * @returns 格式化后的成交量字符串
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e8) {
    return `${formatNumber(volume / 1e8, { decimals: 2 })} 亿手`
  }
  if (volume >= 1e4) {
    return `${formatNumber(volume / 1e4, { decimals: 2 })} 万手`
  }
  return `${formatNumber(volume, { decimals: 0 })} 手`
}

/**
 * 格式化成交额
 * @param amount 成交额（元）
 * @returns 格式化后的成交额字符串
 */
export function formatAmount(amount: number): string {
  if (amount >= 1e8) {
    return `${formatNumber(amount / 1e8, { decimals: 2 })} 亿元`
  }
  if (amount >= 1e4) {
    return `${formatNumber(amount / 1e4, { decimals: 2 })} 万元`
  }
  return `${formatNumber(amount, { decimals: 0 })} 元`
}

/**
 * 获取股票颜色
 * @param changeRate 涨跌幅
 * @returns 颜色类名
 */
export function getStockColor(changeRate: number): string {
  if (changeRate > 0) {
    return 'text-red-500'
  } else if (changeRate < 0) {
    return 'text-green-500'
  }
  return 'text-gray-500'
}

/**
 * 获取股票背景颜色
 * @param changeRate 涨跌幅
 * @returns 背景颜色类名
 */
export function getStockBgColor(changeRate: number): string {
  if (changeRate > 0) {
    return 'bg-red-50'
  } else if (changeRate < 0) {
    return 'bg-green-50'
  }
  return 'bg-gray-50'
}

/**
 * 验证股票代码格式
 * @param code 股票代码
 * @returns 是否有效
 */
export function isValidStockCode(code: string): boolean {
  if (!code) return false
  
  const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '')
  
  // 6位数字股票代码
  if (/^\d{6}$/.test(cleanCode)) {
    const firstDigit = cleanCode.charAt(0)
    return ['0', '2', '3', '6', '8', '9'].includes(firstDigit)
  }
  
  return false
}

/**
 * 股票代码排序
 * @param a 股票A
 * @param b 股票B
 * @returns 排序结果
 */
export function sortStockCodes(a: StockInfo, b: StockInfo): number {
  // 先按市场排序：SH > SZ > BJ
  const marketOrder = { 'SH': 1, 'SZ': 2, 'BJ': 3 }
  const marketA = marketOrder[a.market as keyof typeof marketOrder] || 4
  const marketB = marketOrder[b.market as keyof typeof marketOrder] || 4
  
  if (marketA !== marketB) {
    return marketA - marketB
  }
  
  // 再按代码排序
  return a.code.localeCompare(b.code)
}

/**
 * 过滤股票列表
 * @param stocks 股票列表
 * @param options 过滤选项
 * @returns 过滤后的股票列表
 */
export function filterStocks(
  stocks: StockInfo[],
  options: StockSearchOptions
): StockInfo[] {
  let filtered = [...stocks]
  
  // 按关键词过滤
  if (options.keyword) {
    const keyword = options.keyword.toLowerCase()
    filtered = filtered.filter(stock => 
      stock.code.toLowerCase().includes(keyword) ||
      stock.name.toLowerCase().includes(keyword)
    )
  }
  
  // 按市场过滤
  if (options.market) {
    filtered = filtered.filter(stock => stock.market === options.market)
  }
  
  // 按类型过滤
  if (options.stock_type) {
    filtered = filtered.filter(stock => stock.stock_type === options.stock_type)
  }
  
  // 限制数量
  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit)
  }
  
  return filtered
}

/**
 * 计算股票涨跌停价格
 * @param basePrice 基准价格（通常是前一日收盘价）
 * @param isUpLimit 是否为涨停
 * @returns 涨跌停价格
 */
export function calculateLimitPrice(basePrice: number, isUpLimit: boolean): number {
  const limitRate = isUpLimit ? 0.1 : -0.1
  return basePrice * (1 + limitRate)
}

/**
 * 判断是否为涨跌停
 * @param currentPrice 当前价格
 * @param basePrice 基准价格
 * @returns 涨跌停状态
 */
export function isLimitPrice(
  currentPrice: number,
  basePrice: number
): 'up' | 'down' | 'normal' {
  const upLimit = calculateLimitPrice(basePrice, true)
  const downLimit = calculateLimitPrice(basePrice, false)
  
  if (Math.abs(currentPrice - upLimit) < 0.01) {
    return 'up'
  }
  
  if (Math.abs(currentPrice - downLimit) < 0.01) {
    return 'down'
  }
  
  return 'normal'
}

/**
 * 获取股票状态文本
 * @param stock 股票信息
 * @returns 状态文本
 */
export function getStockStatusText(stock: StockPrice): string {
  const limitStatus = isLimitPrice(stock.current_price, stock.open_price)
  
  switch (limitStatus) {
    case 'up':
      return '涨停'
    case 'down':
      return '跌停'
    default:
      return stock.change_rate > 0 ? '上涨' : stock.change_rate < 0 ? '下跌' : '平盘'
  }
}

/**
 * 获取股票状态颜色
 * @param stock 股票信息
 * @returns 状态颜色
 */
export function getStockStatusColor(stock: StockPrice): string {
  const limitStatus = isLimitPrice(stock.current_price, stock.open_price)
  
  switch (limitStatus) {
    case 'up':
      return 'text-red-600'
    case 'down':
      return 'text-green-600'
    default:
      return getStockColor(stock.change_rate)
  }
} 