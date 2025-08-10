<template>
  <el-card class="transaction-table">
    <template #header>
      <div class="card-header">
        <span>最近交易</span>
      </div>
    </template>
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="stock" label="股票代码" width="100" />
      <el-table-column prop="action" label="操作" width="80" />
      <el-table-column prop="price" label="价格" width="100" />
      <el-table-column prop="time" label="时间" />
      <template #empty>
        <el-empty description="暂无交易记录" />
      </template>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import unifiedHttpClient from '@/utils/unifiedHttpClient'
import { ElMessage } from 'element-plus'

interface Transaction {
  stock: string
  action: string
  price: string
  time: string
}

const tableData = ref<Transaction[]>([])
const loading = ref(false)

// 加载最近交易记录
const loadRecentTransactions = async () => {
  try {
    loading.value = true
    
    const response = await unifiedHttpClient.backtest.getRecentTrades({
      limit: 10
    })
    
    if (response.data && response.data.trades) {
      tableData.value = response.data.trades.map((trade: any) => ({
        stock: trade.stock_code,
        action: trade.action === 'buy' ? '买入' : '卖出',
        price: trade.price.toFixed(2),
        time: new Date(trade.timestamp).toLocaleTimeString()
      }))
    }
  } catch (error) {
    console.error('加载交易记录失败:', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRecentTransactions()
})
</script>

<style lang="scss" scoped>
.transaction-table {
  height: 400px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      font-weight: 600;
      color: #303133;
    }
  }
}
</style> 