<template>
  <el-card class="task-monitor">
    <template #header>
      <div class="card-header">
        <span>任务监控</span>
        <div class="header-actions">
          <el-button-group size="small">
            <el-button 
              :type="viewMode === 'list' ? 'primary' : ''" 
              @click="$emit('update:viewMode', 'list')"
            >
              列表
            </el-button>
            <el-button 
              :type="viewMode === 'timeline' ? 'primary' : ''" 
              @click="$emit('update:viewMode', 'timeline')"
            >
              时间线
            </el-button>
          </el-button-group>
        </div>
      </div>
    </template>

    <div class="monitor-content">
      <!-- 任务统计 -->
      <div class="task-stats">
        <el-row :gutter="16">
          <el-col :xs="12" :sm="6">
            <el-statistic title="运行中" :value="taskStats.running" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic title="等待中" :value="taskStats.pending" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic title="已完成" :value="taskStats.completed" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic title="失败" :value="taskStats.failed" />
          </el-col>
        </el-row>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="task-list" style="max-height: 500px; overflow-y: auto;">
        <div v-for="task in tasks" :key="task.id" class="task-item">
          <div class="task-header">
            <div class="task-info">
              <h4>{{ task.name }}</h4>
              <span class="task-type">{{ task.type }}</span>
            </div>
            <div class="task-status">
              <el-tag :type="getStatusTagType(task.status)" size="small">
                {{ getStatusText(task.status) }}
              </el-tag>
            </div>
          </div>

          <div class="task-details">
            <div class="task-progress">
              <el-progress 
                :percentage="calculateProgress(task)" 
                :status="getProgressStatus(task.status)"
                :stroke-width="6"
              />
              <div class="progress-text">
                {{ task.processed }}/{{ task.total }} ({{ calculateProgress(task) }}%)
              </div>
            </div>
            
            <div class="task-meta">
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                开始时间: {{ formatTime(task.startTime) }}
              </span>
              <span v-if="task.endTime" class="meta-item">
                <el-icon><Check /></el-icon>
                结束时间: {{ formatTime(task.endTime) }}
              </span>
              <span class="meta-item">
                <el-icon><DataLine /></el-icon>
                处理: {{ task.processed }}/{{ task.total }}
              </span>
            </div>
          </div>

          <div class="task-actions">
            <el-button-group size="small">
              <el-button 
                v-if="task.status === 'running'" 
                @click="$emit('pause-task', task.id)"
                title="暂停"
              >
                <el-icon><VideoPause /></el-icon>
              </el-button>
              <el-button 
                v-if="task.status === 'paused'" 
                @click="$emit('resume-task', task.id)"
                title="继续"
              >
                <el-icon><VideoPlay /></el-icon>
              </el-button>
              <el-button 
                v-if="['running', 'paused'].includes(task.status)" 
                type="danger"
                @click="$emit('cancel-task', task.id)"
                title="取消"
              >
                <el-icon><Close /></el-icon>
              </el-button>
              <el-button @click="$emit('view-task-detail', task)" title="详情">
                <el-icon><View /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>
      </div>

      <!-- 时间线视图 -->
      <div v-else-if="viewMode === 'timeline'" class="task-timeline" style="max-height: 500px; overflow-y: auto;">
        <el-timeline>
          <el-timeline-item
            v-for="task in sortedTasksByTime"
            :key="task.id"
            :timestamp="formatTime(task.startTime)"
            :type="getTimelineType(task.status)"
          >
            <div class="timeline-content">
              <h4>{{ task.name }}</h4>
              <p>{{ task.description || '数据收集任务' }}</p>
              <div class="timeline-meta">
                <el-tag :type="getStatusTagType(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </el-tag>
                <span class="timeline-progress">进度: {{ calculateProgress(task) }}% ({{ task.processed }}/{{ task.total }})</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 空状态 -->
      <div v-if="tasks.length === 0" class="empty-state">
        <el-empty description="暂无任务" />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Clock, 
  Check, 
  DataLine, 
  VideoPause, 
  VideoPlay, 
  Close, 
  View 
} from '@element-plus/icons-vue'

// 接口定义
interface Task {
  id: string
  name: string
  type: string
  status: 'running' | 'paused' | 'completed' | 'failed' | 'pending'
  progress: number
  startTime: string
  endTime?: string
  processed: number
  total: number
  description?: string
}

