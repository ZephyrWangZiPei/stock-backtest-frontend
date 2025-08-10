<template>
  <section class="grid-2">
    <SharpCard>
      <template #title>回测配置</template>
      <el-form label-width="72px" class="form">
        <el-form-item label="股票">
          <el-input v-model="form.stock" placeholder="如 sh.600519" />
        </el-form-item>
        <el-form-item label="策略">
          <el-select v-model="form.strategy" placeholder="选择策略">
            <el-option v-for="s in strategies" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="区间">
          <el-date-picker v-model="form.range" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="startBacktest">开始回测</el-button>
        </el-form-item>
      </el-form>
    </SharpCard>

    <SharpCard>
      <template #title>K 线</template>
      <div class="kline" ref="klineRef" />
    </SharpCard>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// 已使用unifiedHttpClient替代旧的API
import SharpCard from '../components/shared/SharpCard.vue'
import unifiedHttpClient from '../utils/unifiedHttpClient'

interface Strategy {
  id: number
  name: string
  description?: string
  parameters?: Record<string, any>
}

const form = ref({ stock: '', strategy: undefined as number | undefined, range: [] as any[] })
const strategies = ref<Strategy[]>([])
const klineRef = ref<HTMLDivElement | null>(null)

async function loadStrategies() {
  try {
    const response = await unifiedHttpClient.backtest.getStrategies()
    strategies.value = response.data || []
  } catch (error) {
    console.error('获取策略失败:', error)
  }
}

async function startBacktest() {
  if (!form.value.stock || !form.value.strategy || form.value.range.length !== 2) return
  try {
    await unifiedHttpClient.backtest.startBacktest({
      strategy_id: form.value.strategy,
      stock_codes: [form.value.stock],
      start_date: form.value.range[0],
      end_date: form.value.range[1],
      initial_capital: 100000
    })
    console.log('回测已启动')
  } catch (error) {
    console.error('启动回测失败:', error)
  }
}

onMounted(loadStrategies)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
.grid-2 { display: grid; grid-template-columns: 360px 1fr; gap: $space-4; }
.kline { height: 420px; }
.form { padding: $space-2 $space-4; }
</style> 