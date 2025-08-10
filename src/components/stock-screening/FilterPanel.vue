<template>
  <el-card class="filter-panel">
    <template #header>
      <div class="card-header">
        <span>筛选条件</span>
        <el-button size="small" @click="handleResetFilters">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </template>
    
    <div class="filter-content" style="max-height: 600px; overflow-y: auto;">
      <!-- 基本信息筛选 -->
      <el-collapse v-model="activeCollapse" accordion>
        <el-collapse-item title="基本信息" name="basic">
          <el-form :model="localFilters" label-width="80px" size="small">
            <el-form-item label="行业">
              <el-select 
                v-model="localFilters.industry" 
                multiple 
                placeholder="选择行业" 
                style="width: 100%"
                max-collapse-tags="2"
                collapse-tags
              >
                <el-option v-for="industry in industries" :key="industry" :label="industry" :value="industry" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="市值范围">
              <el-slider
                v-model="localFilters.marketCapRange"
                range
                :min="0"
                :max="10000"
                :step="100"
                :format-tooltip="formatMarketCap"
              />
            </el-form-item>
            
            <el-form-item label="股价范围">
              <el-input-number 
                v-model="localFilters.priceMin" 
                :min="0" 
                :step="0.1" 
                placeholder="最低价" 
                style="width: 48%" 
              />
              <span style="margin: 0 2%">-</span>
              <el-input-number 
                v-model="localFilters.priceMax" 
                :min="0" 
                :step="0.1" 
                placeholder="最高价" 
                style="width: 48%" 
              />
            </el-form-item>
          </el-form>
        </el-collapse-item>
        
        <!-- 财务指标筛选 -->
        <el-collapse-item title="财务指标" name="financial">
          <el-form :model="localFilters" label-width="80px" size="small">
            <el-form-item label="市盈率">
              <el-slider
                v-model="localFilters.peRange"
                range
                :min="0"
                :max="100"
                :step="1"
              />
            </el-form-item>
            
            <el-form-item label="市净率">
              <el-slider
                v-model="localFilters.pbRange"
                range
                :min="0"
                :max="10"
                :step="0.1"
              />
            </el-form-item>
            
            <el-form-item label="ROE">
              <el-input-number 
                v-model="localFilters.roeMin" 
                :min="0" 
                :max="100" 
                :step="1" 
                placeholder="最小ROE%" 
                style="width: 100%" 
              />
            </el-form-item>
            
            <el-form-item label="负债率">
              <el-input-number 
                v-model="localFilters.debtRatioMax" 
                :min="0" 
                :max="100" 
                :step="1" 
                placeholder="最大负债率%" 
                style="width: 100%" 
              />
            </el-form-item>
          </el-form>
        </el-collapse-item>
        
        <!-- 技术指标筛选 -->
        <el-collapse-item title="技术指标" name="technical">
          <el-form :model="localFilters" label-width="80px" size="small">
            <el-form-item label="RSI">
              <el-slider
                v-model="localFilters.rsiRange"
                range
                :min="0"
                :max="100"
                :step="1"
              />
            </el-form-item>
            
            <el-form-item label="MACD">
              <el-radio-group v-model="localFilters.macdSignal">
                <el-radio label="all">全部</el-radio>
                <el-radio label="golden">金叉</el-radio>
                <el-radio label="dead">死叉</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="均线状态">
              <el-checkbox-group v-model="localFilters.maStatus">
                <el-checkbox label="above_ma5">站上5日线</el-checkbox>
                <el-checkbox label="above_ma20">站上20日线</el-checkbox>
                <el-checkbox label="above_ma60">站上60日线</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-collapse-item>
        
        <!-- 成交量筛选 -->
        <el-collapse-item title="成交量" name="volume">
          <el-form :model="localFilters" label-width="80px" size="small">
            <el-form-item label="成交量">
              <el-radio-group v-model="localFilters.volumeCondition">
                <el-radio label="all">全部</el-radio>
                <el-radio label="increase">放量</el-radio>
                <el-radio label="decrease">缩量</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="换手率">
              <el-slider
                v-model="localFilters.turnoverRange"
                range
                :min="0"
                :max="20"
                :step="0.1"
              />
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
      
      <!-- 筛选操作按钮 -->
      <div class="filter-actions">
        <el-button type="primary" :loading="isScreening" @click="handleStartScreening" block>
          <el-icon><Search /></el-icon>
          开始筛选
        </el-button>
        <el-button @click="handleSaveTemplate" block>
          <el-icon><Star /></el-icon>
          保存为模板
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Star } from '@element-plus/icons-vue'

// Props
interface FilterData {
  industry: string[]
  marketCapRange: [number, number]
  priceMin: number | null
  priceMax: number | null
  peRange: [number, number]
  pbRange: [number, number]
  roeMin: number | null
  debtRatioMax: number | null
  rsiRange: [number, number]
  macdSignal: string
  maStatus: string[]
  volumeCondition: string
  turnoverRange: [number, number]
}

const props = defineProps<{
  filters: FilterData
  isScreening: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:filters': [filters: FilterData]
  'start-screening': []
  'reset-filters': []
  'save-template': []
}>()

// 响应式数据
const activeCollapse = ref(['basic'])

// 本地筛选条件（用于双向绑定）
const localFilters = reactive<FilterData>({ ...props.filters })

// 监听props变化，更新本地数据
watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { deep: true })

// 监听本地数据变化，发送更新事件
watch(localFilters, (newFilters) => {
  emit('update:filters', { ...newFilters })
}, { deep: true })

// 行业数据
const industries = ref<string[]>([])

// 工具函数
const formatMarketCap = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万亿`
  } else if (value >= 100) {
    return `${(value / 100).toFixed(1)}百亿`
  } else {
    return `${value.toFixed(1)}亿`
  }
}

// 事件处理
const handleResetFilters = () => {
  emit('reset-filters')
}

const handleStartScreening = () => {
  emit('start-screening')
}

const handleSaveTemplate = async () => {
  try {
    const { value: templateName } = await ElMessageBox.prompt('请输入模板名称', '保存筛选模板', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: '模板名称长度应为1-20个字符'
    })
    
    // TODO: 实际保存模板逻辑
    ElMessage.success(`模板"${templateName}"已保存`)
    emit('save-template')
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存模板失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-panel {
  .filter-content {
    .filter-actions {
      margin-top: 20px;
      
      .el-button {
        margin-bottom: 8px;
      }
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

// 确保下拉框在滚动容器中正常显示
:deep(.el-select-dropdown) {
  z-index: 9999;
}

:deep(.el-checkbox-group) {
  .el-checkbox {
    display: block;
    margin-bottom: 8px;
    margin-right: 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style> 