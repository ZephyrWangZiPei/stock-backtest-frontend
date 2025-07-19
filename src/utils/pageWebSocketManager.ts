import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { createWebSocketManager, WebSocketManager } from './websocketManager'
import { connectionStatus } from './connectionStatus'
import { ElMessage } from 'element-plus'

// 页面WebSocket配置映射
const PAGE_WEBSOCKET_CONFIGS = {
  '/dashboard': [
    {
      name: 'scheduler',
      url: 'http://127.0.0.1:5000/scheduler',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      description: '调度器连接'
    }
  ],
  '/scheduler': [
    {
      name: 'scheduler',
      url: 'http://127.0.0.1:5000/scheduler',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      description: '调度器连接'
    }
  ],
  '/top-backtest': [
    {
      name: 'top_backtest',
      url: 'http://127.0.0.1:5000',
      transports: ['websocket'],
      description: 'Top回测连接'
    }
  ],
  '/backtest': [
    {
      name: 'ai_analysis',
      url: 'http://127.0.0.1:5000/ai_analysis',
      path: '/socket.io',
      transports: ['websocket'],
      description: 'AI分析连接'
    }
  ],
  '/backtest-history': [
    {
      name: 'scheduler',
      url: 'http://127.0.0.1:5000/scheduler',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      description: '调度器连接'
    }
  ],
  '/websocket-test': [
    {
      name: 'scheduler',
      url: 'http://127.0.0.1:5000/scheduler',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      description: '调度器连接'
    },
    {
      name: 'task_monitor',
      url: 'http://127.0.0.1:5000/scheduler',
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      description: '任务监控连接'
    },
    {
      name: 'top_backtest',
      url: 'http://127.0.0.1:5000',
      transports: ['websocket'],
      description: 'Top回测连接'
    },
    {
      name: 'ai_analysis',
      url: 'http://127.0.0.1:5000/ai_analysis',
      path: '/socket.io',
      transports: ['websocket'],
      description: 'AI分析连接'
    }
  ]
}

// 页面WebSocket管理器类
export class PageWebSocketManager {
  private managers: Map<string, WebSocketManager> = new Map()
  private route: any
  private isInitialized = false

  constructor() {
    this.route = useRoute()
  }

  // 初始化页面WebSocket连接
  init() {
    if (this.isInitialized) return

    const currentPath = this.route.path
    const configs = PAGE_WEBSOCKET_CONFIGS[currentPath as keyof typeof PAGE_WEBSOCKET_CONFIGS] || []

    console.log(`[PageWebSocketManager] 初始化页面 ${currentPath} 的WebSocket连接，共 ${configs.length} 个连接`)

    configs.forEach(config => {
      this.createConnection(config)
    })

    this.isInitialized = true
  }

  // 创建单个连接
  private createConnection(config: any) {
    const { name, description, ...connectionConfig } = config

    // 检查是否已经存在连接
    if (this.managers.has(name)) {
      console.log(`[PageWebSocketManager] 连接 ${name} 已存在，跳过创建`)
      return
    }

    // 检查当前连接状态
    const isCurrentlyConnected = connectionStatus[name] || false

    console.log(`[PageWebSocketManager] 创建连接 ${name} (${description})，当前状态: ${isCurrentlyConnected ? '已连接' : '未连接'}`)

    const manager = createWebSocketManager({
      ...connectionConfig,
      connectionName: name,
      onConnect: (socket) => {
        console.log(`[PageWebSocketManager] ${description} 连接成功`)
        if (!isCurrentlyConnected) {
          ElMessage.success(`${description} 连接成功`)
        }
      },
      onDisconnect: () => {
        console.log(`[PageWebSocketManager] ${description} 连接断开`)
      },
      onConnectError: (error) => {
        console.error(`[PageWebSocketManager] ${description} 连接错误:`, error)
        ElMessage.error(`${description} 连接失败: ${error.message}`)
      },
      onReconnect: (attemptNumber) => {
        console.log(`[PageWebSocketManager] ${description} 重连成功，尝试次数: ${attemptNumber}`)
        ElMessage.success(`${description} 重连成功`)
      },
      onReconnectAttempt: (attemptNumber) => {
        console.log(`[PageWebSocketManager] ${description} 重连尝试 ${attemptNumber}`)
      },
      onReconnectError: (error) => {
        console.error(`[PageWebSocketManager] ${description} 重连错误:`, error)
      },
      onReconnectFailed: () => {
        console.error(`[PageWebSocketManager] ${description} 重连失败`)
        ElMessage.error(`${description} 重连失败，请检查网络连接`)
      }
    })

    this.managers.set(name, manager)

    // 如果当前未连接，则尝试连接
    if (!isCurrentlyConnected) {
      console.log(`[PageWebSocketManager] 尝试连接 ${name}`)
      manager.connect()
    }
  }

  // 检查并重连所有断开的连接
  checkAndReconnect() {
    const currentPath = this.route.path
    const configs = PAGE_WEBSOCKET_CONFIGS[currentPath as keyof typeof PAGE_WEBSOCKET_CONFIGS] || []

    console.log(`[PageWebSocketManager] 检查页面 ${currentPath} 的连接状态`)

    configs.forEach(config => {
      const { name, description } = config
      const isConnected = connectionStatus[name] || false
      const manager = this.managers.get(name)

      if (!isConnected && manager) {
        console.log(`[PageWebSocketManager] 检测到 ${description} 未连接，尝试重连`)
        manager.forceReconnect()
      }
    })
  }

  // 断开所有连接
  disconnect() {
    console.log(`[PageWebSocketManager] 断开所有连接`)
    this.managers.forEach((manager, name) => {
      console.log(`[PageWebSocketManager] 断开连接 ${name}`)
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
}

// 创建页面WebSocket管理器的组合式函数
export function usePageWebSocket() {
  const pageManager = new PageWebSocketManager()

  onMounted(() => {
    // 页面挂载时初始化连接
    pageManager.init()

    // 延迟检查连接状态，确保所有连接都有机会建立
    setTimeout(() => {
      pageManager.checkAndReconnect()
    }, 2000)
  })

  onUnmounted(() => {
    // 页面卸载时断开连接
    pageManager.disconnect()
  })

  return {
    pageManager,
    // 提供便捷方法
    checkAndReconnect: () => pageManager.checkAndReconnect(),
    disconnect: () => pageManager.disconnect(),
    getManager: (name: string) => pageManager.getManager(name),
    hasConnections: () => pageManager.hasConnections()
  }
}

// 路由守卫，用于页面切换时的连接管理
export function setupPageWebSocketGuard() {
  const pageManager = new PageWebSocketManager()

  return {
    beforeRouteEnter: () => {
      // 路由进入前初始化连接
      pageManager.init()
    },
    beforeRouteLeave: () => {
      // 路由离开前断开连接
      pageManager.disconnect()
    }
  }
} 