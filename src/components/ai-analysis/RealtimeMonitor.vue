<template>
  <el-card class="realtime-monitor">
    <template #header>
      <div class="card-header">
        <span>实时监控</span>
        <div class="header-actions">
          <el-tag :type="connectionStatus === 'connected' ? 'success' : 'danger'" size="small">
            <el-icon><Connection /></el-icon>
            {{ getConnectionText() }}
          </el-tag>
          
          <el-button 
            @click="toggleConnection" 
            size="small"
            :type="connectionStatus === 'connected' ? 'danger' : 'primary'"
          >
            {{ connectionStatus === 'connected' ? '断开' : '连接' }}
          </el-button>
        </div>
      </div>
    </template>

    <div class="monitor-content">
      <!-- 连接状态面板 -->
      <div class="connection-panel">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="8">
            <div class="status-item">
              <el-icon class="status-icon" :class="{ active: connectionStatus === 'connected' }">
                <Connection />
              </el-icon>
              <div class="status-info">
                <div class="status-label">WebSocket连接</div>
                <div class="status-value">{{ getConnectionText() }}</div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="8">
            <div class="status-item">
              <el-icon class="status-icon" :class="{ active: isReceivingData }">
                <DataLine />
              </el-icon>
              <div class="status-info">
                <div class="status-label">数据接收</div>
                <div class="status-value">{{ isReceivingData ? '正常' : '暂停' }}</div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="8">
            <div class="status-item">
              <el-icon class="status-icon" :class="{ active: messageCount > 0 }">
                <Message />
              </el-icon>
              <div class="status-info">
                <div class="status-label">消息数量</div>
                <div class="status-value">{{ messageCount }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 实时数据流 -->
      <div class="data-stream">
        <div class="stream-header">
          <h4>实时数据流</h4>
          <div class="stream-controls">
            <el-button 
              @click="pauseStream" 
              size="small"
              :type="isStreamPaused ? 'primary' : 'info'"
            >
              {{ isStreamPaused ? '继续' : '暂停' }}
            </el-button>
            <el-button @click="clearMessages" size="small">清空</el-button>
          </div>
        </div>
        
        <div class="message-list" style="max-height: 300px; overflow-y: auto;" ref="messageListRef">
          <div 
            v-for="message in displayMessages" 
            :key="message.id" 
            class="message-item"
            :class="getMessageClass(message.type)"
          >
            <div class="message-header">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <el-tag :type="getMessageTagType(message.type)" size="small">
                {{ getMessageTypeText(message.type) }}
              </el-tag>
            </div>
            <div class="message-content">{{ message.content }}</div>
            <div v-if="message.data" class="message-data">
              <pre>{{ JSON.stringify(message.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
        
        <div v-if="displayMessages.length === 0" class="empty-messages">
          <el-empty description="暂无消息" />
        </div>
      </div>

      <!-- 事件统计 -->
      <div class="event-stats">
        <h4>事件统计</h4>
        <el-row :gutter="16">
          <el-col :xs="12" :sm="6">
            <el-statistic 
              title="数据更新" 
              :value="eventStats.dataUpdates" 
              suffix="次"
            />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic 
              title="任务状态" 
              :value="eventStats.taskUpdates" 
              suffix="次"
            />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic 
              title="分析完成" 
              :value="eventStats.analysisCompleted" 
              suffix="次"
            />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic 
              title="错误事件" 
              :value="eventStats.errors" 
              suffix="次"
            />
          </el-col>
        </el-row>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, DataLine, Message } from '@element-plus/icons-vue'
import { UnifiedWebSocketManager } from '@/utils/unifiedWebSocketManager'

// 创建WebSocket管理器实例
const websocketManager = new UnifiedWebSocketManager()

// 接口定义
interface RealtimeMessage {
  id: string
  type: 'data' | 'task' | 'analysis' | 'error' | 'system'
  content: string
  data?: any
  timestamp: number
}

interface EventStats {
  dataUpdates: number
  taskUpdates: number
  analysisCompleted: number
  errors: number
}

// Props & Emits
const emit = defineEmits<{
  'message-received': [message: RealtimeMessage]
  'connection-changed': [status: 'connected' | 'disconnected']
}>()

// 响应式数据
const connectionStatus = ref<'connected' | 'disconnected' | 'connecting'>('disconnected')
const isReceivingData = ref(false)
const isStreamPaused = ref(false)
const messageCount = ref(0)
const messageListRef = ref<HTMLElement>()

const messages = ref<RealtimeMessage[]>([])
const eventStats = reactive<EventStats>({
  dataUpdates: 0,
  taskUpdates: 0,
  analysisCompleted: 0,
  errors: 0
})

// 计算属性
const displayMessages = computed(() => {
  if (isStreamPaused.value) {
    return messages.value
  }
  return messages.value.slice(-50) // 只显示最近50条消息
})

// 工具函数
const getConnectionText = () => {
  const texts = {
    connected: '已连接',
    disconnected: '未连接',
    connecting: '连接中'
  }
  return texts[connectionStatus.value]
}

const getMessageClass = (type: string) => {
  return `message-${type}`
}

const getMessageTagType = (type: string) => {
  const types: Record<string, string> = {
    data: 'primary',
    task: 'info',
    analysis: 'success',
    error: 'danger',
    system: 'warning'
  }
  return types[type] || 'info'
}

const getMessageTypeText = (type: string) => {
  const texts: Record<string, string> = {
    data: '数据',
    task: '任务',
    analysis: '分析',
    error: '错误',
    system: '系统'
  }
  return texts[type] || type
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 主要功能方法
const toggleConnection = async () => {
  if (connectionStatus.value === 'connected') {
    await disconnectWebSocket()
  } else {
    await connectWebSocket()
  }
}

const connectWebSocket = async () => {
  try {
    connectionStatus.value = 'connecting'
    
    // 连接到AI分析WebSocket
    await websocketManager.connect('/ai_analysis')
    
    // 设置事件监听器
    setupEventListeners()
    
    connectionStatus.value = 'connected'
    isReceivingData.value = true
    
    addSystemMessage('WebSocket连接成功')
    emit('connection-changed', 'connected')
    
  } catch (error) {
    console.error('WebSocket连接失败:', error)
    connectionStatus.value = 'disconnected'
    isReceivingData.value = false
    addSystemMessage('WebSocket连接失败', 'error')
    ElMessage.error('连接失败')
  }
}

const disconnectWebSocket = async () => {
  try {
    // 清除事件监听器
    clearEventListeners()
    
    // 断开连接
    websocketManager.disconnect('/ai_analysis')
    
    connectionStatus.value = 'disconnected'
    isReceivingData.value = false
    
    addSystemMessage('WebSocket连接已断开')
    emit('connection-changed', 'disconnected')
    
  } catch (error) {
    console.error('断开连接失败:', error)
    ElMessage.error('断开连接失败')
  }
}

const setupEventListeners = () => {
  // 监听AI分析连接状态
  websocketManager.on('/ai_analysis', 'ai_analysis_connected', (data) => {
    addSystemMessage('AI分析服务连接成功')
    isReceivingData.value = true
  })
  
  // 监听AI分析状态更新
  websocketManager.on('/ai_analysis', 'ai_analysis_status', (data) => {
    if (!isStreamPaused.value) {
      addMessage('system', 'AI分析服务状态更新', data)
    }
  })
  
  // 监听任务状态更新
  websocketManager.on('/ai_analysis', 'task_update', (data) => {
    if (!isStreamPaused.value) {
      addMessage('task', `任务状态更新: ${data.status}`, data)
      eventStats.taskUpdates++
    }
  })
  
  // 监听分析进度更新
  websocketManager.on('/ai_analysis', 'analysis_progress', (data) => {
    if (!isStreamPaused.value) {
      addMessage('data', `分析进度: ${data.progress}%`, data)
      eventStats.dataUpdates++
      isReceivingData.value = true
    }
  })
  
  // 监听分析完成事件
  websocketManager.on('/ai_analysis', 'analysis_completed', (data) => {
    if (!isStreamPaused.value) {
      addMessage('analysis', `分析完成: ${data.stock_code || '批量分析'}`, data)
      eventStats.analysisCompleted++
    }
  })
  
  // 监听错误事件
  websocketManager.on('/ai_analysis', 'error', (data) => {
    if (!isStreamPaused.value) {
      addMessage('error', `错误: ${data.message}`, data)
      eventStats.errors++
    }
  })
  
  // 监听系统事件
  websocketManager.on('/ai_analysis', 'system_message', (data) => {
    if (!isStreamPaused.value) {
      addMessage('system', data.message, data)
    }
  })
  
  // 监听连接断开
  websocketManager.on('/ai_analysis', 'disconnect', () => {
    connectionStatus.value = 'disconnected'
    isReceivingData.value = false
    addSystemMessage('WebSocket连接已断开', 'error')
  })
}

const clearEventListeners = () => {
  websocketManager.off('/ai_analysis', 'ai_analysis_connected')
  websocketManager.off('/ai_analysis', 'ai_analysis_status')
  websocketManager.off('/ai_analysis', 'task_update')
  websocketManager.off('/ai_analysis', 'analysis_progress')
  websocketManager.off('/ai_analysis', 'analysis_completed')
  websocketManager.off('/ai_analysis', 'error')
  websocketManager.off('/ai_analysis', 'system_message')
  websocketManager.off('/ai_analysis', 'disconnect')
}

const addMessage = (type: RealtimeMessage['type'], content: string, data?: any) => {
  const message: RealtimeMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    data,
    timestamp: Date.now()
  }
  
  messages.value.push(message)
  messageCount.value++
  
  emit('message-received', message)
  
  // 自动滚动到底部
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
  
  // 限制消息数量
  if (messages.value.length > 200) {
    messages.value.splice(0, 50)
  }
}

const addSystemMessage = (content: string, type: RealtimeMessage['type'] = 'system') => {
  addMessage(type, content)
}

const pauseStream = () => {
  isStreamPaused.value = !isStreamPaused.value
  if (isStreamPaused.value) {
    addSystemMessage('数据流已暂停')
  } else {
    addSystemMessage('数据流已恢复')
  }
}

const clearMessages = () => {
  messages.value = []
  messageCount.value = 0
  addSystemMessage('消息已清空')
}

// 数据接收处理
const handleDataReceiving = () => {
  if (connectionStatus.value !== 'connected' || isStreamPaused.value) return
  
  // 真实数据通过WebSocket接收，这里不再生成模拟数据
}

// 生命周期
onMounted(() => {
  // 自动连接WebSocket
  connectWebSocket()
})

onUnmounted(() => {
  if (connectionStatus.value === 'connected') {
    disconnectWebSocket()
  }
})
</script>

<style lang="scss" scoped>
.realtime-monitor {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
  
  .monitor-content {
    .connection-panel {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      
      .status-item {
        display: flex;
        align-items: center;
        padding: 8px;
        
        .status-icon {
          font-size: 24px;
          margin-right: 12px;
          color: #909399;
          
          &.active {
            color: #67c23a;
          }
        }
        
        .status-info {
          .status-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 2px;
          }
          
          .status-value {
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }
        }
      }
    }
    
    .data-stream {
      margin-bottom: 20px;
      
      .stream-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        h4 {
          margin: 0;
          color: #303133;
        }
        
        .stream-controls {
          display: flex;
          gap: 8px;
        }
      }
      
      .message-list {
        border: 1px solid #ebeef5;
        border-radius: 8px;
        background: #fff;
        
        .message-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f5f7fa;
          
          &:last-child {
            border-bottom: none;
          }
          
          &.message-error {
            background: #fef0f0;
            border-left: 4px solid #f56c6c;
          }
          
          &.message-analysis {
            background: #f0f9ff;
            border-left: 4px solid #409eff;
          }
          
          &.message-data {
            background: #f6ffed;
            border-left: 4px solid #67c23a;
          }
          
          .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            
            .message-time {
              font-size: 12px;
              color: #909399;
            }
          }
          
          .message-content {
            color: #303133;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .message-data {
            font-size: 12px;
            color: #606266;
            background: #f5f7fa;
            padding: 8px;
            border-radius: 4px;
            
            pre {
              margin: 0;
              white-space: pre-wrap;
              word-break: break-word;
            }
          }
        }
      }
      
      .empty-messages {
        text-align: center;
        padding: 40px 0;
      }
    }
    
    .event-stats {
      h4 {
        margin: 0 0 16px 0;
        color: #303133;
      }
      
      .el-statistic {
        text-align: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }
    }
  }
}

@media (max-width: 768px) {
  .realtime-monitor {
    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .header-actions {
        justify-content: center;
      }
    }
    
    .monitor-content {
      .connection-panel {
        .el-col {
          margin-bottom: 12px;
        }
      }
      
      .data-stream {
        .stream-header {
          flex-direction: column;
          gap: 8px;
          align-items: stretch;
          
          .stream-controls {
            justify-content: center;
          }
        }
      }
      
      .event-stats {
        .el-col {
          margin-bottom: 12px;
        }
      }
    }
  }
}
</style> 