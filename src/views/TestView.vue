<template>
  <div class="test-container p-6 space-y-6">
    <h1 class="text-2xl font-bold text-white mb-6">样式测试页面</h1>
    
    <!-- 按钮测试 -->
    <div class="test-section">
      <h2 class="text-lg font-semibold text-white mb-4">按钮测试</h2>
      <div class="flex space-x-4">
        <el-button type="primary">主要按钮</el-button>
        <el-button type="success">成功按钮</el-button>
        <el-button type="warning">警告按钮</el-button>
        <el-button type="danger">危险按钮</el-button>
        <el-button type="info">信息按钮</el-button>
      </div>
    </div>

    <!-- 输入框测试 -->
    <div class="test-section">
      <h2 class="text-lg font-semibold text-white mb-4">输入框测试</h2>
      <div class="grid grid-cols-2 gap-4">
        <el-input v-model="testInput" placeholder="请输入内容" />
        <el-select v-model="testSelect" placeholder="请选择">
          <el-option label="选项1" value="1" />
          <el-option label="选项2" value="2" />
          <el-option label="选项3" value="3" />
        </el-select>
      </div>
    </div>

    <!-- 表格测试 -->
    <div class="test-section">
      <h2 class="text-lg font-semibold text-white mb-4">表格测试</h2>
      <el-table :data="testData" border stripe>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="value" label="值" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '成功' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default>
            <el-button type="primary" size="small">查看</el-button>
            <el-button type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Element Plus 表格测试 -->
    <div class="test-section">
      <h2 class="text-lg font-semibold text-white mb-4">Element Plus 表格测试</h2>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索..."
          :prefix-icon="Search"
          clearable
          style="width: 300px"
        />
        <el-select
          v-model="statusFilter"
          placeholder="选择状态"
          clearable
          style="width: 150px"
        >
          <el-option label="成功" value="成功" />
          <el-option label="失败" value="失败" />
        </el-select>
      </div>

      <!-- 表格 -->
      <el-table
        :data="filteredTestData"
        stripe
        border
        style="width: 100%; margin-top: 16px"
      >
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="value" label="值" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '成功' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

const testInput = ref('')
const testSelect = ref('')
const searchQuery = ref('')
const statusFilter = ref('')

const testData = ref([
  { name: '测试项目1', value: 100, status: '成功' },
  { name: '测试项目2', value: 200, status: '失败' },
  { name: '测试项目3', value: 300, status: '成功' },
  { name: '测试项目4', value: 400, status: '成功' },
  { name: '测试项目5', value: 500, status: '失败' },
])

// 过滤后的数据
const filteredTestData = computed(() => {
  let result = [...testData.value]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    result = result.filter(item => item.status === statusFilter.value)
  }

  return result
})
</script>

<style lang="scss" scoped>
.test-container {
  background: #1e293b;
  min-height: 100vh;
}

.test-section {
  background: rgba(31, 41, 55, 0.8);
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(75, 85, 99, 0.3);
}

.table-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
