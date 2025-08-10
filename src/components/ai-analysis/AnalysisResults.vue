<template>
  <el-card class="analysis-results">
    <template #header>
      <div class="card-header">
        <span>分析结果</span>
        <div class="header-actions">
          <el-button-group size="small">
            <el-button 
              :type="viewMode === 'summary' ? 'primary' : ''" 
              @click="$emit('update:viewMode', 'summary')"
            >
              概览
            </el-button>
            <el-button 
              :type="viewMode === 'detailed' ? 'primary' : ''" 
              @click="$emit('update:viewMode', 'detailed')"
            >
              详细
            </el-button>
            <el-button 
              :type="viewMode === 'chart' ? 'primary' : ''" 
              @click="$emit('update:viewMode', 'chart')"
            >
              图表
            </el-button>
          </el-button-group>
          
          <el-button @click="exportResults" size="small">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
    </template>

    <div v-if="!results || results.length === 0" class="empty-state">
      <el-empty description="暂无分析结果" />
    </div>

    <div v-else class="results-content">
      <!-- 概览模式 -->
      <div v-if="viewMode === 'summary'" class="summary-view">
        <el-row :gutter="20" class="summary-stats">
          <el-col :xs="24" :sm="12" :lg="6">
            <el-statistic title="已分析股票" :value="summaryStats.totalStocks" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-statistic title="推荐买入" :value="summaryStats.buyCount" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-statistic title="平均评分" :value="summaryStats.avgScore" :precision="1" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-statistic title="高评分股票" :value="summaryStats.highScoreCount" />
          </el-col>
        </el-row>

        <!-- 推荐股票列表 -->
        <div class="recommended-stocks">
          <h4>推荐股票 (评分 ≥ 4.0)</h4>
          <div class="stock-cards" style="max-height: 400px; overflow-y: auto;">
            <div 
              v-for="stock in recommendedStocks" 
              :key="stock.code" 
              class="stock-card"
              @click="$emit('view-stock-detail', stock)"
            >
              <div class="stock-header">
                <div class="stock-info">
                  <h5>{{ stock.name }} ({{ stock.code }})</h5>
                  <el-tag :type="getRecommendationTagType(stock.recommendation)" size="small">
                    {{ getRecommendationText(stock.recommendation) }}
                  </el-tag>
                </div>
                <div class="stock-score">
                  <el-rate v-model="stock.score" disabled show-score text-color="#ff9900" :max="5" />
                </div>
              </div>
              
              <div class="stock-metrics">
                <span class="metric">
                  <label>置信度:</label>
                  <span class="value">{{ stock.confidence }}%</span>
                </span>
                <span class="metric">
                  <label>风险等级:</label>
                  <span class="value" :class="getRiskClass(stock.riskLevel)">{{ stock.riskLevel }}</span>
                </span>
              </div>
              
              <p class="stock-summary">{{ stock.summary }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细模式 -->
      <div v-else-if="viewMode === 'detailed'" class="detailed-view" style="max-height: 600px; overflow-y: auto;">
        <el-table :data="results" stripe style="width: 100%">
          <el-table-column prop="code" label="代码" width="100" />
          <el-table-column prop="name" label="名称" width="140" show-overflow-tooltip />
          
          <el-table-column label="综合评分" width="140">
            <template #default="{ row }">
              <el-rate v-model="row.score" disabled show-score text-color="#ff9900" :max="5" />
            </template>
          </el-table-column>
          
          <el-table-column prop="recommendation" label="建议" width="100">
            <template #default="{ row }">
              <el-tag :type="getRecommendationTagType(row.recommendation)" size="small">
                {{ getRecommendationText(row.recommendation) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="confidence" label="置信度" width="100">
            <template #default="{ row }">
              {{ row.confidence }}%
            </template>
          </el-table-column>
          
          <el-table-column label="分项评分" width="200">
            <template #default="{ row }">
              <div class="sub-scores">
                <span class="score-item">基本面: {{ row.fundamentalScore }}</span>
                <span class="score-item">技术面: {{ row.technicalScore }}</span>
                <span class="score-item">情绪面: {{ row.sentimentScore }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="riskLevel" label="风险" width="80">
            <template #default="{ row }">
              <span :class="getRiskClass(row.riskLevel)">{{ row.riskLevel }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button @click="$emit('view-stock-detail', row)" title="详情">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button @click="$emit('add-to-watchlist', row)" title="加入自选">
                  <el-icon><Star /></el-icon>
                </el-button>
                <el-button @click="$emit('add-to-candidates', row)" title="加入候选池">
                  <el-icon><Plus /></el-icon>
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 图表模式 -->
      <div v-else-if="viewMode === 'chart'" class="chart-view">
        <el-row :gutter="20">
          <el-col :xs="24" :lg="12">
            <div class="chart-container">
              <h4>评分分布</h4>
              <div class="chart-placeholder">
                <el-icon size="64"><PieChart /></el-icon>
                <p>评分分布图表 (待实现)</p>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="24" :lg="12">
            <div class="chart-container">
              <h4>推荐分布</h4>
              <div class="chart-placeholder">
                <el-icon size="64"><Histogram /></el-icon>
                <p>推荐分布图表 (待实现)</p>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="24">
            <div class="chart-container">
              <h4>行业分布</h4>
              <div class="chart-placeholder" style="height: 300px">
                <el-icon size="64"><DataAnalysis /></el-icon>
                <p>行业分布图表 (待实现)</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Download, 
  View, 
  Star, 
  Plus, 
  PieChart, 
  Histogram, 
  DataAnalysis 
} from '@element-plus/icons-vue'

// 接口定义
interface AnalysisResult {
  code: string
  name: string
  score: number
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  fundamentalScore: number
  technicalScore: number
  sentimentScore: number
  riskLevel: 'low' | 'medium' | 'high'
  summary: string
  [key: string]: any
}

// Props
const props = defineProps<{
  results: AnalysisResult[]
  viewMode: 'summary' | 'detailed' | 'chart'
}>()

// Emits
defineEmits<{
  'update:viewMode': [mode: 'summary' | 'detailed' | 'chart']
  'view-stock-detail': [stock: AnalysisResult]
  'add-to-watchlist': [stock: AnalysisResult]
  'add-to-candidates': [stock: AnalysisResult]
}>()

// 计算属性
const summaryStats = computed(() => {
  const total = props.results.length
  const buyCount = props.results.filter(r => r.recommendation === 'buy').length
  const avgScore = total > 0 
    ? props.results.reduce((sum, r) => sum + r.score, 0) / total 
    : 0
  const highScoreCount = props.results.filter(r => r.score >= 4.0).length
  
  return {
    totalStocks: total,
    buyCount,
    avgScore,
    highScoreCount
  }
})

const recommendedStocks = computed(() => {
  return props.results
    .filter(stock => stock.score >= 4.0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // 只显示前10只
})

// 工具函数
const getRecommendationTagType = (recommendation: string) => {
  const types: Record<string, string> = {
    buy: 'success',
    hold: 'warning',
    sell: 'danger'
  }
  return types[recommendation] || 'info'
}

const getRecommendationText = (recommendation: string) => {
  const texts: Record<string, string> = {
    buy: '推荐买入',
    hold: '持有观望',
    sell: '建议卖出'
  }
  return texts[recommendation] || recommendation
}

const getRiskClass = (riskLevel: string) => {
  const classes: Record<string, string> = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high'
  }
  return classes[riskLevel] || ''
}

const exportResults = () => {
  if (!props.results || props.results.length === 0) {
    ElMessage.warning('暂无结果可导出')
    return
  }
  
  // TODO: 实际导出逻辑
  ElMessage.success('分析结果已导出')
}
</script>

<style lang="scss" scoped>
.analysis-results {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
  
  .results-content {
    .summary-view {
      .summary-stats {
        margin-bottom: 24px;
        
        .el-statistic {
          text-align: center;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }
      }
      
      .recommended-stocks {
        h4 {
          margin: 0 0 16px 0;
          color: #303133;
        }
        
        .stock-cards {
          .stock-card {
            border: 1px solid #ebeef5;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            background: #fff;
            cursor: pointer;
            transition: all 0.3s;
            
            &:hover {
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            }
            
            .stock-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              
              .stock-info {
                h5 {
                  margin: 0 0 4px 0;
                  color: #303133;
                  font-size: 16px;
                }
              }
            }
            
            .stock-metrics {
              display: flex;
              gap: 16px;
              margin-bottom: 8px;
              
              .metric {
                font-size: 12px;
                
                label {
                  color: #909399;
                  margin-right: 4px;
                }
                
                .value {
                  color: #303133;
                  font-weight: 500;
                  
                  &.risk-low {
                    color: #67c23a;
                  }
                  
                  &.risk-medium {
                    color: #e6a23c;
                  }
                  
                  &.risk-high {
                    color: #f56c6c;
                  }
                }
              }
            }
            
            .stock-summary {
              margin: 0;
              color: #606266;
              font-size: 13px;
              line-height: 1.4;
            }
          }
        }
      }
    }
    
    .detailed-view {
      .sub-scores {
        display: flex;
        flex-direction: column;
        gap: 2px;
        
        .score-item {
          font-size: 12px;
          color: #606266;
        }
      }
    }
    
    .chart-view {
      .chart-container {
        h4 {
          margin: 0 0 16px 0;
          color: #303133;
          text-align: center;
        }
        
        .chart-placeholder {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          border-radius: 8px;
          color: #909399;
          
          p {
            margin: 16px 0 0 0;
          }
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 0;
  }
}

// 表格中的风险等级颜色
:deep(.el-table) {
  .risk-low {
    color: #67c23a;
    font-weight: 500;
  }
  
  .risk-medium {
    color: #e6a23c;
    font-weight: 500;
  }
  
  .risk-high {
    color: #f56c6c;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .analysis-results {
    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .header-actions {
        justify-content: center;
      }
    }
    
    .results-content {
      .summary-view {
        .summary-stats {
          .el-col {
            margin-bottom: 12px;
          }
        }
        
        .recommended-stocks {
          .stock-cards {
            .stock-card {
              .stock-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
              }
              
              .stock-metrics {
                flex-direction: column;
                gap: 4px;
              }
            }
          }
        }
      }
      
      .chart-view {
        .el-col {
          margin-bottom: 20px;
        }
      }
    }
  }
}
</style> 