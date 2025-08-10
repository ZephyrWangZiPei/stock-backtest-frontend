<template>
  <el-card class="candidate-toolbar">
    <div class="toolbar-content">
      <div class="toolbar-left">
        <el-button type="primary" @click="$emit('refresh-candidates')">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="$emit('import-from-screening')">
          <el-icon><Upload /></el-icon>
          从筛选导入
        </el-button>
        <el-button 
          @click="$emit('batch-analysis')" 
          :disabled="selectedCount === 0"
        >
          <el-icon><DataAnalysis /></el-icon>
          批量分析 ({{ selectedCount }})
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-select 
          :model-value="filterStatus" 
          @update:model-value="$emit('update:filterStatus', $event)"
          placeholder="状态筛选" 
          style="width: 120px; margin-right: 10px"
        >
          <el-option label="全部" value="all" />
          <el-option label="待评估" value="pending" />
          <el-option label="已评估" value="evaluated" />
          <el-option label="推荐买入" value="buy" />
          <el-option label="观望" value="watch" />
          <el-option label="不推荐" value="reject" />
        </el-select>
        
        <el-input
          :model-value="searchKeyword"
          @update:model-value="$emit('update:searchKeyword', $event)"
          placeholder="搜索股票代码或名称"
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Refresh, Upload, DataAnalysis, Search } from '@element-plus/icons-vue'

// Props
defineProps<{
  selectedCount: number
  filterStatus: string
  searchKeyword: string
}>()

// Emits
defineEmits<{
  'refresh-candidates': []
  'import-from-screening': []
  'batch-analysis': []
  'update:filterStatus': [value: string]
  'update:searchKeyword': [value: string]
}>()
</script>

<style lang="scss" scoped>
.candidate-toolbar {
  margin-bottom: 20px;
  
  .toolbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .toolbar-left {
      display: flex;
      gap: 12px;
    }
    
    .toolbar-right {
      display: flex;
      align-items: center;
    }
  }
}

@media (max-width: 768px) {
  .candidate-toolbar {
    .toolbar-content {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .toolbar-left,
      .toolbar-right {
        justify-content: center;
      }
      
      .toolbar-left {
        .el-button {
          flex: 1;
          min-width: 0;
        }
      }
      
      .toolbar-right {
        .el-select,
        .el-input {
          width: 100% !important;
          margin: 4px 0 !important;
        }
      }
    }
  }
}
</style> 