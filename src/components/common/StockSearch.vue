<template>
  <div class="stock-search">
    <el-input
      v-model="keyword"
      :placeholder="placeholder"
      :disabled="disabled"
      :loading="isSearching"
      @input="handleInputChange"
      @focus="handleInputFocus"
      @blur="handleInputBlur"
      clearable
    >
      <template #suffix>
        <el-icon v-if="isSearching" class="is-loading">
          <Loading />
        </el-icon>
      </template>
    </el-input>

    <!-- 搜索结果下拉框 -->
    <div
      v-if="showDropdown && hasResults"
      class="stock-dropdown"
      @mousedown.prevent
    >
      <div
        v-for="stock in results"
        :key="stock.code"
        class="stock-option"
        @click="selectStock(stock)"
      >
        <div class="stock-info">
          <div class="stock-code">{{ stock.code }}</div>
          <div class="stock-name">{{ stock.name }}</div>
        </div>
        <div class="stock-market">{{ getMarketName(stock.market || '') }}</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="showDropdown && isEmpty"
      class="stock-dropdown empty-state"
    >
      <div class="empty-text">未找到相关股票</div>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="error"
      class="error-message"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useStockSearch } from '@/composables/useStockSearch'
import { getMarketName } from '@/utils/stock'
import type { Stock } from '@/types/api'

/**
 * 组件属性
 */
interface Props {
  /** 初始关键词 */
  modelValue?: string
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 市场类型 */
  market?: string
  /** 股票类型 */
  stockType?: string
  /** 最大结果数量 */
  limit?: number
  /** 防抖延迟时间 */
  debounceDelay?: number
}

/**
 * 组件事件
 */
interface Emits {
  /** 选中股票事件 */
  (e: 'select', stock: Stock): void
  /** 清除选中事件 */
  (e: 'clear'): void
  /** 输入变化事件 */
  (e: 'input', value: string): void
  /** 更新模型值事件 */
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '输入股票代码或名称',
  disabled: false,
  stockType: 'stock',
  limit: 10,
  debounceDelay: 300
})

const emit = defineEmits<Emits>()

// 使用股票搜索组合式函数
const {
  keyword,
  isSearching,
  results,
  selectedStock,
  showDropdown,
  error,
  hasResults,
  isEmpty,
  selectStock: selectStockInternal,
  clearSelectedStock,
  handleInputFocus,
  handleInputBlur,
  handleInputChange: handleInputChangeInternal,
  reset
} = useStockSearch({
  keyword: props.modelValue,
  market: props.market,
  stock_type: props.stockType,
  limit: props.limit,
  debounceDelay: props.debounceDelay
})

// 处理输入变化
const handleInputChange = (value: string) => {
  handleInputChangeInternal(value)
  emit('input', value)
  emit('update:modelValue', value)
}

// 选择股票
const selectStock = (stock: Stock) => {
  selectStockInternal(stock)
  emit('select', stock)
  emit('update:modelValue', stock.name)
}

// 清除选中
const clearSelection = () => {
  clearSelectedStock()
  emit('clear')
  emit('update:modelValue', '')
}

// 暴露方法给父组件
defineExpose({
  reset,
  clearSelection,
  selectedStock: computed(() => selectedStock.value)
})
</script>

<style lang="scss" scoped>
.stock-search {
  position: relative;
  width: 100%;
}

.stock-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: var(--el-box-shadow);
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}

.stock-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.stock-option:hover {
  background: var(--el-fill-color-light);
}

.stock-option:not(:last-child) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.stock-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.stock-code {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.stock-name {
  font-size: 12px;
  opacity: 0.8;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-market {
  font-size: 11px;
  opacity: 0.7;
  padding: 2px 6px;
  background: var(--el-fill-color);
  border-radius: 4px;
}

.stock-dropdown.empty-state {
  padding: 24px;
  text-align: center;
}

.empty-text {
  font-size: 12px;
  opacity: 0.7;
}

.error-message {
  margin-top: 4px;
  color: var(--el-color-danger);
  font-size: 11px;
}
</style>