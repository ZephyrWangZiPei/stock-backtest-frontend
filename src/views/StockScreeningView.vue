<template>
  <div class="screening-container">
    <el-card class="screening-card">
      <template #header>
        <div class="card-header">
          <h2>🔍 股票筛选</h2>
          <div class="header-actions">
            <el-button @click="showConfigDialog = true" type="info" plain>
              <el-icon><Setting /></el-icon>
              筛选配置
            </el-button>
            <el-button type="primary" @click="startScreening" :loading="isScreening" :disabled="isScreening">
              <el-icon><Search /></el-icon>
              开始筛选
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选进度 -->
      <div v-if="isScreening" class="progress-section">
        <el-divider content-position="left">筛选进度</el-divider>
        <el-progress 
          :percentage="screeningProgress" 
          :status="screeningProgress === 100 ? 'success' : ''"
        />
        <p class="progress-message">{{ progressMessage }}</p>
        <div class="progress-stats">
          <span>已处理: {{ processedCount }}/{{ totalStocks }}</span>
          <span>找到: {{ successCount }}</span>
          <span>错误: {{ errorCount }}</span>
        </div>
        <el-button type="danger" @click="cancelScreening" size="small">
          取消筛选
        </el-button>
      </div>

      <!-- 筛选结果 -->
      <div v-if="screeningResults.length > 0" class="results-section">
        <el-divider content-position="left">筛选结果</el-divider>
        
        <div class="results-summary">
          <el-alert
            :title="`筛选完成，共找到 ${screeningResults.length} 只符合条件的股票`"
            type="success"
            :closable="false"
          />
        </div>

        <div class="table-container">
          <el-table 
            :data="paginatedResults" 
            stripe 
            style="width: 100%; height: 100%"
            :max-height="tableHeight"
          >
            <el-table-column prop="stock_code" label="股票代码" fixed="left" />
            <el-table-column prop="stock_name" label="股票名称" fixed="left" />
            <el-table-column prop="industry" label="行业" />
            <el-table-column prop="comprehensive_score" label="综合评分" sortable>
              <template #default="scope">
                <span :class="getScoreClass(scope.row.comprehensive_score)">
                  {{ scope.row.comprehensive_score }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="technical_score" label="技术面评分" sortable>
              <template #default="scope">
                <span :class="getScoreClass(scope.row.technical_score)">
                  {{ scope.row.technical_score }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="fundamental_score" label="基本面评分" sortable>
              <template #default="scope">
                <span :class="getScoreClass(scope.row.fundamental_score)">
                  {{ scope.row.fundamental_score }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="passed_filters" label="通过筛选">
              <template #default="scope">
                <el-tag :type="scope.row.passed_filters ? 'success' : 'danger'">
                  {{ scope.row.passed_filters ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="viewStockDetail(scope.row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100, 200]"
            :total="screeningResults.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!isScreening" class="empty-state">
        <el-empty description="暂无筛选结果，请点击开始筛选" />
      </div>
    </el-card>

    <!-- 筛选配置对话框 -->
    <el-dialog
      v-model="showConfigDialog"
      title="筛选配置"
      width="800px"
      :before-close="handleConfigDialogClose"
    >
      <el-form :model="screeningConfig" label-width="120px">
        <!-- 筛选类型 -->
        <el-form-item label="筛选类型">
          <el-radio-group v-model="screeningConfig.screeningType">
            <el-radio label="comprehensive">综合筛选</el-radio>
            <el-radio label="technical">技术面筛选</el-radio>
            <el-radio label="fundamental">基本面筛选</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 评分阈值 -->
        <el-form-item label="最低评分">
          <el-slider
            v-model="screeningConfig.minScore"
            :min="0"
            :max="100"
            :step="5"
            show-input
            input-size="small"
          />
        </el-form-item>

        <!-- 最大结果数 -->
        <el-form-item label="最大结果数">
          <el-input-number
            v-model="screeningConfig.maxResults"
            :min="10"
            :max="1000"
            :step="10"
            size="small"
          />
        </el-form-item>

        <!-- 技术面筛选配置 -->
        <el-form-item label="技术面配置" v-if="screeningConfig.screeningType === 'technical' || screeningConfig.screeningType === 'comprehensive'">
          <el-card class="config-sub-card">
            <el-form-item label="MA指标">
              <el-checkbox-group v-model="screeningConfig.technical.ma">
                <el-checkbox label="ma5">MA5</el-checkbox>
                <el-checkbox label="ma10">MA10</el-checkbox>
                <el-checkbox label="ma20">MA20</el-checkbox>
                <el-checkbox label="ma60">MA60</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="MACD">
              <el-checkbox v-model="screeningConfig.technical.macd">启用MACD</el-checkbox>
            </el-form-item>
            <el-form-item label="RSI">
              <el-checkbox v-model="screeningConfig.technical.rsi">启用RSI</el-checkbox>
            </el-form-item>
            <el-form-item label="KDJ">
              <el-checkbox v-model="screeningConfig.technical.kdj">启用KDJ</el-checkbox>
            </el-form-item>
          </el-card>
        </el-form-item>

        <!-- 基本面筛选配置 -->
        <el-form-item label="基本面配置" v-if="screeningConfig.screeningType === 'fundamental' || screeningConfig.screeningType === 'comprehensive'">
          <el-card class="config-sub-card">
            <el-form-item label="市盈率范围">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input-number
                    v-model="screeningConfig.fundamental.peMin"
                    placeholder="最小值"
                    size="small"
                  />
                </el-col>
                <el-col :span="12">
                  <el-input-number
                    v-model="screeningConfig.fundamental.peMax"
                    placeholder="最大值"
                    size="small"
                  />
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item label="市净率范围">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input-number
                    v-model="screeningConfig.fundamental.pbMin"
                    placeholder="最小值"
                    size="small"
                  />
                </el-col>
                <el-col :span="12">
                  <el-input-number
                    v-model="screeningConfig.fundamental.pbMax"
                    placeholder="最大值"
                    size="small"
                  />
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item label="营收增长率">
              <el-input-number
                v-model="screeningConfig.fundamental.revenueGrowth"
                placeholder="最低增长率(%)"
                size="small"
              />
            </el-form-item>
            <el-form-item label="净利润增长率">
              <el-input-number
                v-model="screeningConfig.fundamental.profitGrowth"
                placeholder="最低增长率(%)"
                size="small"
              />
            </el-form-item>
          </el-card>
        </el-form-item>

        <!-- 行业筛选 -->
        <el-form-item label="行业筛选">
          <el-select
            v-model="screeningConfig.industries"
            multiple
            placeholder="选择行业"
            style="width: 100%"
          >
            <el-option label="银行" value="银行" />
            <el-option label="房地产" value="房地产" />
            <el-option label="医药生物" value="医药生物" />
            <el-option label="电子" value="电子" />
            <el-option label="计算机" value="计算机" />
            <el-option label="通信" value="通信" />
            <el-option label="汽车" value="汽车" />
            <el-option label="食品饮料" value="食品饮料" />
            <el-option label="家用电器" value="家用电器" />
            <el-option label="机械设备" value="机械设备" />
          </el-select>
        </el-form-item>

        <!-- 市值范围 -->
        <el-form-item label="市值范围">
          <el-select v-model="screeningConfig.marketCap" placeholder="选择市值范围">
            <el-option label="不限" value="" />
            <el-option label="小盘股 (< 50亿)" value="small" />
            <el-option label="中盘股 (50-200亿)" value="medium" />
            <el-option label="大盘股 (> 200亿)" value="large" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetConfig">重置配置</el-button>
          <el-button @click="showConfigDialog = false">取消</el-button>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Search } from '@element-plus/icons-vue'

const isScreening = ref(false)
const screeningProgress = ref(0)
const progressMessage = ref('准备开始筛选...')
const processedCount = ref(0)
const totalStocks = ref(0)
const successCount = ref(0)
const errorCount = ref(0)
const screeningResults = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const showConfigDialog = ref(false)
const tableHeight = ref(600)

// 筛选配置
const screeningConfig = ref({
  screeningType: 'comprehensive',
  minScore: 60,
  maxResults: 100,
  technical: {
    ma: ['ma5', 'ma10', 'ma20'],
    macd: true,
    rsi: true,
    kdj: false
  },
  fundamental: {
    peMin: 0,
    peMax: 50,
    pbMin: 0,
    pbMax: 10,
    revenueGrowth: 10,
    profitGrowth: 5
  },
  industries: [],
  marketCap: ''
})

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return screeningResults.value.slice(start, end)
})

const getScoreClass = (score: number) => {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-average'
  return 'score-poor'
}

const startScreening = () => {
  console.log('开始筛选，配置:', screeningConfig.value)
  isScreening.value = true
  screeningProgress.value = 0
  progressMessage.value = '正在初始化筛选...'
  processedCount.value = 0
  successCount.value = 0
  errorCount.value = 0
  
  // 模拟筛选过程
  simulateScreening()
}

const simulateScreening = () => {
  totalStocks.value = 100
  const interval = setInterval(() => {
    processedCount.value += 5
    screeningProgress.value = Math.floor((processedCount.value / totalStocks.value) * 100)
    
    if (Math.random() > 0.7) {
      successCount.value++
      screeningResults.value.push({
        stock_code: `000${successCount.value.toString().padStart(3, '0')}`,
        stock_name: `股票${successCount.value}`,
        industry: '科技',
        comprehensive_score: Math.floor(Math.random() * 40) + 60,
        technical_score: Math.floor(Math.random() * 40) + 60,
        fundamental_score: Math.floor(Math.random() * 40) + 60,
        passed_filters: true
      })
    }
    
    if (Math.random() > 0.9) {
      errorCount.value++
    }
    
    progressMessage.value = `正在筛选第 ${processedCount.value} 只股票...`
    
    if (processedCount.value >= totalStocks.value) {
      clearInterval(interval)
      screeningProgress.value = 100
      progressMessage.value = '筛选完成'
      isScreening.value = false
      ElMessage.success(`筛选完成，共找到 ${screeningResults.value.length} 只符合条件的股票`)
    }
  }, 100)
}

const cancelScreening = () => {
  console.log('取消筛选')
  isScreening.value = false
  progressMessage.value = '筛选已取消'
  ElMessage.info('筛选已取消')
}

const viewStockDetail = (stock: any) => {
  console.log('查看股票详情:', stock)
  ElMessage.info(`查看股票详情: ${stock.stock_name}`)
}

const handleConfigDialogClose = () => {
  showConfigDialog.value = false
}

const resetConfig = () => {
  screeningConfig.value = {
    screeningType: 'comprehensive',
    minScore: 60,
    maxResults: 100,
    technical: {
      ma: ['ma5', 'ma10', 'ma20'],
      macd: true,
      rsi: true,
      kdj: false
    },
    fundamental: {
      peMin: 0,
      peMax: 50,
      pbMin: 0,
      pbMax: 10,
      revenueGrowth: 10,
      profitGrowth: 5
    },
    industries: [],
    marketCap: ''
  }
  ElMessage.success('配置已重置')
}

const saveConfig = () => {
  console.log('保存筛选配置:', screeningConfig.value)
  showConfigDialog.value = false
  ElMessage.success('筛选配置已保存')
}

onMounted(() => {
  console.log('股票筛选组件已挂载')
})
</script>

<style scoped>
.screening-container {
  padding: 20px;
}

.screening-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.progress-section {
  margin: 20px 0;
}

.progress-message {
  margin: 10px 0;
  color: #606266;
}

.progress-stats {
  display: flex;
  gap: 20px;
  margin: 10px 0;
  color: #909399;
}

.results-section {
  margin: 20px 0;
}

.results-summary {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.score-excellent {
  color: #67c23a;
  font-weight: bold;
}

.score-good {
  color: #409eff;
  font-weight: bold;
}

.score-average {
  color: #e6a23c;
  font-weight: bold;
}

.score-poor {
  color: #f56c6c;
  font-weight: bold;
}

.config-sub-card {
  margin-bottom: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 
 
 
 
