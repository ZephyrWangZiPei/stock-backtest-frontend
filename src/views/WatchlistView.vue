<template>
  <div class="watchlist-container">
    <!-- Header moved to NavBar -->

    <div class="watchlist-content">
      <!-- 市场概况 -->
      <div class="mb-6">
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <el-card class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span class="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">市场概况</span>
                </div>
                <button @click="refreshMarketSummary" :disabled="marketLoading" class="refresh-btn">
                  <Refresh class="w-4 h-4" :class="marketLoading ? 'animate-spin' : ''" />
                </button>
              </div>
            </template>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div v-for="index in marketSummary" :key="index.code" 
                   class="market-index-card group relative overflow-hidden">
                <!-- Animated background -->
                <div class="absolute inset-0 bg-gradient-to-br from-gray-700/30 to-gray-800/50 rounded-xl"></div>
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="relative p-6 rounded-xl border border-gray-600/30 group-hover:border-blue-500/30 transition-all duration-300">
                  <div class="text-sm text-gray-400 mb-2 font-medium">{{ index.name }}</div>
                  <div class="text-3xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
                    {{ index.current_price?.toFixed(2) || '--' }}
                  </div>
                  <div class="flex items-center space-x-2">
                    <span :class="getChangeColor(index.change_rate)" class="font-semibold text-lg">
                      {{ formatChange(index.change_amount, index.change_rate) }}
                    </span>
                    <div :class="getChangeColor(index.change_rate)" class="w-2 h-2 rounded-full animate-pulse"></div>
                  </div>
                  
                  <!-- Decorative element -->
                  <div class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 group-hover:scale-110 transition-transform duration-300"></div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- Control Header (operations) -->
      <div class="watchlist-controls mb-6">
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>
          <div class="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl px-6 py-4 flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <el-switch 
                v-model="autoRefresh" 
                @change="toggleAutoRefresh"
                active-text="自动刷新"
                inactive-text="手动刷新"
                class="custom-switch"
              />
            </div>
            <button @click="showAddDialog = true" class="action-btn action-btn-primary">
              <div class="flex items-center space-x-2">
                <Plus class="w-5 h-5" />
                <span>添加股票</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 自选股列表 -->
      <div class="flex-1">
        <div class="relative group h-full">
          <div class="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <el-card class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span class="font-bold text-xl bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                    自选股票 ({{ watchlist.length }})
                  </span>
                </div>
                <button @click="refreshWatchlist" :disabled="watchlistLoading" class="refresh-btn">
                  <Refresh class="w-4 h-4" :class="watchlistLoading ? 'animate-spin' : ''" />
                </button>
              </div>
            </template>

            <div class="table-container h-full">
              <div v-if="watchlist.length === 0" class="empty-state">
                <div class="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                  <div class="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
                </div>
                <p class="text-lg font-medium text-gray-300 mb-4">还没有添加自选股</p>
                <button @click="showAddDialog = true" class="action-btn action-btn-primary">
                  添加第一只股票
                </button>
              </div>

              <el-table v-else :data="watchlist" class="custom-table h-full" height="100%">
                <el-table-column label="股票名称" min-width="150" fixed="left">
                  <template #default="scope">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                        <div class="w-3 h-3 bg-green-400 rounded"></div>
                      </div>
                      <div>
                        <div class="font-medium text-white">{{ scope.row.name }}</div>
                        <div class="text-sm text-gray-400">{{ scope.row.code }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="当前价" prop="current_price" width="120" align="right">
                  <template #default="scope">
                    <div class="font-bold text-lg" :class="getChangeColor(scope.row.change_rate)">
                      {{ scope.row.current_price?.toFixed(2) || '--' }}
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="涨跌幅" width="160" align="right">
                  <template #default="scope">
                    <div :class="getChangeColor(scope.row.change_rate)" class="font-medium">
                      {{ formatChange(scope.row.change_amount, scope.row.change_rate) }}
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="成交量" width="140" align="right">
                  <template #default="scope">
                    <div class="text-sm text-gray-300">
                      {{ formatVolume(scope.row.volume) }}
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="成交额" width="140" align="right">
                  <template #default="scope">
                    <div class="text-sm text-gray-300">
                      {{ formatAmount(scope.row.amount) }}
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="数据日期" width="180" align="center">
                  <template #default="scope">
                    <div class="text-sm text-gray-400 bg-gray-700/30 px-3 py-1 rounded-lg">
                      {{ formatTime(scope.row.quote_time) }}
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="策略信号" width="220" align="center">
                  <template #default="scope">
                    <div v-if="scope.row.signals" class="flex space-x-1 justify-center">
                      <el-tag v-if="scope.row.signals.buy > 0" type="success" effect="dark" size="small" class="custom-tag">
                        买入: {{ scope.row.signals.buy }}
                      </el-tag>
                      <el-tag v-if="scope.row.signals.sell > 0" type="danger" effect="dark" size="small" class="custom-tag">
                        卖出: {{ scope.row.signals.sell }}
                      </el-tag>
                      <el-tag v-if="scope.row.signals.hold > 0" type="info" effect="dark" size="small" class="custom-tag">
                        持有: {{ scope.row.signals.hold }}
                      </el-tag>
                    </div>
                    <span v-else class="text-gray-400">--</span>
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="90" align="center" fixed="right">
                  <template #default="scope">
                    <button 
                      @click="removeFromWatchlist(scope.row.code)"
                      class="table-action-btn table-action-delete"
                    >
                      删除
                    </button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- Enhanced Add Stock Dialog -->
    <el-dialog v-model="showAddDialog" title="添加自选股" width="500px" class="custom-dialog">
      <el-form class="custom-form">
        <el-form-item label="搜索股票">
          <el-select
            v-model="selectedStock"
            filterable
            remote
            reserve-keyword
            placeholder="输入股票代码或名称搜索"
            :remote-method="searchStocks"
            :loading="stockSearchLoading"
            class="w-full custom-select"
          >
            <el-option
              v-for="item in stockOptions"
              :key="item.code"
              :label="`${item.name} (${item.code})`"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="showAddDialog = false" class="dialog-button dialog-button-cancel">
            取消
          </button>
          <button @click="addToWatchlist" :disabled="!selectedStock" class="dialog-button dialog-button-save">
            添加
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Delete } from '@element-plus/icons-vue'
import { io, Socket } from 'socket.io-client'
import { 
  getRealtimeData, 
  getBatchRealtimeData, 
  getMarketSummary,
  getStocks,
  getBatchSignals
} from '@/utils/api'

