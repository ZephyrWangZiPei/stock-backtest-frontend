<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center space-x-4">
      <el-input v-model="filters.stock_code" placeholder="股票代码 (可空)" class="w-60" clearable />
      <el-button type="primary" @click="fetchHistory" :loading="loading">查询</el-button>
      <el-button type="danger" @click="onClear" :loading="clearLoading">清空历史</el-button>
    </div>

    <el-table :data="history" border stripe class="w-full">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="strategy_id" label="策略ID" width="100" />
      <el-table-column prop="start_date" label="开始日期" width="120" />
      <el-table-column prop="end_date" label="结束日期" width="120" />
      <el-table-column prop="total_return" label="收益率" width="100">
        <template #default="{ row }">
          <span :class="row.total_return >= 0 ? 'text-red-500' : 'text-green-500'">
            {{ row.total_return !== null ? (row.total_return * 100).toFixed(2) + '%' : '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column prop="selected_stocks" label="股票" >
        <template #default="{ row }">
          <el-tag
            v-for="item in row.selected_stocks"
            :key="typeof item === 'string' ? item : item.code"
            size="small"
            class="mr-1"
          >{{ typeof item === 'string' ? item : `${item.code} ${item.name}` }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="goDetail(row.id)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next, total"
      :current-page="page"
      :page-size="size"
      :total="total"
      @current-change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getBacktestHistory, clearBacktestHistory } from '@/utils/api';
import { ElMessage, ElMessageBox, ElTag } from 'element-plus';

const router = useRouter();

const filters = reactive<{ stock_code?: string }>({ stock_code: undefined });
const history = ref<any[]>([]);
const loading = ref(false);
const clearLoading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

async function fetchHistory() {
  loading.value = true;
  try {
    const { data } = await getBacktestHistory({ ...filters, page: page.value, size: size.value });
    history.value = data.items;
    total.value = data.total;
  } catch (e: any) {
    ElMessage.error(e.message || '获取失败');
  } finally {
    loading.value = false;
  }
}

function onPageChange(p: number) {
  page.value = p;
  fetchHistory();
}

function goDetail(id: number) {
  router.push({ path: '/backtest', query: { id } });
}

async function onClear() {
  try {
    await ElMessageBox.confirm('确定要清除历史记录？此操作不可恢复!', '警告', { type: 'warning' });
    clearLoading.value = true;
    await clearBacktestHistory(filters.stock_code);
    ElMessage.success('已清除');
    page.value = 1;
    fetchHistory();
  } catch (_) {}
  finally {
    clearLoading.value = false;
  }
}

onMounted(fetchHistory);
</script>

<style scoped>
</style> 