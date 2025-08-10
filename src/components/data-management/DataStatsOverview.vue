<template>
  <el-card class="data-stats-overview">
    <template #header>
      <span>数据统计概览</span>
    </template>

    <div class="stats-content">
      <!-- 数据完整性统计 -->
      <div class="data-summary">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="summary-item">
              <div class="item-icon stocks">
                <el-icon size="24"><DataBoard /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-value">{{ stats.totalStocks }}</div>
                <div class="item-label">股票总数</div>
                <div class="item-progress">
                  <el-progress :percentage="100" :show-text="false" :stroke-width="4" />
                </div>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <div class="summary-item">
              <div class="item-icon daily">
                <el-icon size="24"><TrendCharts /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-value">{{ stats.dailyDataCompleteness }}%</div>
                <div class="item-label">日线完整度</div>
                <div class="item-progress">
                  <el-progress 
                    :percentage="stats.dailyDataCompleteness" 
                    :show-text="false" 
                    :stroke-width="4"
                    :color="getProgressColor(stats.dailyDataCompleteness)"
                  />
                </div>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <div class="summary-item">
              <div class="item-icon fundamental">
                <el-icon size="24"><PieChart /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-value">{{ stats.fundamentalCompleteness }}%</div>
                <div class="item-label">基本面完整度</div>
                <div class="item-progress">
                  <el-progress 
                    :percentage="stats.fundamentalCompleteness" 
                    :show-text="false" 
                    :stroke-width="4"
                    :color="getProgressColor(stats.fundamentalCompleteness)"
                  />
                </div>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <div class="summary-item">
              <div class="item-icon technical">
                <el-icon size="24"><DataAnalysis /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-value">{{ stats.technicalCompleteness }}%</div>
                <div class="item-label">技术指标完整度</div>
                <div class="item-progress">
                  <el-progress 
                    :percentage="stats.technicalCompleteness" 
                    :show-text="false" 
                    :stroke-width="4"
                    :color="getProgressColor(stats.technicalCompleteness)"
                  />
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 更多指标 -->
      <div class="more-metrics" v-if="extra.overallCompleteness !== null || extra.analystCoverage !== null || extra.instituteCoverage !== null">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" v-if="extra.overallCompleteness !== null">
            <div class="summary-item">
              <div class="item-icon fundamental">
                <el-icon size="24"><PieChart /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-value">{{ extra.overallCompleteness }}%</div>
                <div class="item-label">总体完整度</div>
                <div class="item-progress">
                  <el-progress 
                    :percentage="extra.overallCompleteness || 0" 
                    :show-text="false" 
                    :stroke-width="4"
                    :color="getProgressColor(extra.overallCompleteness || 0)"
                  />
                </div>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" v-if="extra.analystCoverage !== null">
            <div class="summary-item">
              <div class="item-icon technical">
                <el-icon size="24"><DataAnalysis /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-value">{{ extra.analystCoverage }}%</div>
                <div class="item-label">分析师评级覆盖率</div>
                <div class="item-progress">
                  <el-progress 
                    :percentage="extra.analystCoverage || 0" 
                    :show-text="false" 
                    :stroke-width="4"
                    :color="getProgressColor(extra.analystCoverage || 0)"
                  />
                </div>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" v-if="extra.instituteCoverage !== null">
            <div class="summary-item">
              <div class="item-icon daily">
                <el-icon size="24"><TrendCharts /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-value">{{ extra.instituteCoverage }}%</div>
                <div class="item-label">机构持股覆盖率</div>
                <div class="item-progress">
                  <el-progress 
                    :percentage="extra.instituteCoverage || 0" 
                    :show-text="false" 
                    :stroke-width="4"
                    :color="getProgressColor(extra.instituteCoverage || 0)"
                  />
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 详细统计 -->
      <div class="detailed-stats">
        <el-row :gutter="20">
          <el-col :xs="24" :lg="12">
            <h4>数据源统计</h4>
            <div class="data-source-stats">
              <div v-for="source in dataSourceStats" :key="source.name" class="source-item">
                <div class="source-info">
                  <span class="source-name">{{ source.name }}</span>
                  <span class="source-count">{{ source.count }}</span>
                </div>
                <div class="source-progress">
                  <el-progress 
                    :percentage="source.percentage" 
                    :show-text="false"
                    :stroke-width="6"
                  />
                </div>
              </div>
            </div>

            <h4 style="margin-top: 20px;">覆盖统计</h4>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="日线覆盖">
                {{ extra.counts.stocks_with_daily_data }}/{{ stats.totalStocks }}
              </el-descriptions-item>
              <el-descriptions-item label="资金流向覆盖">
                {{ extra.counts.stocks_with_fund_flow }}/{{ stats.totalStocks }}
              </el-descriptions-item>
              <el-descriptions-item label="技术指标覆盖">
                {{ extra.counts.stocks_with_technical_indicators }}/{{ stats.totalStocks }}
              </el-descriptions-item>
              <el-descriptions-item label="分析师评级覆盖">
                {{ extra.counts.stocks_with_analyst_rating }}/{{ stats.totalStocks }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>

          <el-col :xs="24" :lg="12">
            <h4>更新状态</h4>
            <div class="update-status">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="最后更新">
                  {{ formatTime(stats.lastUpdateTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="今日新增">
                  {{ stats.todayAdded }} 条记录
                </el-descriptions-item>
                <el-descriptions-item label="数据延迟">
                  <el-tag :type="getDelayTagType(stats.dataDelay)" size="small">
                    {{ getDelayText(stats.dataDelay) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="数据质量">
                  <el-tag :type="getQualityTagType(stats.dataQuality)" size="small">
                    {{ getQualityText(stats.dataQuality) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="今日是否更新" v-if="extra.todayUpdated !== null">
                  <el-tag :type="extra.todayUpdated ? 'success' : 'warning'" size="small">
                    {{ extra.todayUpdated ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <h4 style="margin-top: 20px;">回测统计</h4>
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="回测总数">{{ extra.backtest.total }}</el-descriptions-item>
                <el-descriptions-item label="已完成">{{ extra.backtest.completed }}</el-descriptions-item>
                <el-descriptions-item label="完成率">{{ extra.backtest.completion_rate }}%</el-descriptions-item>
              </el-descriptions>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataBoard, TrendCharts, PieChart, DataAnalysis } from '@element-plus/icons-vue'

// 接口定义
interface DataStats {
  totalStocks: number
  dailyDataCompleteness: number
  fundamentalCompleteness: number
  technicalCompleteness: number
  lastUpdateTime: string
  todayAdded: number
  dataDelay: number // 小时
  dataQuality: number // 0-100
}

interface DataSourceStat {
  name: string
  count: number
  percentage: number
}

interface ExtraStats {
  overallCompleteness: number | null
  analystCoverage: number | null
  instituteCoverage: number | null
  counts: {
    stocks_with_daily_data: number
    stocks_with_fund_flow: number
    stocks_with_technical_indicators: number
    stocks_with_analyst_rating: number
  }
  backtest: {
    total: number
    completed: number
    completion_rate: number
  }
  todayUpdated: boolean | null
}

// Props
const props = defineProps<{
  stats: DataStats
  sourceStats?: DataSourceStat[]
  extra?: Partial<ExtraStats>
}>()

// 计算属性
const dataSourceStats = computed<DataSourceStat[]>(() => {
  if (props.sourceStats && props.sourceStats.length) return props.sourceStats
  // fallback: 空数据
  return [
    { name: 'Baostock', count: 0, percentage: 0 },
    { name: 'AkShare', count: 0, percentage: 0 },
    { name: 'Tushare', count: 0, percentage: 0 }
  ]
})

const extra = computed<ExtraStats>(() => ({
  overallCompleteness: props.extra?.overallCompleteness ?? null,
  analystCoverage: props.extra?.analystCoverage ?? null,
  instituteCoverage: props.extra?.instituteCoverage ?? null,
  counts: {
    stocks_with_daily_data: props.extra?.counts?.stocks_with_daily_data ?? 0,
    stocks_with_fund_flow: props.extra?.counts?.stocks_with_fund_flow ?? 0,
    stocks_with_technical_indicators: props.extra?.counts?.stocks_with_technical_indicators ?? 0,
    stocks_with_analyst_rating: props.extra?.counts?.stocks_with_analyst_rating ?? 0
  },
  backtest: {
    total: props.extra?.backtest?.total ?? 0,
    completed: props.extra?.backtest?.completed ?? 0,
    completion_rate: props.extra?.backtest?.completion_rate ?? 0
  },
  todayUpdated: props.extra?.todayUpdated ?? null
}))

// 工具函数
const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 70) return '#e6a23c'
  return '#f56c6c'
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString()
}

const getDelayTagType = (delay: number) => {
  if (delay <= 1) return 'success'
  if (delay <= 6) return 'warning'
  return 'danger'
}

const getDelayText = (delay: number) => {
  if (delay <= 1) return '实时'
  if (delay <= 6) return `延迟${delay}小时`
  return `严重延迟${delay}小时`
}

const getQualityTagType = (quality: number) => {
  if (quality >= 90) return 'success'
  if (quality >= 70) return 'warning'
  return 'danger'
}

const getQualityText = (quality: number) => {
  if (quality >= 90) return '优秀'
  if (quality >= 70) return '良好'
  return '需改善'
}
</script>

<style lang="scss" scoped>
.data-stats-overview {
  margin-bottom: 20px;
  
  .stats-content {
    .data-summary {
      margin-bottom: 24px;
      
      .summary-item {
        display: flex;
        align-items: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        height: 100px;
        
        .item-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          color: white;
          
          &.stocks { background: linear-gradient(135deg, #409eff 0%, #2979ff 100%); }
          &.daily { background: linear-gradient(135deg, #67c23a 0%, #4caf50 100%); }
          &.fundamental { background: linear-gradient(135deg, #e6a23c 0%, #ff9800 100%); }
          &.technical { background: linear-gradient(135deg, #f56c6c 0%, #e91e63 100%); }
        }
        
        .item-content {
          flex: 1;
          
          .item-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            line-height: 1;
            margin-bottom: 4px;
          }
          
          .item-label {
            color: #909399;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .item-progress { width: 100%; }
        }
      }
    }

    .more-metrics { margin-bottom: 24px; }
    
    .detailed-stats {
      h4 { margin: 0 0 16px 0; color: #303133; font-size: 16px; }
      
      .data-source-stats {
        .source-item {
          margin-bottom: 12px;
          
          .source-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            
            .source-name { font-size: 14px; color: #303133; }
            .source-count { font-size: 14px; color: #606266; }
          }
          .source-progress { width: 100%; }
        }
      }
      
      .update-status { .el-descriptions { background: #f8f9fa; } }
    }
  }
}

@media (max-width: 768px) {
  .data-stats-overview {
    .stats-content {
      .data-summary {
        .el-col { margin-bottom: 12px; }
        .summary-item { height: auto; min-height: 80px; 
          .item-icon { width: 40px; height: 40px; margin-right: 12px; }
          .item-content { .item-value { font-size: 20px; } }
        }
      }
      .detailed-stats { .el-col { margin-bottom: 20px; } }
    }
  }
}
</style> 