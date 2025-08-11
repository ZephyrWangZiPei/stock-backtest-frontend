<template>
  <el-card class="strategy-config">
    <template #header>
      <span>策略配置</span>
    </template>
    
    <div class="config-content" style="max-height: 600px; overflow-y: auto;">
      <el-form :model="localConfig" label-width="130px" size="default">
        <!-- 基本配置 -->
        <el-divider content-position="left">基本配置</el-divider>
      
        
        <el-form-item label="策略名称" required>
          <el-select 
            v-model="localConfig.strategy" 
            placeholder="选择策略" 
            style="width: 100%"
            :loading="loadingStrategies"
            :disabled="loadingStrategies"
          >
            <el-option 
              v-for="strategy in availableStrategies" 
              :key="strategy.id" 
              :label="strategy.name" 
              :value="strategy.id"
            >
              <div class="strategy-option">
                <span>{{ strategy.name }}</span>
                <span class="strategy-desc">{{ strategy.description }}</span>
              </div>
            </el-option>
          </el-select>
          <div v-if="loadingStrategies" style="color: #409eff; font-size: 12px; margin-top: 4px;">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在加载策略列表...
          </div>
          <div v-else-if="availableStrategies.length === 0" style="color: #f56c6c; font-size: 12px; margin-top: 4px;">
            策略列表加载失败，请刷新页面重试
          </div>
        </el-form-item>
        
        <el-form-item label="股票池" required>
          <el-select 
            v-model="localConfig.stockPool" 
            multiple 
            filterable 
            placeholder="选择股票" 
            style="width: 100%"
            max-collapse-tags="3"
            collapse-tags
          >
            <el-option 
              v-for="stock in availableStocks" 
              :key="stock.code" 
              :label="`${stock.name} (${stock.code})`" 
              :value="stock.code"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="回测时间">
          <el-date-picker
            v-model="localConfig.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="初始资金">
          <el-input-number
            v-model="localConfig.initialCapital"
            :min="10000"
            :max="10000000"
            :step="10000"
            placeholder="初始资金"
            style="width: 100%"
          />
          <span class="unit-label">元</span>
        </el-form-item>
        
        <!-- 交易设置 -->
        <el-divider content-position="left">交易设置</el-divider>
        
        <el-form-item label="手续费率">
          <el-input-number
            v-model="localConfig.commission"
            :min="0"
            :max="0.01"
            :step="0.0001"
            :precision="4"
            placeholder="手续费率"
            style="width: 100%"
          />
          <span class="unit-label">%</span>
        </el-form-item>
        
        <el-form-item label="印花税率">
          <el-input-number
            v-model="localConfig.stampTax"
            :min="0"
            :max="0.01"
            :step="0.0001"
            :precision="4"
            placeholder="印花税率"
            style="width: 100%"
          />
          <span class="unit-label">%</span>
        </el-form-item>
        
        <el-form-item label="滑点">
          <el-input-number
            v-model="localConfig.slippage"
            :min="0"
            :max="0.1"
            :step="0.001"
            :precision="3"
            placeholder="滑点"
            style="width: 100%"
          />
          <span class="unit-label">%</span>
        </el-form-item>
        
        <!-- 风控设置 -->
        <el-divider content-position="left">风控设置</el-divider>
        
        <el-form-item label="单只股票最大仓位">
          <el-slider
            v-model="localConfig.maxPositionPct"
            :min="5"
            :max="100"
            :step="5"
            show-stops
            show-tooltip
            :format-tooltip="(val: number) => `${val}%`"
          />
        </el-form-item>
        
        <el-form-item label="止损比例">
          <el-input-number
            v-model="localConfig.stopLoss"
            :min="0"
            :max="50"
            :step="1"
            placeholder="止损比例"
            style="width: 100%"
          />
          <span class="unit-label">%</span>
        </el-form-item>
        
        <el-form-item label="止盈比例">
          <el-input-number
            v-model="localConfig.takeProfit"
            :min="0"
            :max="200"
            :step="5"
            placeholder="止盈比例"
            style="width: 100%"
          />
          <span class="unit-label">%</span>
        </el-form-item>
        
        <!-- 策略参数 -->
        <el-divider content-position="left">策略参数</el-divider>
        
        <div v-if="selectedStrategyParams.length > 0">
          <el-form-item 
            v-for="param in selectedStrategyParams" 
            :key="param.name"
            :label="param.label"
          >
            <!-- 数字类型参数 -->
            <el-input-number
              v-if="param.type === 'number'"
              v-model="localConfig.strategyParams[param.name]"
              :min="param.min"
              :max="param.max"
              :step="param.step"
              :precision="param.precision"
              :placeholder="param.description"
              style="width: 100%"
            />
            
            <!-- 选择类型参数 -->
            <el-select
              v-else-if="param.type === 'select'"
              v-model="localConfig.strategyParams[param.name]"
              :placeholder="param.description"
              style="width: 100%"
            >
              <el-option
                v-for="option in param.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            
            <!-- 默认文本输入 -->
            <el-input
              v-else
              v-model="localConfig.strategyParams[param.name]"
              :placeholder="param.description"
              style="width: 100%"
            />
            
            <span v-if="param.unit" class="unit-label">{{ param.unit }}</span>
          </el-form-item>
        </div>
        
        <div v-else class="no-params">
          <el-text type="info">当前策略无需额外参数配置</el-text>
        </div>
      </el-form>
    </div>
    
    <div class="config-actions">
      <el-button @click="handleReset">重置配置</el-button>
      <el-button @click="handleSaveTemplate">保存模板</el-button>
      <el-button type="primary" @click="handleStartBacktest" :loading="isRunning">
        <el-icon><VideoPlay /></el-icon>
        开始回测
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Loading } from '@element-plus/icons-vue'
import unifiedHttpClient from '@/utils/unifiedHttpClient'

