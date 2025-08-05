<template>
  <div class="websocket-event-logger">
    <el-card class="logger-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">📡 WebSocket事件日志</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="clearLogs"
              :disabled="logs.length === 0"
            >
              清空日志
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              @click="exportLogs"
              :disabled="logs.length === 0"
            >
              导出日志
            </el-button>
            <el-switch
              v-model="autoScroll"
              active-text="自动滚动"
              inactive-text="手动滚动"
              size="small"
            />
          </div>
        </div>
      </template>
      
      <div class="logger-content">
        <!-- 过滤器 -->
        <div class="filters">
          <el-select 
            v-model="selectedService" 
            placeholder="选择服务" 
            size="small"
            clearable
            style="width: 150px;"
          >
            <el-option label="全部服务" value="" />
            <el-option label="数据采集" value="dataCollection" />
            <el-option label="AI分析" value="aiAnalysis" />
            <el-option label="新闻分析" value="newsAnalysis" />
            <el-option label="回测服务" value="backtest" />
            <el-option label="调度服务" value="scheduler" />
          </el-select>
          
          <el-select 
            v-model="selectedEventType" 
            placeholder="选择事件类型" 
            size="small"
            clearable
            style="width: 150px;"
          >
            <el-option label="全部事件" value="" />
            <el-option label="连接事件" value="connection" />
            <el-option label="消息事件" value="message" />
            <el-option label="错误事件" value="error" />
            <el-option label="心跳事件" value="heartbeat" />
          </el-select>
          
          <el-select 
            v-model="logLevel" 
            placeholder="日志级别" 
            size="small"
            style="width: 120px;"
          >
            <el-option label="全部" value="all" />
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="错误" value="error" />
          </el-select>
          
          <el-button 
            type="info" 
            size="small" 
            @click="togglePause"
          >
            {{ isPaused ? '继续' : '暂停' }}
          </el-button>
        </div>

        <!-- 日志列表 -->
        <div class="log-container" ref="logContainer">
          <div 
            v-for="(log, index) in filteredLogs" 
            :key="index"
            class="log-item"
            :class="getLogItemClass(log)"
          >
            <div class="log-header">
              <span class="timestamp">{{ formatTimestamp(log.timestamp) }}</span>
              <el-tag 
                :type="getLogLevelType(log.level)" 
                size="small"
                class="level-tag"
              >
                {{ log.level.toUpperCase() }}
              </el-tag>
              <el-tag 
                v-if="log.service"
                type="info" 
                size="small"
                class="service-tag"
              >
                {{ getServiceDisplayName(log.service) }}
              </el-tag>
              <span class="event-type">{{ log.eventType }}</span>
            </div>
            
            <div class="log-message">
              {{ log.message }}
            </div>
            
            <div v-if="log.data" class="log-data">
              <el-button 
                type="text" 
                size="small" 
                @click="toggleDataExpansion(index)"
              >
                {{ expandedData.has(index) ? '收起数据' : '展开数据' }}
              </el-button>
              
              <div v-if="expandedData.has(index)" class="data-content">
                <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
          
          <div v-if="filteredLogs.length === 0" class="empty-logs">
            <el-empty description="暂无日志记录" />
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="statistics">
          <div class="stat-item">
            <span class="label">总日志数:</span>
            <span class="value">{{ logs.length }}</span>
          </div>
          <div class="stat-item">
            <span class="label">信息:</span>
            <span class="value info">{{ getLogCountByLevel('info') }}</span>
          </div>
          <div class="stat-item">
            <span class="label">警告:</span>
            <span class="value warning">{{ getLogCountByLevel('warning') }}</span>
          </div>
          <div class="stat-item">
            <span class="label">错误:</span>
            <span class="value error">{{ getLogCountByLevel('error') }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  service?: string
  eventType: string
  message: string
  data?: any
}

// 响应式状态
const logs = ref<LogEntry[]>([])
const selectedService = ref('')
const selectedEventType = ref('')
const logLevel = ref('all')
const autoScroll = ref(true)
const isPaused = ref(false)
const expandedData = ref<Set<number>>(new Set())
const logContainer = ref<HTMLElement>()

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 添加日志
const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
  if (isPaused.value) return
  
  const log: LogEntry = {
    id: generateId(),
    timestamp: new Date(),
    ...entry
  }
  
  logs.value.unshift(log)
  
  // 限制日志数量，避免内存泄漏
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(0, 1000)
  }
  
  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 过滤日志