interface Stock {
  code: string;
  name: string;
}

interface RealtimeData {
  stock_code: string;
  current_price: number;
  open_price: number;
  high_price: number;
  low_price: number;
  pre_close: number;
  change_amount: number;
  change_rate: number;
  volume: number;
  amount: number;
  quote_time: string;
}

interface SignalSummary {
  buy: number;
  sell: number;
  hold: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

interface WatchlistItem extends Stock {
  current_price?: number;
  change_amount?: number;
  change_rate?: number;
  volume?: number;
  amount?: number;
  quote_time?: string;
  signals?: SignalSummary;
}

interface MarketIndex {
  name: string;
  code: string;
  current_price?: number;
  change_amount?: number;
  change_rate?: number;
}

// 状态管理
const watchlist = ref<WatchlistItem[]>([]);
const marketSummary = ref<MarketIndex[]>([]);
const showAddDialog = ref(false);
const selectedStock = ref<Stock | null>(null);
const stockOptions = ref<Stock[]>([]);
const autoRefresh = ref(true);

// 加载状态
const watchlistLoading = ref(false);
const marketLoading = ref(false);
const stockSearchLoading = ref(false);

// WebSocket连接
let socket: Socket | null = null;
let refreshInterval: number | null = null;

// 从localStorage加载自选股列表
const loadWatchlist = () => {
  try {
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      const savedList = JSON.parse(saved) as Stock[];
      watchlist.value = savedList.map(stock => ({
        ...stock,
        current_price: 0,
        change_amount: 0,
        change_rate: 0
      }));
    }
  } catch (error) {
    console.error('加载自选股失败:', error);
  }
};

