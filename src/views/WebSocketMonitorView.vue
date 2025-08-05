<template>
  <div class="websocket-monitor-view">
    <div class="page-header">
      <h1>🔗 WebSocket连接监控</h1>
      <p class="description">实时监控WebSocket连接状态、网络质量和事件日志</p>
    </div>
    
    <div class="monitor-content">
      <!-- 连接状态监控 -->
      <div class="monitor-section">
        <ConnectionStatusMonitor />
      </div>
      
      <!-- 事件日志和连接测试 -->
      <div class="monitor-section">
        <el-row :gutter="20">
          <el-col :span="16">
            <WebSocketEventLogger ref="eventLogger" />
          </el-col>
          <el-col :span="8">
            <WebSocketConnectionTester ref="connectionTester" />
          </el-col>
        </el-row>
      </div>
      
      <!-- 连接统计图表 -->
      <div class="monitor-section">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">📊 连接统计</span>
              <el-button 
                type="primary" 
                size="small" 
                @click="refreshCharts"
              >
                刷新图表
              </el-button>
            </div>
          </template>
          
          <div class="charts-container">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="chart-item">
                  <h4>连接状态趋势</h4>
                  <div class="chart-placeholder">
                    <el-empty description="图表功能开发中..." />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="chart-item">
                  <h4>网络延迟分布</h4>
                  <div class="chart-placeholder">
                    <el-empty description="图表功能开发中..." />
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>
      
      <!-- 性能指标 -->
      <div class="monitor-section">
        <el-card class="metrics-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">📈 性能指标</span>
              <el-button 
                type="primary" 
                size="small" 
                @click="refreshMetrics"
              >
                刷新指标
              </el-button>
            </div>
          </template>
          
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-icon">📡</div>
              <div class="metric-content">
                <div class="metric-value">{{ metrics.totalConnections }}</div>
                <div class="metric-label">总连接数</div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-icon">⚡</div>
              <div class="metric-content">
                <div class="metric-value">{{ metrics.avgLatency }}ms</div>
                <div class="metric-label">平均延迟</div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-icon">📈</div>
              <div class="metric-content">
                <div class="metric-value">{{ metrics.successRate }}%</div>
                <div class="metric-label">成功率</div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-icon">🔄</div>
              <div class="metric-content">
                <div class="metric-value">{{ metrics.reconnectCount }}</div>
                <div class="metric-label">重连次数</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ConnectionStatusMonitor from '@/components/websocket/ConnectionStatusMonitor.vue'
import WebSocketEventLogger from '@/components/websocket/WebSocketEventLogger.vue'
import WebSocketConnectionTester from '@/components/websocket/WebSocketConnectionTester.vue'

const eventLogger = ref()
const connectionTester = ref()

const metrics = reactive({
  totalConnections: 5,
  avgLatency: 45,
  successRate: 98.5,
  reconnectCount: 3
})

const refreshCharts = () => {
  console.log('刷新图表')
  // 这里添加刷新图表逻辑
}

const refreshMetrics = () => {
  console.log('刷新指标')
  // 这里添加刷新指标逻辑
}

onMounted(() => {
  console.log('WebSocket监控页面已挂载')
})
</script>

<style scoped>
.websocket-monitor-view {
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
}

.description {
  color: #909399;
  margin: 0;
}

.monitor-content {
  max-width: 1200px;
  margin: 0 auto;
}

.monitor-section {
  margin-bottom: 30px;
}

.chart-card,
.metrics-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: bold;
  color: #303133;
}

.charts-container {
  padding: 20px 0;
}

.chart-item {
  text-align: center;
}

.chart-item h4 {
  margin-bottom: 15px;
  color: #606266;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.metric-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.metric-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.metric-label {
  color: #909399;
  font-size: 0.9rem;
}
</style> 