const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    // 服务过滤
    if (selectedService.value && log.service !== selectedService.value) {
      return false
    }
    
    // 事件类型过滤
    if (selectedEventType.value) {
      const eventType = getEventType(log.eventType)
      if (eventType !== selectedEventType.value) {
        return false
      }
    }
    
    // 日志级别过滤
    if (logLevel.value !== 'all' && log.level !== logLevel.value) {
      return false
    }
    
    return true
  })
})

// 获取事件类型
const getEventType = (eventType: string): string => {
  if (eventType.includes('connect') || eventType.includes('disconnect')) {
    return 'connection'
  } else if (eventType.includes('error') || eventType.includes('failed')) {
    return 'error'
  } else if (eventType.includes('ping') || eventType.includes('pong')) {
    return 'heartbeat'
  } else {
    return 'message'
  }
}

// 获取日志项样式类
const getLogItemClass = (log: LogEntry): string => {
  const classes = [`log-level-${log.level}`]
  if (log.service) {
    classes.push(`service-${log.service}`)
  }
  return classes.join(' ')
}

// 获取日志级别类型
const getLogLevelType = (level: string): string => {
  switch (level) {
    case 'info': return 'info'
    case 'warning': return 'warning'
    case 'error': return 'danger'
    default: return 'info'
  }
}

// 获取服务显示名称
const getServiceDisplayName = (service: string): string => {
  const nameMap: Record<string, string> = {
    dataCollection: '数据采集',
    aiAnalysis: 'AI分析',
    newsAnalysis: '新闻分析',
    backtest: '回测服务',
    scheduler: '调度服务'
  }
  return nameMap[service] || service
}

// 格式化时间戳
const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  })
}

// 切换数据展开状态
const toggleDataExpansion = (index: number) => {
  if (expandedData.value.has(index)) {
    expandedData.value.delete(index)
  } else {
    expandedData.value.add(index)
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  expandedData.value.clear()
  ElMessage.success('日志已清空')
}

// 导出日志
const exportLogs = () => {
  const logText = filteredLogs.value.map(log => {
    return `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] ${log.service ? `[${getServiceDisplayName(log.service)}]` : ''} ${log.eventType}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
  }).join('\n')
  
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `websocket_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('日志已导出')
}

// 切换暂停状态
const togglePause = () => {
  isPaused.value = !isPaused.value
  ElMessage.success(isPaused.value ? '日志记录已暂停' : '日志记录已恢复')
}

// 获取指定级别的日志数
const getLogCountByLevel = (level: string): number => {
  return logs.value.filter(log => log.level === level).length
}

// 监听WebSocket事件
const setupWebSocketEventListeners = () => {
  // 这里可以添加对WebSocket事件的监听
  // 例如：监听连接、断开、消息等事件
}

// 生命周期
onMounted(() => {
  setupWebSocketEventListeners()
  
  // 添加一些示例日志
  addLog({
    level: 'info',
    eventType: 'system',
    message: 'WebSocket事件日志器已启动'
  })
})

// 导出方法供外部使用
defineExpose({
  addLog,
  clearLogs,
  exportLogs
})
</script>

<style scoped lang="scss">
.websocket-event-logger {
  .logger-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        font-weight: 600;
        font-size: 16px;
      }
      
      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }
    
    .logger-content {
      .filters {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e4e7ed;
      }
      
      .log-container {
        height: 400px;
        overflow-y: auto;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        padding: 12px;
        background: #fafafa;
        
        .log-item {
          margin-bottom: 12px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border-left: 4px solid #409eff;
          
          &.log-level-warning {
            border-left-color: #e6a23c;
          }
          
          &.log-level-error {
            border-left-color: #f56c6c;
          }
          
          .log-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            
            .timestamp {
              font-size: 12px;
              color: #909399;
              font-family: monospace;
            }
            
            .level-tag {
              font-size: 10px;
            }
            
            .service-tag {
              font-size: 10px;
            }
            
            .event-type {
              font-size: 12px;
              font-weight: 500;
              color: #606266;
            }
          }
          
          .log-message {
            font-size: 13px;
            color: #303133;
            margin-bottom: 8px;
            word-break: break-word;
          }
          
          .log-data {
            .data-content {
              margin-top: 8px;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #e4e7ed;
              
              pre {
                margin: 0;
                font-size: 11px;
                color: #606266;
                white-space: pre-wrap;
                word-break: break-word;
              }
            }
          }
        }
        
        .empty-logs {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }
      }
      
      .statistics {
        display: flex;
        gap: 20px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e4e7ed;
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .label {
            font-size: 12px;
            color: #909399;
          }
          
          .value {
            font-size: 14px;
            font-weight: 600;
            
            &.info {
              color: #409eff;
            }
            
            &.warning {
              color: #e6a23c;
            }
            
            &.error {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
}

// 滚动条样式
.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 
