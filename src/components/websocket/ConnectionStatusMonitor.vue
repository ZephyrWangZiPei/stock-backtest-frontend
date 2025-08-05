<template>
  <div class="connection-status-monitor">
    <el-card class="status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">🔗 WebSocket连接状态</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="refreshStatus"
            :loading="refreshing"
          >
            刷新
          </el-button>
        </div>
      </template>
      
      <div class="status-content">
        <!-- 网络状态 -->
        <div class="network-status">
          <h4>🌐 网络状态</h4>
          <div class="status-grid">
            <div class="status-item">
              <span class="label">网络连接:</span>
              <el-tag :type="networkStatus.isOnline ? 'success' : 'danger'" size="small">
                {{ networkStatus.isOnline ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="label">网络质量:</span>
              <el-tag :type="getNetworkQualityType(networkStatus.quality)" size="small">
                {{ getNetworkQualityText(networkStatus.quality) }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="label">连续失败:</span>
              <span class="value">{{ networkStatus.consecutiveFailures }}</span>
            </div>
          </div>
        </div>

        <!-- 页面活动状态 -->
        <div class="activity-status">
          <h4>📱 页面活动</h4>
          <div class="status-grid">
            <div class="status-item">
              <span class="label">页面可见:</span>
              <el-tag :type="isPageVisible ? 'success' : 'warning'" size="small">
                {{ isPageVisible ? '可见' : '隐藏' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="label">页面焦点:</span>
              <el-tag :type="isPageActive ? 'success' : 'warning'" size="small">
                {{ isPageActive ? '活跃' : '非活跃' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="label">最后活动:</span>
              <span class="value">{{ formatTimeSinceLastActivity() }}</span>
            </div>
          </div>
        </div>

        <!-- 服务连接状态 -->
        <div class="service-status">
          <h4>🔌 服务连接</h4>
          <div class="service-grid">
            <div 
              v-for="(connected, service) in connectionStatus" 
              :key="service"
              class="service-item"
            >
              <div class="service-header">
                <span class="service-name">{{ getServiceDisplayName(service) }}</span>
                <el-tag 
                  :type="connected ? 'success' : 'danger'" 
                  size="small"
                  :class="{ 'reconnecting': isReconnecting(service) }"
                >
                  {{ connected ? '已连接' : (isReconnecting(service) ? '重连中' : '未连接') }}
                </el-tag>
              </div>
              
              <!-- 连接质量信息 -->
              <div v-if="connected" class="quality-info">
                <div class="quality-item">
                  <span class="label">平均延迟:</span>
                  <span class="value">{{ getAveragePing(service) }}ms</span>
                </div>
                <div class="quality-item">
                  <span class="label">心跳次数:</span>
                  <span class="value">{{ getPingCount(service) }}</span>
                </div>
                <div class="quality-item">
                  <span class="label">失败次数:</span>
                  <span class="value">{{ getFailedPings(service) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <el-button 
            type="primary" 
            @click="reconnectAll"
            :loading="reconnecting"
            :disabled="!hasDisconnectedServices"
          >
            重连所有服务
          </el-button>
          <el-button 
            type="warning" 
            @click="disconnectAll"
          >
            断开所有连接
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getUnifiedConnectionStatus, 
  getReconnectionStatus,
  getConnectionQuality,
  getNetworkStatus,
  getActivityStatus,
  reconnectEnhancedWebSockets,
  disconnectEnhancedWebSockets
} from '@/utils/unifiedWebSocketManager'

// 响应式状态
const refreshing = ref(false)
const reconnecting = ref(false)
const connectionStatus = ref<Record<string, boolean>>({})
const reconnectionStatus = ref<Record<string, boolean>>({})
const networkStatus = ref({
  isOnline: true,
  quality: 'good',
  consecutiveFailures: 0
})
const activityStatus = ref({
  isActive: true,
  lastActivity: Date.now(),
  timeSinceLastActivity: 0
})

// 计算属性
const isPageVisible = computed(() => document.visibilityState === 'visible')
const isPageActive = computed(() => document.hasFocus())

const hasDisconnectedServices = computed(() => {
  return Object.values(connectionStatus.value).some(connected => !connected)
})

// 更新状态
const updateStatus = () => {
  connectionStatus.value = getUnifiedConnectionStatus()
  
  // 更新重连状态
  const services = Object.keys(connectionStatus.value)
  services.forEach(service => {
    reconnectionStatus.value[service] = getReconnectionStatus(service)
  })
  
  // 更新网络状态
  networkStatus.value = getNetworkStatus()
  
  // 更新活动状态
  activityStatus.value = getActivityStatus()
}

// 刷新状态
const refreshStatus = async () => {
  refreshing.value = true
  try {
    updateStatus()
    ElMessage.success('状态已刷新')
  } catch (error) {
    ElMessage.error('刷新状态失败')
  } finally {
    refreshing.value = false
  }
}

// 重连所有服务
const reconnectAll = async () => {
  reconnecting.value = true
  try {
    reconnectEnhancedWebSockets()
    ElMessage.success('重连请求已发送')
  } catch (error) {
    ElMessage.error('重连失败')
  } finally {
    reconnecting.value = false
  }
}

// 断开所有连接
const disconnectAll = () => {
  try {
    disconnectEnhancedWebSockets()
    ElMessage.success('所有连接已断开')
    updateStatus()
  } catch (error) {
    ElMessage.error('断开连接失败')
  }
}

// 检查是否正在重连
const isReconnecting = (service: string): boolean => {
  return reconnectionStatus.value[service] || false
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

// 获取网络质量类型
const getNetworkQualityType = (quality: string): string => {
  switch (quality) {
    case 'good': return 'success'
    case 'poor': return 'warning'
    case 'disconnected': return 'danger'
    default: return 'info'
  }
}

// 获取网络质量文本
const getNetworkQualityText = (quality: string): string => {
  switch (quality) {
    case 'good': return '良好'
    case 'poor': return '较差'
    case 'disconnected': return '断开'
    default: return '未知'
  }
}

// 获取平均延迟
const getAveragePing = (service: string): string => {
  const quality = getConnectionQuality(service)
  if (quality && quality.avgPingTime > 0) {
    return quality.avgPingTime.toFixed(1)
  }
  return '--'
}

// 获取心跳次数
const getPingCount = (service: string): string => {
  const quality = getConnectionQuality(service)
  return quality ? quality.pingCount.toString() : '0'
}

// 获取失败次数
const getFailedPings = (service: string): string => {
  const quality = getConnectionQuality(service)
  return quality ? quality.failedPings.toString() : '0'
}

// 格式化最后活动时间
const formatTimeSinceLastActivity = (): string => {
  const timeSince = activityStatus.value.timeSinceLastActivity
  if (timeSince < 60000) {
    return `${Math.floor(timeSince / 1000)}秒前`
  } else if (timeSince < 3600000) {
    return `${Math.floor(timeSince / 60000)}分钟前`
  } else {
    return `${Math.floor(timeSince / 3600000)}小时前`
  }
}

// 定时更新状态
let statusUpdateTimer: NodeJS.Timeout | null = null

onMounted(() => {
  updateStatus()
  
  // 每5秒更新一次状态
  statusUpdateTimer = setInterval(() => {
    updateStatus()
  }, 5000)
})

onUnmounted(() => {
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer)
  }
})
</script>

<style scoped lang="scss">
.connection-status-monitor {
  .status-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        font-weight: 600;
        font-size: 16px;
      }
    }
    
    .status-content {
      .network-status,
      .activity-status,
      .service-status {
        margin-bottom: 20px;
        
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #606266;
        }
      }
      
      .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
          
          .label {
            font-size: 13px;
            color: #606266;
          }
          
          .value {
            font-size: 13px;
            font-weight: 500;
            color: #303133;
          }
        }
      }
      
      .service-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
        
        .service-item {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e4e7ed;
          
          .service-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            
            .service-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
            
            .reconnecting {
              animation: pulse 1.5s infinite;
            }
          }
          
          .quality-info {
            .quality-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
              
              .label {
                font-size: 12px;
                color: #909399;
              }
              
              .value {
                font-size: 12px;
                font-weight: 500;
                color: #606266;
              }
            }
          }
        }
      }
      
      .actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e4e7ed;
      }
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style> 
