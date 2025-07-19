<template>
  <div class="websocket-test-container">
    <div class="test-header">
      <h1>WebSocket 重连机制测试</h1>
      <p>测试所有WebSocket连接的重连功能</p>
    </div>

    <div class="connection-grid">
      <!-- 调度器连接 -->
      <div class="connection-card">
        <div class="card-header">
          <h3>调度器连接</h3>
          <div class="status-indicator" :class="{ 'connected': schedulerConnected }">
            {{ schedulerConnected ? '已连接' : '未连接' }}
          </div>
        </div>
        <div class="card-content">
          <p>连接名称: scheduler</p>
          <p>重连次数: {{ schedulerReconnectCount }}</p>
          <div class="button-group">
            <el-button @click="testSchedulerConnection" type="primary">测试连接</el-button>
            <el-button @click="disconnectScheduler" type="danger">断开连接</el-button>
          </div>
        </div>
      </div>

      <!-- 任务监控连接 -->
      <div class="connection-card">
        <div class="card-header">
          <h3>任务监控连接</h3>
          <div class="status-indicator" :class="{ 'connected': taskMonitorConnected }">
            {{ taskMonitorConnected ? '已连接' : '未连接' }}
          </div>
        </div>
        <div class="card-content">
          <p>连接名称: task_monitor</p>
          <p>重连次数: {{ taskMonitorReconnectCount }}</p>
          <div class="button-group">
            <el-button @click="testTaskMonitorConnection" type="primary">测试连接</el-button>
            <el-button @click="disconnectTaskMonitor" type="danger">断开连接</el-button>
          </div>
        </div>
      </div>

      <!-- Top回测连接 -->
      <div class="connection-card">
        <div class="card-header">
          <h3>Top回测连接</h3>
          <div class="status-indicator" :class="{ 'connected': topBacktestConnected }">
            {{ topBacktestConnected ? '已连接' : '未连接' }}
          </div>
        </div>
        <div class="card-content">
          <p>连接名称: top_backtest</p>
          <p>重连次数: {{ topBacktestReconnectCount }}</p>
          <div class="button-group">
            <el-button @click="testTopBacktestConnection" type="primary">测试连接</el-button>
            <el-button @click="disconnectTopBacktest" type="danger">断开连接</el-button>
          </div>
        </div>
      </div>

      <!-- AI分析连接 -->
      <div class="connection-card">
        <div class="card-header">
          <h3>AI分析连接</h3>
          <div class="status-indicator" :class="{ 'connected': aiAnalysisConnected }">
            {{ aiAnalysisConnected ? '已连接' : '未连接' }}
          </div>
        </div>
        <div class="card-content">
          <p>连接名称: ai_analysis</p>
          <p>重连次数: {{ aiAnalysisReconnectCount }}</p>
          <div class="button-group">
            <el-button @click="testAiAnalysisConnection" type="primary">测试连接</el-button>
            <el-button @click="disconnectAiAnalysis" type="danger">断开连接</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局连接状态 -->
    <div class="global-status">
      <h3>全局连接状态</h3>
      <div class="status-summary">
        <p>总连接数: {{ totalConnections }}</p>
        <p>已连接数: {{ connectedCount }}</p>
        <p>连接率: {{ connectionRate }}%</p>
      </div>
      <div class="button-group">
        <el-button @click="testAllConnections" type="success">测试所有连接</el-button>
        <el-button @click="disconnectAll" type="warning">断开所有连接</el-button>
      </div>
    </div>

    <!-- 日志区域 -->
    <div class="log-section">
      <h3>连接日志</h3>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
      <el-button @click="clearLogs" size="small">清空日志</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createWebSocketManager, WebSocketManager } from '@/utils/websocketManager'
import { connectionStatus } from '@/utils/connectionStatus'

// 连接管理器
let schedulerManager: WebSocketManager | null = null
let taskMonitorManager: WebSocketManager | null = null
let topBacktestManager: WebSocketManager | null = null
let aiAnalysisManager: WebSocketManager | null = null

// 连接状态
const schedulerConnected = ref(false)
const taskMonitorConnected = ref(false)
const topBacktestConnected = ref(false)
const aiAnalysisConnected = ref(false)

// 重连计数
const schedulerReconnectCount = ref(0)
const taskMonitorReconnectCount = ref(0)
const topBacktestReconnectCount = ref(0)
const aiAnalysisReconnectCount = ref(0)

// 日志
const logs = ref<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }>>([])

// 计算属性
const totalConnections = computed(() => 4)
const connectedCount = computed(() => {
  return [schedulerConnected.value, taskMonitorConnected.value, topBacktestConnected.value, aiAnalysisConnected.value]
    .filter(Boolean).length
})
const connectionRate = computed(() => Math.round((connectedCount.value / totalConnections.value) * 100))

