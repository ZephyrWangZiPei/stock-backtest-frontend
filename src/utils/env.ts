/**
 * 环境变量工具函数
 */

/**
 * 获取环境变量值
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值或默认值
 */
export function getEnv(key: string, defaultValue?: string): string {
  return import.meta.env[key] || defaultValue || ''
}

/**
 * 获取布尔类型环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 布尔值
 */
export function getBoolEnv(key: string, defaultValue = false): boolean {
  const value = getEnv(key)
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

/**
 * 获取数字类型环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 数字值
 */
export function getNumberEnv(key: string, defaultValue = 0): number {
  const value = getEnv(key)
  if (!value) return defaultValue
  const num = parseInt(value, 10)
  return isNaN(num) ? defaultValue : num
}

/**
 * 应用配置
 */
export const appConfig = {
  // 应用信息
  title: getEnv('VITE_APP_TITLE', 'Stock Scan'),
  version: getEnv('VITE_APP_VERSION', '1.0.0'),
  env: getEnv('VITE_APP_ENV', 'development'),
  
  // API配置
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'http://127.0.0.1:5000/api'),
  apiTimeout: getNumberEnv('VITE_API_TIMEOUT', 30000),
  
  // WebSocket配置
  wsUrl: getEnv('VITE_WS_URL', 'http://127.0.0.1:5000'),
  wsReconnectInterval: getNumberEnv('VITE_WS_RECONNECT_INTERVAL', 5000),
  wsMaxReconnectAttempts: getNumberEnv('VITE_WS_MAX_RECONNECT_ATTEMPTS', 5),
  
  // 调试配置
  debug: getBoolEnv('VITE_DEBUG', import.meta.env.DEV),
  
  // 运行时环境
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  isSSR: import.meta.env.SSR
}

/**
 * 验证必需的环境变量
 */
export function validateEnv(): void {
  const requiredEnvs = [
    'VITE_API_BASE_URL',
    'VITE_WS_URL'
  ]
  
  const missing = requiredEnvs.filter(key => !getEnv(key))
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing)
    console.warn('Please check your .env file configuration')
  }
}

// 在开发环境下验证环境变量
if (appConfig.isDev) {
  validateEnv()
}
