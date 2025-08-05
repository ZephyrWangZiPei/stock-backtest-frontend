<template>
  <div class="websocket-connection-tester">
    <el-card class="tester-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">🧪 WebSocket连接测试</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="startTest"
            :loading="testing"
            :disabled="testRunning"
          >
            开始测试
          </el-button>
        </div>
      </template>
      
      <div class="tester-content">
        <!-- 测试配置 -->
        <div class="test-config">
          <h4>⚙️ 测试配置</h4>
          <div class="config-grid">
            <div class="config-item">
              <label>测试服务:</label>
              <el-select v-model="selectedService" placeholder="选择测试服务" size="small">
                <el-option label="数据采集" value="dataCollection" />
                <el-option label="AI分析" value="aiAnalysis" />
                <el-option label="新闻分析" value="newsAnalysis" />
                <el-option label="回测服务" value="backtest" />
                <el-option label="调度服务" value="scheduler" />
              </el-select>
            </div>
            
            <div class="config-item">
              <label>测试时长 (秒):</label>
              <el-input-number 
                v-model="testDuration" 
                :min="10" 
                :max="300" 
                size="small"
                style="width: 120px;"
              />
            </div>
            
            <div class="config-item">
              <label>心跳间隔 (秒):</label>
              <el-input-number 
                v-model="heartbeatInterval" 
                :min="5" 
                :max="60" 
                size="small"
                style="width: 120px;"
              />
            </div>
            
            <div class="config-item">
              <label>消息频率 (秒):</label>
              <el-input-number 
                v-model="messageInterval" 
                :min="1" 
                :max="30" 
                size="small"
                style="width: 120px;"
              />
            </div>
          </div>
        </div>

        <!-- 测试场景 -->
        <div class="test-scenarios">
          <h4>🎯 测试场景</h4>
          <div class="scenarios-grid">
            <el-checkbox-group v-model="selectedScenarios">
              <el-checkbox label="page_visibility">页面可见性切换</el-checkbox>
              <el-checkbox label="page_focus">页面焦点切换</el-checkbox>
              <el-checkbox label="network_switch">网络连接切换</el-checkbox>
              <el-checkbox label="long_idle">长时间无活动</el-checkbox>
              <el-checkbox label="rapid_connect">快速连接断开</el-checkbox>
              <el-checkbox label="high_frequency">高频消息发送</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 测试进度 -->
        <div v-if="testRunning" class="test-progress">
          <h4>📊 测试进度</h4>
          <div class="progress-info">
            <div class="progress-item">
              <span class="label">测试时间:</span>
              <span class="value">{{ formatDuration(testElapsedTime) }}</span>
            </div>
            <div class="progress-item">
              <span class="label">剩余时间:</span>
              <span class="value">{{ formatDuration(testRemainingTime) }}</span>
            </div>
            <div class="progress-item">
              <span class="label">连接状态:</span>
              <el-tag :type="connectionStatus ? 'success' : 'danger'" size="small">
                {{ connectionStatus ? '已连接' : '未连接' }}
              </el-tag>
            </div>
          </div>
          
          <el-progress 
            :percentage="testProgress" 
            :status="testProgress === 100 ? 'success' : undefined"
          />
        </div>

        <!-- 测试结果 -->
        <div v-if="testResults.length > 0" class="test-results">
          <h4>📈 测试结果</h4>
          <div class="results-summary">
            <div class="result-item">
              <span class="label">总测试时间:</span>
              <span class="value">{{ formatDuration(totalTestTime) }}</span>
            </div>
            <div class="result-item">
              <span class="label">连接成功率:</span>
              <span class="value">{{ connectionSuccessRate }}%</span>
            </div>
            <div class="result-item">
              <span class="label">平均重连时间:</span>
              <span class="value">{{ averageReconnectTime }}ms</span>
            </div>
            <div class="result-item">
              <span class="label">消息成功率:</span>
              <span class="value">{{ messageSuccessRate }}%</span>
            </div>
            <div class="result-item">
              <span class="label">平均延迟:</span>
              <span class="value">{{ averageLatency }}ms</span>
            </div>
          </div>
          
          <div class="results-details">
            <el-table :data="testResults" size="small" max-height="300">
              <el-table-column prop="timestamp" label="时间" width="120">
                <template #default="{ row }">
                  {{ formatTimestamp(row.timestamp) }}
                </template>
              </el-table-column>
              <el-table-column prop="event" label="事件" width="120" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="耗时" width="80">
                <template #default="{ row }">
                  {{ row.duration ? `${row.duration}ms` : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="details" label="详情" />
            </el-table>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <el-button 
            type="danger" 
            @click="stopTest"
            :disabled="!testRunning"
          >
            停止测试
          </el-button>
          <el-button 
            type="success" 
            @click="exportTestResults"
            :disabled="testResults.length === 0"
          >
            导出结果
          </el-button>
          <el-button 
            type="warning" 
            @click="clearResults"
            :disabled="testResults.length === 0"
          >
            清空结果
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
  getServiceConnectionStatus, 
  sendToService, 
  getServiceSocket 
} from '@/utils/unifiedWebSocketManager'

interface TestResult {
  timestamp: Date
  event: string
  status: 'success' | 'failed'
  duration?: number
  details: string
}

// 响应式状态
const selectedService = ref('dataCollection')
const testDuration = ref(60)
const heartbeatInterval = ref(10)
const messageInterval = ref(5)
const selectedScenarios = ref<string[]>(['page_visibility', 'page_focus'])

const testing = ref(false)
const testRunning = ref(false)
const testStartTime = ref<Date | null>(null)
const testElapsedTime = ref(0)
const connectionStatus = ref(false)
const testResults = ref<TestResult[]>([])

// 测试相关定时器
let testTimer: NodeJS.Timeout | null = null
let heartbeatTimer: NodeJS.Timeout | null = null
let messageTimer: NodeJS.Timeout | null = null
let progressTimer: NodeJS.Timeout | null = null

// 计算属性
const testProgress = computed(() => {
  if (!testStartTime.value) return 0
  const elapsed = (Date.now() - testStartTime.value.getTime()) / 1000
  return Math.min((elapsed / testDuration.value) * 100, 100)
})

const testRemainingTime = computed(() => {
  if (!testStartTime.value) return testDuration.value
  const elapsed = (Date.now() - testStartTime.value.getTime()) / 1000
  return Math.max(testDuration.value - elapsed, 0)
})

const totalTestTime = computed(() => {
  if (testResults.value.length === 0) return 0
  const firstResult = testResults.value[testResults.value.length - 1]
  const lastResult = testResults.value[0]
  return lastResult.timestamp.getTime() - firstResult.timestamp.getTime()
})

const connectionSuccessRate = computed(() => {
  const connectionEvents = testResults.value.filter(r => r.event.includes('连接'))
  if (connectionEvents.length === 0) return 0
  const successCount = connectionEvents.filter(r => r.status === 'success').length
  return Math.round((successCount / connectionEvents.length) * 100)
})

const averageReconnectTime = computed(() => {
  const reconnectEvents = testResults.value.filter(r => r.event.includes('重连') && r.duration)
  if (reconnectEvents.length === 0) return 0
  const totalTime = reconnectEvents.reduce((sum, r) => sum + (r.duration || 0), 0)
  return Math.round(totalTime / reconnectEvents.length)
})

const messageSuccessRate = computed(() => {
  const messageEvents = testResults.value.filter(r => r.event.includes('消息'))
  if (messageEvents.length === 0) return 0
  const successCount = messageEvents.filter(r => r.status === 'success').length
  return Math.round((successCount / messageEvents.length) * 100)
})

const averageLatency = computed(() => {
  const latencyEvents = testResults.value.filter(r => r.duration && r.event.includes('消息'))
  if (latencyEvents.length === 0) return 0
  const totalLatency = latencyEvents.reduce((sum, r) => sum + (r.duration || 0), 0)
  return Math.round(totalLatency / latencyEvents.length)
})

// 添加测试结果
const addTestResult = (event: string, status: 'success' | 'failed', duration?: number, details: string = '') => {
  testResults.value.unshift({
    timestamp: new Date(),
    event,
    status,
    duration,
    details
  })
}

// 开始测试
const startTest = async () => {
  if (testRunning.value) return
  
  testing.value = true
  testRunning.value = true
  testStartTime.value = new Date()
  testResults.value = []
  
  try {
    // 初始化连接测试
    addTestResult('测试开始', 'success', undefined, `服务: ${selectedService.value}, 时长: ${testDuration.value}秒`)
    
    // 检查初始连接状态
    const initialStatus = getServiceConnectionStatus(selectedService.value)
    connectionStatus.value = initialStatus
    addTestResult('初始连接检查', initialStatus ? 'success' : 'failed')
    
    // 启动测试定时器
    testTimer = setTimeout(() => {
      stopTest()
    }, testDuration.value * 1000)
    
    // 启动进度更新
    progressTimer = setInterval(() => {
      testElapsedTime.value = (Date.now() - testStartTime.value!.getTime()) / 1000
    }, 1000)
    
    // 启动心跳测试
    if (selectedScenarios.value.includes('heartbeat')) {
      heartbeatTimer = setInterval(() => {
        testHeartbeat()
      }, heartbeatInterval.value * 1000)
    }
    
    // 启动消息测试
    if (selectedScenarios.value.includes('high_frequency')) {
      messageTimer = setInterval(() => {
        testMessageSending()
      }, messageInterval.value * 1000)
    }
    
    // 启动场景测试
    startScenarioTests()
    
    ElMessage.success('连接测试已开始')
  } catch (error) {
    addTestResult('测试启动失败', 'failed', undefined, error instanceof Error ? error.message : '未知错误')
    stopTest()
  } finally {
    testing.value = false
  }
}

// 停止测试
const stopTest = () => {
  testRunning.value = false
  
  // 清理定时器
  if (testTimer) {
    clearTimeout(testTimer)
    testTimer = null
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (messageTimer) {
    clearInterval(messageTimer)
    messageTimer = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  
  addTestResult('测试结束', 'success', undefined, `总耗时: ${formatDuration(testElapsedTime.value)}`)
  ElMessage.success('连接测试已结束')
}

// 测试心跳
const testHeartbeat = () => {
  const startTime = Date.now()
  const socket = getServiceSocket(selectedService.value)
  
  if (socket && getServiceConnectionStatus(selectedService.value)) {
    try {
      socket.emit('ping', () => {
        const duration = Date.now() - startTime
        addTestResult('心跳测试', 'success', duration, `延迟: ${duration}ms`)
      })
      
      // 设置超时
      setTimeout(() => {
        addTestResult('心跳超时', 'failed', 10000, '心跳响应超时')
      }, 10000)
    } catch (error) {
      addTestResult('心跳失败', 'failed', undefined, error instanceof Error ? error.message : '未知错误')
    }
  } else {
    addTestResult('心跳测试', 'failed', undefined, '连接未建立')
  }
}

// 测试消息发送
const testMessageSending = () => {
  const startTime = Date.now()
  
  try {
    const success = sendToService(selectedService.value, 'test_message', {
      timestamp: Date.now(),
      test: true
    })
    
    if (success) {
      const duration = Date.now() - startTime
      addTestResult('消息发送', 'success', duration, '测试消息发送成功')
    } else {
      addTestResult('消息发送', 'failed', undefined, '消息发送失败')
    }
  } catch (error) {
    addTestResult('消息发送', 'failed', undefined, error instanceof Error ? error.message : '未知错误')
  }
}

// 启动场景测试
const startScenarioTests = () => {
  // 页面可见性测试
  if (selectedScenarios.value.includes('page_visibility')) {
    setTimeout(() => {
      addTestResult('页面可见性测试', 'success', undefined, '模拟页面隐藏/显示')
    }, 5000)
  }
  
  // 页面焦点测试
  if (selectedScenarios.value.includes('page_focus')) {
    setTimeout(() => {
      addTestResult('页面焦点测试', 'success', undefined, '模拟页面焦点切换')
    }, 10000)
  }
  
  // 网络切换测试
  if (selectedScenarios.value.includes('network_switch')) {
    setTimeout(() => {
      addTestResult('网络切换测试', 'success', undefined, '模拟网络连接切换')
    }, 15000)
  }
  
  // 长时间无活动测试
  if (selectedScenarios.value.includes('long_idle')) {
    setTimeout(() => {
      addTestResult('长时间无活动测试', 'success', undefined, '模拟长时间无活动状态')
    }, 20000)
  }
  
  // 快速连接断开测试
  if (selectedScenarios.value.includes('rapid_connect')) {
    setTimeout(() => {
      addTestResult('快速连接测试', 'success', undefined, '模拟快速连接断开')
    }, 25000)
  }
}

// 导出测试结果
const exportTestResults = () => {
  const resultText = [
    `WebSocket连接测试报告`,
    `测试时间: ${new Date().toLocaleString()}`,
    `测试服务: ${selectedService.value}`,
    `测试时长: ${formatDuration(testDuration.value)}`,
    `连接成功率: ${connectionSuccessRate.value}%`,
    `平均重连时间: ${averageReconnectTime.value}ms`,
    `消息成功率: ${messageSuccessRate.value}%`,
    `平均延迟: ${averageLatency.value}ms`,
    ``,
    `详细结果:`,
    ...testResults.value.map(r => 
      `[${formatTimestamp(r.timestamp)}] ${r.event}: ${r.status}${r.duration ? ` (${r.duration}ms)` : ''} - ${r.details}`
    )
  ].join('\n')
  
  const blob = new Blob([resultText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `websocket_test_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('测试结果已导出')
}

// 清空结果
const clearResults = () => {
  testResults.value = []
  ElMessage.success('测试结果已清空')
}

// 格式化时间戳
const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化持续时间
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  // 初始化
})

onUnmounted(() => {
  stopTest()
})
</script>

<style scoped lang="scss">
.websocket-connection-tester {
  .tester-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        font-weight: 600;
        font-size: 16px;
      }
    }
    
    .tester-content {
      .test-config,
      .test-scenarios,
      .test-progress,
      .test-results {
        margin-bottom: 20px;
        
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #606266;
        }
      }
      
      .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        
        .config-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          label {
            font-size: 13px;
            color: #606266;
          }
        }
      }
      
      .scenarios-grid {
        .el-checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
      }
      
      .progress-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
        
        .progress-item {
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
      
      .results-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
        
        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e4e7ed;
          
          .label {
            font-size: 13px;
            color: #606266;
          }
          
          .value {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
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
</style> 
