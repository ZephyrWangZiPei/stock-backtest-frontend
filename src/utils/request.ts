import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { appConfig } from './env'

// 扩展 axios 配置类型以支持 metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}

// 获取基础URL，支持环境变量配置
const getBaseURL = (): string => {
  // 开发环境使用代理，生产环境使用环境变量
  if (appConfig.isDev) {
    return '/api' // 开发环境使用Vite代理
  }
  return appConfig.apiBaseUrl
}

// 创建 axios 实例
const service = axios.create({
  baseURL: getBaseURL(),
  timeout: appConfig.apiTimeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    // 可以在这里统一添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳，用于调试
    config.metadata = { startTime: new Date() }

    return config
  },
  error => {
    console.error('Request interceptor error:', error)
    ElMessage.error('请求配置错误')
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 计算请求耗时
    const endTime = new Date()
    const startTime = response.config.metadata?.startTime
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime()
      // API请求耗时日志
    }

    // 检查业务状态码
    const { data } = response
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        const errorMessage = data.message || '请求失败'
        ElMessage.error(errorMessage)
        return Promise.reject(new Error(errorMessage))
      }
    }

    return data
  },
  (error: AxiosError) => {
    console.error('Response interceptor error:', error)

    let errorMessage = '请求失败'

    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response
      switch (status) {
        case 400:
          errorMessage = '请求参数错误'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          // 可以在这里处理登录跳转
          break
        case 403:
          errorMessage = '拒绝访问'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 502:
          errorMessage = '网关错误'
          break
        case 503:
          errorMessage = '服务不可用'
          break
        default:
          errorMessage = `请求失败 (${status})`
      }

      // 如果后端返回了具体错误信息，使用后端的错误信息
      if (data && typeof data === 'object' && 'message' in data) {
        errorMessage = data.message as string
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络'
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误'
    }

    ElMessage({
      message: errorMessage,
      type: 'error',
      duration: 5000
    })

    return Promise.reject(error)
  }
)

export default service 