// 保存自选股列表到localStorage
const saveWatchlist = () => {
  try {
    const stockList = watchlist.value.map(item => ({
      code: item.code,
      name: item.name
    }));
    localStorage.setItem('watchlist', JSON.stringify(stockList));
  } catch (error) {
    console.error('保存自选股失败:', error);
  }
};

// 搜索股票
const searchStocks = async (query: string) => {
  if (!query) {
    stockOptions.value = [];
    return;
  }

  stockSearchLoading.value = true;
  try {
    const response = await getStocks({ query, per_page: 20 });
    stockOptions.value = response.data.items;
  } catch (error) {
    console.error('搜索股票失败:', error);
    stockOptions.value = [];
  } finally {
    stockSearchLoading.value = false;
  }
};

// 添加到自选股
const addToWatchlist = () => {
  if (!selectedStock.value) return;

  // 检查是否已存在
  const exists = watchlist.value.some(item => item.code === selectedStock.value!.code);
  if (exists) {
    ElMessage.warning('该股票已在自选股中');
    return;
  }

  watchlist.value.push({
    ...selectedStock.value,
    current_price: 0,
    change_amount: 0,
    change_rate: 0
  });

  saveWatchlist();
  showAddDialog.value = false;
  selectedStock.value = null;
  ElMessage.success('添加成功');

  // 立即获取新添加股票的数据
  refreshWatchlist();
  
  // 如果开启了WebSocket，重新订阅
  if (socket?.connected) {
    subscribeToWatchlist();
  }
};

// 从自选股删除
const removeFromWatchlist = (code: string) => {
  const index = watchlist.value.findIndex(item => item.code === code);
  if (index > -1) {
    watchlist.value.splice(index, 1);
    saveWatchlist();
    ElMessage.success('删除成功');
    
    // 如果开启了WebSocket，重新订阅
    if (socket?.connected) {
      subscribeToWatchlist();
    }
  }
};

// 获取策略信号
const fetchStrategySignals = async (codes: string[]) => {
  if (codes.length === 0) return;
  try {
    const response = await getBatchSignals(codes) as unknown as ApiResponse<Record<string, SignalSummary>>;
    if (response.success && response.data) {
      watchlist.value.forEach(item => {
        if (response.data[item.code]) {
          item.signals = response.data[item.code];
        }
      });
    }
  } catch (error) {
    console.error('获取策略信号失败:', error);
  }
};

// 刷新自选股数据
const refreshWatchlist = async () => {
  if (watchlist.value.length === 0) return;

  watchlistLoading.value = true;
  try {
    const codes = watchlist.value.map(item => item.code);
    console.log('准备获取自选股数据，股票代码:', codes);
    
    const response = await getBatchRealtimeData(codes) as unknown as ApiResponse<Record<string, RealtimeData>>;
    console.log('API响应:', response);
    
    if (response.success && response.data) {
      console.log('响应数据结构:', Object.keys(response.data));
      
      // 更新实时数据
      watchlist.value.forEach(item => {
        const realtimeData = response.data[item.code];
        console.log(`股票 ${item.code} 的实时数据:`, realtimeData);
        if (realtimeData) {
          console.log(`更新股票 ${item.code} 的数据`);
          Object.assign(item, realtimeData);
        } else {
          console.log(`股票 ${item.code} 没有找到实时数据`);
        }
      });
      
      // 获取策略信号
      fetchStrategySignals(codes);

      console.log('更新后的自选股列表:', watchlist.value);
    } else {
      console.log('获取自选股数据失败:', response.message || '未知错误');
    }
  } catch (error) {
    console.error('刷新自选股数据失败:', error);
    ElMessage.error('刷新数据失败');
  } finally {
    watchlistLoading.value = false;
  }
};

