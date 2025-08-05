<template>
  <div class="news-analysis-container">
    <div class="news-analysis-header">
      <h1 class="news-analysis-title">新闻分析</h1>
      <p class="news-analysis-subtitle">新闻数据采集与情感分析</p>
    </div>

    <div class="news-analysis-content">
      <!-- 新闻搜索 -->
      <el-card class="news-search-card">
        <template #header>
          <div class="card-header">
            <span>新闻搜索</span>
          </div>
        </template>
        <el-form
          :model="searchForm"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="搜索关键词">
                <el-input
                  v-model="searchForm.keywords"
                  placeholder="输入搜索关键词"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button
              type="primary"
              @click="searchNews"
            >搜索新闻</el-button>
            <el-button @click="resetSearch">重置搜索</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 新闻列表 -->
      <el-card class="news-list-card">
        <template #header>
          <div class="card-header">
            <span>新闻列表</span>
          </div>
        </template>
        <div class="news-content">
          <div class="news-placeholder">
            <el-icon>
              <Document />
            </el-icon>
            <p>新闻列表将在这里显示</p>
          </div>
        </div>
      </el-card>

      <!-- 情感分析 -->
      <el-card class="sentiment-analysis-card">
        <template #header>
          <div class="card-header">
            <span>情感分析</span>
          </div>
        </template>
        <div class="sentiment-content">
          <div class="sentiment-placeholder">
            <el-icon>
              <DataAnalysis />
            </el-icon>
            <p>情感分析结果将在这里显示</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Document, DataAnalysis } from '@element-plus/icons-vue'

// 基础数据 - 清理业务逻辑，保留框架
const searchForm = reactive({
  keywords: '',
  dateRange: null
})

// 基础事件处理 - 保留框架
const searchNews = () => {
  console.log('搜索新闻:', searchForm)
}

const resetSearch = () => {
  console.log('重置搜索')
  searchForm.keywords = ''
  searchForm.dateRange = null
}
</script>

<style scoped>
.news-analysis-container {
  padding: 20px;
}

.news-analysis-header {
  margin-bottom: 30px;
  text-align: center;
}

.news-analysis-title {
  font-size: 2rem;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.news-analysis-subtitle {
  font-size: 1rem;
  color: #909399;
  margin: 0;
}

.news-analysis-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.news-search-card,
.news-list-card,
.sentiment-analysis-card {
  margin-bottom: 20px;
}

.news-content,
.sentiment-content {
  min-height: 300px;
}

.news-placeholder,
.sentiment-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.news-placeholder .el-icon,
.sentiment-placeholder .el-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
