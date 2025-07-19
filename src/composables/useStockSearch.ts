/**
 * 股票搜索组合式函数
 * 提供股票搜索、选择、防抖等功能
 */

import { ref, computed, watch } from 'vue'
import { getStocks } from '@/utils/api'
import type { Stock } from '@/types/api'

/**
 * 股票搜索选项
 */
export interface StockSearchOptions {
  /** 搜索关键词 */
  keyword?: string
  /** 市场类型 */
  market?: string
  /** 股票类型 */
  stock_type?: string
  /** 最大结果数量 */
  limit?: number
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number
}

/**
 * 股票搜索状态
 */
export interface StockSearchState {
  /** 是否正在搜索 */
  isSearching: boolean
  /** 搜索结果 */
  results: Stock[]
  /** 选中的股票 */
  selectedStock: Stock | null
  /** 是否显示下拉框 */
  showDropdown: boolean
  /** 搜索错误信息 */
  error: string | null
}

/**
 * 使用股票搜索
 * @param options 搜索选项
 * @returns 股票搜索相关状态和方法
 */
export function useStockSearch(options: StockSearchOptions = {}) {
  const {
    keyword: initialKeyword = '',
    market,
    stock_type = 'stock',
    limit = 10,
    debounceDelay = 300
  } = options

  // 响应式状态
  const keyword = ref(initialKeyword)
  const isSearching = ref(false)
  const results = ref<Stock[]>([])
  const selectedStock = ref<Stock | null>(null)
  const showDropdown = ref(false)
  const error = ref<string | null>(null)
  const searchTimeout = ref<NodeJS.Timeout | null>(null)

  // 计算属性
  const hasResults = computed(() => results.value.length > 0)
  const isEmpty = computed(() => !isSearching.value && keyword.value && results.value.length === 0)
  const canSearch = computed(() => keyword.value.trim().length >= 1)

  /**
   * 执行股票搜索
   */
  const searchStocks = async () => {
    if (!canSearch.value) {
      results.value = []
      return
    }

    isSearching.value = true
    error.value = null

    try {
      const response = await getStocks({
        keyword: keyword.value.trim(),
        stock_type,
        per_page: limit,
        ...(market && { market })
      })

      if (response.success && response.data) {
        results.value = response.data.items || []
      } else {
        results.value = []
        error.value = response.message || '搜索失败'
      }
    } catch (err) {
      console.error('股票搜索失败:', err)
      results.value = []
      error.value = '网络错误，请稍后重试'
    } finally {
      isSearching.value = false
    }
  }

  /**
   * 防抖搜索
   */
  const debouncedSearch = () => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }

    searchTimeout.value = setTimeout(() => {
      searchStocks()
    }, debounceDelay)
  }

  /**
   * 选择股票
   * @param stock 股票信息
   */
  const selectStock = (stock: Stock) => {
    selectedStock.value = stock
    keyword.value = stock.name
    showDropdown.value = false
    results.value = []
  }

  /**
   * 清除选中的股票
   */
  const clearSelectedStock = () => {
    selectedStock.value = null
    keyword.value = ''
    results.value = []
    showDropdown.value = false
  }

  /**
   * 显示下拉框
   */
  const showDropdownMenu = () => {
    if (hasResults.value) {
      showDropdown.value = true
    }
  }

  /**
   * 隐藏下拉框
   */
  const hideDropdownMenu = () => {
    // 延迟隐藏，给用户时间点击选项
    setTimeout(() => {
      showDropdown.value = false
    }, 200)
  }

  /**
   * 处理输入框聚焦
   */
  const handleInputFocus = () => {
    if (hasResults.value) {
      showDropdown.value = true
    }
  }

  /**
   * 处理输入框失焦
   */
  const handleInputBlur = () => {
    hideDropdownMenu()
  }

  /**
   * 处理输入变化
   */
  const handleInputChange = (value: string) => {
    keyword.value = value
    if (value.trim()) {
      debouncedSearch()
    } else {
      results.value = []
      showDropdown.value = false
    }
  }

  /**
   * 重置搜索状态
   */
  const reset = () => {
    keyword.value = ''
    isSearching.value = false
    results.value = []
    selectedStock.value = null
    showDropdown.value = false
    error.value = null
    
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
      searchTimeout.value = null
    }
  }

  // 监听关键词变化
  watch(keyword, (newValue) => {
    if (newValue !== selectedStock.value?.name) {
      selectedStock.value = null
    }
  })

  return {
    // 状态
    keyword,
    isSearching,
    results,
    selectedStock,
    showDropdown,
    error,
    hasResults,
    isEmpty,
    canSearch,

    // 方法
    searchStocks,
    debouncedSearch,
    selectStock,
    clearSelectedStock,
    showDropdownMenu,
    hideDropdownMenu,
    handleInputFocus,
    handleInputBlur,
    handleInputChange,
    reset
  }
} 