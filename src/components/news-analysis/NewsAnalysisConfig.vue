<template>
  <el-card class="config-card">
    <template #header>
      <div class="card-header">
        <span class="header-title">
          <el-icon class="header-icon">
            <Setting />
          </el-icon>
          分析配置
        </span>
        <el-tag
          :type="isConnected ? 'success' : 'danger'"
          size="small"
        >
          {{ isConnected ? '已连接' : '未连接' }}
        </el-tag>
      </div>
    </template>

    <el-form label-width="120px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="股票搜索">
            <StockSelector
              v-model="selectedStockCode"
              :disabled="disabled"
              placeholder="输入股票代码或名称搜索"
              @change="handleStockChange"
              @clear="handleStockClear"
            />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="已选股票">
            <div v-if="selectedStock" class="selected-stock">
              <el-tag
                type="primary"
                closable
                @close="handleStockClear"
              >
                {{ selectedStock.code }} - {{ selectedStock.name }}
              </el-tag>
            </div>
            <div v-else class="no-stock-selected">
              <span class="placeholder-text">请先搜索并选择股票</span>
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="分析日期">
            <el-date-picker
              v-model="analysisDate"
              type="date"
              placeholder="选择分析日期"
              :disabled="disabled"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item>
        <el-button
          type="primary"
          @click="handleStartAnalysis"
          :disabled="!canStartAnalysis || disabled"
          :loading="loading"
          size="large"
        >
          {{ loading ? '分析中...' : '🔍 开始新闻分析' }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import StockSelector from '@/components/common/StockSelector.vue'
import type { Stock } from '@/types/api'

/**
 * 组件属性
 */
interface Props {
  /** 是否已连接 */
  isConnected: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 选中的股票 */
  selectedStock?: Stock | null
  /** 分析日期 */
  analysisDate?: string
}

/**
 * 组件事件
 */
interface Emits {
  /** 开始分析事件 */
  (e: 'start-analysis', data: { stockCode: string; analysisDate: string }): void
  /** 股票选择事件 */
  (e: 'stock-select', stock: Stock): void
  /** 股票清除事件 */
  (e: 'stock-clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  selectedStock: null,
  analysisDate: ''
})

const emit = defineEmits<Emits>()

// 响应式数据
const selectedStockCode = ref('')
const analysisDate = ref(props.analysisDate)

// 计算属性
const canStartAnalysis = computed(() => {
  return props.selectedStock && analysisDate.value && props.isConnected
})

// 方法
const handleStockChange = (value: Stock | string | string[]) => {
  if (typeof value === 'object' && 'code' in value) {
    // 单选模式，value是Stock对象
    emit('stock-select', value as Stock)
  } else if (typeof value === 'string') {
    // 单选模式，value是股票代码字符串
    selectedStockCode.value = value
  }
}

const handleStockClear = () => {
  selectedStockCode.value = ''
  emit('stock-clear')
}

const handleStartAnalysis = () => {
  if (!canStartAnalysis.value || !props.selectedStock) return

  emit('start-analysis', {
    stockCode: props.selectedStock.code,
    analysisDate: analysisDate.value
  })
}

// 监听外部变化
watch(() => props.selectedStock, (newStock) => {
  if (newStock) {
    selectedStockCode.value = newStock.code
  } else {
    selectedStockCode.value = ''
  }
})

watch(() => props.analysisDate, (newDate) => {
  analysisDate.value = newDate
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

.config-card {
  @include card-base;
  margin-bottom: $spacing-lg;

  .card-header {
    @include flex(row, space-between, center);

    .header-title {
      @include flex(row, flex-start, center);
      font-weight: $font-weight-medium;
      color: $text-primary;

      .header-icon {
        margin-right: $spacing-sm;
        font-size: $font-size-medium;
      }
    }
  }

  .selected-stock {
    .el-tag {
      font-size: $font-size-small;
    }
  }

  .no-stock-selected {
    @include flex(row, flex-start, center);
    height: 32px;

    .placeholder-text {
      color: $text-placeholder;
      font-size: $font-size-small;
    }
  }
}
</style> 