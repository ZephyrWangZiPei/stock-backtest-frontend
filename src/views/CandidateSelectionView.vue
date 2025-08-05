<template>
  <div class="candidate-selection-container">
    <div class="page-header">
      <h1 class="page-title">🎯 海选中心</h1>
      <p class="page-subtitle">完整的海选流程，从筛选到AI分析</p>
    </div>
    
    <div class="page-content">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>海选配置</span>
              </div>
            </template>
            <div class="config-content">
              <el-form>
                <el-form-item label="筛选条件">
                  <el-select v-model="selectionConfig.condition" placeholder="请选择筛选条件" class="w-full">
                    <el-option label="技术面筛选" value="technical" />
                    <el-option label="基本面筛选" value="fundamental" />
                    <el-option label="综合筛选" value="comprehensive" />
                  </el-select>
                </el-form-item>
                <el-form-item label="目标数量">
                  <el-input-number v-model="selectionConfig.targetCount" :min="10" :max="1000" class="w-full" />
                </el-form-item>
                <el-form-item label="启用AI分析">
                  <el-switch v-model="selectionConfig.enableAI" />
                </el-form-item>
                <el-button type="primary" @click="startSelection" class="w-full">开始海选</el-button>
              </el-form>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="16">
          <el-card class="progress-card">
            <template #header>
              <div class="card-header">
                <span>海选进度</span>
              </div>
            </template>
            <div class="progress-content">
              <el-steps :active="currentStep" direction="vertical">
                <el-step title="数据准备" description="准备股票数据和筛选条件" />
                <el-step title="初步筛选" description="根据条件进行初步筛选" />
                <el-step title="评分计算" description="计算候选股票评分" />
                <el-step title="AI分析" description="对候选股票进行AI分析" />
                <el-step title="结果生成" description="生成最终海选结果" />
              </el-steps>
              
              <div class="progress-info">
                <el-progress :percentage="progressPercentage" :status="progressStatus" />
                <p class="progress-text">{{ progressText }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="mt-6">
        <el-col :span="24">
          <el-card class="result-card">
            <template #header>
              <div class="card-header">
                <span>候选股票列表</span>
                <el-button type="success" size="small" @click="exportResults">导出结果</el-button>
              </div>
            </template>
            <div class="result-content">
              <el-table :data="candidateStocks" class="w-full">
                <el-table-column prop="code" label="股票代码" />
                <el-table-column prop="name" label="股票名称" />
                <el-table-column prop="score" label="综合评分" />
                <el-table-column prop="technicalScore" label="技术评分" />
                <el-table-column prop="fundamentalScore" label="基本面评分" />
                <el-table-column prop="aiScore" label="AI评分" />
                <el-table-column label="操作">
                  <template #default="{ row }">
                    <el-button size="small" @click="viewDetail(row)">查看详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const selectionConfig = reactive({
  condition: 'comprehensive',
  targetCount: 100,
  enableAI: true
})

const currentStep = ref(0)
const progressPercentage = ref(0)
const progressStatus = ref('')
const progressText = ref('准备开始海选...')
const candidateStocks = ref([])

const startSelection = () => {
  console.log('开始海选:', selectionConfig)
  // 这里添加海选逻辑
}

const exportResults = () => {
  console.log('导出结果')
  // 这里添加导出逻辑
}

const viewDetail = (row: any) => {
  console.log('查看详情:', row)
  // 这里添加查看详情逻辑
}
</script>

<style scoped>
.candidate-selection-container {
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
.progress-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-content,
.progress-content,
.result-content {
  padding: 20px 0;
}

.progress-info {
  margin-top: 20px;
}

.progress-text {
  margin-top: 10px;
  color: #606266;
}

.mt-6 {
  margin-top: 20px;
}

.w-full {
  width: 100%;
}
</style> 
 
 
 
