<template>
  <div class="data-status-table">
    <div class="table-header">
      <div class="header-info">
        <span class="total-count">共 {{ tableData.length }} 条记录</span>
        <el-tag :type="getOverallStatusType()" size="small">
          {{ getOverallStatusText() }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button size="small" type="primary" @click="handleCollect">
          <el-icon><Download /></el-icon>
          采集数据
        </el-button>
      </div>
    </div>

    <el-table
      :data="paginatedData"
      :loading="loading"
      stripe
      style="width: 100%"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="stock_code" label="股票代码" width="120" sortable="custom">
        <template #default="{ row }">
          <el-link type="primary">{{ row.stock_code }}</el-link>
        </template>
      </el-table-column>
      
      <el-table-column prop="stock_name" label="股票名称" min-width="140" show-overflow-tooltip />
      
      <el-table-column prop="industry" label="行业" width="120" show-overflow-tooltip />
      
      <el-table-column prop="data_count" label="数据量" width="100" sortable="custom">
        <template #default="{ row }">
          <span>{{ formatNumber(row.data_count || 0) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="completeness" label="完整度" width="120" sortable="custom">
        <template #default="{ row }">
          <el-progress 
            :percentage="row.completeness || 0" 
            :stroke-width="8"
            :show-text="false"
          />
          <span class="percentage-text">{{ row.completeness || 0 }}%</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="last_update" label="最后更新" width="180" sortable="custom">
        <template #default="{ row }">
          <span>{{ formatTime(row.last_update) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button-group size="small">
            <el-button @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button type="primary" @click="handleCollectSingle(row)">
              <el-icon><Refresh /></el-icon>
              更新
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="filteredData.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`${selectedRow?.stock_name} (${selectedRow?.stock_code}) - 数据详情`"
      width="800px"
    >
      <div v-if="selectedRow" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="股票代码">{{ selectedRow.stock_code }}</el-descriptions-item>
          <el-descriptions-item label="股票名称">{{ selectedRow.stock_name }}</el-descriptions-item>
          <el-descriptions-item label="所属行业">{{ selectedRow.industry }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">{{ getDataTypeText(type) }}</el-descriptions-item>
          <el-descriptions-item label="数据量">{{ formatNumber(selectedRow.data_count || 0) }}</el-descriptions-item>
          <el-descriptions-item label="完整度">{{ selectedRow.completeness || 0 }}%</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ formatTime(selectedRow.last_update) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedRow.status)">
              {{ getStatusText(selectedRow.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="type === 'daily'" class="data-timeline">
          <h4>数据时间线</h4>
          <el-timeline>
            <el-timeline-item 
              v-for="item in dataTimeline" 
              :key="item.date"
              :timestamp="item.date"
              :type="item.type"
            >
              {{ item.description }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          type="primary" 
          @click="selectedRow && handleCollectSingle(selectedRow)"
          :disabled="!selectedRow"
        >
          立即更新数据
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, View } from '@element-plus/icons-vue'
import unifiedHttpClient from '@/utils/unifiedHttpClient'

interface DataStatusRow {
  stock_code: string
  stock_name: string
  industry: string
  data_count: number
  completeness: number
  last_update: string
  status: 'normal' | 'outdated' | 'missing' | 'error'
}

interface Props {
  data: DataStatusRow[]
  type: 'daily' | 'fundamental' | 'technical'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()

// 响应式数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const sortField = ref('')
const sortOrder = ref('')
const detailDialogVisible = ref(false)
const selectedRow = ref<DataStatusRow | null>(null)
const dataTimeline = ref<any[]>([])

// 计算属性
const tableData = computed(() => props.data || [])

const filteredData = computed(() => {
  let data = [...tableData.value]
  
  // 排序
  if (sortField.value && sortOrder.value) {
    data.sort((a, b) => {
      const aVal = a[sortField.value as keyof DataStatusRow]
      const bVal = b[sortField.value as keyof DataStatusRow]
      
      if (sortOrder.value === 'ascending') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }
  
  return data
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

// 工具函数
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}

const formatTime = (time: string) => {
  if (!time) return '无数据'
  return new Date(time).toLocaleString()
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    normal: 'success',
    outdated: 'warning',
    missing: 'info',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    normal: '正常',
    outdated: '过期',
    missing: '缺失',
    error: '错误'
  }
  return texts[status] || status
}

const getDataTypeText = (type: string) => {
  const texts: Record<string, string> = {
    daily: '日线数据',
    fundamental: '基本面数据',
    technical: '技术指标数据'
  }
  return texts[type] || type
}

const getOverallStatusType = () => {
  const errorCount = tableData.value.filter(item => item.status === 'error').length
  const outdatedCount = tableData.value.filter(item => item.status === 'outdated').length
  
  if (errorCount > 0) return 'danger'
  if (outdatedCount > 0) return 'warning'
  return 'success'
}

const getOverallStatusText = () => {
  const errorCount = tableData.value.filter(item => item.status === 'error').length
  const outdatedCount = tableData.value.filter(item => item.status === 'outdated').length
  const normalCount = tableData.value.filter(item => item.status === 'normal').length
  
  return `正常: ${normalCount}, 过期: ${outdatedCount}, 错误: ${errorCount}`
}

// 事件处理
const handleRefresh = () => {
  emit('refresh')
}

const handleCollect = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要采集所有${getDataTypeText(props.type)}吗？这可能需要较长时间。`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // TODO: 实现批量数据采集
    ElMessage.success('数据采集已启动')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('启动数据采集失败')
    }
  }
}

const handleCollectSingle = async (row: DataStatusRow) => {
  try {
    loading.value = true
    
    // 启动单个股票数据采集
    await unifiedHttpClient.dataCollection.startCollection({
      data_source: 'akshare',
      data_type: props.type,
      stock_codes: [row.stock_code]
    })
    
    ElMessage.success(`${row.stock_name} 数据更新已启动`)
    emit('refresh')
  } catch (error) {
    ElMessage.error('数据更新失败')
  } finally {
    loading.value = false
  }
}

const handleViewDetail = async (row: DataStatusRow) => {
  selectedRow.value = row
  
  // TODO: 加载详细的数据时间线
  dataTimeline.value = [
    {
      date: '2024-01-15',
      type: 'primary',
      description: '数据采集完成，共获取120条记录'
    },
    {
      date: '2024-01-10',
      type: 'success',
      description: '开始数据采集任务'
    },
    {
      date: '2024-01-05',
      type: 'warning',
      description: '发现数据缺失，需要补充采集'
    }
  ]
  
  detailDialogVisible.value = true
}

const handleSortChange = ({ prop, order }: any) => {
  sortField.value = prop
  sortOrder.value = order
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style lang="scss" scoped>
.data-status-table {
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .total-count {
        font-size: 14px;
        color: #606266;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .el-table {
    .percentage-text {
      margin-left: 8px;
      font-size: 12px;
      color: #909399;
    }
  }
  
  .pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
  
  .detail-content {
    .data-timeline {
      margin-top: 24px;
      
      h4 {
        margin-bottom: 16px;
        color: #303133;
      }
    }
  }
}

@media (max-width: 768px) {
  .data-status-table {
    .table-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .header-actions {
        justify-content: center;
      }
    }
  }
}
</style> 