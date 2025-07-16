<template>
  <div class="navbar">
    <!-- Left side: Breadcrumbs and page info -->
    <div class="navbar-left">
      <div class="page-info">
        <h2 class="page-title">{{ pageTitle }}</h2>
        <div class="breadcrumb">
          <span class="breadcrumb-item">系统</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item current">{{ breadcrumbLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Right side: Status & User Info -->
    <div class="navbar-right">
      <!-- System Status -->
      <div class="status-section">
        <!-- Connection Status -->
        <div class="status-item">
          <div class="status-indicator connection-tooltip-container">
            <div
              class="status-dot"
              :class="{
                'status-dot-success': allConnected && !isInProgress,
                'status-dot-warning': allConnected && isInProgress,
                'status-dot-error': !allConnected
              }"
            ></div>
            <div class="status-content">
              <span class="status-label">数据服务</span>
              <span class="status-value">{{ connectionStatusText }}</span>
              <span class="status-detail">{{ connectionStats.connected }}/{{ connectionStats.total }} ({{
                connectionStats.rate }}%)</span>
            </div>

            <!-- Hover Tooltip -->
            <div
              class="connection-tooltip"
              @click="goToWebSocketTest"
            >
              <div class="tooltip-header">
                <span class="tooltip-title">WebSocket 连接状态</span>
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

        <!-- Task Progress -->
        <div
          v-if="isInProgress"
          class="status-item"
        >
          <div class="progress-container">
            <div class="progress-info">
              <span class="progress-label">{{ taskMessage }}</span>
              <span class="progress-percentage">{{ taskProgress }}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: taskProgress + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="navbar-divider"></div>

      <!-- User Section -->
      <div class="user-section">
        <div class="user-info">
          <div class="user-avatar">
            <div class="avatar-content">
              <span class="avatar-text">U</span>
            </div>
            <div class="avatar-status"></div>
          </div>
          <div class="user-details">
            <span class="user-name">管理员</span>
            <span class="user-role">系统管理员</span>
          </div>
        </div>

        <!-- User Menu -->
        <div class="user-menu">
          <button class="menu-button">
            <svg
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button
          class="action-btn"
          title="通知"
        >
          <svg
            class="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
            ></path>
          </svg>
          <span class="notification-badge">3</span>
        </button>

        <button
          class="action-btn"
          title="设置"
        >
          <svg
            class="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSchedulerStore } from '@/store/scheduler';
import { connectionStatus } from '@/utils/connectionStatus';

const route = useRoute();
const router = useRouter();
const store = useSchedulerStore();

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/backtest': '策略回测',
  '/scheduler': '任务调度',
  '/top-backtest': 'Top回测'
}

const pageDescriptions: Record<string, string> = {
  '/dashboard': '系统状态监控与数据总览',
  '/backtest': '历史数据回测与策略验证',
  '/scheduler': '定时任务管理与监控',
  '/top-backtest': '筛选结果与潜力股回测分析'
}

const pageTitle = computed(() => {
  return pageTitles[route.path] || '系统';
});

const pageTagline = computed(() => {
  return pageDescriptions[route.path] || '';
});

const breadcrumbLabel = computed(() => {
  return pageTagline.value ? `${pageTitle.value}（${pageTagline.value}）` : pageTitle.value;
});

const dailyUpdateTask = computed(() => store.taskStatus['update_daily_data'] || null);

const isInProgress = computed(() => {
  return dailyUpdateTask.value && dailyUpdateTask.value.current_date_progress < 100 && dailyUpdateTask.value.success === undefined;
});

const taskProgress = computed(() => {
  return dailyUpdateTask.value ? dailyUpdateTask.value.current_date_progress : 0;
});

const taskMessage = computed(() => {
  if (dailyUpdateTask.value) {
    return dailyUpdateTask.value.message || '数据更新中...';
  }
  return '数据更新中...';
});

// 多 WebSocket 连接汇总状态
const allConnected = computed(() => {
  const values = Object.values(connectionStatus);
  return values.length > 0 && values.every(v => v);
});

const hasDisconnected = computed(() => {
  return Object.values(connectionStatus).some(v => !v);
});

const connectionStatusText = computed(() => {
  if (hasDisconnected.value || !allConnected.value) return '未连接';
  if (isInProgress.value) return '更新中';
  return '已连接';
});

