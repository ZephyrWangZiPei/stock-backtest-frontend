<template>
  <div class="dashboard-container">
    <!-- 紧凑布局：上下两行 -->
    <div class="dashboard-content">
      <!-- 第一行：系统统计和股票推荐 -->
      <div class="dashboard-row">
        <!-- System Statistics -->
        <div class="stats-card">
          <el-card
            shadow="hover"
            class="compact-card"
          >
            <template #header>
              <div class="card-header">
                <span class="card-title">系统统计</span>
                <el-button
                  type="primary"
                  :icon="Refresh"
                  @click="refreshSystemData"
                  :loading="systemLoading"
                  circle
                  size="small"
                />
              </div>
            </template>

            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ systemStats.totalStocks }}</div>
                <div class="stat-label">股票总数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ systemStats.totalBacktests }}</div>
                <div class="stat-label">回测次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ systemStats.totalStrategies }}</div>
                <div class="stat-label">策略数量</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Stock Recommendations -->
        <div class="recommendation-card">
          <el-card
            shadow="hover"
            class="compact-card"
          >
            <template #header>
              <div class="card-header">
                <span class="card-title">股票推荐</span>
                <el-button
                  type="primary"
                  :icon="Refresh"
                  @click="fetchRecommendations"
                  :loading="recoLoading"
                  circle
                  size="small"
                />
              </div>
            </template>

            <div class="recommendation-content">
              <el-empty
                v-if="stockRecommendations.length === 0"
                description="暂无股票推荐"
              />
              <div
                v-else
                class="recommendation-scroll-container"
              >
                <div class="recommendation-list">
                  <div
                    v-for="reco in stockRecommendations"
                    :key="'stk-' + reco.code"
                    class="recommendation-item"
                  >
                    <div class="stock-info">
                      <div class="stock-name">{{ reco.name }}</div>
                      <div class="stock-code">{{ reco.code }}</div>
                    </div>
                    <div class="stock-signals">
                      <el-tag
                        type="success"
                        size="small"
                      >
                        买:{{ reco.signals.buy }}
                      </el-tag>
                      <el-tag
                        type="danger"
                        size="small"
                      >
                        卖:{{ reco.signals.sell }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 第二行：最近活动 -->
      <div class="activities-section">
        <el-card
          shadow="hover"
          class="compact-card"
        >
          <template #header>
            <span class="card-title">最近活动</span>
          </template>

          <el-empty
            v-if="recentActivities.length === 0"
            description="暂无最近活动"
          />

          <el-timeline
            v-else
            class="compact-timeline"
          >
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.timestamp"
              :type="activity.type"
              size="large"
            >
              <el-card
                class="activity-card"
                shadow="never"
              >
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-description">{{ activity.description }}</div>
              </el-card>
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
import { usePageWebSocket } from '@/utils/pageWebSocketManager'

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

// WebSocket连接管理
const { pageManager, checkAndReconnect } = usePageWebSocket()

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

// --- 分类 ---
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
  // 清理定时器和其他资源
  // 注意：WebSocket连接由全局管理器处理，这里不需要手动清理
});
</script>

<style scoped>
/* Dashboard Container - 紧凑布局 */
.dashboard-container {
  height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 16px;
    overflow: hidden;
  }
  
  .dashboard-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }
  
  /* Dashboard Row - 第一行布局 */
  .dashboard-row {
    display: flex;
      gap: 16px;
      height: 45%;
      min-height: 300px;
    }
    
    /* 卡片容器 */
    .stats-card {
      flex: 1;
      min-width: 300px;
    }
    
    .recommendation-card {
      flex: 2;
      min-width: 400px;
    }
    
    /* 紧凑卡片样式 */
    .compact-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .compact-card :deep(.el-card__body) {
      flex: 1;
      padding: 16px;
      overflow: hidden;
    }
    
    /* Card Headers */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    /* Statistics Grid - 更紧凑 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      height: 100%;
    }
    
    .stat-item {
      text-align: center;
      padding: 12px 8px;
      border-radius: 6px;
      background: var(--el-fill-color-light);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .stat-item:hover {
      background: var(--el-fill-color);
      transform: translateY(-2px);
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--el-color-primary);
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      opacity: 0.8;
    }
    
    /* Recommendation Content - 滚动容器 */
    .recommendation-content {
      height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .recommendation-scroll-container {
        flex: 1;
        overflow: hidden;
        position: relative;
      }
      
      .recommendation-list {
        height: 100%;
        overflow-y: auto;
        padding-right: 4px;
      
        /* 自定义滚动条 */
        &::-webkit-scrollbar {
          width: 6px;
        }
      
        &::-webkit-scrollbar-track {
          background: var(--el-fill-color-light);
          border-radius: 3px;
        }
      
        &::-webkit-scrollbar-thumb {
          background: var(--el-border-color);
          border-radius: 3px;
      
          &:hover {
            background: var(--el-border-color-hover);
          }
        }
      }
      
      .recommendation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        margin-bottom: 6px;
        border-radius: 6px;
        background: var(--el-fill-color-light);
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }
      
      .recommendation-item:hover {
        background: var(--el-fill-color);
        border-color: var(--el-border-color);
        transform: translateX(2px);
      }
      
      .stock-info {
        flex: 1;
        min-width: 0;
      }
      
      .stock-name {
        font-weight: 600;
        margin-bottom: 2px;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .stock-code {
        font-size: 11px;
        opacity: 0.7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .stock-signals {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      
      /* Activities Section - 第二行 */
      .activities-section {
        flex: 1;
        min-height: 200px;
      }
      
      .compact-timeline {
        max-height: 100%;
        overflow-y: auto;
      
        /* 自定义滚动条 */
        &::-webkit-scrollbar {
          width: 6px;
        }
      
        &::-webkit-scrollbar-track {
          background: var(--el-fill-color-light);
          border-radius: 3px;
        }
      
        &::-webkit-scrollbar-thumb {
          background: var(--el-border-color);
          border-radius: 3px;
      
          &:hover {
            background: var(--el-border-color-hover);
          }
        }
}

.activity-card {
  margin-bottom: 6px;
  padding: 8px 12px;
}

.activity-title {
  font-weight: 600;
  margin-bottom: 2px;
  font-size: 14px;
}

.activity-description {
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.4;
}

/* Stats Cards */
.stats-card {
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
  @apply w-12 h-12 rounded-md flex items-center justify-center mb-4;
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

/* 移除所有 Element Plus 组件样式覆盖，使用原生样式 */
</style> 