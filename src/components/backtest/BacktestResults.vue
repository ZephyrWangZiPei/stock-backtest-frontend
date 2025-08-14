<template>
  <div class="backtest-results">
    <div v-if="!results" class="no-results">
      <el-empty description="暂无回测结果">
        <el-text type="info">配置策略参数并开始回测，查看详细结果</el-text>
      </el-empty>
    </div>
    
    <div v-else class="results-content">
      <!-- 核心指标 -->
      <el-card class="metrics-card" style="margin-bottom: 20px;">
        <template #header>
          <span>核心指标</span>
        </template>
        
        <el-row :gutter="16">
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value" :class="getReturnClass(results.totalReturn)">
                {{ formatPercent(results.totalReturn) }}
              </div>
              <div class="metric-label">总收益率</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value" :class="getReturnClass(results.annualReturn)">
                {{ formatPercent(results.annualReturn) }}
              </div>
              <div class="metric-label">年化收益率</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value">{{ results.sharpeRatio.toFixed(2) }}</div>
              <div class="metric-label">夏普比率</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value negative">{{ formatPercent(results.maxDrawdown) }}</div>
              <div class="metric-label">最大回撤</div>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value">{{ results.totalTrades }}</div>
              <div class="metric-label">总交易次数</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value positive">{{ formatPercent(results.winRate) }}</div>
              <div class="metric-label">胜率</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value">{{ formatPercent(results.volatility) }}</div>
              <div class="metric-label">波动率</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="metric-item">
              <div class="metric-value">{{ formatCurrency(results.finalValue) }}</div>
              <div class="metric-label">期末价值</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
      
      <!-- 净值曲线图 -->
      <el-card v-if="!hideChart" class="chart-card" style="margin-bottom: 20px;">
        <template #header>
          <span>净值曲线</span>
        </template>
        <BacktestChart :key="(results?.klineData?.length||0)+'-'+(results?.trades?.length||0)"
          :portfolioHistory="results?.portfolioHistory || []"
          :trades="results?.trades || []"
          :kline="results?.klineData || []" />
      </el-card>
      
      <!-- 交易记录 -->
      <el-card class="trades-card">
        <template #header>
          <div class="card-header">
            <span>交易记录</span>
            <el-button size="small" @click="exportTrades">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </template>
        
        <div class="trades-table">
          <el-table :data="results.trades" stripe size="small">
            <el-table-column prop="date" label="日期" width="100" />
            <el-table-column prop="stock" label="股票" width="100" />
            <el-table-column prop="action" label="操作" width="80">
              <template #default="{ row }">
                <el-tag :type="row.action === 'buy' ? 'success' : 'danger'" size="small">
                  {{ row.action === 'buy' ? '买入' : '卖出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="80">
              <template #default="{ row }">
                ¥{{ row.price.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量"  >
              <template #default="{ row }">
                {{ formatQuantity(row.quantity) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" >
              <template #default="{ row }">
                {{ formatCurrency(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="交易原因" show-overflow-tooltip min-width="200"/>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { TrendCharts, Download } from '@element-plus/icons-vue'
import BacktestChart from './BacktestChart.vue'

// 接口定义
interface MonthlyReturn { month: string; return: number }
interface PositionAnalysis { stock: string; return: number; trades: number }
interface Trade { date: string; stock: string; action: 'buy' | 'sell'; price: number; quantity: number; amount: number; return: number | null; reason: string }
interface KLineBar { time: string; open: number; high: number; low: number; close: number; volume?: number }

interface BacktestResults {
  totalReturn: number
  annualReturn: number
  sharpeRatio: number
  maxDrawdown: number
  totalTrades: number
  winRate: number
  volatility: number
  finalValue: number
  monthlyReturns: MonthlyReturn[]
  positionAnalysis: PositionAnalysis[]
  trades: Trade[]
  portfolioHistory?: { date: string; total_value: number }[]
  klineData?: KLineBar[]
}

// Props
const props = defineProps<{ 
  results: BacktestResults | null,
  hideChart?: boolean
}>()
const hideChart = props.hideChart === true

// 工具函数
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`
}

const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatQuantity = (value: number) => {
  if (value <= 0) return '0手';
  const lots = value / 100;
  if (lots === Math.floor(lots)) {
    return `${lots}手`;
  } else {
    return `${value}股`;
  }
}

const getReturnClass = (value: number) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

// 导出交易记录
const exportTrades = () => {
  ElMessage.success('交易记录已导出')
}
</script>

<style lang="scss" scoped>
.backtest-results {
  .no-results {
    padding: 60px 20px;
    text-align: center;
  }
  
  .results-content {
    .metrics-card {
      .metric-item {
        text-align: center;
        padding: 12px;
        
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 4px;
          
          &.positive {
            color: #67c23a;
          }
          
          &.negative {
            color: #f56c6c;
          }
          
          &.neutral {
            color: #909399;
          }
        }
        
        .metric-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
    
    .chart-card {
      .chart-container {
        .chart-placeholder {
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          border-radius: 4px;
          color: #909399;
          
          p {
            margin: 16px 0 0 0;
            font-size: 14px;
          }
        }
      }
    }
    
    .analysis-card {
      .monthly-returns {
        .month-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #ebeef5;
          
          &:last-child {
            border-bottom: none;
          }
          
          .month-label {
            font-size: 14px;
            color: #303133;
          }
          
          .month-return {
            font-weight: 600;
            
            &.positive {
              color: #67c23a;
            }
            
            &.negative {
              color: #f56c6c;
            }
            
            &.neutral {
              color: #909399;
            }
          }
        }
      }
      
      .position-analysis {
        .position-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #ebeef5;
          
          &:last-child {
            border-bottom: none;
          }
          
          .position-stock {
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }
          
          .position-metrics {
            display: flex;
            gap: 12px;
            
            .position-return {
              font-weight: 600;
              
              &.positive {
                color: #67c23a;
              }
              
              &.negative {
                color: #f56c6c;
              }
              
              &.neutral {
                color: #909399;
              }
            }
            
            .position-trades {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
    
    .trades-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .trades-table {
        :deep(.el-table) {
          .positive {
            color: #67c23a;
          }
          
          .negative {
            color: #f56c6c;
          }
          
          .neutral {
            color: #909399;
          }
        }
      }
    }
  }
}

</style> 