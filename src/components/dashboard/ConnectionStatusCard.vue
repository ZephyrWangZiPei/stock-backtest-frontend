<template>
  <el-card class="connection-status-card">
    <template #header>
      <div class="card-header">
        <span>服务连接状态</span>
        <el-button @click="checkConnectionStatus" size="small" type="primary">
          检查连接
        </el-button>
      </div>
    </template>
    <el-row :gutter="20">
      <el-col :span="4" v-for="(status, service) in connectionStatus" :key="service">
        <div class="status-indicator" :class="{ connected: status }">
          <el-icon :class="{ 'is-success': status, 'is-danger': !status }">
            <CircleCheck v-if="status" />
            <CircleClose v-else />
          </el-icon>
          <span class="service-name">{{ getServiceDisplayName(service) }}</span>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import enhancedWebSocketManager from '@/utils/unifiedWebSocketManager'

// Props
interface Props {
  connectionStatus: Record<string, boolean>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  statusUpdate: [status: Record<string, boolean>]
}>()

// 方法
const getServiceDisplayName = (service: string) => {
  const names = {
    dataCollection: '数据采集',
    aiAnalysis: 'AI分析',
    newsAnalysis: '新闻分析',
    scheduler: '调度器'
  }
  return names[service as keyof typeof names] || service
}

const checkConnectionStatus = () => {
  const status = enhancedWebSocketManager.getUnifiedConnectionStatus()
  emit('statusUpdate', status)
  ElMessage.success('连接状态已检查')
}
</script>

<style scoped>
.connection-status-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: #f56c6c;
  color: white;
}

.status-indicator.connected {
  background-color: #67c23a;
}

.service-name {
  font-size: 12px;
  font-weight: 500;
}
</style> 
