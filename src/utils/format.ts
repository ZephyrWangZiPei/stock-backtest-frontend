export const getChangeColor = (changeRate?: number): string => {
  if (changeRate === undefined || changeRate === null) return 'text-gray-400'
  return changeRate > 0 ? 'text-red-500' : changeRate < 0 ? 'text-green-500' : 'text-gray-400'
}

export const formatChange = (changeAmount?: number, changeRate?: number): string => {
  if (changeAmount === undefined || changeRate === undefined) return '--'
  const amountStr = changeAmount > 0 ? `+${changeAmount.toFixed(2)}` : changeAmount.toFixed(2)
  const rateStr = changeRate > 0 ? `+${changeRate.toFixed(2)}%` : `${changeRate.toFixed(2)}%`
  return `${amountStr} (${rateStr})`
}

export const formatVolume = (volume?: number): string => {
  if (volume === undefined || volume === null) return '--'
  // 单位：手，>= 1亿手 -> 亿手, >= 1万手 -> 万手
  if (volume >= 1e8) return `${(volume / 1e8).toFixed(2)} 亿手`
  if (volume >= 1e4) return `${(volume / 1e4).toFixed(2)} 万手`
  return `${volume.toFixed(0)} 手`
}

export const formatAmount = (amount?: number): string => {
  if (amount === undefined || amount === null) return '--'
  // 单位：元，>= 1亿 -> 亿，>= 1万 -> 万
  if (amount >= 1e8) return `${(amount / 1e8).toFixed(2)} 亿`
  if (amount >= 1e4) return `${(amount / 1e4).toFixed(2)} 万`
  return amount.toFixed(0)
}

export const formatTime = (time: string | Date | undefined): string => {
  if (!time) return '--'
  const date = typeof time === 'string' ? new Date(time) : time
  // 格式化为 YYYY-MM-DD HH:mm:ss
  return date
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '-')
} 