// Props
const props = defineProps<{
  tasks: Task[]
  viewMode: 'list' | 'timeline'
}>()

// 监听 tasks 变化
import { watch } from 'vue'
watch(() => props.tasks, (newTasks, oldTasks) => {
  console.log('🔄 TaskMonitor 接收到新的 tasks:', {
    newLength: newTasks.length,
    oldLength: oldTasks?.length || 0,
    runningTasks: newTasks.filter(t => t.status === 'running').map(t => ({
      id: t.id,
      name: t.name,
      processed: t.processed,
      total: t.total,
      progress: t.progress
    }))
  })
}, { deep: true })

// Emits
defineEmits<{
  'update:viewMode': [mode: 'list' | 'timeline']
  'pause-task': [taskId: string]
  'resume-task': [taskId: string]
  'cancel-task': [taskId: string]
  'view-task-detail': [task: Task]
}>()

// 计算属性
const taskStats = computed(() => {
  const stats = {
    running: 0,
    pending: 0,
    completed: 0,
    failed: 0
  }
  
  props.tasks.forEach(task => {
    if (task.status in stats) {
      stats[task.status as keyof typeof stats]++
    }
  })
  
  return stats
})

const sortedTasksByTime = computed(() => {
  return [...props.tasks].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )
})

// 工具函数
const getStatusTagType = (status: string) => {
  const types: Record<string, string> = {
    running: 'primary',
    paused: 'warning',
    completed: 'success',
    failed: 'danger',
    pending: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    running: '运行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败',
    pending: '等待中'
  }
  return texts[status] || status
}

const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  return undefined
}

const getTimelineType = (status: string) => {
  const types: Record<string, string> = {
    running: 'primary',
    paused: 'warning',
    completed: 'success',
    failed: 'danger',
    pending: 'info'
  }
  return types[status] || 'info'
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString()
}

// 计算进度百分比
const calculateProgress = (task: Task) => {
  // 如果有实际的处理数量，使用实际数量计算百分比
  if (task.total > 0 && task.processed >= 0) {
    return Math.round((task.processed / task.total) * 100)
  }
  
  // 如果 task.progress 已经是百分比（0-100），直接使用
  if (task.progress >= 0 && task.progress <= 100) {
    return task.progress
  }
  
  // 如果 task.progress 是实际数量，尝试计算百分比
  if (task.progress > 0) {
    // 假设 total 是 100，progress 是实际数量
    return Math.min(Math.round(task.progress), 100)
  }
  
  return 0
}
</script>

<style lang="scss" scoped>
.task-monitor {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .monitor-content {
    .task-stats {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      
      .el-statistic {
        text-align: center;
      }
    }
    
    .task-list {
      .task-item {
        border: 1px solid #ebeef5;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        background: #fff;
        
        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          
          .task-info {
            h4 {
              margin: 0 0 4px 0;
              color: #303133;
              font-size: 16px;
            }
            
            .task-type {
              font-size: 12px;
              color: #909399;
            }
          }
        }
        
        .task-details {
          margin-bottom: 12px;
          
          .task-progress {
            margin-bottom: 8px;
            
            .progress-text {
              text-align: center;
              font-size: 12px;
              color: #606266;
              margin-top: 4px;
            }
          }
          
          .task-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            
            .meta-item {
              display: flex;
              align-items: center;
              font-size: 12px;
              color: #606266;
              
              .el-icon {
                margin-right: 4px;
              }
            }
          }
        }
        
        .task-actions {
          text-align: right;
        }
      }
    }
    
    .task-timeline {
      .timeline-content {
        h4 {
          margin: 0 0 8px 0;
          color: #303133;
          font-size: 16px;
        }
        
        p {
          margin: 0 0 8px 0;
          color: #606266;
          font-size: 14px;
        }
        
        .timeline-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .timeline-progress {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 0;
    }
  }
}

@media (max-width: 768px) {
  .task-monitor {
    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }
    
    .monitor-content {
      .task-stats {
        .el-col {
          margin-bottom: 12px;
        }
      }
      
      .task-list {
        .task-item {
          .task-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .task-details {
            .task-meta {
              flex-direction: column;
              gap: 8px;
            }
          }
          
          .task-actions {
            text-align: center;
          }
        }
      }
    }
  }
}
</style> 