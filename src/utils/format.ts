/**
 * 格式化工具函数
 * 提供日期、时间、数字等格式化方法
 */

/**
 * 日期格式化选项
 */
export interface DateFormatOptions {
  year?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  day?: 'numeric' | '2-digit'
  hour?: 'numeric' | '2-digit'
  minute?: 'numeric' | '2-digit'
  second?: 'numeric' | '2-digit'
  weekday?: 'long' | 'short' | 'narrow'
  timeZoneName?: 'long' | 'short'
}

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化字符串或选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | number,
  format: string | DateFormatOptions = 'YYYY-MM-DD'
): string {
  const dateObj = new Date(date)
  
  if (typeof format === 'object') {
    return dateObj.toLocaleDateString('zh-CN', format)
  }
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化时间
 * @param date 日期对象或日期字符串
 * @param includeSeconds 是否包含秒数
 * @returns 格式化后的时间字符串
 */
export function formatTime(
  date: Date | string | number,
  includeSeconds = false
): string {
  const dateObj = new Date(date)
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')
  
  return includeSeconds 
    ? `${hours}:${minutes}:${seconds}`
    : `${hours}:${minutes}`
}

/**
 * 格式化相对时间
 * @param date 日期对象或日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return '刚刚'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}小时前`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}天前`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}年前`
}

/**
 * 格式化数字
 * @param num 数字
 * @param options 格式化选项
 * @returns 格式化后的数字字符串
 */
export function formatNumber(
  num: number,
  options: {
    decimals?: number
    thousandsSeparator?: boolean
    currency?: string
    percentage?: boolean
  } = {}
): string {
  const {
    decimals = 2,
    thousandsSeparator = true,
    currency,
    percentage = false
  } = options
  
  let formatted = num.toFixed(decimals)
  
  if (thousandsSeparator) {
    const parts = formatted.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    formatted = parts.join('.')
  }
  
  if (currency) {
    formatted = `${currency}${formatted}`
  }
  
  if (percentage) {
    formatted = `${formatted}%`
  }
  
  return formatted
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 格式化百分比
 * @param value 数值
 * @param total 总数
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(
  value: number,
  total: number,
  decimals = 2
): string {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * 格式化股票代码
 * @param code 股票代码
 * @returns 格式化后的股票代码
 */
export function formatStockCode(code: string): string {
  if (!code) return ''
  
  // 移除所有非字母数字字符
  const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '')
  
  // 如果是6位数字，添加市场前缀
  if (/^\d{6}$/.test(cleanCode)) {
    const firstDigit = cleanCode.charAt(0)
    if (['0', '2', '3'].includes(firstDigit)) {
      return `sz.${cleanCode}`
    } else if (['6', '9'].includes(firstDigit)) {
      return `sh.${cleanCode}`
    }
  }
  
  return cleanCode
}

/**
 * 格式化股票名称
 * @param name 股票名称
 * @param maxLength 最大长度
 * @returns 格式化后的股票名称
 */
export function formatStockName(
  name: string,
  maxLength = 10
): string {
  if (!name) return ''
  
  if (name.length <= maxLength) {
    return name
  }
  
  return name.substring(0, maxLength) + '...'
}

/**
 * 格式化金额
 * @param amount 金额
 * @param currency 货币符号
 * @param decimals 小数位数
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(
  amount: number,
  currency = '¥',
  decimals = 2
): string {
  return formatNumber(amount, {
    decimals,
    thousandsSeparator: true,
    currency
  })
}

/**
 * 格式化价格变化
 * @param change 价格变化
 * @param price 当前价格
 * @returns 格式化后的价格变化字符串
 */
export function formatPriceChange(
  change: number,
  price: number
): { text: string; type: 'positive' | 'negative' | 'neutral' } {
  if (change === 0) {
    return {
      text: '0.00 (0.00%)',
      type: 'neutral'
    }
  }
  
  const changeText = formatNumber(change, { decimals: 2 })
  const percentage = formatPercentage(Math.abs(change), price, 2)
  const sign = change > 0 ? '+' : '-'
  
  return {
    text: `${sign}${changeText} (${sign}${percentage})`,
    type: change > 0 ? 'positive' : 'negative'
  }
}

/**
 * 格式化持续时间
 * @param seconds 秒数
 * @returns 格式化后的持续时间字符串
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}分${remainingSeconds}秒`
      : `${minutes}分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}小时${remainingMinutes}分钟`
      : `${hours}小时`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return remainingHours > 0
    ? `${days}天${remainingHours}小时`
    : `${days}天`
} 