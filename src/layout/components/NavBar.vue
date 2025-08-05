<template>
  <div class="navbar">
    <div class="navbar-left">
      <div class="logo">
        <el-icon>
          <TrendCharts />
        </el-icon>
        <span class="logo-text">股票扫描系统</span>
      </div>
    </div>

    <div class="navbar-center">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="item in breadcrumbs"
          :key="item.path"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="navbar-right">
      <!-- 连接状态指示器 -->
      <div
        class="status-indicator"
        @click="showStatusDetail = !showStatusDetail"
      >
        <div
          class="status-dot"
          :class="getConnectionStatusClass()"
        ></div>
        <span class="status-text">{{ getConnectionStatusText() }}</span>
        <el-icon>
          <ArrowDown />
        </el-icon>
      </div>

      <!-- 连接状态详情 -->
      <el-popover
        v-model:visible="showStatusDetail"
        placement="bottom-end"
        :width="300"
        trigger="click"
      >
        <template #reference>
          <div class="status-indicator">
            <div
              class="status-dot"
              :class="getConnectionStatusClass()"
            ></div>
            <span class="status-text">{{ getConnectionStatusText() }}</span>
            <el-icon>
              <ArrowDown />
            </el-icon>
          </div>
        </template>

        <div class="status-detail">
          <h4>服务连接状态</h4>
          <div class="service-status">
            <div
              v-for="(status, service) in connectionStatus"
              :key="service"
              class="service-item"
            >
              <span class="service-name">{{ getServiceDisplayName(service) }}</span>
              <el-tag
                :type="status ? 'success' : 'danger'"
                size="small"
              >
                {{ status ? '已连接' : '未连接' }}
              </el-tag>
            </div>
          </div>
          <div class="status-summary">
            <p>连接率: {{ getConnectionStatusDetail() }}</p>
            <p>任务: {{ runningTasks }}/{{ totalTasks }}</p>
          </div>
        </div>
      </el-popover>

      <!-- 用户菜单 -->
      <el-dropdown>
        <div class="user-menu">
          <el-avatar
            :size="32"
            icon="UserFilled"
          />
          <span class="username">管理员</span>
          <el-icon>
            <ArrowDown />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="showSettings">
              <el-icon>
                <Setting />
              </el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item @click="showAbout">
              <el-icon>
                <InfoFilled />
              </el-icon>
              关于系统
            </el-dropdown-item>
            <el-dropdown-item
              divided
              @click="logout"
            >
              <el-icon>
                <SwitchButton />
              </el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem, ElDialog } from 'element-plus'
import {
  Bell,
  Setting,
  User,
  SwitchButton,
  QuestionFilled,
  Connection,
  DataAnalysis,
  Document,
  Calendar,
  TrendCharts,
  ArrowDown,
  InfoFilled
} from '@element-plus/icons-vue'
import unifiedWebSocketManager from '@/utils/unifiedWebSocketManager'

// 响应式数据
const showStatusDetail = ref(false)
const route = useRoute()
const router = useRouter()

// 连接状态
const connectionStatus = ref({
  dataCollection: false,
  aiAnalysis: false,
  newsAnalysis: false,
  scheduler: false
})

// 任务状态
const taskStatus = ref({
  dataCollection: { running: 0, completed: 0, failed: 0 },
  aiAnalysis: { running: 0, completed: 0, failed: 0 },
  newsAnalysis: { running: 0, completed: 0, failed: 0 },
  scheduler: { running: 0, completed: 0, failed: 0 }
})

// 重连相关
const reconnectAttempts = ref(0)
const reconnectInterval = ref<NodeJS.Timeout | null>(null)

// 任务统计
const runningTasks = ref(0)
const totalTasks = ref(0)

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta?.title as string
  }))
})

// 获取连接状态样式类
const getConnectionStatusClass = () => {
  const connectedCount = Object.values(connectionStatus.value).filter(Boolean).length
  const totalCount = Object.keys(connectionStatus.value).length

  if (connectedCount === totalCount) return 'status-dot-success'
  if (connectedCount > 0) return 'status-dot-warning'
  return 'status-dot-error'
}

// 获取连接状态文本
const getConnectionStatusText = () => {
  const connectedCount = Object.values(connectionStatus.value).filter(Boolean).length
  const totalCount = Object.keys(connectionStatus.value).length

  if (connectedCount === totalCount) return '已连接'
  if (connectedCount > 0) return '部分连接'
  return '未连接'
}

// 获取连接状态详情
const getConnectionStatusDetail = () => {
  const connectedCount = Object.values(connectionStatus.value).filter(Boolean).length
  const totalCount = Object.keys(connectionStatus.value).length
  return `${connectedCount}/${totalCount} (${Math.round(connectedCount / totalCount * 100)}%)`
}

// 获取服务显示名称
const getServiceDisplayName = (service: string) => {
  const names: Record<string, string> = {
    dataCollection: '数据采集',
    aiAnalysis: 'AI分析',
    newsAnalysis: '新闻分析',
    scheduler: '调度服务'
  }
  return names[service] || service
}

