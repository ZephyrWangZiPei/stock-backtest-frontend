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
          <div class="status-indicator">
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
            </div>
          </div>
        </div>

        <!-- Task Progress -->
        <div v-if="isInProgress" class="status-item">
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
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-btn" title="通知">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
          </svg>
          <span class="notification-badge">3</span>
        </button>
        
        <button class="action-btn" title="设置">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSchedulerStore } from '@/store/scheduler';
import { connectionStatus } from '@/utils/connectionStatus';

const route = useRoute();
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
  return dailyUpdateTask.value && dailyUpdateTask.value.progress < 100 && dailyUpdateTask.value.success === undefined;
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
  @apply w-3 h-3 rounded-full transition-all duration-300;
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
  @apply w-32 h-2 bg-gray-700 rounded-full overflow-hidden;
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
  @apply w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center;
}

.avatar-text {
  @apply text-white font-semibold text-sm;
}

.avatar-status {
  @apply absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800;
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
  @apply p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all duration-200;
}

/* Quick Actions */
.quick-actions {
  @apply flex items-center space-x-2;
}

.action-btn {
  @apply relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all duration-200;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.notification-badge {
  @apply absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium;
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