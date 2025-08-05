<template>
  <div class="smart-recommendation-container">
    <div class="page-header">
      <h1 class="page-title">⭐ 智能推荐</h1>
      <p class="page-subtitle">智能推荐和买入卖出点位分析</p>
    </div>
    
    <div class="page-content">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>推荐配置</span>
              </div>
            </template>
            <div class="config-content">
              <el-form>
                <el-form-item label="推荐数量">
                  <el-input-number v-model="recommendConfig.topN" :min="5" :max="50" class="w-full" />
                </el-form-item>
                <el-form-item label="风险等级">
                  <el-select v-model="recommendConfig.riskLevel" placeholder="请选择风险等级" class="w-full">
                    <el-option label="低风险" value="low" />
                    <el-option label="中风险" value="medium" />
                    <el-option label="高风险" value="high" />
                  </el-select>
                </el-form-item>
                <el-form-item label="启用AI分析">
                  <el-switch v-model="recommendConfig.enableAI" />
                </el-form-item>
                <el-button type="primary" @click="generateRecommendations" class="w-full">生成推荐</el-button>
              </el-form>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="16">
          <el-card class="candidate-card">
            <template #header>
              <div class="card-header">
                <span>候选股票</span>
                <span class="candidate-count">共 {{ candidateStocks.length }} 只</span>
              </div>
            </template>
            <div class="candidate-content">
              <el-table :data="candidateStocks" class="w-full">
                <el-table-column prop="code" label="股票代码" />
                <el-table-column prop="name" label="股票名称" />
                <el-table-column prop="score" label="综合评分" />
                <el-table-column prop="risk" label="风险等级" />
                <el-table-column label="操作">
                  <template #default="{ row }">
                    <el-button size="small" @click="analyzeStock(row)">AI分析</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="mt-6">
        <el-col :span="12">
          <el-card class="recommendation-card">
            <template #header>
              <div class="card-header">
                <span>Top推荐</span>
              </div>
            </template>
            <div class="recommendation-content">
              <el-empty description="暂无推荐数据" />
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card class="portfolio-card">
            <template #header>
              <div class="card-header">
                <span>投资组合</span>
              </div>
            </template>
            <div class="portfolio-content">
              <div class="portfolio-chart">
                <el-icon><PieChart /></el-icon>
                <p>投资组合分布图</p>
              </div>
              <div class="portfolio-stats">
                <div class="stat-item">
                  <span class="stat-label">预期收益:</span>
                  <span class="stat-value">15.6%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最大回撤:</span>
                  <span class="stat-value">8.2%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">夏普比率:</span>
                  <span class="stat-value">1.8</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { PieChart } from '@element-plus/icons-vue'

const recommendConfig = reactive({
  topN: 10,
  riskLevel: 'medium',
  enableAI: true
})

const candidateStocks = ref([])

const generateRecommendations = () => {
  console.log('生成推荐:', recommendConfig)
  // 这里添加推荐生成逻辑
}

const analyzeStock = (stock: any) => {
  console.log('AI分析股票:', stock)
  // 这里添加AI分析逻辑
}
</script>

<style scoped>
.smart-recommendation-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
}

.page-subtitle {
  font-size: 1rem;
  color: #909399;
  margin: 0;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.config-card,
.candidate-card,
.recommendation-card,
.portfolio-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.candidate-count {
  font-size: 14px;
  color: #909399;
}

.config-content,
.candidate-content,
.recommendation-content,
.portfolio-content {
  padding: 20px 0;
}

.portfolio-chart {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.portfolio-chart .el-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.portfolio-stats {
  margin-top: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-label {
  color: #606266;
}

.stat-value {
  font-weight: bold;
  color: #67c23a;
}

.mt-6 {
  margin-top: 20px;
}

.w-full {
  width: 100%;
}
</style> 
 
 
 
