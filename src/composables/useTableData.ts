/**
 * 表格数据管理 Composable
 * 封装表格的排序、分页、过滤等通用逻辑
 */

import { ref, computed, Ref } from 'vue'

// =============================================================================
// 类型定义
// =============================================================================

export interface SortConfig {
  prop: string
  order: 'ascending' | 'descending' | null
}

export interface FilterConfig {
  [key: string]: any
}

export interface PaginationConfig {
  currentPage: number
  pageSize: number
  total: number
}

export interface TableDataOptions<T = any> {
  data: Ref<T[]>
  sortable?: boolean
  filterable?: boolean
  pagination?: boolean
  defaultSort?: SortConfig
  defaultPageSize?: number
  pageSizes?: number[]
}

// =============================================================================
// 主要功能
// =============================================================================

export function useTableData<T = any>(options: TableDataOptions<T>) {
  const {
    data,
    sortable = true,
    filterable = true,
    pagination = true,
    defaultSort = { prop: '', order: null },
    defaultPageSize = 20,
    pageSizes = [10, 20, 50, 100]
  } = options

  // =============================================================================
  // 响应式状态
  // =============================================================================

  // 排序状态
  const sortConfig = ref<SortConfig>(defaultSort)

  // 过滤状态
  const filterConfig = ref<FilterConfig>({})

  // 分页状态
  const paginationConfig = ref<PaginationConfig>({
    currentPage: 1,
    pageSize: defaultPageSize,
    total: 0
  })

  // 搜索关键词
  const searchQuery = ref('')

  // 加载状态
  const loading = ref(false)

  // =============================================================================
  // 计算属性
  // =============================================================================

  // 过滤后的数据
  const filteredData = computed(() => {
    let result = [...data.value]

    // 搜索过滤
    if (searchQuery.value && filterable) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item => {
        return Object.values(item as Record<string, any>).some(value => {
          if (value == null) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // 条件过滤
    if (filterable && Object.keys(filterConfig.value).length > 0) {
      result = result.filter(item => {
        return Object.entries(filterConfig.value).every(([key, value]) => {
          if (value == null || value === '') return true
          return (item as Record<string, any>)[key] === value
        })
      })
    }

    return result
  })

  // 排序后的数据
  const sortedData = computed(() => {
    if (!sortable || !sortConfig.value.prop) {
      return filteredData.value
    }

    const { prop, order } = sortConfig.value
    const result = [...filteredData.value]

    result.sort((a, b) => {
      let aVal = (a as Record<string, any>)[prop]
      let bVal = (b as Record<string, any>)[prop]

      // 处理 null/undefined 值
      if (aVal == null) aVal = order === 'descending' ? -Infinity : Infinity
      if (bVal == null) bVal = order === 'descending' ? -Infinity : Infinity

      // 字符串比较
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (order === 'descending') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
    })

    return result
  })

  // 分页后的数据
  const paginatedData = computed(() => {
    if (!pagination) {
      return sortedData.value
    }

    const { currentPage, pageSize } = paginationConfig.value
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize

    return sortedData.value.slice(start, end)
  })

  // 总数据量
  const total = computed(() => {
    return filteredData.value.length
  })

  // 总页数
  const totalPages = computed(() => {
    if (!pagination) return 1
    return Math.ceil(total.value / paginationConfig.value.pageSize)
  })

  // =============================================================================
  // 方法
  // =============================================================================

  /**
   * 处理排序变化
   */
  const handleSortChange = (config: SortConfig) => {
    if (!sortable) return

    sortConfig.value = config
    // 重置到第一页
    if (pagination) {
      paginationConfig.value.currentPage = 1
    }
  }

  /**
   * 处理过滤变化
   */
  const handleFilterChange = (filters: FilterConfig) => {
    if (!filterable) return

    filterConfig.value = { ...filters }
    // 重置到第一页
    if (pagination) {
      paginationConfig.value.currentPage = 1
    }
  }

  /**
   * 处理搜索变化
   */
  const handleSearchChange = (query: string) => {
    searchQuery.value = query
    // 重置到第一页
    if (pagination) {
      paginationConfig.value.currentPage = 1
    }
  }

  /**
   * 处理页码变化
   */
  const handlePageChange = (page: number) => {
    if (!pagination) return
    paginationConfig.value.currentPage = page
  }

  /**
   * 处理每页数量变化
   */
  const handleSizeChange = (size: number) => {
    if (!pagination) return
    paginationConfig.value.pageSize = size
    paginationConfig.value.currentPage = 1
  }

  /**
   * 重置所有状态
   */
  const reset = () => {
    sortConfig.value = defaultSort
    filterConfig.value = {}
    searchQuery.value = ''
    paginationConfig.value = {
      currentPage: 1,
      pageSize: defaultPageSize,
      total: 0
    }
  }

  /**
   * 刷新数据
   */
  const refresh = async (refreshFn?: () => Promise<void>) => {
    loading.value = true
    try {
      if (refreshFn) {
        await refreshFn()
      }
    } finally {
      loading.value = false
    }
  }

  // =============================================================================
  // 导出
  // =============================================================================

  return {
    // 状态
    sortConfig,
    filterConfig,
    paginationConfig,
    searchQuery,
    loading,

    // 计算属性
    filteredData,
    sortedData,
    paginatedData,
    total,
    totalPages,

    // 方法
    handleSortChange,
    handleFilterChange,
    handleSearchChange,
    handlePageChange,
    handleSizeChange,
    reset,
    refresh,

    // 配置
    pageSizes
  }
}

// =============================================================================
// 扩展功能
// =============================================================================

/**
 * 表格选择功能
 */
export function useTableSelection<T = any>(data: Ref<T[]>) {
  const selectedRows = ref<T[]>([])
  const selectedRowKeys = ref<(string | number)[]>([])

  const isAllSelected = computed(() => {
    return data.value.length > 0 && selectedRows.value.length === data.value.length
  })

  const isIndeterminate = computed(() => {
    return selectedRows.value.length > 0 && selectedRows.value.length < data.value.length
  })

  const handleSelectionChange = (selection: T[]) => {
    selectedRows.value = selection
  }

  const handleSelectAll = (val: boolean) => {
    selectedRows.value = val ? [...data.value] : []
  }

  const clearSelection = () => {
    selectedRows.value = []
    selectedRowKeys.value = []
  }

  return {
    selectedRows,
    selectedRowKeys,
    isAllSelected,
    isIndeterminate,
    handleSelectionChange,
    handleSelectAll,
    clearSelection
  }
}

/**
 * 表格导出功能
 */
export function useTableExport<T = any>() {
  const exportLoading = ref(false)

  const exportToCSV = async (
    data: T[],
    filename: string = 'export.csv',
    headers?: string[]
  ) => {
    exportLoading.value = true
    try {
      // 这里可以集成实际的导出逻辑
      console.log('Exporting data:', data)
      
      // 模拟导出延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 实际项目中这里会生成并下载CSV文件
      console.log('Export completed')
    } finally {
      exportLoading.value = false
    }
  }

  const exportToExcel = async (
    data: T[],
    filename: string = 'export.xlsx',
    sheetName: string = 'Sheet1'
  ) => {
    exportLoading.value = true
    try {
      // 这里可以集成实际的Excel导出逻辑
      console.log('Exporting to Excel:', data)
      
      // 模拟导出延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Excel export completed')
    } finally {
      exportLoading.value = false
    }
  }

  return {
    exportLoading,
    exportToCSV,
    exportToExcel
  }
}

/**
 * 表格列配置管理
 */
export function useTableColumns() {
  const visibleColumns = ref<string[]>([])
  const columnConfig = ref<Record<string, any>>({})

  const setVisibleColumns = (columns: string[]) => {
    visibleColumns.value = columns
  }

  const toggleColumn = (column: string) => {
    const index = visibleColumns.value.indexOf(column)
    if (index > -1) {
      visibleColumns.value.splice(index, 1)
    } else {
      visibleColumns.value.push(column)
    }
  }

  const setColumnConfig = (column: string, config: any) => {
    columnConfig.value[column] = { ...columnConfig.value[column], ...config }
  }

  return {
    visibleColumns,
    columnConfig,
    setVisibleColumns,
    toggleColumn,
    setColumnConfig
  }
} 