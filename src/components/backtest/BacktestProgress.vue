<template>
  <el-card class="backtest-progress">
    <template #header>
      <div class="card-header">
        <span>回测进度</span>
        <el-button 
          v-if="isRunning" 
          size="small" 
          type="danger" 
          @click="handleStop"
        >
          <el-icon><VideoPause /></el-icon>
          停止回测
        </el-button>
      </div>
    </template>
    
    <div v-if="!isRunning && !progress" class="no-progress">
      <el-text type="info">点击"开始回测"启动策略回测</el-text>
    </div>
    
    <div v-else class="progress-content">
      <!-- 总体进度 -->
      <div class="overall-progress">
        <div class="progress-header">
          <span class="progress-title">总体进度</span>
          <span class="progress-percent">{{ Math.round(progress?.overall || 0) }}%</span>
        </div>
        <el-progress 
          :percentage="Math.round(progress?.overall || 0)" 
          :status="getProgressStatus()"
          :stroke-width="8"
        />
      </div>
      
      <!-- 阶段进度 -->
      <div v-if="progress" class="stage-progress">
        <div class="stage-item">
          <div class="stage-header">
            <span class="stage-name">数据加载</span>
            <span class="stage-status">{{ getStageStatus('data_loading') }}</span>
          </div>
          <el-progress 
            :percentage="Math.round(progress.stages.data_loading)" 
            :show-text="false"
            :stroke-width="6"
            :status="getStageProgressStatus('data_loading')"
          />
        </div>
        
        <div class="stage-item">
          <div class="stage-header">
            <span class="stage-name">策略计算</span>
            <span class="stage-status">{{ getStageStatus('strategy_calculation') }}</span>
          </div>
          <el-progress 
            :percentage="Math.round(progress.stages.strategy_calculation)" 
            :show-text="false"
            :stroke-width="6"
            :status="getStageProgressStatus('strategy_calculation')"
          />
        </div>
        
        <div class="stage-item">
          <div class="stage-header">
            <span class="stage-name">交易模拟</span>
            <span class="stage-status">{{ getStageStatus('trading_simulation') }}</span>
          </div>
          <el-progress 
            :percentage="Math.round(progress.stages.trading_simulation)" 
            :show-text="false"
            :stroke-width="6"
            :status="getStageProgressStatus('trading_simulation')"
          />
        </div>
        
        <div class="stage-item">
          <div class="stage-header">
            <span class="stage-name">结果分析</span>
            <span class="stage-status">{{ getStageStatus('result_analysis') }}</span>
          </div>
          <el-progress 
            :percentage="Math.round(progress.stages.result_analysis)" 
            :show-text="false"
            :stroke-width="6"
            :status="getStageProgressStatus('result_analysis')"
          />
        </div>
      </div>
      
      <!-- 实时信息 -->
      <div v-if="progress" class="realtime-info">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ progress.currentDate }}</div>
              <div class="info-label">当前日期</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ progress.processedDays }}</div>
              <div class="info-label">已处理天数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ progress.totalTrades }}</div>
              <div class="info-label">交易次数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ formatCurrency(progress.currentValue) }}</div>
              <div class="info-label">当前价值</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 日志信息 -->
      <div v-if="progress && progress.logs.length > 0" class="progress-logs">
        <div class="logs-header">
          <span>执行日志</span>
          <el-button size="small" text @click="clearLogs">清空</el-button>
        </div>
        <div class="logs-content" style="max-height: 200px; overflow-y: auto;">
          <div 
            v-for="(log, index) in progress.logs" 
            :key="index" 
            class="log-item"
            :class="log.level"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
      
      <!-- 估算时间 -->
      <div v-if="isRunning && progress" class="time-estimation">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="time-item">
              <div class="time-value">{{ formatDuration(progress.elapsedTime) }}</div>
              <div class="time-label">已用时间</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="time-item">
              <div class="time-value">{{ formatDuration(progress.estimatedTime) }}</div>
              <div class="time-label">预计总时间</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="time-item">
              <div class="time-value">{{ formatDuration(progress.remainingTime) }}</div>
              <div class="time-label">剩余时间</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { VideoPause } from '@element-plus/icons-vue'

// 接口定义
interface BacktestProgress {
  overall: number
  stages: {
    data_loading: number
    strategy_calculation: number
    trading_simulation: number
    result_analysis: number
  }
  currentDate: string
  processedDays: number
  totalTrades: number
  currentValue: number
  elapsedTime: number
  estimatedTime: number
  remainingTime: number
  logs: ProgressLog[]
}

interface ProgressLog {
  time: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

// Props
const props = defineProps<{
  progress: BacktestProgress | null
  isRunning: boolean
}>()

// Emits
const emit = defineEmits<{
  'stop-backtest': []
  'clear-logs': []
}>()

// 工具函数
const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

const getProgressStatus = () => {
  if (!props.progress) return undefined
  if (props.progress.overall >= 100) return 'success'
  if (props.isRunning) return undefined
  return 'exception'
}

const getStageStatus = (stageName: keyof BacktestProgress['stages']) => {
  if (!props.progress) return '待开始'
  const stageProgress = props.progress.stages[stageName]
  if (stageProgress >= 100) return '已完成'
  if (stageProgress > 0) return '进行中'
  return '待开始'
}

const getStageProgressStatus = (stageName: keyof BacktestProgress['stages']) => {
  if (!props.progress) return undefined
  const stageProgress = props.progress.stages[stageName]
  if (stageProgress >= 100) return 'success'
  if (stageProgress > 0) return undefined
  return undefined
}

// 事件处理
const handleStop = () => {
  emit('stop-backtest')
}

const clearLogs = () => {
  emit('clear-logs')
}
</script>

<style lang="scss" scoped>
.backtest-progress {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .no-progress {
    padding: 40px 20px;
    text-align: center;
  }
  
  .progress-content {
    .overall-progress {
      margin-bottom: 24px;
      
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .progress-title {
          font-weight: 600;
          color: #303133;
        }
        
        .progress-percent {
          font-weight: bold;
          color: #409eff;
        }
      }
    }
    
    .stage-progress {
      margin-bottom: 24px;
      
      .stage-item {
        margin-bottom: 16px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .stage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          
          .stage-name {
            font-size: 14px;
            color: #303133;
          }
          
          .stage-status {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
    
    .realtime-info {
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 6px;
      
      .info-item {
        text-align: center;
        
        .info-value {
          font-size: 18px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .info-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
    
    .progress-logs {
      margin-bottom: 24px;
      
      .logs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        span {
          font-weight: 600;
          color: #303133;
        }
      }
      
      .logs-content {
        border: 1px solid #ebeef5;
        border-radius: 4px;
        padding: 8px;
        background: #fafafa;
        
        .log-item {
          display: flex;
          margin-bottom: 4px;
          font-size: 12px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .log-time {
            margin-right: 8px;
            color: #909399;
            white-space: nowrap;
          }
          
          .log-message {
            flex: 1;
          }
          
          &.info {
            color: #303133;
          }
          
          &.success {
            color: #67c23a;
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
    
    .time-estimation {
      .time-item {
        text-align: center;
        
        .time-value {
          font-size: 16px;
          font-weight: bold;
          color: #409eff;
          margin-bottom: 4px;
        }
        
        .time-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .backtest-progress {
    .progress-content {
      .realtime-info {
        .info-item {
          margin-bottom: 12px;
          
          .info-value {
            font-size: 16px;
          }
        }
      }
      
      .time-estimation {
        .time-item {
          margin-bottom: 12px;
          
          .time-value {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style> 