// 刷新市场概况
const refreshMarketSummary = async () => {
  marketLoading.value = true;
  try {
    console.log('开始获取市场概况数据');
    const response = await getMarketSummary() as unknown as ApiResponse<{ indices: MarketIndex[], update_time: string }>;
    console.log('市场概况API响应:', response);
    
    if (response.success && response.data) {
      console.log('市场概况数据:', response.data.indices);
      marketSummary.value = response.data.indices;
      console.log('更新后的市场概况:', marketSummary.value);
    } else {
      console.log('获取市场概况失败:', response.message || '未知错误');
    }
  } catch (error) {
    console.error('刷新市场概况失败:', error);
    ElMessage.error('刷新市场概况失败');
  } finally {
    marketLoading.value = false;
  }
};

// WebSocket连接和订阅
const connectWebSocket = () => {
  socket = io('http://localhost:5000', {
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket连接成功');
    subscribeToWatchlist();
  });

  socket.on('disconnect', () => {
    console.log('WebSocket连接断开');
  });

  socket.on('watchlist_data', (data) => {
    console.log('收到自选股数据:', data);
    updateWatchlistData(data.data);
  });

  socket.on('market_summary', (data) => {
    console.log('收到市场概况:', data);
    marketSummary.value = data.indices;
  });

  socket.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
};

// 订阅自选股数据
const subscribeToWatchlist = () => {
  if (socket?.connected && watchlist.value.length > 0) {
    const codes = watchlist.value.map(item => item.code);
    socket.emit('join_watchlist', { stock_codes: codes });
  }
};

// 更新自选股数据
const updateWatchlistData = (data: Record<string, RealtimeData>) => {
  watchlist.value.forEach(item => {
    const realtimeData = data[item.code];
    if (realtimeData) {
      Object.assign(item, realtimeData);
    }
  });
};

// 切换自动刷新
const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    connectWebSocket();
    // 立即请求市场概况
    if (socket?.connected) {
      socket.emit('request_market_summary');
    }
  } else {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};

// 工具函数
const getChangeColor = (changeRate?: number) => {
  if (!changeRate) return 'text-gray-400';
  return changeRate > 0 ? 'text-red-500' : changeRate < 0 ? 'text-green-500' : 'text-gray-400';
};

const formatChange = (changeAmount?: number, changeRate?: number) => {
  if (changeAmount === undefined || changeRate === undefined) return '--';
  const amountStr = changeAmount > 0 ? `+${changeAmount.toFixed(2)}` : changeAmount.toFixed(2);
  const rateStr = changeRate > 0 ? `+${changeRate.toFixed(2)}%` : `${changeRate.toFixed(2)}%`;
  return `${amountStr} (${rateStr})`;
};

const formatVolume = (volume?: number) => {
  if (!volume) return '--';
  if (volume >= 100000000) return `${(volume / 100000000).toFixed(1)}亿`;
  if (volume >= 10000) return `${(volume / 10000).toFixed(1)}万`;
  return volume.toString();
};

