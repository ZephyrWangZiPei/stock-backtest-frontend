<template>
  <el-card class="data-collection-panel">
    <template #header>
      <div class="card-header">
        <span>数据收集控制台</span>
        <el-button @click="$emit('refresh-tasks')" size="small">
          <el-icon><Refresh /></el-icon>
          刷新状态
        </el-button>
      </div>
    </template>

    <div class="collection-controls">
      <!-- 快速收集 -->
      <div class="quick-collection">
        <h4>快速收集</h4>
        <el-row :gutter="12">
          <el-col :xs="12" :sm="6">
            <el-button 
              type="primary" 
              @click="$emit('quick-collect', 'stock_basic')"
              :loading="isCollecting"
              block
            >
              更新股票列表
            </el-button>
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-button 
              type="success" 
              @click="$emit('quick-collect', 'daily_data')"
              :loading="isCollecting"
              block
            >
              补齐日线数据
            </el-button>
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-button 
              type="warning" 
              @click="$emit('quick-collect', 'fundamental')"
              :loading="isCollecting"
              block
            >
              基本面数据
            </el-button>
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-button 
              type="info" 
              @click="$emit('quick-collect', 'technical')"
              :loading="isCollecting"
              block
            >
              技术指标
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 自定义收集 -->
      <div class="custom-collection">
        <h4>自定义收集</h4>
        <el-form :model="customForm" label-width="100px" size="small">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="数据类型">
                <el-select v-model="customForm.dataType" placeholder="选择数据类型" style="width: 100%">
                  <el-option label="股票基础信息" value="stock_basic" />
                  <el-option label="日线数据" value="daily_data" />
                  <el-option label="基本面数据" value="fundamental" />
                  <el-option label="技术指标" value="technical" />
                  <el-option label="新闻数据" value="news_data" />
                  <el-option label="资金流向" value="fund_flow" />
                  <el-option label="机构持股" value="institute_hold" />
                  <el-option label="分析师评级" value="analyst_rating" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="8">
              <el-form-item label="数据源">
                <el-select v-model="customForm.dataSource" placeholder="选择数据源" style="width: 100%">
                  <el-option label="Baostock" value="baostock" />
                  <el-option label="AkShare" value="akshare" />
                  <el-option label="Tushare" value="tushare" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="8">
              <el-form-item label="时间范围">
                <el-select v-model="customForm.timeRange" placeholder="选择时间范围" style="width: 100%">
                  <el-option label="最近1个月" value="1m" />
                  <el-option label="最近3个月" value="3m" />
                  <el-option label="最近1年" value="1y" />
                  <el-option label="最近5年" value="5y" />
                  <el-option label="全部历史" value="all" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleCustomCollect"
              :loading="isCollecting"
              :disabled="!customForm.dataType || !customForm.dataSource"
            >
              开始收集
            </el-button>
            <el-button @click="resetCustomForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 批量操作 -->
      <div class="batch-operations">
        <h4>批量操作</h4>
        <el-space>
          <el-button 
            type="danger" 
            @click="$emit('batch-operation', 'stop', runningTasks)"
            :disabled="runningTasks.length === 0"
          >
            停止所有任务
          </el-button>
        </el-space>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import type { Task } from '../../types/task'

// 接口定义
interface CustomCollectionForm {
  dataType: string
  dataSource: string
  timeRange: string
}

// Props
const props = defineProps<{
  isCollecting: boolean
  tasks: Task[]
}>()

// Emits
 const emit=defineEmits<{
  'refresh-tasks': []
  'quick-collect': [type: string]
  'custom-collect': [params: any]
  'batch-operation': [operation: string, tasks: Task[]]
}>()

// 响应式数据
const customForm = reactive<CustomCollectionForm>({
  dataType: '',
  dataSource: '',
  timeRange: '1y'
})

// 计算属性
const runningTasks = computed(() => 
  props.tasks.filter(task => task.status === 'running')
)

const pausedTasks = computed(() => 
  props.tasks.filter(task => task.status === 'paused')
)

// 方法
const handleCustomCollect = () => {
  if (!customForm.dataType || !customForm.dataSource) {
    ElMessage.warning('请选择数据类型和数据源')
    return
  }
  
  // 发送自定义收集事件，由父组件完成真实启动
  const params: any = {
    data_source: customForm.dataSource,
    data_type: customForm.dataType,
    // 可由父组件补齐日期范围，此处先给出基于 timeRange 的大致范围
  }
  
  // 简单映射 timeRange 到日期范围（可选，父组件会覆盖）
  const today = new Date()
  const dateToStr = (d: Date) => d.toISOString().split('T')[0]
  const start = new Date(today)
  switch (customForm.timeRange) {
    case '1m': start.setMonth(today.getMonth() - 1); break
    case '3m': start.setMonth(today.getMonth() - 3); break
    case '1y': start.setFullYear(today.getFullYear() - 1); break
    case '5y': start.setFullYear(today.getFullYear() - 5); break
    case 'all': start.setFullYear(today.getFullYear() - 20); break
    default: start.setMonth(today.getMonth() - 1); break
  }
  params.start_date = dateToStr(start)
  params.end_date = dateToStr(today)
  
  // 向父组件发出事件
  // @ts-ignore
  emit('custom-collect', params)
}

const resetCustomForm = () => {
  customForm.dataType = ''
  customForm.dataSource = ''
  customForm.timeRange = '1y'
}
</script>

<style lang="scss" scoped>
.data-collection-panel {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .collection-controls {
    .quick-collection,
    .custom-collection,
    .batch-operations {
      margin-bottom: 24px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      h4 {
        margin: 0 0 16px 0;
        color: #303133;
        font-size: 16px;
        border-bottom: 1px solid #ebeef5;
        padding-bottom: 8px;
      }
    }
    
    .quick-collection {
      .el-col {
        margin-bottom: 8px;
      }
    }
    
    .batch-operations {
      .el-space {
        width: 100%;
        justify-content: center;
      }
    }
  }
}

@media (max-width: 768px) {
  .data-collection-panel {
    .collection-controls {
      .custom-collection {
        .el-col {
          margin-bottom: 12px;
        }
      }
      
      .batch-operations {
        .el-space {
          flex-direction: column;
          
          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style> 