// 接口定义
interface StrategyConfig {
  strategy: string | number // 支持字符串和数字类型的策略ID
  stockPool: string[]
  dateRange: [string, string] | null
  initialCapital: number
  commission: number
  stampTax: number
  slippage: number
  maxPositionPct: number
  stopLoss: number
  takeProfit: number
  strategyParams: Record<string, any>
}

interface Strategy {
  id: string | number // 支持字符串和数字类型的策略ID
  name: string
  description: string
  parameters: any // 支持两种格式：对象格式和数组格式
  db_id?: number // 数据库ID
}

interface StrategyParam {
  name: string
  label?: string
  description?: string
  min?: number
  max?: number
  step?: number
  precision?: number
  unit?: string
  default: any
  type?: string
  options?: Array<{value: string, label: string}>
}

interface Stock {
  code: string
  name: string
  industry: string
}

// Props
const props = defineProps<{
  config: StrategyConfig
  isRunning: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:config': [config: StrategyConfig]
  'start-backtest': []
  'reset-config': []
  'save-template': []
}>()

// 响应式数据
const localConfig = reactive<StrategyConfig>({ ...props.config })

// 监听props变化
watch(() => props.config, (newConfig) => {
  Object.assign(localConfig, newConfig)
}, { deep: true })

// 监听本地配置变化，发送更新事件
watch(localConfig, (newConfig) => {
  emit('update:config', { ...newConfig })
}, { deep: true })

// 可用策略
const availableStrategies = ref<Strategy[]>([])
const loadingStrategies = ref(false)

// 可用股票 - 从API获取
const availableStocks = ref<Stock[]>([])
const loadingStocks = ref(false)

// 加载可用策略列表
const loadAvailableStrategies = async () => {
  try {
    loadingStrategies.value = true
    console.log('开始加载策略列表...')
    
    const response = await unifiedHttpClient.backtest.getStrategies()
    console.log('策略列表接口响应:', response)
    
    if (response.data.data && Array.isArray(response.data.data)) {
      availableStrategies.value = response.data.data
      console.log('加载策略列表成功:', response.data.data)
      ElMessage.success(`成功加载 ${response.data.data.length} 个策略`)
    } else {
      console.warn('策略列表响应数据格式异常:', response)
      availableStrategies.value = []
      ElMessage.warning('策略列表数据格式异常')
    }
  } catch (error) {
    console.error('加载策略列表失败:', error)
    ElMessage.error(`加载策略列表失败: ${error.message || '未知错误'}`)
    availableStrategies.value = []
  } finally {
    loadingStrategies.value = false
  }
}

// 加载可用股票列表
const loadAvailableStocks = async () => {
  try {
    loadingStocks.value = true
    
    const response = await unifiedHttpClient.dataCollection.getStocksList({
      limit: 500  // 获取更多股票供选择
    })
    
    if (response.data && response.data.stock_list) {
      availableStocks.value = response.data.stock_list.map((stock: any) => ({
        code: stock.code,
        name: stock.name,
        industry: stock.industry || '未知'
      }))
    } else {
      // 备用方案：从筛选API获取股票列表
      try {
        const screeningResponse = await unifiedHttpClient.screening.getAvailableStocks()
        if (screeningResponse.data && screeningResponse.data.data) {
          availableStocks.value = screeningResponse.data.data.map((stock: any) => ({
            code: stock.code,
            name: stock.name,
            industry: stock.industry || '未知'
          }))
        }
      } catch (error) {
        console.warn('备用股票列表获取也失败:', error)
      }
    }
  } catch (error) {
    console.error('加载股票列表失败:', error)
    ElMessage.warning('加载股票列表失败，请检查网络连接')
    availableStocks.value = []
  } finally {
    loadingStocks.value = false
  }
}

