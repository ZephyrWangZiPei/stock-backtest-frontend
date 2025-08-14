<template>
  <div class="websocket-monitor">
    <el-card class="monitor-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Connection /></el-icon>
            WebSocket 连接监控
          </span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="refreshConnections"
              :loading="refreshing"
            >
              刷新连接
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="connectAll"
              :loading="connecting"
            >
              连接全部
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="disconnectAll"
            >
              断开全部
            </el-button>
          </div>
        </div>
      </template>

      <!-- 连接状态概览 -->
      <div class="connection-overview">
        <el-row :gutter="16">
          <el-col :span="6" v-for="(status, namespace) in connectionStatus" :key="namespace">
            <el-card 
              class="status-card" 
              :class="{ 'connected': status, 'disconnected': !status }"
              shadow="hover"
            >
              <div class="status-content">
                <div class="status-indicator">
                  <el-icon :class="{ 'connected': status, 'disconnected': !status }">
                    <CircleCheck v-if="status" />
                    <CircleClose v-else />
                  </el-icon>
                </div>
                <div class="status-info">
                  <div class="namespace">{{ getNamespaceDisplayName(namespace) }}</div>
                  <div class="status-text">{{ status ? '已连接' : '未连接' }}</div>
                </div>
                <div class="status-actions">
                  <el-button 
                    v-if="!status" 
                    type="primary" 
                    size="small" 
                    @click="connectNamespace(namespace)"
                    :loading="connectingNamespaces.includes(namespace)"
                  >
                    连接
                  </el-button>
                  <el-button 
                    v-else 
                    type="danger" 
                    size="small" 
                    @click="disconnectNamespace(namespace)"
                  >
                    断开
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 事件日志 -->
      <div class="event-log-section">
        <div class="section-header">
          <h3>实时事件日志</h3>
          <div class="log-controls">
            <el-button 
              size="small" 
              @click="clearLog"
              :disabled="eventLog.length === 0"
            >
              清空日志
            </el-button>
            <el-switch
              v-model="autoScroll"
              active-text="自动滚动"
              inactive-text="手动滚动"
            />
          </div>
        </div>
        
        <div 
          ref="logContainer" 
          class="event-log-container"
          :class="{ 'auto-scroll': autoScroll }"
        >
          <div 
            v-for="(event, index) in eventLog" 
            :key="index"
            class="log-entry"
            :class="getLogEntryClass(event)"
          >
            <div class="log-timestamp">{{ formatTimestamp(event.timestamp) }}</div>
            <div class="log-namespace">{{ event.namespace }}</div>
            <div class="log-event">{{ event.event }}</div>
            <div class="log-data">
              <el-button 
                v-if="event.data" 
                type="text" 
                size="small" 
                @click="showEventData(event)"
              >
                查看数据
              </el-button>
            </div>
          </div>
          
          <div v-if="eventLog.length === 0" class="empty-log">
            <el-empty description="暂无事件日志" />
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="statistics-section">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ totalEvents }}</div>
              <div class="stat-label">总事件数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ connectedCount }}</div>
              <div class="stat-label">已连接</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ errorCount }}</div>
              <div class="stat-label">错误数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ uptime }}</div>
              <div class="stat-label">运行时间</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 事件数据详情对话框 -->
    <el-dialog
      v-model="eventDataVisible"
      title="事件数据详情"
      width="60%"
      :before-close="closeEventData"
    >
      <div class="event-data-content">
        <pre>{{ JSON.stringify(selectedEventData, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="closeEventData">关闭</el-button>
        <el-button type="primary" @click="copyEventData">复制数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { unifiedWebSocketManager } from '../../utils/unifiedWebSocketManager'

interface LogEntry {
  timestamp: Date
  namespace: string
  event: string
  data?: any
  type: 'info' | 'success' | 'warning' | 'error'
}

// 响应式数据
const refreshing = ref(false)
const connecting = ref(false)
const connectingNamespaces = ref<string[]>([])
const autoScroll = ref(true)
const eventDataVisible = ref(false)
const selectedEventData = ref<any>(null)
const logContainer = ref<HTMLElement>()

const connectionStatus = reactive<Record<string, boolean>>({
  '/data_collection': false,
  '/scheduler': false,
  '/backtest': false,
  '/ai_analysis': false,
  '/news_analysis': false
})

const eventLog = ref<LogEntry[]>([])
const startTime = ref(new Date())

// 计算属性
const totalEvents = computed(() => eventLog.value.length)
const connectedCount = computed(() => Object.values(connectionStatus).filter(Boolean).length)
const errorCount = computed(() => eventLog.value.filter(e => e.type === 'error').length)
const uptime = computed(() => {
  const diff = Date.now() - startTime.value.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
})

// 命名空间显示名称映射
const namespaceDisplayNames: Record<string, string> = {
  '/data_collection': '数据采集',
  '/scheduler': '任务调度',
  '/backtest': '回测引擎',
  '/ai_analysis': 'AI分析',
  '/news_analysis': '新闻分析'
}

// 方法
const getNamespaceDisplayName = (namespace: string) => {
  return namespaceDisplayNames[namespace] || namespace
}

const getLogEntryClass = (event: LogEntry) => {
  return `log-entry-${event.type}`
}

const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleTimeString()
}

const addLogEntry = (namespace: string, event: string, data?: any, type: LogEntry['type'] = 'info') => {
  const entry: LogEntry = {
    timestamp: new Date(),
    namespace,
    event,
    data,
    type
  }
  
  eventLog.value.push(entry)
  
  // 限制日志条数
  if (eventLog.value.length > 1000) {
    eventLog.value = eventLog.value.slice(-500)
  }
  
  // 自动滚动
  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  }
}

const refreshConnections = async () => {
  refreshing.value = true
  try {
    const status = unifiedWebSocketManager.getAllConnectionStatus()
    Object.keys(connectionStatus).forEach(namespace => {
      connectionStatus[namespace] = status[namespace] || false
    })
    ElMessage.success('连接状态已刷新')
  } catch (error) {
    ElMessage.error('刷新连接状态失败')
  } finally {
    refreshing.value = false
  }
}

const connectAll = async () => {
  connecting.value = true
  try {
    const promises = Object.keys(connectionStatus).map(namespace => 
      unifiedWebSocketManager.connect(namespace)
    )
    await Promise.all(promises)
    ElMessage.success('所有连接已建立')
  } catch (error) {
    ElMessage.error('连接建立失败')
  } finally {
    connecting.value = false
  }
}

const disconnectAll = () => {
  unifiedWebSocketManager.disconnectAll()
  Object.keys(connectionStatus).forEach(namespace => {
    connectionStatus[namespace] = false
  })
  ElMessage.success('所有连接已断开')
}

const connectNamespace = async (namespace: string) => {
  connectingNamespaces.value.push(namespace)
  try {
    await unifiedWebSocketManager.connect(namespace)
    connectionStatus[namespace] = true
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
  unifiedWebSocketManager.disconnect(namespace)
  connectionStatus[namespace] = false
  ElMessage.success(`${getNamespaceDisplayName(namespace)}已断开`)
}

const clearLog = () => {
  eventLog.value = []
}

const showEventData = (event: LogEntry) => {
  selectedEventData.value = event.data
  eventDataVisible.value = true
}

const closeEventData = () => {
  eventDataVisible.value = false
  selectedEventData.value = null
}

const copyEventData = () => {
  if (selectedEventData.value) {
    navigator.clipboard.writeText(JSON.stringify(selectedEventData.value, null, 2))
    ElMessage.success('数据已复制到剪贴板')
  }
}

// 监听 pattern_similarity 事件并增强数据展示
const setupPatternSimilarityListeners = () => {
  const ns = '/backtest'
  unifiedWebSocketManager.on(ns, 'pattern_similarity_progress', (data: any) => {
    addLogEntry(ns, 'pattern_similarity_progress', data, 'info')
  })
  unifiedWebSocketManager.on(ns, 'pattern_similarity_result', (data: any) => {
    addLogEntry(ns, 'pattern_similarity_result', data, 'success')
  })
}

// 设置事件监听器
const setupEventListeners = () => {
  const namespaces = Object.keys(connectionStatus)
  
  namespaces.forEach(namespace => {
    // 连接事件
    unifiedWebSocketManager.on(namespace, 'connect', () => {
      connectionStatus[namespace] = true
      addLogEntry(namespace, 'connect', null, 'success')
    })
    
    unifiedWebSocketManager.on(namespace, 'disconnect', (data: any) => {
      connectionStatus[namespace] = false
      addLogEntry(namespace, 'disconnect', data, 'warning')
    })
    
    unifiedWebSocketManager.on(namespace, 'connect_error', (error: any) => {
      connectionStatus[namespace] = false
      addLogEntry(namespace, 'connect_error', error, 'error')
    })
    
    unifiedWebSocketManager.on(namespace, 'reconnect', (data: any) => {
      connectionStatus[namespace] = true
      addLogEntry(namespace, 'reconnect', data, 'success')
    })
    
    unifiedWebSocketManager.on(namespace, 'reconnect_error', (error: any) => {
      addLogEntry(namespace, 'reconnect_error', error, 'error')
    })
    
    unifiedWebSocketManager.on(namespace, 'reconnect_failed', () => {
      connectionStatus[namespace] = false
      addLogEntry(namespace, 'reconnect_failed', null, 'error')
    })
    
    // 业务事件
    const businessEvents = [
      'task_started', 'task_progress', 'task_completed', 'task_failed',
      'backtest_started', 'backtest_progress', 'backtest_completed',
      'analysis_started', 'analysis_completed', 'news_update',
      // 新增：相似K线事件
      'pattern_similarity_progress', 'pattern_similarity_result'
    ]
    
    businessEvents.forEach(event => {
      unifiedWebSocketManager.on(namespace, event, (data: any) => {
        addLogEntry(namespace, event, data, event.includes('result') ? 'success' : 'info')
      })
    })
  })

  setupPatternSimilarityListeners()
}

// 生命周期
onMounted(() => {
  setupEventListeners()
  refreshConnections()
})

onUnmounted(() => {
  // 清理事件监听器
  Object.keys(connectionStatus).forEach(namespace => {
    unifiedWebSocketManager.clearEventListeners(namespace)
  })
})
</script>

<style lang="scss" scoped>
.websocket-monitor {
  padding: 20px;
  
  .monitor-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
        }
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .connection-overview {
    margin-bottom: 24px;
    
    .status-card {
      margin-bottom: 16px;
      
      &.connected {
        border-color: #67c23a;
        
        .status-indicator .el-icon {
          color: #67c23a;
        }
      }
      
      &.disconnected {
        border-color: #f56c6c;
        
        .status-indicator .el-icon {
          color: #f56c6c;
        }
      }
      
      .status-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .status-indicator {
          .el-icon {
            font-size: 20px;
          }
        }
        
        .status-info {
          flex: 1;
          margin-left: 12px;
          
          .namespace {
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .status-text {
            font-size: 12px;
            color: #909399;
          }
        }
        
        .status-actions {
          margin-left: 12px;
        }
      }
    }
  }
  
  .event-log-section {
    margin-bottom: 24px;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .log-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
    
    .event-log-container {
      height: 400px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      overflow-y: auto;
      background-color: #fafafa;
      
      &.auto-scroll {
        scroll-behavior: smooth;
      }
      
      .log-entry {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid #ebeef5;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.log-entry-success {
          background-color: #f0f9ff;
        }
        
        &.log-entry-warning {
          background-color: #fef7e0;
        }
        
        &.log-entry-error {
          background-color: #fef0f0;
        }
        
        .log-timestamp {
          width: 80px;
          color: #909399;
        }
        
        .log-namespace {
          width: 120px;
          font-weight: 600;
          color: #409eff;
        }
        
        .log-event {
          flex: 1;
          color: #303133;
        }
        
        .log-data {
          width: 80px;
          text-align: right;
        }
      }
      
      .empty-log {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
    }
  }
  
  .statistics-section {
    .stat-card {
      text-align: center;
      padding: 16px;
      background-color: #f5f7fa;
      border-radius: 4px;
      
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #409eff;
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.event-data-content {
  pre {
    background-color: #f5f7fa;
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
  }
}
</style> 