// 计算连接率
const connectionRate = computed(() => {
  const values = Object.values(connectionStatus);
  if (values.length === 0) return 0;
  const connectedCount = values.filter(v => v).length;
  return Math.round((connectedCount / values.length) * 100);
});

// 计算连接统计
const connectionStats = computed(() => {
  const values = Object.values(connectionStatus);
  const totalConnections = values.length;
  const connectedCount = values.filter(v => v).length;
  return {
    total: totalConnections,
    connected: connectedCount,
    rate: connectionRate.value
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

<style scoped>
.navbar {
  @apply h-20 flex items-center justify-between px-6;
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Left Section */
.navbar-left {
  @apply flex items-center;
}

.page-info {
  @apply flex flex-col space-y-1;
}

.page-title {
  @apply text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400;
}

.breadcrumb {
  @apply flex items-center text-sm text-gray-400;
}

.breadcrumb-item {
  @apply transition-colors duration-200;
}

.breadcrumb-item.current {
  @apply text-gray-200 font-medium;
}

.breadcrumb-separator {
  @apply mx-2 text-gray-500;
}

/* Right Section */
.navbar-right {
  @apply flex items-center space-x-6;
}

/* Status Section */
.status-section {
  @apply flex items-center space-x-4;
}

.status-item {
  @apply flex items-center;
}

.status-indicator {
  @apply flex items-center space-x-3;
}

.status-dot {
  @apply w-3 h-3 rounded-md transition-all duration-300;
}

.status-dot-success {
  @apply bg-green-400;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.status-dot-warning {
  @apply bg-yellow-400 animate-pulse;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
}

.status-dot-error {
  @apply bg-red-400;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.status-content {
  @apply flex flex-col;
}

.status-label {
  @apply text-xs text-gray-400 font-medium;
}

.status-value {
  @apply text-sm text-gray-200;
}

.status-detail {
  @apply text-xs text-gray-500;
}

/* Connection Tooltip */
.connection-tooltip-container {
  @apply relative;
}

.connection-tooltip {
  @apply absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl opacity-0 invisible transition-all duration-200 z-50 cursor-pointer;
  transform: translateY(-10px);
}

.connection-tooltip-container:hover .connection-tooltip {
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
/* Progress */
.progress-container {
  @apply space-y-2;
}

.progress-info {
  @apply flex items-center justify-between;
}

.progress-label {
  @apply text-sm text-gray-300;
}

.progress-percentage {
  @apply text-xs text-gray-400 font-mono;
}

.progress-bar {
  @apply w-32 h-2 bg-gray-700 rounded-md overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out;
  animation: progressPulse 2s ease-in-out infinite;
}

@keyframes progressPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Divider */
.navbar-divider {
  @apply w-px h-8 bg-gray-600;
}

/* User Section */
.user-section {
  @apply flex items-center space-x-3;
}

.user-info {
  @apply flex items-center space-x-3;
}

.user-avatar {
  @apply relative;
}

.avatar-content {
  @apply w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center;
}

.avatar-text {
  @apply text-white font-semibold text-sm;
}

.avatar-status {
  @apply absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-md border-2 border-gray-800;
}

.user-details {
  @apply flex flex-col;
}

.user-name {
  @apply text-sm font-medium text-gray-200;
}

.user-role {
  @apply text-xs text-gray-400;
}

.user-menu {
  @apply flex items-center;
}

.menu-button {
  @apply p-1 rounded-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all duration-200;
}

/* Quick Actions */
.quick-actions {
  @apply flex items-center space-x-2;
}

.action-btn {
  @apply relative p-2 rounded-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all duration-200;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.notification-badge {
  @apply absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-md flex items-center justify-center font-medium;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -3px, 0);
  }
  70% {
    transform: translate3d(0, -2px, 0);
  }
  90% {
    transform: translate3d(0, -1px, 0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    @apply px-4;
  }
  
  .user-details,
  .status-content {
    @apply hidden;
  }
  
  .status-section {
    @apply space-x-2;
  }
  
  .navbar-right {
    @apply space-x-3;
  }
}

.page-tagline {
  @apply text-sm text-gray-400;
}
</style> 