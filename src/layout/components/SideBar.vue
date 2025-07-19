<template>
  <div
    class="sidebar-container"
    :class="{ 'is-collapsed': isCollapse }"
  >
    <!-- Logo Section -->
    <div class="logo-section">
      <div class="logo-container">
        <img
          src="/favicon.svg"
          alt="Logo"
          class="w-8 h-8 mr-2"
        />
        <h1
          v-if="!isCollapse"
          class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
        >
          Stock Scan
        </h1>
      </div>
    </div>

    <!-- Menu -->
    <el-menu
      :default-active="currentRoute.path"
      :collapse="isCollapse"
      :router="true"
      class="el-menu-vertical-demo"
    >
      <el-menu-item
        v-for="route in menuRoutes"
        :key="route.path"
        :index="route.path"
      >
        <el-icon>
          <component :is="route.meta.icon" />
        </el-icon>
        <template #title>{{ route.meta.title }}</template>
      </el-menu-item>
    </el-menu>

    <!-- Collapse Button -->
    <div class="collapse-button-container">
      <el-button
        @click="toggleCollapse"
        link
      >
        <el-icon :size="20">
          <component :is="isCollapse ? ArrowRightBold : ArrowLeftBold" />
        </el-icon>
      </el-button>
    </div>

    <!-- Footer Section -->
    <div class="sidebar-footer">
      <div class="status-indicator connection-tooltip-container">
        <div
          class="w-2 h-2 rounded-full animate-pulse"
          :class="allConnected ? 'bg-green-400' : 'bg-red-400'"
        ></div>
        <span
          v-if="!isCollapse"
          class="text-xs text-gray-400"
        >
          {{ allConnected ? '系统正常' : '连接异常' }}
          <span class="text-gray-500">({{ connectionStats.connected }}/{{ connectionStats.total }})</span>
        </span>

        <!-- Hover Tooltip -->
        <div
          class="sidebar-connection-tooltip"
          @click="goToWebSocketTest"
        >
          <div class="tooltip-header">
            <span class="tooltip-title">WebSocket 连接详情</span>
            <span class="tooltip-summary">{{ connectionStats.connected }}/{{ connectionStats.total }} 已连接</span>
          </div>
          <div class="tooltip-content">
            <div
              v-for="(isConnected, name) in connectionStatus"
              :key="name"
              class="connection-item"
              :class="{ 'connected': isConnected, 'disconnected': !isConnected }"
            >
              <div
                class="connection-dot"
                :class="{ 'connected': isConnected, 'disconnected': !isConnected }"
              ></div>
              <span class="connection-name">{{ getConnectionDisplayName(name) }}</span>
              <span class="connection-status">{{ isConnected ? '已连接' : '未连接' }}</span>
            </div>
          </div>
          <div class="tooltip-footer">
            <span class="tooltip-tip">点击查看详细测试页面</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { connectionStatus } from '@/utils/connectionStatus';
import {
  ElMenu,
  ElMenuItem,
  ElIcon,
  ElButton,
} from 'element-plus';
import {
  Odometer,
  TrendCharts,
  Histogram,
  DataAnalysis,
  Refresh,
  ArrowLeftBold,
  ArrowRightBold,
  Connection,
  Document,
} from '@element-plus/icons-vue';

const currentRoute = useRoute();
const router = useRouter();
const isCollapse = ref(false);

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 模拟的路由列表，实际项目中应从 Vue Router 实例中获取并筛选
// 假设路由配置中包含 meta: { title: '菜单标题', icon: 'ElementPlusIconName', showInSidebar: true }
const allAppRoutes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: { title: '仪表盘', icon: Odometer, showInSidebar: true },
  },
  {
    path: '/backtest',
    name: 'Backtest',
    meta: { title: '策略回测', icon: TrendCharts, showInSidebar: true },
  },
  {
    path: '/backtest-history',
    name: 'BacktestHistory',
    meta: { title: '回测历史', icon: Histogram, showInSidebar: true },
  },
  {
    path: '/top-backtest',
    name: 'TopBacktest',
    meta: { title: 'Top回测', icon: DataAnalysis, showInSidebar: true },
  },
  {
    path: '/scheduler',
    name: 'Scheduler',
    meta: { title: '任务调度', icon: Refresh, showInSidebar: true },
  },
  {
    path: '/websocket-test',
    name: 'WebSocketTest',
    meta: { title: 'WebSocket测试', icon: Connection, showInSidebar: true },
  },
  {
    path: '/news-analysis',
    name: 'NewsAnalysis',
    meta: { title: '新闻分析', icon: Document, showInSidebar: true },
  },
  // 您可以在这里添加更多路由，只要有 showInSidebar: true 就会自动显示
];

const menuRoutes = computed(() => {
  return allAppRoutes.filter(route => route.meta && route.meta.showInSidebar);
});

