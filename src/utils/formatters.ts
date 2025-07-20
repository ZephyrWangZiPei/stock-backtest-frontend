/**
 * 格式化工具函数
 * 统一处理数字、日期、百分比等格式化
 */

// =============================================================================
// 数字格式化
// =============================================================================

/**
 * 格式化百分比
 * @param value 数值 (0-1)
 * @param decimals 小数位数
 * @param showSymbol 是否显示百分号
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 2,
  showSymbol: boolean = true
): string {
  if (value == null) return '-';
  
  const percentage = (value * 100).toFixed(decimals);
  return showSymbol ? `${percentage}%` : percentage;
}

/**
 * 格式化货币
 * @param value 数值
 * @param currency 货币符号
 * @param decimals 小数位数
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = '¥',
  decimals: number = 2
): string {
  if (value == null) return '-';
  
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 格式化大数字（添加千分位分隔符）
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的大数字字符串
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value == null) return '-';
  
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// =============================================================================
// 日期时间格式化
// =============================================================================

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化模式
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'iso' | 'relative' = 'short'
): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('zh-CN');
    case 'long':
      return dateObj.toLocaleString('zh-CN');
    case 'iso':
      return dateObj.toISOString().split('T')[0];
    case 'relative':
      return formatRelativeTime(dateObj);
    default:
      return dateObj.toLocaleDateString('zh-CN');
  }
}

/**
 * 格式化相对时间
 * @param date 日期对象
 * @returns 相对时间字符串
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

/**
 * 格式化时间戳
 * @param timestamp 时间戳
 * @param format 格式化模式
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(
  timestamp: number | null | undefined,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  if (timestamp == null) return '-';
  
  const date = new Date(timestamp);
  return formatDate(date, format);
}

// =============================================================================
// 股票相关格式化
// =============================================================================

/**
 * 格式化股票代码
 * @param code 股票代码
 * @returns 格式化后的股票代码
 */
export function formatStockCode(code: string | null | undefined): string {
  if (!code) return '-';
  
  // 移除前缀并格式化
  const cleanCode = code.replace(/^(sh|sz)\./, '');
  return cleanCode.toUpperCase();
}

/**
 * 格式化股票名称
 * @param name 股票名称
 * @param maxLength 最大长度
 * @returns 格式化后的股票名称
 */
export function formatStockName(
  name: string | null | undefined,
  maxLength: number = 10
): string {
  if (!name) return '-';
  
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
}

/**
 * 格式化涨跌幅
 * @param change 涨跌幅
 * @param decimals 小数位数
 * @returns 格式化后的涨跌幅字符串
 */
export function formatChange(
  change: number | null | undefined,
  decimals: number = 2
): string {
  if (change == null) return '-';
  
  const sign = change >= 0 ? '+' : '';
  return `${sign}${formatPercentage(change, decimals)}`;
}

/**
 * 获取涨跌颜色
 * @param change 涨跌幅
 * @param reverse 是否反转颜色（用于某些场景）
 * @returns CSS颜色值
 */
export function getChangeColor(
  change: number | null | undefined,
  reverse: boolean = false
): string {
  if (change == null) return '#6b7280'; // 灰色
  
  const isPositive = change > 0;
  const shouldBeRed = reverse ? !isPositive : isPositive;
  
  return shouldBeRed ? '#ef4444' : '#22c55e'; // 红色 : 绿色
}

// =============================================================================
// 性能指标格式化
// =============================================================================

/**
 * 格式化胜率
 * @param winRate 胜率 (0-1)
 * @param decimals 小数位数
 * @returns 格式化后的胜率字符串
 */
export function formatWinRate(
  winRate: number | null | undefined,
  decimals: number = 2
): string {
  return formatPercentage(winRate, decimals);
}

/**
 * 格式化夏普比率
 * @param sharpeRatio 夏普比率
 * @param decimals 小数位数
 * @returns 格式化后的夏普比率字符串
 */
export function formatSharpeRatio(
  sharpeRatio: number | null | undefined,
  decimals: number = 3
): string {
  if (sharpeRatio == null) return '-';
  return sharpeRatio.toFixed(decimals);
}

/**
 * 格式化最大回撤
 * @param maxDrawdown 最大回撤 (0-1)
 * @param decimals 小数位数
 * @returns 格式化后的最大回撤字符串
 */
export function formatMaxDrawdown(
  maxDrawdown: number | null | undefined,
  decimals: number = 2
): string {
  if (maxDrawdown == null) return '-';
  return formatPercentage(Math.abs(maxDrawdown), decimals);
}

/**
 * 格式化盈亏比
 * @param profitFactor 盈亏比
 * @param decimals 小数位数
 * @returns 格式化后的盈亏比字符串
 */
export function formatProfitFactor(
  profitFactor: number | null | undefined,
  decimals: number = 2
): string {
  if (profitFactor == null) return '-';
  
  if (profitFactor === Infinity) return '∞';
  if (profitFactor === -Infinity) return '-∞';
  
  return profitFactor.toFixed(decimals);
}

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 格式化持续时间
 * @param milliseconds 毫秒数
 * @returns 格式化后的持续时间字符串
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`;
  return `${seconds}秒`;
}

/**
 * 格式化文件大小（简化版）
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatBytes(bytes: number): string {
  return formatFileSize(bytes);
}

/**
 * 格式化数字范围
 * @param min 最小值
 * @param max 最大值
 * @param decimals 小数位数
 * @returns 格式化后的范围字符串
 */
export function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  decimals: number = 2
): string {
  if (min == null || max == null) return '-';
  return `${formatNumber(min, decimals)} - ${formatNumber(max, decimals)}`;
}

/**
 * 格式化列表
 * @param items 项目列表
 * @param separator 分隔符
 * @param maxItems 最大显示项目数
 * @returns 格式化后的列表字符串
 */
export function formatList(
  items: (string | number)[],
  separator: string = ', ',
  maxItems: number = 5
): string {
  if (!items || items.length === 0) return '-';
  
  if (items.length <= maxItems) {
    return items.join(separator);
  }
  
  const displayed = items.slice(0, maxItems);
  const remaining = items.length - maxItems;
  
  return `${displayed.join(separator)} +${remaining}项`;
}

/**
 * 格式化文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名
 */
export function formatFileExtension(filename: string): string {
  if (!filename) return '';
  
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * 格式化文件类型
 * @param filename 文件名
 * @returns 文件类型描述
 */
export function formatFileType(filename: string): string {
  const ext = formatFileExtension(filename);
  
  const typeMap: Record<string, string> = {
    'jpg': 'JPEG图片',
    'jpeg': 'JPEG图片',
    'png': 'PNG图片',
    'gif': 'GIF图片',
    'svg': 'SVG图片',
    'pdf': 'PDF文档',
    'doc': 'Word文档',
    'docx': 'Word文档',
    'xls': 'Excel表格',
    'xlsx': 'Excel表格',
    'txt': '文本文件',
    'csv': 'CSV文件',
    'json': 'JSON文件',
    'xml': 'XML文件',
    'zip': '压缩文件',
    'rar': '压缩文件',
    '7z': '压缩文件',
  };
  
  return typeMap[ext] || '未知文件';
} 