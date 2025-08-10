<template>
  <el-card class="candidate-list">
    <template #header>
      <div class="card-header">
        <span>候选股票列表</span>
        <div class="header-actions">
          <el-button-group size="small">
            <el-button 
              :type="viewMode === 'table' ? 'primary' : ''" 
              @click="$emit('update:viewMode', 'table')"
            >
              <el-icon><List /></el-icon>
              表格
            </el-button>
            <el-button 
              :type="viewMode === 'card' ? 'primary' : ''" 
              @click="$emit('update:viewMode', 'card')"
            >
              <el-icon><Grid /></el-icon>
              卡片
            </el-button>
          </el-button-group>
        </div>
      </div>
    </template>
    
    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="table-view" style="max-height: 800px; overflow-y: auto;">
      <el-table
        :data="paginatedCandidates"
        @selection-change="$emit('selection-change', $event)"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="code" label="股票代码" width="120">
          <template #default="{ row }">
            <el-link type="primary" @click="$emit('view-detail', row)">{{ row.code }}</el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="股票名称" width="140" show-overflow-tooltip />
        
        <el-table-column prop="industry" label="行业" width="120" show-overflow-tooltip />
        
        <el-table-column prop="price" label="最新价" width="100">
          <template #default="{ row }">
            <span :class="getPriceChangeClass(row.change_pct)">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="change_pct" label="涨跌幅" width="100">
          <template #default="{ row }">
            <span :class="getPriceChangeClass(row.change_pct)">
              {{ row.change_pct > 0 ? '+' : '' }}{{ row.change_pct }}%
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="score" label="综合评分" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.score" disabled show-score text-color="#ff9900" :max="5" />
          </template>
        </el-table-column>
        
        <el-table-column prop="recommendation" label="投资建议" width="120">
          <template #default="{ row }">
            <el-tag :type="getRecommendationTagType(row.recommendation)">
              {{ getRecommendationText(row.recommendation) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="added_date" label="加入时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.added_date) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button @click="$emit('view-detail', row)" title="查看详情">
                <el-icon><View /></el-icon>
              </el-button>
              <el-button @click="$emit('edit-candidate', row)" title="编辑">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="danger" @click="$emit('remove-candidate', row)" title="移除">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 卡片视图 -->
    <div v-else class="card-view" style="max-height: 800px; overflow-y: auto;">
      <el-row :gutter="16">
        <el-col v-for="candidate in paginatedCandidates" :key="candidate.id" :xs="24" :sm="12" :lg="8">
          <div class="candidate-card">
            <div class="card-header">
              <div class="stock-info">
                <h3>{{ candidate.name }}</h3>
                <span class="stock-code">{{ candidate.code }}</span>
              </div>
              <div class="card-actions">
                <el-checkbox 
                  :model-value="candidate.selected" 
                  @update:model-value="toggleSelection(candidate, $event)"
                />
              </div>
            </div>
            
            <div class="card-content">
              <div class="price-info">
                <span class="price" :class="getPriceChangeClass(candidate.change_pct)">
                  ¥{{ candidate.price }}
                </span>
                <span class="change" :class="getPriceChangeClass(candidate.change_pct)">
                  {{ candidate.change_pct > 0 ? '+' : '' }}{{ candidate.change_pct }}%
                </span>
              </div>
              
              <div class="metrics">
                <div class="metric-item">
                  <span class="label">行业</span>
                  <span class="value">{{ candidate.industry }}</span>
                </div>
                <div class="metric-item">
                  <span class="label">市值</span>
                  <span class="value">{{ formatMarketCap(candidate.market_cap || 0) }}</span>
                </div>
                <div class="metric-item">
                  <span class="label">PE</span>
                  <span class="value">{{ candidate.pe }}</span>
                </div>
                <div class="metric-item">
                  <span class="label">ROE</span>
                  <span class="value">{{ candidate.roe }}%</span>
                </div>
              </div>
              
              <div class="rating-section">
                <el-rate v-model="candidate.score" disabled show-score text-color="#ff9900" :max="5" />
                <el-tag :type="getRecommendationTagType(candidate.recommendation)" size="small">
                  {{ getRecommendationText(candidate.recommendation) }}
                </el-tag>
              </div>
            </div>
            
            <div class="card-footer">
              <el-button-group size="small">
                <el-button @click="$emit('view-detail', candidate)">详情</el-button>
                <el-button @click="$emit('edit-candidate', candidate)">编辑</el-button>
                <el-button type="danger" @click="$emit('remove-candidate', candidate)">移除</el-button>
              </el-button-group>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="candidates.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('current-change', $event)"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { List, Grid, View, Edit, Delete } from '@element-plus/icons-vue'
import type { Candidate } from '@/types/candidate'

// Props
const props = defineProps<{
  candidates: Candidate[]
  viewMode: 'table' | 'card'
  currentPage: number
  pageSize: number
}>()

// Emits
const emit = defineEmits<{
  'update:viewMode': [mode: 'table' | 'card']
  'selection-change': [selection: Candidate[]]
  'view-detail': [candidate: Candidate]
  'edit-candidate': [candidate: Candidate]
  'remove-candidate': [candidate: Candidate]
  'size-change': [size: number]
  'current-change': [page: number]
}>()

// 计算属性
const paginatedCandidates = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize
  const end = start + props.pageSize
  return props.candidates.slice(start, end)
})

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getPriceChangeClass = (changePct: number) => {
  if (changePct > 0) return 'price-up'
  if (changePct < 0) return 'price-down'
  return 'price-flat'
}

