<template>
  <div class="dashboard-container">
    <!-- Header moved to NavBar -->

    <el-row :gutter="24" class="dashboard-row">
      <!-- System Statistics -->
      <el-col :span="8">
        <div class="relative group h-full">
          <div class="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <el-card class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span class="font-bold text-xl bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">系统统计</span>
                </div>
                <el-button text @click="refreshSystemData" :loading="systemLoading" class="hover:bg-gray-700/50 transition-colors">
                  <el-icon class="text-green-400"><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            
            <div class="grid grid-cols-2 gap-6">
              <div class="stats-card stats-card-blue">
                <div class="stats-icon bg-blue-500/20">
                  <div class="w-6 h-6 bg-blue-400 rounded-lg"></div>
                </div>
                <div class="text-3xl font-bold text-blue-400 mb-1">{{ systemStats.totalStocks }}</div>
                <div class="text-sm text-gray-300 font-medium">股票总数</div>
              </div>
              <div class="stats-card stats-card-green">
                <div class="stats-icon bg-green-500/20">
                  <div class="w-6 h-6 bg-green-400 rounded-lg"></div>
                </div>
                <div class="text-3xl font-bold text-green-400 mb-1">{{ systemStats.totalBacktests }}</div>
                <div class="text-sm text-gray-300 font-medium">回测次数</div>
              </div>
              <div class="stats-card stats-card-purple">
                <div class="stats-icon bg-purple-500/20">
                  <div class="w-6 h-6 bg-purple-400 rounded-lg"></div>
                </div>
                <div class="text-3xl font-bold text-purple-400 mb-1">{{ systemStats.totalStrategies }}</div>
                <div class="text-sm text-gray-300 font-medium">策略数量</div>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>

      <!-- Stock Recommendations -->
      <el-col :span="16">
        <div class="relative group h-full">
          <div class="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <el-card class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span class="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">股票推荐</span>
                </div>
                <el-button text @click="fetchRecommendations" :loading="recoLoading" class="hover:bg-gray-700/50 transition-colors">
                  <el-icon class="text-purple-400"><Refresh /></el-icon>
                </el-button>
              </div>
            </template>

            <div class="recommendation-content">
              <div v-if="stockRecommendations.length === 0" class="flex flex-col items-center justify-center h-48 text-gray-400">
                <span class="text-sm">暂无股票推荐</span>
              </div>
              <div v-else class="flex-1 min-h-0">
                <div class="h-full overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  <div v-for="reco in paginatedStockRecommendations" :key="'stk-' + reco.code" class="recommendation-card group">
                    <div class="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl border border-gray-600/30 hover:border-purple-500/30 transition-all duration-300">
                      <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                          <div class="w-4 h-4 bg-purple-400 rounded"></div>
                        </div>
                        <div>
                          <div class="font-semibold text-white group-hover:text-purple-300 transition-colors">{{ reco.name }}</div>
                          <div class="text-sm text-gray-400">{{ reco.code }}</div>
                        </div>
                      </div>
                      <div class="flex items-center space-x-3">
                        <div class="flex space-x-2">
                          <el-tag type="success" effect="dark" size="small" class="px-3 py-1 rounded-full font-medium">
                            买:{{ reco.signals.buy }}
                          </el-tag>
                          <el-tag type="danger" effect="dark" size="small" class="px-3 py-1 rounded-full font-medium">
                            卖:{{ reco.signals.sell }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <el-pagination v-if="stockRecommendations.length > pageSize" class="pt-2 flex justify-center" background layout="prev, pager, next" :page-size="pageSize" :current-page="stockPage" :total="stockRecommendations.length" @current-change="handleStockPageChange" />
              </div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- Recent Activities -->
    <div class="mt-6">
      <div class="relative group">
        <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-2xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
        <el-card class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                <span class="font-bold text-xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">最近活动</span>
              </div>
            </div>
          </template>
          
          <div v-if="recentActivities.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
            <div class="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <div class="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
            </div>
            <p class="text-lg font-medium">暂无最近活动</p>
          </div>
          
          <el-timeline v-else class="custom-timeline">
            <el-timeline-item 
              v-for="(activity, index) in recentActivities" 
              :key="activity.id"
              :timestamp="activity.timestamp"
              :type="activity.type"
              class="timeline-item"
              :style="{ animationDelay: `${index * 150}ms` }"
            >
              <div class="bg-gray-700/30 hover:bg-gray-700/50 rounded-xl p-4 border border-gray-600/30 hover:border-indigo-500/30 transition-all duration-300">
                <div class="text-white font-medium mb-1">{{ activity.title }}</div>
                <div class="text-sm text-gray-300">{{ activity.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/virtual-list/style/css'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { getChangeColor, formatChange } from '@/utils/format'
import { 
  getSystemStats,
  getRecommendations,
} from '@/utils/api'

interface SystemStats {
  totalStocks: number;
  totalBacktests: number;
  totalStrategies: number;
}

interface SignalSummary {
  buy: number;
  sell: number;
  hold: number;
}

interface Recommendation {
  code: string;
  name: string;
  signals: SignalSummary;
  reason?: string; // 推荐原因
}

interface Activity {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const router = useRouter();

// 状态管理
const systemStats = ref<SystemStats>({
  totalStocks: 0,
  totalBacktests: 0,
  totalStrategies: 0,
});
const recommendations = ref<Recommendation[]>([]);
const recentActivities = ref<Activity[]>([]);

// 加载状态
const systemLoading = ref(false);
const recoLoading = ref(false);

// --- 分类与分页 ---
const pageSize = 10; // 单页数量

const isIndexRecommendation = (reco: Recommendation) => {
  const name = reco.name || '';
  const code = (reco.code || '').toLowerCase();

  // 1) 名称中包含"指数"或"等权"关键词
  if (name.includes('指数') || name.includes('等权')) return true;

  // 2) 典型指数代码前缀：上证 000xxx、深证 399xxx、以及中证 930xxx 等
  //   - 为避免误将深市 000xxx 的股票当成指数，仅匹配 sh.000xxx 与 sz.399xxx
  if (/^sh\.000\d{3}$/i.test(code) || /^sz\.399\d{3}$/i.test(code) || /^sh\.930\d{3}$/i.test(code)) {
    return true;
  }

  return false;
};

// 分类结果
const indexRecommendations = computed(() => recommendations.value.filter(isIndexRecommendation));
const stockRecommendations = computed(() => recommendations.value.filter(r => !isIndexRecommendation(r)));

// 分页状态
const indexPage = ref(1);
const stockPage = ref(1);

const paginatedIndexRecommendations = computed(() => {
  const start = (indexPage.value - 1) * pageSize;
  return indexRecommendations.value.slice(start, start + pageSize);
});

const paginatedStockRecommendations = computed(() => {
  const start = (stockPage.value - 1) * pageSize;
  return stockRecommendations.value.slice(start, start + pageSize);
});

const handleIndexPageChange = (page: number) => { indexPage.value = page; };
const handleStockPageChange = (page: number) => { stockPage.value = page; };

// 刷新系统数据
const refreshSystemData = async () => {
  systemLoading.value = true;
  try {
    const response = await getSystemStats() as unknown as { success: boolean, data: any };
    if (response.success) {
      systemStats.value.totalStocks = response.data.total_stocks || 0;
      systemStats.value.totalBacktests = response.data.total_backtests || 0;
      systemStats.value.totalStrategies = response.data.total_strategies || 0;
    }

  } catch (error) {
    console.error('刷新系统数据失败:', error);
    ElMessage.error('刷新系统数据失败');
  } finally {
    systemLoading.value = false;
  }
};

// 获取策略推荐
const fetchRecommendations = async () => {
  recoLoading.value = true;
  try {
    const response = await getRecommendations() as unknown as { success: boolean; data: Recommendation[] };
    if (response.success) {
      recommendations.value = response.data;
      // 重置分页
      indexPage.value = 1;
      stockPage.value = 1;
    }
  } catch (error) {
    console.error('获取策略推荐失败:', error);
    ElMessage.error('获取推荐列表失败');
  } finally {
    recoLoading.value = false;
  }
};

// 初始化最近活动（示例数据）
const initRecentActivities = () => {
  recentActivities.value = [
    {
      id: 1,
      title: '系统启动',
      description: '股票推荐与回测系统已成功启动',
      timestamp: new Date().toLocaleString('zh-CN'),
      type: 'success'
    },
    {
      id: 2,
      title: '数据更新',
      description: '股票基础数据已更新',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toLocaleString('zh-CN'),
      type: 'info'
    },
    {
      id: 3,
      title: '策略回测',
      description: '双均线策略回测完成',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toLocaleString('zh-CN'),
      type: 'primary'
    }
  ];
};

// 生命周期
onMounted(() => {
  refreshSystemData();
  fetchRecommendations();
  initRecentActivities();
});

onUnmounted(() => {
  // if (socket) {
  //   socket.disconnect();
  // }
});
</script>

<style scoped>
/* Dashboard Container */
.dashboard-container {
  @apply h-full flex flex-col overflow-hidden;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  overflow: auto;
}

/* Dashboard Row */
.dashboard-row {
  @apply mb-6 flex-shrink-0;
  min-height: 400px;
}

/* Recommendation Content */
.recommendation-content {
  @apply h-full flex flex-col;
  min-height: 320px;
  max-height: 400px;
}

/* Custom Scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.6) rgba(31, 41, 55, 0.3);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 0.8));
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(139, 92, 246, 1), rgba(99, 102, 241, 1));
}

/* Market Index Cards */
.market-index-card {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

.market-index-card:nth-child(1) { animation-delay: 0.1s; }
.market-index-card:nth-child(2) { animation-delay: 0.2s; }
.market-index-card:nth-child(3) { animation-delay: 0.3s; }

/* Stats Cards */
.stats-card {
  @apply relative p-6 rounded-xl border transition-all duration-300 cursor-pointer;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%);
  border-color: rgba(75, 85, 99, 0.3);
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.stats-card:nth-child(1) { animation-delay: 0.1s; }
.stats-card:nth-child(2) { animation-delay: 0.2s; }
.stats-card:nth-child(3) { animation-delay: 0.3s; }
.stats-card:nth-child(4) { animation-delay: 0.4s; }

.stats-card-blue:hover { border-color: rgba(59, 130, 246, 0.5); }
.stats-card-green:hover { border-color: rgba(34, 197, 94, 0.5); }
.stats-card-purple:hover { border-color: rgba(168, 85, 247, 0.5); }

.stats-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center mb-4;
  transition: all 0.3s ease;
}

.stats-card:hover .stats-icon {
  transform: scale(1.1) rotate(5deg);
}

/* Recommendation Cards */
.recommendation-card {
  animation: slideInRight 0.6s ease-out forwards;
  opacity: 0;
  transform: translateX(30px);
  /* Performance optimization for rendering large lists */
  will-change: transform, opacity;
  contain: layout style;
}

/* Timeline Styling */
.custom-timeline .timeline-item {
  animation: fadeInLeft 0.6s ease-out forwards;
  opacity: 0;
  transform: translateX(-20px);
}

/* Animations */
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Improved card heights for better layout */
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
  height: calc(100% - 100px) !important;
  padding: 1.5rem !important;
}

/* Enhanced scrollbar styling */
:deep(.el-scrollbar__thumb) {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8)) !important;
  border-radius: 6px !important;
}

:deep(.el-scrollbar__bar) {
  background: rgba(31, 41, 55, 0.3) !important;
}

/* Button hover effects */
:deep(.el-button) {
  transition: all 0.3s ease !important;
}

:deep(.el-button:hover) {
  transform: translateY(-1px) !important;
}

/* Tag styling */
:deep(.el-tag) {
  backdrop-filter: blur(4px) !important;
  transition: all 0.3s ease !important;
}

:deep(.el-tag:hover) {
  transform: scale(1.05) !important;
}
</style> 