const formatAmount = (amount?: number) => {
  if (!amount) return '--';
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}亿`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return amount.toFixed(0);
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '--';
  try {
    const date = new Date(timeStr);
    // 格式化为 年/月/日 HH:mm:ss
    return date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    }).replace(/\//g, '-'); // 将 YYYY/MM/DD 替换为 YYYY-MM-DD
  } catch {
    return '--';
  }
};

// 生命周期
onMounted(() => {
  loadWatchlist();
  refreshMarketSummary();
  if (watchlist.value.length > 0) {
    refreshWatchlist();
  }
  // 如果默认开启自动刷新，则在挂载时直接连接
  if (autoRefresh.value) {
    connectWebSocket();
  }
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// 监听自选股变化
watch(() => watchlist.value.length, (newLength) => {
  if (newLength > 0 && socket?.connected) {
    subscribeToWatchlist();
  }
});
</script>

<style scoped>
/* Watchlist Container */
.watchlist-container {
  @apply h-full flex flex-col overflow-hidden;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.watchlist-content {
  @apply flex-1 flex flex-col min-h-0 space-y-6;
}

/* Action Buttons */
.action-btn {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300 border backdrop-blur-sm;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%);
  border-color: rgba(75, 85, 99, 0.3);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.action-btn-primary {
  @apply text-green-300 hover:text-green-200;
}

.action-btn-primary:hover {
  border-color: rgba(34, 197, 94, 0.5);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
}

/* Refresh Button */
.refresh-btn {
  @apply p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all duration-200;
}

/* Market Index Cards */
.market-index-card {
  @apply transition-all duration-300;
}

.market-index-card:hover {
  transform: translateY(-4px);
}

/* Table Container - Enhanced for better height management */
.table-container {
  @apply rounded-xl overflow-hidden flex-1 min-h-0;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, rgba(17, 24, 39, 0.3) 100%);
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-gray-400;
}

/* Enhanced Custom Table Styling */
.custom-table {
  @apply h-full;
}

/* Table Action Buttons */
.table-action-btn {
  @apply px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 border;
}

.table-action-delete {
  @apply text-red-300 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40;
}

/* Custom Switch */
.custom-switch {
  @apply backdrop-blur-sm;
}

/* Custom Tags */
.custom-tag {
  @apply backdrop-blur-sm border border-gray-600/30;
}

/* Dialog Buttons */
.dialog-button {
  @apply px-6 py-2 rounded-lg font-medium transition-all duration-200 border;
}

.dialog-button-cancel {
  @apply text-gray-300 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500;
}

.dialog-button-save {
  @apply text-white bg-gradient-to-r from-green-500 to-teal-500 border-transparent hover:from-green-600 hover:to-teal-600;
}

.dialog-button-save:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Change Colors */
.text-red-500 {
  color: #ef4444 !important;
}

.text-green-500 {
  color: #22c55e !important;
}

/* Enhanced Element Plus overrides for better table display */
:deep(.el-card) {
  background: rgba(31, 41, 55, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

:deep(.el-card__header) {
  background: rgba(17, 24, 39, 0.3) !important;
  border-bottom: 1px solid rgba(75, 85, 99, 0.2) !important;
}

:deep(.el-card__body) {
  height: calc(100% - 60px) !important;
  padding: 1.5rem !important;
  overflow: hidden !important;
}

:deep(.el-table) {
  background: transparent !important;
  color: #f3f4f6 !important;
  height: 100% !important;
}

:deep(.el-table__inner-wrapper) {
  height: 100% !important;
}

:deep(.el-table__body-wrapper) {
  max-height: calc(100% - 48px) !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 197, 94, 0.6) rgba(31, 41, 55, 0.3);
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.8));
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(34, 197, 94, 1), rgba(16, 185, 129, 1));
}

:deep(.el-table th) {
  background: rgba(17, 24, 39, 0.6) !important;
  border-color: rgba(75, 85, 99, 0.3) !important;
  color: #d1d5db !important;
}

:deep(.el-table td) {
  border-color: rgba(75, 85, 99, 0.2) !important;
  background: rgba(31, 41, 55, 0.3) !important;
}

:deep(.el-table__row:hover) {
  background: rgba(55, 65, 81, 0.5) !important;
}

:deep(.el-switch) {
  --el-switch-on-color: #22c55e;
  --el-switch-off-color: #6b7280;
}

:deep(.el-switch__core) {
  background: rgba(107, 114, 128, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3);
}

:deep(.el-switch.is-checked .el-switch__core) {
  background: rgba(34, 197, 94, 0.8) !important;
}

:deep(.el-dialog) {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
  padding: 20px 24px 16px;
}

:deep(.el-dialog__title) {
  color: #f3f4f6 !important;
  font-weight: 600;
}

:deep(.el-form-item__label) {
  color: #d1d5db !important;
}

:deep(.el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
  border-radius: 8px;
}

:deep(.el-input__inner) {
  color: #f3f4f6 !important;
  background: transparent !important;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
}

:deep(.el-tag) {
  backdrop-filter: blur(4px) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

/* Loading animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Hover effects */
.kpi-item {
  transition: all 0.3s ease;
}

.kpi-item:hover {
  transform: translateY(-2px);
}
</style> 