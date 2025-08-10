<template>
  <div class="stock-list">
    <!-- 加载状态 -->
    <div v-if="isScreening" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>
    
    <!-- 空结果 -->
    <div v-else-if="stocks.length === 0" class="empty-result">
      <el-empty description="暂无符合条件的股票">
        <el-button type="primary" @click="$emit('reset-filters')">调整筛选条件</el-button>
      </el-empty>
    </div>
    
    <!-- 股票列表 -->
    <div v-else class="stock-items" style="max-height: 800px; overflow-y: auto;">
      <div v-for="stock in paginatedStocks" :key="stock.code" class="stock-item">
        <div class="stock-header">
          <div class="stock-basic">
            <h3>{{ stock.name }} ({{ stock.code }})</h3>
            <el-tag :type="getIndustryTagType(stock.industry)" size="small">{{ stock.industry }}</el-tag>
          </div>
          <div class="stock-score">
            <el-rate v-model="stock.score" disabled show-score text-color="#ff9900" :max="5" />
          </div>
        </div>
        
        <div class="stock-metrics">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="metric-item">
                <span class="metric-label">最新价</span>
                <span class="metric-value" :class="getPriceChangeClass(stock.change_pct)">
                  ¥{{ stock.price }}
                </span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-item">
                <span class="metric-label">涨跌幅</span>
                <span class="metric-value" :class="getPriceChangeClass(stock.change_pct)">
                  {{ stock.change_pct > 0 ? '+' : '' }}{{ stock.change_pct }}%
                </span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-item">
                <span class="metric-label">市值</span>
                <span class="metric-value">{{ formatMarketCap(stock.market_cap) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-item">
                <span class="metric-label">成交量</span>
                <span class="metric-value">{{ formatVolume(stock.volume) }}</span>
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="16" style="margin-top: 10px">
            <el-col :span="4">
              <div class="metric-item">
                <span class="metric-label">PE</span>
                <span class="metric-value">{{ stock.pe || '--' }}</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="metric-item">
                <span class="metric-label">PB</span>
                <span class="metric-value">{{ stock.pb || '--' }}</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="metric-item">
                <span class="metric-label">ROE</span>
                <span class="metric-value">{{ stock.roe || '--' }}%</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="metric-item">
                <span class="metric-label">RSI</span>
                <span class="metric-value">{{ stock.rsi || '--' }}</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="metric-item">
                <span class="metric-label">换手率</span>
                <span class="metric-value">{{ stock.turnover || '--' }}%</span>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="stock-actions">
                <el-button-group size="small">
                  <el-button @click="$emit('view-detail', stock)" title="查看详情">
                    <el-icon><View /></el-icon>
                  </el-button>
                  <el-button @click="$emit('add-to-watchlist', stock)" title="加入自选">
                    <el-icon><Star /></el-icon>
                  </el-button>
                  <el-button @click="$emit('add-to-candidate', stock)" title="加入候选池">
                    <el-icon><Plus /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div v-if="stocks.length > 0" class="pagination-wrapper">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="stocks.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { View, Star, Plus } from '@element-plus/icons-vue'

// Props
const props = defineProps<{
  stocks: any[]
  isScreening: boolean
  currentPage: number
  pageSize: number
}>()

// Emits
const emit = defineEmits<{
  'size-change': [size: number]
  'current-change': [page: number]
  'view-detail': [stock: any]
  'add-to-watchlist': [stock: any]
  'add-to-candidate': [stock: any]
  'reset-filters': []
}>()

// 计算属性
const paginatedStocks = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize
  const end = start + props.pageSize
  return props.stocks.slice(start, end)
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

const formatVolume = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万手`
  } else {
    return `${value.toFixed(0)}手`
  }
}

const getPriceChangeClass = (changePct: number) => {
  if (changePct > 0) return 'price-up'
  if (changePct < 0) return 'price-down'
  return 'price-flat'
}

const getIndustryTagType = (industry: string) => {
  const tagTypes = ['', 'success', 'info', 'warning', 'danger']
  return tagTypes[industry.length % tagTypes.length]
}

// 事件处理
const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const handleCurrentChange = (page: number) => {
  emit('current-change', page)
}
</script>

<style lang="scss" scoped>
.stock-list {
  .loading-container {
    padding: 20px 0;
  }
  
  .empty-result {
    padding: 40px 0;
    text-align: center;
  }
  
  .stock-items {
    .stock-item {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fff;
      
      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }
      
      .stock-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        .stock-basic {
          h3 {
            margin: 0 0 4px 0;
            color: #303133;
            font-size: 18px;
          }
        }
        
        .stock-score {
          text-align: right;
        }
      }
      
      .stock-metrics {
        .metric-item {
          text-align: center;
          
          .metric-label {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }
          
          .metric-value {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            
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
        
        .stock-actions {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }
    }
  }
  
  .pagination-wrapper {
    margin-top: 20px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .stock-list {
    .stock-items {
      .stock-item {
        .stock-header {
          flex-direction: column;
          align-items: flex-start;
          
          .stock-score {
            margin-top: 8px;
            text-align: left;
          }
        }
        
        .stock-metrics {
          .el-row {
            margin-bottom: 8px;
          }
        }
      }
    }
  }
}
</style> 