// 添加日志
const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

// 清空日志
const clearLogs = () => {
  logs.value = []
}

// 测试调度器连接
const testSchedulerConnection = () => {
  if (schedulerManager) {
    schedulerManager.disconnect()
  }

  schedulerManager = createWebSocketManager({
    url: 'http://localhost:5000/scheduler',
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    connectionName: 'scheduler',
    onConnect: (socket) => {
      schedulerConnected.value = true
      addLog('调度器连接成功', 'success')
    },
    onDisconnect: () => {
      schedulerConnected.value = false
      addLog('调度器连接断开', 'warning')
    },
    onConnectError: (error) => {
      addLog(`调度器连接错误: ${error.message}`, 'error')
    },
    onReconnect: (attemptNumber) => {
      schedulerReconnectCount.value = attemptNumber
      addLog(`调度器重连成功，尝试次数: ${attemptNumber}`, 'success')
    },
    onReconnectAttempt: (attemptNumber) => {
      addLog(`调度器重连尝试 ${attemptNumber}`, 'info')
    },
    onReconnectError: (error) => {
      addLog(`调度器重连错误: ${error.message}`, 'error')
    },
    onReconnectFailed: () => {
      addLog('调度器重连失败', 'error')
    }
  })

  schedulerManager.connect()
  addLog('正在连接调度器...', 'info')
}

// 测试任务监控连接
const testTaskMonitorConnection = () => {
  if (taskMonitorManager) {
    taskMonitorManager.disconnect()
  }

  taskMonitorManager = createWebSocketManager({
    url: 'http://localhost:5000/scheduler',
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    connectionName: 'task_monitor',
    onConnect: (socket) => {
      taskMonitorConnected.value = true
      addLog('任务监控连接成功', 'success')
    },
    onDisconnect: () => {
      taskMonitorConnected.value = false
      addLog('任务监控连接断开', 'warning')
    },
    onConnectError: (error) => {
      addLog(`任务监控连接错误: ${error.message}`, 'error')
    },
    onReconnect: (attemptNumber) => {
      taskMonitorReconnectCount.value = attemptNumber
      addLog(`任务监控重连成功，尝试次数: ${attemptNumber}`, 'success')
    },
    onReconnectAttempt: (attemptNumber) => {
      addLog(`任务监控重连尝试 ${attemptNumber}`, 'info')
    },
    onReconnectError: (error) => {
      addLog(`任务监控重连错误: ${error.message}`, 'error')
    },
    onReconnectFailed: () => {
      addLog('任务监控重连失败', 'error')
    }
  })

  taskMonitorManager.connect()
  addLog('正在连接任务监控...', 'info')
}

// 测试Top回测连接
const testTopBacktestConnection = () => {
  if (topBacktestManager) {
    topBacktestManager.disconnect()
  }

  topBacktestManager = createWebSocketManager({
    url: 'http://localhost:5000/scheduler',
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    connectionName: 'top_backtest',
    onConnect: (socket) => {
      topBacktestConnected.value = true
      addLog('Top回测连接成功', 'success')
    },
    onDisconnect: () => {
      topBacktestConnected.value = false
      addLog('Top回测连接断开', 'warning')
    },
    onConnectError: (error) => {
      addLog(`Top回测连接错误: ${error.message}`, 'error')
    },
    onReconnect: (attemptNumber) => {
      topBacktestReconnectCount.value = attemptNumber
      addLog(`Top回测重连成功，尝试次数: ${attemptNumber}`, 'success')
    },
    onReconnectAttempt: (attemptNumber) => {
      addLog(`Top回测重连尝试 ${attemptNumber}`, 'info')
    },
    onReconnectError: (error) => {
      addLog(`Top回测重连错误: ${error.message}`, 'error')
    },
    onReconnectFailed: () => {
      addLog('Top回测重连失败', 'error')
    }
  })

  topBacktestManager.connect()
  addLog('正在连接Top回测...', 'info')
}

// 测试AI分析连接
const testAiAnalysisConnection = () => {
  if (aiAnalysisManager) {
    aiAnalysisManager.disconnect()
  }

  aiAnalysisManager = createWebSocketManager({
    url: 'http://localhost:5000/ai_analysis',
    path: '/socket.io',
    transports: ['websocket'],
    connectionName: 'ai_analysis',
    onConnect: (socket) => {
      aiAnalysisConnected.value = true
      addLog('AI分析连接成功', 'success')
    },
    onDisconnect: () => {
      aiAnalysisConnected.value = false
      addLog('AI分析连接断开', 'warning')
    },
    onConnectError: (error) => {
      addLog(`AI分析连接错误: ${error.message}`, 'error')
    },
    onReconnect: (attemptNumber) => {
      aiAnalysisReconnectCount.value = attemptNumber
      addLog(`AI分析重连成功，尝试次数: ${attemptNumber}`, 'success')
    },
    onReconnectAttempt: (attemptNumber) => {
      addLog(`AI分析重连尝试 ${attemptNumber}`, 'info')
    },
    onReconnectError: (error) => {
      addLog(`AI分析重连错误: ${error.message}`, 'error')
    },
    onReconnectFailed: () => {
      addLog('AI分析重连失败', 'error')
    }
  })

  aiAnalysisManager.connect()
  addLog('正在连接AI分析...', 'info')
}

