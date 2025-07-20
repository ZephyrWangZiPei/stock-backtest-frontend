<template>
  <div class="stock-selector">
    <el-select
      v-model="selectedStocks"
      :multiple="multiple"
      filterable
      remote
      reserve-keyword
      :placeholder="placeholder"
      :remote-method="searchStocks"
      :loading="stockSearchLoading"
      :disabled="disabled"
      style="width: 100%"
      @change="handleSelectionChange"
      @clear="handleClear"
    >
      <el-option
        v-for="item in stockOptions"
        :key="item.code"
        :label="`${item.name} (${item.code})`"
        :value="multiple ? item.code : item"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { getStocks } from '@/utils/api'
import type { Stock } from '@/types/api'

/**
 * 组件属性
 */
interface Props {
  /** 是否支持多选 */
  multiple?: boolean
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 选中的股票（单选时为Stock对象，多选时为string数组） */
  modelValue?: Stock | string | string[]
  /** 搜索延迟时间（毫秒） */
  debounceDelay?: number
  /** 每页显示数量 */
  perPage?: number
}

/**
 * 组件事件
 */
interface Emits {
  /** 值变化事件 */
  (e: 'update:modelValue', value: Stock | string | string[]): void
  /** 选择变化事件 */
  (e: 'change', value: Stock | string | string[]): void
  /** 清除事件 */
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  placeholder: '输入股票代码或名称搜索',
  disabled: false,
  modelValue: undefined,
  debounceDelay: 300,
  perPage: 50
})

const emit = defineEmits<Emits>()

// 响应式数据
const stockOptions = ref<Stock[]>([])
const stockSearchLoading = ref(false)
const selectedStocks = ref<Stock | string | string[]>(props.modelValue || (props.multiple ? [] : ''))
let searchTimeout: number | null = null

// 方法
const searchStocks = (query: string) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (query) {
    stockSearchLoading.value = true
    searchTimeout = window.setTimeout(async () => {
      try {
        const res = await getStocks({ query: query, per_page: props.perPage })
        stockOptions.value = res.data?.items || []
      } catch (error) {
        console.error('搜索股票失败:', error)
        stockOptions.value = []
      } finally {
        stockSearchLoading.value = false
      }
    }, props.debounceDelay)
  } else {
    stockOptions.value = []
  }
}

const handleSelectionChange = (value: Stock | string | string[]) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const handleClear = () => {
  emit('clear')
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedStocks.value = newValue || (props.multiple ? [] : '')
}, { deep: true })

// 组件卸载时清理定时器
onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style lang="scss" scoped>
/* 使用 Element Plus 原生样式，无需自定义覆盖 */
</style>