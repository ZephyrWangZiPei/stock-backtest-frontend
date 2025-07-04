<template>
  <div class="sidebar-container" :class="{ 'is-collapsed': isCollapse }">
    <!-- Logo Section -->
    <div class="logo-section">
      <div class="logo-container">
        <img src="/favicon.svg" alt="Logo" class="w-8 h-8 mr-2" />
        <h1 v-if="!isCollapse" class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
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
      <el-button @click="toggleCollapse" link>
        <el-icon :size="20">
          <component :is="isCollapse ? ArrowRightBold : ArrowLeftBold" />
        </el-icon>
      </el-button>
    </div>

    <!-- Footer Section -->
    <div class="sidebar-footer">
      <div class="status-indicator">
        <div 
          class="w-2 h-2 rounded-full animate-pulse"
          :class="allConnected ? 'bg-green-400' : 'bg-red-400'"
        ></div>
        <span v-if="!isCollapse" class="text-xs text-gray-400">{{ allConnected ? '系统正常' : '连接异常' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
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
} from '@element-plus/icons-vue';

const currentRoute = useRoute();
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
</style> 