const getRecommendationTagType = (recommendation: string) => {
  const types: Record<string, string> = {
    buy: 'success',
    watch: 'warning',
    reject: 'danger',
    pending: 'info'
  }
  return types[recommendation] || 'info'
}

const getRecommendationText = (recommendation: string) => {
  const texts: Record<string, string> = {
    buy: '推荐买入',
    watch: '观望',
    reject: '不推荐',
    pending: '待评估'
  }
  return texts[recommendation] || recommendation
}

// 切换选中状态
const toggleSelection = (candidate: Candidate, selected: boolean) => {
  candidate.selected = selected
  const selectedCandidates = props.candidates.filter(c => c.selected)
  emit('selection-change', selectedCandidates)
}
</script>

<style lang="scss" scoped>
.candidate-list {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-view {
    .candidate-card {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fff;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        .stock-info {
          h3 {
            margin: 0 0 4px 0;
            color: #303133;
            font-size: 16px;
          }
          
          .stock-code {
            color: #909399;
            font-size: 12px;
          }
        }
      }
      
      .card-content {
        .price-info {
          text-align: center;
          margin-bottom: 12px;
          
          .price {
            font-size: 20px;
            font-weight: bold;
            margin-right: 8px;
            
            &.price-up {
              color: #f56c6c;
            }
            
            &.price-down {
              color: #67c23a;
            }
            
            &.price-flat {
              color: #909399;
            }
          }
          
          .change {
            font-size: 14px;
            
            &.price-up {
              color: #f56c6c;
            }
            
            &.price-down {
              color: #67c23a;
            }
            
            &.price-flat {
              color: #909399;
            }
          }
        }
        
        .metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
          
          .metric-item {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            
            .label {
              color: #909399;
            }
            
            .value {
              color: #303133;
              font-weight: 500;
            }
          }
        }
        
        .rating-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      }
      
      .card-footer {
        margin-top: 12px;
        text-align: center;
      }
    }
  }
  
  .pagination-wrapper {
    margin-top: 20px;
    text-align: center;
  }
}

// 表格中的价格颜色
:deep(.el-table) {
  .price-up {
    color: #f56c6c;
  }
  
  .price-down {
    color: #67c23a;
  }
  
  .price-flat {
    color: #909399;
  }
}

@media (max-width: 768px) {
  .candidate-list {
    .card-view {
      .candidate-card {
        .metrics {
          grid-template-columns: 1fr;
        }
        
        .rating-section {
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
      }
    }
  }
}
</style> 