// 断开连接
const disconnectScheduler = () => {
  if (schedulerManager) {
    schedulerManager.disconnect()
    addLog('调度器连接已断开', 'warning')
  }
}

const disconnectTaskMonitor = () => {
  if (taskMonitorManager) {
    taskMonitorManager.disconnect()
    addLog('任务监控连接已断开', 'warning')
  }
}

const disconnectTopBacktest = () => {
  if (topBacktestManager) {
    topBacktestManager.disconnect()
    addLog('Top回测连接已断开', 'warning')
  }
}

const disconnectAiAnalysis = () => {
  if (aiAnalysisManager) {
    aiAnalysisManager.disconnect()
    addLog('AI分析连接已断开', 'warning')
  }
}

// 测试所有连接
const testAllConnections = () => {
  testSchedulerConnection()
  testTaskMonitorConnection()
  testTopBacktestConnection()
  testAiAnalysisConnection()
  addLog('正在测试所有连接...', 'info')
}

// 断开所有连接
const disconnectAll = () => {
  disconnectScheduler()
  disconnectTaskMonitor()
  disconnectTopBacktest()
  disconnectAiAnalysis()
  addLog('所有连接已断开', 'warning')
}

// 监听连接状态变化
const updateConnectionStatus = () => {
  schedulerConnected.value = connectionStatus.scheduler || false
  taskMonitorConnected.value = connectionStatus.task_monitor || false
  topBacktestConnected.value = connectionStatus.top_backtest || false
  aiAnalysisConnected.value = connectionStatus.ai_analysis || false
}

// 定时更新连接状态
let statusInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateConnectionStatus()
  statusInterval = setInterval(updateConnectionStatus, 500) // 更频繁地更新状态
  addLog('WebSocket测试页面已加载', 'info')
  
  // 立即测试所有连接
  setTimeout(() => {
    testAllConnections()
  }, 1000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
  disconnectAll()
})
</script>

<style scoped>
.websocket-test-container {
  @apply min-h-screen p-6 bg-gradient-to-br from-gray-950 to-gray-800 text-gray-100;
}

.test-header {
  @apply text-center mb-8;
}

.test-header h1 {
  @apply text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2;
}

.test-header p {
  @apply text-gray-400;
}

.connection-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-8;
}

.connection-card {
  @apply bg-gray-800/60 border border-gray-700 rounded-lg p-6 shadow-lg;
}

.card-header {
  @apply flex justify-between items-center mb-4;
}

.card-header h3 {
  @apply text-lg font-semibold text-white;
}

.status-indicator {
  @apply px-3 py-1 rounded-full text-sm font-medium;
  @apply bg-red-500/20 text-red-400 border border-red-500/30;
}

.status-indicator.connected {
  @apply bg-green-500/20 text-green-400 border border-green-500/30;
}

.card-content p {
  @apply text-gray-300 mb-2;
}

.button-group {
  @apply flex gap-2 mt-4;
}

.global-status {
  @apply bg-gray-800/60 border border-gray-700 rounded-lg p-6 mb-8;
}

.global-status h3 {
  @apply text-lg font-semibold text-white mb-4;
}

.status-summary {
  @apply grid grid-cols-3 gap-4 mb-4;
}

.status-summary p {
  @apply text-center p-3 bg-gray-700/50 rounded-lg;
}

.log-section {
  @apply bg-gray-800/60 border border-gray-700 rounded-lg p-6;
}

.log-section h3 {
  @apply text-lg font-semibold text-white mb-4;
}

.log-container {
  @apply bg-gray-900/50 border border-gray-600 rounded-lg p-4 h-64 overflow-y-auto mb-4;
}

.log-entry {
  @apply flex gap-3 text-sm mb-2;
}

.log-entry.info {
  @apply text-blue-400;
}

.log-entry.success {
  @apply text-green-400;
}

.log-entry.error {
  @apply text-red-400;
}

.log-entry.warning {
  @apply text-yellow-400;
}

.log-time {
  @apply text-gray-500 font-mono;
}

.log-message {
  @apply flex-1;
}
</style> 