// 更新任务状态
const updateTaskStatus = async () => {
  try {
    // 通过WebSocket获取任务状态，避免频繁的HTTP请求
    // 这里可以设置默认值，或者通过WebSocket事件更新
    if (connectionStatus.value.dataCollection) {
      // 如果数据采集服务已连接，可以设置默认值
    } else {
      // 如果未连接，使用默认值
    }
  } catch (error) {
    console.error('更新任务状态失败:', error)
    // 使用默认值
  }
}

// WebSocket事件处理
const handleConnectionStatus = (service: string, connected: boolean) => {
  const wasConnected = connectionStatus.value[service as keyof typeof connectionStatus.value]
  connectionStatus.value[service as keyof typeof connectionStatus.value] = connected

  // 检测连接断开
  if (wasConnected && !connected) {
    console.log(`🔌 ${service} 连接断开`)
    ElMessage.warning(`${service} 服务连接断开`)

    // 启动重连机制
    if (reconnectAttempts.value === 0) {
      startReconnect()
    }
  }

  // 检测连接恢复
  if (!wasConnected && connected) {
    console.log(`🔗 ${service} 连接恢复`)
    ElMessage.success(`${service} 服务连接恢复`)

    // 停止重连
    if (reconnectAttempts.value > 0) {
      stopReconnect()
    }
  }
}

// 开始重连
const startReconnect = () => {
  if (reconnectAttempts.value >= 5) {
    ElMessage.error('重连次数已达上限，请手动刷新页面')
    return
  }

  reconnectAttempts.value++
  console.log(`🔄 开始重连... (${reconnectAttempts.value}/5)`)

  reconnectInterval.value = setInterval(() => {
    console.log(`🔄 尝试重连... (${reconnectAttempts.value}/5)`)
    unifiedWebSocketManager.initEnhancedWebSockets()
  }, 3000) // 3秒尝试一次
}

// 停止重连
const stopReconnect = () => {
  if (reconnectInterval.value) {
    clearInterval(reconnectInterval.value)
    reconnectInterval.value = null
  }
  reconnectAttempts.value = 0
}

// 用户操作
const showSettings = () => {
  ElMessage.info('系统设置功能开发中...')
}

const showAbout = () => {
  ElMessage.info('关于系统功能开发中...')
}

const logout = () => {
  ElMessage.info('退出登录功能开发中...')
}

// 生命周期
onMounted(() => {
  console.log('导航栏组件已挂载')

  // 初始化WebSocket连接
  unifiedWebSocketManager.initEnhancedWebSockets()

  // 监听连接状态变化
  unifiedWebSocketManager.addUnifiedEventListener('dataCollectionConnected', (connected: boolean) => {
    handleConnectionStatus('dataCollection', connected)
  })

  unifiedWebSocketManager.addUnifiedEventListener('aiAnalysisConnected', (connected: boolean) => {
    handleConnectionStatus('aiAnalysis', connected)
  })

  unifiedWebSocketManager.addUnifiedEventListener('newsAnalysisConnected', (connected: boolean) => {
    handleConnectionStatus('newsAnalysis', connected)
  })

  unifiedWebSocketManager.addUnifiedEventListener('schedulerConnected', (connected: boolean) => {
    handleConnectionStatus('scheduler', connected)
  })

  // 初始更新任务状态
  updateTaskStatus()
})

onUnmounted(() => {
  // 清理重连定时器
  stopReconnect()

  // 移除事件监听器
  unifiedWebSocketManager.removeUnifiedEventListener('dataCollectionConnected', handleConnectionStatus)
  unifiedWebSocketManager.removeUnifiedEventListener('aiAnalysisConnected', handleConnectionStatus)
  unifiedWebSocketManager.removeUnifiedEventListener('newsAnalysisConnected', handleConnectionStatus)
  unifiedWebSocketManager.removeUnifiedEventListener('schedulerConnected', handleConnectionStatus)
})
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.logo-text {
  margin-left: 8px;
}

.navbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-indicator:hover {
  background-color: #f5f7fa;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot-success {
  background-color: #67c23a;
}

.status-dot-warning {
  background-color: #e6a23c;
}

.status-dot-error {
  background-color: #f56c6c;
}

.status-text {
  font-size: 14px;
  color: #606266;
}

.user-menu {
  display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .user-menu:hover {
    background-color: #f5f7fa;
  }
  
  .username {
    font-size: 14px;
    color: #303133;
  }
  
  .status-detail {
    padding: 16px;
  }
  
  .status-detail h4 {
    margin: 0 0 16px 0;
    color: #303133;
    font-size: 16px;
  }
  
  .service-status {
    margin-bottom: 16px;
  }
  
  .service-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .service-item:last-child {
    border-bottom: none;
  }
  
    .service-name {
      font-size: 14px;
      color: #606266;
    }
  
    .status-summary {
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }
  
    .status-summary p {
      margin: 4px 0;
      font-size: 12px;
      color: #909399;
    }
</style>
