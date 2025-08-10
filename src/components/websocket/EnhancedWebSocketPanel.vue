<template>
  <div class="enhanced-websocket-panel">
    <el-card class="panel-card">
      <template #header>
        <div class="panel-header">
          <span class="title">
            <el-icon><Connection /></el-icon>
            增强WebSocket管理面板
          </span>
          <div class="header-actions">
            <el-button-group size="small">
              <el-button 
                :type="activeTab === 'overview' ? 'primary' : ''"
                @click="activeTab = 'overview'"
              >
                概览
              </el-button>
              <el-button 
                :type="activeTab === 'connections' ? 'primary' : ''"
                @click="activeTab = 'connections'"
              >
                连接管理
              </el-button>
              <el-button 
                :type="activeTab === 'events' ? 'primary' : ''"
                @click="activeTab = 'events'"
              >
                事件监控
              </el-button>
              <el-button 
                :type="activeTab === 'notifications' ? 'primary' : ''"
                @click="activeTab = 'notifications'"
              >
                通知管理
              </el-button>
              <el-button 
                :type="activeTab === 'performance' ? 'primary' : ''"
                @click="activeTab = 'performance'"
              >
                性能监控
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 概览面板 -->
      <div v-if="activeTab === 'overview'" class="overview-panel">
        <el-row :gutter="20">
          <!-- 连接状态统计 -->
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon connected">
                  <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ connectionStats.activeConnections }}/{{ connectionStats.totalConnections }}</div>
                  <div class="stat-label">活跃连接</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 事件统计 -->
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon events">
                  <el-icon><Bell /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ eventStats.totalEvents }}</div>
                  <div class="stat-label">总事件数</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 通知统计 -->
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon notifications">
                  <el-icon><Message /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ notificationStats.unacknowledged }}</div>
                  <div class="stat-label">未读通知</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 性能统计 -->
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon performance">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ performanceStats.averageProcessingTime.toFixed(1) }}ms</div>
                  <div class="stat-label">平均处理时间</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 实时任务监控 -->
        <div class="realtime-tasks">
          <h3>实时任务监控</h3>
          <el-table :data="activeTasks" stripe size="small" max-height="300">
            <el-table-column prop="name" label="任务名称" width="200" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getTaskTypeColor(row.type)" size="small">
                  {{ getTaskTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="progress" label="进度" width="150">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.progress" 
                  :status="getProgressStatus(row.status)"
                  :stroke-width="6"
                />
              </template>
            </el-table-column>
            <el-table-column prop="message" label="状态信息" />
            <el-table-column prop="startTime" label="开始时间" width="150">
              <template #default="{ row }">
                {{ formatTime(row.startTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 系统健康状态 -->
        <div class="system-health">
          <h3>系统健康状态</h3>
          <el-row :gutter="16">
            <el-col :span="8" v-for="(health, namespace) in healthStatus" :key="namespace">
              <div class="health-item" :class="health">
                <div class="health-indicator">
                  <el-icon>
                    <CircleCheck v-if="health === 'healthy'" />
                    <Warning v-else-if="health === 'degraded'" />
                    <CircleClose v-else />
                  </el-icon>
                </div>
                <div class="health-info">
                  <div class="namespace">{{ getNamespaceDisplayName(namespace) }}</div>
                  <div class="status">{{ getHealthStatusText(health) }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 连接管理面板 -->
      <div v-if="activeTab === 'connections'" class="connections-panel">
        <div class="panel-actions">
          <el-button type="primary" @click="connectAll" :loading="connecting">
            连接全部
          </el-button>
          <el-button type="danger" @click="disconnectAll">
            断开全部
          </el-button>
          <el-button @click="refreshConnections">
            刷新状态
          </el-button>
        </div>

        <el-table :data="connectionList" stripe>
          <el-table-column prop="namespace" label="命名空间" width="150">
            <template #default="{ row }">
              <strong>{{ getNamespaceDisplayName(row.namespace) }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="connected" label="连接状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.connected ? 'success' : 'danger'" size="small">
                {{ row.connected ? '已连接' : '未连接' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="health" label="健康状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getHealthTagType(row.health)" size="small">
                {{ getHealthStatusText(row.health) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latency" label="延迟" width="100">
            <template #default="{ row }">
              <span :class="{ 'high-latency': row.latency > 1000 }">
                {{ row.latency }}ms
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="messageCount" label="消息数" width="100" />
          <el-table-column prop="errorCount" label="错误数" width="100">
            <template #default="{ row }">
              <span :class="{ 'error-count': row.errorCount > 0 }">
                {{ row.errorCount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="reconnectCount" label="重连次数" width="100" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button 
                v-if="!row.connected" 
                size="small" 
                type="primary" 
                @click="connectNamespace(row.namespace)"
                :loading="connectingNamespaces.includes(row.namespace)"
              >
                连接
              </el-button>
              <el-button 
                v-else 
                size="small" 
                type="danger" 
                @click="disconnectNamespace(row.namespace)"
              >
                断开
              </el-button>
              <el-button 
                size="small" 
                @click="forceReconnect(row.namespace)"
                :disabled="!row.connected"
              >
                重连
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 事件监控面板 -->
      <div v-if="activeTab === 'events'" class="events-panel">
        <div class="panel-actions">
          <el-button @click="clearEventHistory">清空历史</el-button>
          <el-switch
            v-model="autoScrollEvents"
            active-text="自动滚动"
            inactive-text="手动滚动"
          />
          <el-select v-model="eventFilter" placeholder="筛选事件" style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="连接事件" value="connect" />
            <el-option label="任务事件" value="task" />
            <el-option label="错误事件" value="error" />
          </el-select>
        </div>

        <div class="event-log" ref="eventLogContainer">
          <div 
            v-for="event in filteredEvents" 
            :key="event.id"
            class="event-item"
            :class="getEventClass(event)"
          >
            <div class="event-time">{{ formatTime(event.timestamp) }}</div>
            <div class="event-namespace">{{ getNamespaceDisplayName(event.namespace) }}</div>
            <div class="event-name">{{ event.event }}</div>
            <div class="event-data">
              <el-button 
                v-if="event.data" 
                type="text" 
                size="small" 
                @click="showEventDetail(event)"
              >
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 通知管理面板 -->
      <div v-if="activeTab === 'notifications'" class="notifications-panel">
        <div class="panel-actions">
          <el-button @click="acknowledgeAllNotifications">全部已读</el-button>
          <el-button @click="clearNotificationHistory">清空历史</el-button>
          <el-button @click="testNotification">测试通知</el-button>
          <el-switch
            v-model="notificationsEnabled"
            active-text="通知开启"
            inactive-text="通知关闭"
          />
          <el-switch
            v-model="soundEnabled"
            active-text="声音开启"
            inactive-text="声音关闭"
          />
        </div>

        <!-- 通知规则管理 -->
        <div class="notification-rules">
          <h3>通知规则</h3>
          <el-table :data="notificationRules" size="small">
            <el-table-column prop="name" label="规则名称" />
            <el-table-column prop="enabled" label="状态" width="80">
              <template #default="{ row }">
                <el-switch 
                  v-model="row.enabled" 
                  @change="toggleNotificationRule(row.id, row.enabled)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="settings.priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="getPriorityTagType(row.settings.priority)" size="small">
                  {{ row.settings.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="触发次数" width="100">
              <template #default="{ row }">
                {{ notificationStats.byRule[row.id] || 0 }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 通知历史 -->
        <div class="notification-history">
          <h3>通知历史</h3>
          <el-table :data="notificationHistory" size="small" max-height="300">
            <el-table-column prop="timestamp" label="时间" width="150">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="event.namespace" label="来源" width="120">
              <template #default="{ row }">
                {{ getNamespaceDisplayName(row.event.namespace) }}
              </template>
            </el-table-column>
            <el-table-column prop="event.event" label="事件" />
            <el-table-column prop="acknowledged" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.acknowledged ? 'success' : 'warning'" size="small">
                  {{ row.acknowledged ? '已读' : '未读' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  v-if="!row.acknowledged"
                  size="small" 
                  type="text" 
                  @click="acknowledgeNotification(row.id)"
                >
                  标记已读
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 性能监控面板 -->
      <div v-if="activeTab === 'performance'" class="performance-panel">
        <div class="panel-actions">
          <el-button @click="resetPerformanceMetrics">重置指标</el-button>
          <el-button @click="flushAllQueues">刷新队列</el-button>
        </div>

        <!-- 性能指标 -->
        <div class="performance-metrics">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="metric-card">
                <div class="metric-value">{{ performanceStats.totalMessages }}</div>
                <div class="metric-label">总消息数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-card">
                <div class="metric-value">{{ performanceStats.processedMessages }}</div>
                <div class="metric-label">已处理消息</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-card">
                <div class="metric-value">{{ performanceStats.queuedMessages }}</div>
                <div class="metric-label">队列中消息</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-card">
                <div class="metric-value">{{ performanceStats.droppedMessages }}</div>
                <div class="metric-label">丢弃消息</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 队列状态 -->
        <div class="queue-status">
          <h3>消息队列状态</h3>
          <el-table :data="queueList" size="small">
            <el-table-column prop="namespace" label="命名空间">
              <template #default="{ row }">
                {{ getNamespaceDisplayName(row.namespace) }}
              </template>
            </el-table-column>
            <el-table-column prop="messages.length" label="队列长度" width="100" />
            <el-table-column prop="processing" label="处理状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.processing ? 'warning' : 'success'" size="small">
                  {{ row.processing ? '处理中' : '空闲' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastProcessed" label="最后处理时间" width="150">
              <template #default="{ row }">
                {{ formatTime(row.lastProcessed) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  @click="flushQueue(row.namespace)"
                  :disabled="row.processing"
                >
                  立即处理
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="clearQueue(row.namespace)"
                >
                  清空队列
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 事件详情对话框 -->
    <el-dialog
      v-model="eventDetailVisible"
      title="事件详情"
      width="60%"
    >
      <div v-if="selectedEvent" class="event-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="事件ID">{{ selectedEvent.id }}</el-descriptions-item>
          <el-descriptions-item label="命名空间">{{ selectedEvent.namespace }}</el-descriptions-item>
          <el-descriptions-item label="事件名称">{{ selectedEvent.event }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">{{ selectedEvent.type }}</el-descriptions-item>
          <el-descriptions-item label="时间戳">{{ formatTime(selectedEvent.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">{{ selectedEvent.processed ? '已处理' : '未处理' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="event-data-section">
          <h4>事件数据</h4>
          <pre>{{ JSON.stringify(selectedEvent.data, null, 2) }}</pre>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="eventDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyEventData">复制数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { 
  Connection, CircleCheck, CircleClose, Warning, Bell, Message, TrendCharts 
} from '@element-plus/icons-vue'

// 导入我们的WebSocket服务
import { websocketEventBus } from '@/utils/websocketEventBus'
import { websocketConnectionPool } from '@/utils/websocketConnectionPool'
import { realtimeNotificationService } from '@/services/realtimeNotificationService'
import { realtimeDataService } from '@/services/realtimeDataService'
import { websocketPerformanceOptimizer } from '@/utils/websocketPerformanceOptimizer'

// 响应式数据
const activeTab = ref('overview')
const connecting = ref(false)
const connectingNamespaces = ref<string[]>([])
const autoScrollEvents = ref(true)
const eventFilter = ref('')
const notificationsEnabled = ref(true)
const soundEnabled = ref(true)
const eventDetailVisible = ref(false)
const selectedEvent = ref<any>(null)
const eventLogContainer = ref<HTMLElement>()

// 计算属性
const connectionStats = computed(() => websocketConnectionPool.getStats())
const eventStats = computed(() => websocketEventBus.getStats())
const notificationStats = computed(() => realtimeNotificationService.getStats())
const performanceStats = computed(() => websocketPerformanceOptimizer.getMetrics())
const healthStatus = computed(() => websocketConnectionPool.getHealthStatus())

const connectionList = computed(() => {
  const metrics = websocketConnectionPool.getMetrics() as any[]
  return Array.isArray(metrics) ? metrics : []
})

const activeTasks = computed(() => realtimeDataService.getAllTasks())

const notificationRules = computed(() => realtimeNotificationService.getRules())

const notificationHistory = computed(() => realtimeNotificationService.getHistory(50))

const queueList = computed(() => {
  const queues = websocketPerformanceOptimizer.getQueueStatus() as any[]
  return Array.isArray(queues) ? queues : []
})

const filteredEvents = computed(() => {
  let events = websocketEventBus.getEventHistory()
  
  if (eventFilter.value) {
    events = events.filter(event => {
      switch (eventFilter.value) {
        case 'connect':
          return ['connect', 'disconnect', 'connect_error', 'reconnect'].includes(event.event)
        case 'task':
          return event.event.includes('task') || event.event.includes('progress') || event.event.includes('completed')
        case 'error':
          return event.type === 'error' || event.event.includes('error')
        default:
          return true
      }
    })
  }
  
  return events.slice(-100).reverse()
})

// 方法
const getNamespaceDisplayName = (namespace: string) => {
  const names: Record<string, string> = {
    '/data_collection': '数据采集',
    '/scheduler': '任务调度',
    '/backtest': '回测引擎',
    '/ai_analysis': 'AI分析',
    '/news_analysis': '新闻分析'
  }
  return names[namespace] || namespace
}

const getTaskTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'data_collection': 'primary',
    'backtest': 'success',
    'ai_analysis': 'warning',
    'scheduler': 'info',
    'news_analysis': 'danger'
  }
  return colors[type] || 'info'
}

const getTaskTypeName = (type: string) => {
  const names: Record<string, string> = {
    'data_collection': '数据采集',
    'backtest': '回测',
    'ai_analysis': 'AI分析',
    'scheduler': '调度',
    'news_analysis': '新闻分析'
  }
  return names[type] || type
}

const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  return undefined
}

const getHealthStatusText = (health: string) => {
  const texts: Record<string, string> = {
    'healthy': '健康',
    'degraded': '降级',
    'unhealthy': '异常'
  }
  return texts[health] || health
}

const getHealthTagType = (health: string) => {
  const types: Record<string, string> = {
    'healthy': 'success',
    'degraded': 'warning',
    'unhealthy': 'danger'
  }
  return types[health] || 'info'
}

const getPriorityTagType = (priority: string) => {
  const types: Record<string, string> = {
    'critical': 'danger',
    'high': 'warning',
    'normal': 'success',
    'low': 'info'
  }
  return types[priority] || 'info'
}

const getEventClass = (event: any) => {
  return `event-${event.type}`
}

const formatTime = (date: Date | string) => {
  if (!date) return '--'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString()
}

// 连接管理方法
const connectAll = async () => {
  connecting.value = true
  try {
    await websocketConnectionPool.connectAll()
    ElMessage.success('所有连接已建立')
  } catch (error) {
    ElMessage.error('连接建立失败')
  } finally {
    connecting.value = false
  }
}

const disconnectAll = () => {
  websocketConnectionPool.disconnectAll()
  ElMessage.success('所有连接已断开')
}

const refreshConnections = () => {
  // 刷新连接状态的逻辑
  ElMessage.success('连接状态已刷新')
}

const connectNamespace = async (namespace: string) => {
  connectingNamespaces.value.push(namespace)
  try {
    await websocketConnectionPool.connectToNamespace(namespace)
    ElMessage.success(`${getNamespaceDisplayName(namespace)}连接成功`)
  } catch (error) {
    ElMessage.error(`${getNamespaceDisplayName(namespace)}连接失败`)
  } finally {
    const index = connectingNamespaces.value.indexOf(namespace)
    if (index > -1) {
      connectingNamespaces.value.splice(index, 1)
    }
  }
}

const disconnectNamespace = (namespace: string) => {
  websocketConnectionPool.disconnect(namespace)
  ElMessage.success(`${getNamespaceDisplayName(namespace)}已断开`)
}

const forceReconnect = async (namespace: string) => {
  try {
    await websocketConnectionPool.forceReconnect(namespace)
    ElMessage.success(`${getNamespaceDisplayName(namespace)}重连成功`)
  } catch (error) {
    ElMessage.error(`${getNamespaceDisplayName(namespace)}重连失败`)
  }
}

// 事件管理方法
const clearEventHistory = () => {
  websocketEventBus.clearHistory()
  ElMessage.success('事件历史已清空')
}

const showEventDetail = (event: any) => {
  selectedEvent.value = event
  eventDetailVisible.value = true
}

const copyEventData = () => {
  if (selectedEvent.value) {
    navigator.clipboard.writeText(JSON.stringify(selectedEvent.value, null, 2))
    ElMessage.success('事件数据已复制到剪贴板')
  }
}

// 通知管理方法
const acknowledgeAllNotifications = () => {
  realtimeNotificationService.acknowledgeAll()
  ElMessage.success('所有通知已标记为已读')
}

const clearNotificationHistory = () => {
  realtimeNotificationService.clearHistory()
  ElMessage.success('通知历史已清空')
}

const testNotification = () => {
  realtimeNotificationService.testNotification('normal')
}

const toggleNotificationRule = (ruleId: string, enabled: boolean) => {
  realtimeNotificationService.toggleRule(ruleId, enabled)
}

const acknowledgeNotification = (notificationId: string) => {
  realtimeNotificationService.acknowledgeNotification(notificationId)
}

// 性能管理方法
const resetPerformanceMetrics = () => {
  websocketPerformanceOptimizer.resetMetrics()
  ElMessage.success('性能指标已重置')
}

const flushAllQueues = async () => {
  await websocketPerformanceOptimizer.flush()
  ElMessage.success('所有队列已刷新')
}

const flushQueue = async (namespace: string) => {
  await websocketPerformanceOptimizer.flush(namespace)
  ElMessage.success(`${getNamespaceDisplayName(namespace)}队列已刷新`)
}

const clearQueue = (namespace: string) => {
  websocketPerformanceOptimizer.clearQueue(namespace)
  ElMessage.success(`${getNamespaceDisplayName(namespace)}队列已清空`)
}

// 生命周期
onMounted(() => {
  // 初始化连接
  connectAll()
  
  // 设置事件自动滚动
  if (autoScrollEvents.value) {
    const scrollToBottom = () => {
      nextTick(() => {
        if (eventLogContainer.value) {
          eventLogContainer.value.scrollTop = eventLogContainer.value.scrollHeight
        }
      })
    }
    
    // 监听新事件
    const unsubscribe = websocketEventBus.subscribe({
      id: 'panel_auto_scroll',
      handler: scrollToBottom
    })
    
    onUnmounted(() => {
      unsubscribe()
    })
  }
})
</script>

<style lang="scss" scoped>
.enhanced-websocket-panel {
  padding: 20px;
  
  .panel-card {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
          color: #409eff;
        }
      }
    }
  }
  
  .overview-panel {
    .stat-card {
      margin-bottom: 16px;
      
      .stat-content {
        display: flex;
        align-items: center;
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          
          &.connected {
            background-color: #f0f9ff;
            color: #67c23a;
          }
          
          &.events {
            background-color: #fef7e0;
            color: #e6a23c;
          }
          
          &.notifications {
            background-color: #fdf6ec;
            color: #409eff;
          }
          
          &.performance {
            background-color: #f5f7fa;
            color: #909399;
          }
          
          .el-icon {
            font-size: 24px;
          }
        }
        
        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
    
    .realtime-tasks,
    .system-health {
      margin-top: 24px;
      
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        color: #303133;
        border-bottom: 1px solid #ebeef5;
        padding-bottom: 8px;
      }
    }
    
    .system-health {
      .health-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        margin-bottom: 8px;
        
        &.healthy {
          border-color: #67c23a;
          background-color: #f0f9ff;
        }
        
        &.degraded {
          border-color: #e6a23c;
          background-color: #fdf6ec;
        }
        
        &.unhealthy {
          border-color: #f56c6c;
          background-color: #fef0f0;
        }
        
        .health-indicator {
          margin-right: 12px;
          
          .el-icon {
            font-size: 20px;
          }
        }
        
        .health-info {
          .namespace {
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .status {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
  
  .connections-panel,
  .events-panel,
  .notifications-panel,
  .performance-panel {
    .panel-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f5f7fa;
      border-radius: 4px;
    }
  }
  
  .events-panel {
    .event-log {
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      background-color: #fafafa;
      
      .event-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid #ebeef5;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.event-success {
          background-color: #f0f9ff;
        }
        
        &.event-warning {
          background-color: #fef7e0;
        }
        
        &.event-error {
          background-color: #fef0f0;
        }
        
        .event-time {
          width: 80px;
          color: #909399;
        }
        
        .event-namespace {
          width: 120px;
          font-weight: 600;
          color: #409eff;
        }
        
        .event-name {
          flex: 1;
          color: #303133;
        }
        
        .event-data {
          width: 80px;
          text-align: right;
        }
      }
    }
  }
  
  .notifications-panel {
    .notification-rules,
    .notification-history {
      margin-bottom: 24px;
      
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        color: #303133;
        border-bottom: 1px solid #ebeef5;
        padding-bottom: 8px;
      }
    }
  }
  
  .performance-panel {
    .performance-metrics {
      margin-bottom: 24px;
      
      .metric-card {
        text-align: center;
        padding: 20px;
        background-color: #f5f7fa;
        border-radius: 4px;
        
        .metric-value {
          font-size: 28px;
          font-weight: 600;
          color: #409eff;
          margin-bottom: 8px;
        }
        
        .metric-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
    
    .queue-status {
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        color: #303133;
        border-bottom: 1px solid #ebeef5;
        padding-bottom: 8px;
      }
    }
  }
  
  .high-latency {
    color: #f56c6c;
    font-weight: 600;
  }
  
  .error-count {
    color: #f56c6c;
    font-weight: 600;
  }
}

.event-detail {
  .event-data-section {
    margin-top: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #303133;
    }
    
    pre {
      background-color: #f5f7fa;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.5;
    }
  }
}
</style> 