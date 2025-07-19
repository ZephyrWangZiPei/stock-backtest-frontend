import { createWebSocketManager, WebSocketManager } from './websocketManager'
import { connectionStatus } from './connectionStatus'
import { ElMessage } from 'element-plus'

// 全局WebSocket连接配置
const GLOBAL_WEBSOCKET_CONFIGS = [
  {
    name: 'scheduler',
    url: 'http://127.0.0.1:5000/scheduler',
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    description: '调度器连接'
  }
]

class GlobalWebSocketManager {
  private managers: Map<string, WebSocketManager> = new Map()
  private isInitialized = false
  private checkInterval: NodeJS.Timeout | null = null

  // 初始化全局WebSocket连接
  init() {
    if (this.isInitialized) return

    console.log('[GlobalWebSocketManager] 初始化全局WebSocket连接')

    GLOBAL_WEBSOCKET_CONFIGS.forEach(config => {
      this.createConnection(config)
    })

    this.isInitialized = true

    // 启动定期检查
    this.startPeriodicCheck()
  }

  // 创建单个连接
  private createConnection(config: any) {
    const { name, description, ...connectionConfig } = config

    // 检查是否已经存在连接
    if (this.managers.has(name)) {
      console.log(`[GlobalWebSocketManager] 连接 ${name} 已存在，跳过创建`)
      return
    }

    console.log(`[GlobalWebSocketManager] 创建全局连接 ${name} (${description})`)

    const manager = createWebSocketManager({
      ...connectionConfig,
      connectionName: name,
      onConnect: (socket) => {
        console.log(`[GlobalWebSocketManager] ${description} 连接成功`)
      },
      onDisconnect: () => {
        console.log(`[GlobalWebSocketManager] ${description} 连接断开`)
      },
      onConnectError: (error) => {
        console.error(`[GlobalWebSocketManager] ${description} 连接错误:`, error)
      },
      onReconnect: (attemptNumber) => {
        console.log(`[GlobalWebSocketManager] ${description} 重连成功，尝试次数: ${attemptNumber}`)
      },
      onReconnectAttempt: (attemptNumber) => {
        console.log(`[GlobalWebSocketManager] ${description} 重连尝试 ${attemptNumber}`)
      },
      onReconnectError: (error) => {
        console.error(`[GlobalWebSocketManager] ${description} 重连错误:`, error)
      },
      onReconnectFailed: () => {
        console.error(`[GlobalWebSocketManager] ${description} 重连失败`)
      }
    })

    this.managers.set(name, manager)
    manager.connect()
  }

  // 启动定期检查
  private startPeriodicCheck() {
    this.checkInterval = setInterval(() => {
      this.checkAndReconnect()
    }, 10000) // 每10秒检查一次
  }

  // 停止定期检查
  private stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // 检查并重连断开的连接
  checkAndReconnect() {
    GLOBAL_WEBSOCKET_CONFIGS.forEach(config => {
      const { name, description } = config
      const isConnected = connectionStatus[name] || false
      const manager = this.managers.get(name)

      if (!isConnected && manager) {
        console.log(`[GlobalWebSocketManager] 检测到 ${description} 未连接，尝试重连`)
        manager.forceReconnect()
      }
    })
  }

  // 断开所有连接
  disconnect() {
    console.log('[GlobalWebSocketManager] 断开所有全局连接')
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.managers.forEach((manager, name) => {
      console.log(`[GlobalWebSocketManager] 断开连接 ${name}`)
      manager.disconnect()
    })
    this.managers.clear()
    this.isInitialized = false
  }

  // 获取连接管理器
  getManager(name: string): WebSocketManager | undefined {
    return this.managers.get(name)
  }

  // 获取所有连接管理器
  getAllManagers(): Map<string, WebSocketManager> {
    return this.managers
  }

  // 检查是否有连接
  hasConnections(): boolean {
    return this.managers.size > 0
  }

  // 获取连接状态统计
  getConnectionStats() {
    const total = this.managers.size
    const connected = Array.from(this.managers.values()).filter(m => m.isConnected).length
    const rate = total > 0 ? Math.round((connected / total) * 100) : 0

    return {
      total,
      connected,
      rate
    }
  }

  // 销毁所有连接
  destroy() {
    console.log('[GlobalWebSocketManager] 销毁所有全局WebSocket连接')

    this.managers.forEach((manager, name) => {
      console.log(`[GlobalWebSocketManager] 销毁连接 ${name}`)
      // 使用destroy方法而不是disconnect，确保完全清理
      if (typeof manager.destroy === 'function') {
        manager.destroy()
      } else {
        manager.disconnect()
      }
    })

    this.managers.clear()
    this.isInitialized = false

    // 停止定期检查
    this.stopPeriodicCheck()
  }
}

// 创建全局WebSocket管理器实例
export const globalWebSocketManager = new GlobalWebSocketManager()

// 导出便捷方法
export const initGlobalWebSockets = () => globalWebSocketManager.init()
export const disconnectGlobalWebSockets = () => globalWebSocketManager.disconnect()
export const destroyGlobalWebSockets = () => globalWebSocketManager.destroy()
export const getGlobalWebSocketManager = (name: string) => globalWebSocketManager.getManager(name)
export const getGlobalConnectionStats = () => globalWebSocketManager.getConnectionStats()