// 组件挂载时加载股票列表和策略列表
onMounted(() => {
  loadAvailableStocks()
  loadAvailableStrategies()
})

// 计算当前选中策略的参数
const selectedStrategyParams = computed(() => {
  const strategy = availableStrategies.value.find(s => s.id === localConfig.strategy)
  if (!strategy) return []
  
  const params = strategy.parameters
  
  // 处理两种参数格式
  if (Array.isArray(params)) {
    // 数组格式：直接返回
    return params.map(param => ({
      name: param.name,
      label: param.label || param.name,
      description: param.description || '',
      min: param.min || 0,
      max: param.max || 100,
      step: param.step || 1,
      precision: param.precision || 0,
      unit: param.unit || '',
      default: param.default,
      type: param.type || 'number',
      options: param.options || []
    }))
  } else if (typeof params === 'object') {
    // 对象格式：转换为数组格式
    return Object.entries(params).map(([name, config]: [string, any]) => ({
      name,
      label: config.description || name,
      description: config.description || '',
      min: config.min || 0,
      max: config.max || 100,
      step: config.step || 1,
      precision: config.precision || 0,
      unit: '',
      default: config.default,
      type: config.type || 'number'
    }))
  }
  
  return []
})

// 监听策略变化，初始化参数
watch(() => localConfig.strategy, (newStrategy) => {
  if (newStrategy) {
    const strategy = availableStrategies.value.find(s => s.id === newStrategy)
    if (strategy) {
      console.log('策略变化，初始化参数:', strategy)
      
      // 初始化策略参数为默认值
      const params: Record<string, any> = {}
      selectedStrategyParams.value.forEach(param => {
        // 确保默认值类型正确
        if (param.type === 'number') {
          params[param.name] = typeof param.default === 'number' ? param.default : 0
        } else if (param.type === 'select') {
          params[param.name] = param.default || (param.options && param.options[0]?.value)
        } else {
          params[param.name] = param.default || ''
        }
      })
      
      localConfig.strategyParams = params
      console.log('策略参数初始化完成:', params)
    }
  }
})

// 事件处理
const handleReset = () => {
  emit('reset-config')
  ElMessage.info('配置已重置')
}

const handleSaveTemplate = async () => {
  try {
    const { value: templateName } = await ElMessageBox.prompt('请输入模板名称', '保存配置模板', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: '模板名称长度应为1-20个字符'
    })
    
    emit('save-template')
    ElMessage.success(`配置模板"${templateName}"已保存`)
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存模板失败')
    }
  }
}

const handleStartBacktest = () => {
  // 验证必填项
  if (!localConfig.strategy) {
    ElMessage.error('请选择策略')
    return
  }
  
  if (!localConfig.stockPool || localConfig.stockPool.length === 0) {
    ElMessage.error('请选择股票池')
    return
  }
  
  if (!localConfig.dateRange) {
    ElMessage.error('请选择回测时间范围')
    return
  }
  
  emit('start-backtest')
}
</script>

<style lang="scss" scoped>
.strategy-config {
  .config-content {
  padding:10px;
    .unit-label {
      margin-left: 8px;
      color: #909399;
      font-size: 12px;
    }
    
    .no-params {
      text-align: center;
      padding: 20px;
    }
  }
  
  .config-actions {
    margin-top: 20px;
    text-align: right;
    border-top: 1px solid #ebeef5;
    padding-top: 16px;
    
    .el-button {
      margin-left: 8px;
    }
  }
}

// 策略选择器选项样式
:deep(.el-select-dropdown) {
  .strategy-option {
    display: flex;
    flex-direction: column;
    
    .strategy-desc {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
}

// 表单样式优化
:deep(.el-form-item) {
  margin-bottom: 16px;
  
  .el-form-item__label {
    font-weight: 500;
  }
}

:deep(.el-divider) {
  margin: 20px 0 16px 0;
  
  .el-divider__text {
    font-weight: 600;
    color: #409eff;
  }
}

:deep(.el-slider) {
  .el-slider__runway {
    height: 6px;
  }
  
  .el-slider__button {
    width: 16px;
    height: 16px;
  }
}
</style> 