// 全局连接状态
const allConnected = computed(() => {
  const values = Object.values(connectionStatus);
  return values.length > 0 && values.every(v => v);
});

// 计算连接统计
const connectionStats = computed(() => {
  const values = Object.values(connectionStatus);
  const totalConnections = values.length;
  const connectedCount = values.filter(v => v).length;
  return {
    total: totalConnections,
    connected: connectedCount
  };
});

// 获取连接显示名称
const getConnectionDisplayName = (name: string): string => {
  const nameMap: Record<string, string> = {
    'scheduler': '调度器',
    'task_monitor': '任务监控',
    'top_backtest': 'Top回测',
    'ai_analysis': 'AI分析'
  };
  return nameMap[name] || name;
};

// 跳转到WebSocket测试页面
const goToWebSocketTest = () => {
  router.push('/websocket-test');
};

// 定时更新连接状态
let statusInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // 每500ms更新一次连接状态
  statusInterval = setInterval(() => {
    // 触发响应式更新
    const _ = connectionStatus;
  }, 500);
});

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
});
</script>

<style>
/* Global Element Plus overrides (not scoped) */
.el-menu {
  border-right: none !important;
  background-color: transparent !important;
}

.el-menu-item {
  /* Tailwind applies some base styles */
  @apply transition-all duration-300;
}

.el-menu-item.is-active {
  background-color: rgba(60, 100, 200, 0.2) !important; /* A light blue/purple for active */
}

.el-menu-item:hover {
  background-color: rgba(60, 100, 200, 0.1) !important;
}

.el-menu-item .el-icon {
  color: #9ca3af; /* Default icon color */
}

.el-menu-item.is-active .el-icon {
  color: #e9d5ff; /* Active icon color */
}

.el-menu-item:hover .el-icon {
  color: #e2e8f0; /* Hover icon color */
}

.el-menu-item .el-menu-item__title {
  color: #9ca3af; /* Default text color */
}

.el-menu-item.is-active .el-menu-item__title {
  color: #e9d5ff; /* Active text color */
}

.el-menu-item:hover .el-menu-item__title {
  color: #e2e8f0; /* Hover text color */
}
</style>

<style scoped>
.sidebar-container {
  @apply h-full flex flex-col;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(75, 85, 99, 0.3);
  transition: width 0.3s ease; /* For collapse transition */
  width: 256px; /* Default width (w-64) */
}

.sidebar-container.is-collapsed {
  width: 64px; /* Collapsed width (w-16) */
}

.logo-section {
  @apply p-4 border-b border-gray-700/30;
}

.logo-container {
  @apply flex items-center justify-center space-x-2;
}

/* Ensure logo text hides/shows with collapse */
.logo-section h1 {
  transition: opacity 0.3s ease, width 0.3s ease;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-container.is-collapsed .logo-section h1 {
  opacity: 0;
  width: 0;
  padding: 0;
  margin: 0;
}

.el-menu-vertical-demo {
  flex-grow: 1;
  padding: 1rem 0;
}

.collapse-button-container {
  @apply flex justify-end p-2 border-t border-gray-700/30;
}

.sidebar-footer {
  @apply p-4 border-t border-gray-700/30;
}

.status-indicator {
  @apply flex items-center space-x-2;
}

/* Hide status text when collapsed */
.sidebar-container.is-collapsed .status-indicator span {
  display: none;
}
/* Sidebar Connection Tooltip */
.connection-tooltip-container {
  @apply relative;
}

.sidebar-connection-tooltip {
  @apply absolute bottom-full left-0 mb-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible transition-all duration-200 z-50 cursor-pointer;
  transform: translateY(10px);
}

.connection-tooltip-container:hover .sidebar-connection-tooltip {
  @apply opacity-100 visible;
  transform: translateY(0);
}

.tooltip-header {
  @apply p-3 border-b border-gray-600;
}

.tooltip-title {
  @apply text-sm font-semibold text-white block;
}

.tooltip-summary {
  @apply text-xs text-gray-400 block mt-1;
}

.tooltip-content {
  @apply p-3 space-y-2 max-h-48 overflow-y-auto;
}

.connection-item {
  @apply flex items-center justify-between py-1;
}

.connection-dot {
  @apply w-2 h-2 rounded-full mr-2;
}

.connection-dot.connected {
  @apply bg-green-400;
}

.connection-dot.disconnected {
  @apply bg-red-400;
}

.connection-name {
  @apply text-sm text-gray-200 flex-1;
}

.connection-status {
  @apply text-xs px-2 py-1 rounded;
}

.connection-item.connected .connection-status {
  @apply bg-green-500/20 text-green-400;
}

.connection-item.disconnected .connection-status {
  @apply bg-red-500/20 text-red-400;
}

.tooltip-footer {
  @apply p-3 border-t border-gray-600 bg-gray-700/50;
}

.tooltip-tip {
  @apply text-xs text-gray-400;
}
</style> 