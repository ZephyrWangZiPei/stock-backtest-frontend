<template>
  <div class="sidebar">
    <!-- Logo Section -->
    <div class="logo-section">
      <div class="logo-container">
        <div class="logo-icon">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <div class="w-4 h-4 bg-white rounded-sm"></div>
          </div>
        </div>
        <div class="logo-text">
          <h1 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Stock Scan
          </h1>
          <p class="text-xs text-gray-400 mt-1">智能分析系统</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="navigation">
      <div class="nav-header">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">主要功能</span>
      </div>
      
      <div class="nav-items">
        <router-link
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="nav-item group"
          :class="{ 'nav-item-active': currentRoute.path === route.path }"
        >
          <div class="nav-item-content">
            <div class="nav-icon">
              <component :is="route.icon" class="w-5 h-5" />
            </div>
            <span class="nav-text">{{ route.name }}</span>
          </div>
          
          <!-- Active indicator -->
          <div class="nav-indicator" v-if="currentRoute.path === route.path"></div>
          
          <!-- Hover background -->
          <div class="nav-hover-bg"></div>
        </router-link>
      </div>
    </nav>

    <!-- Footer Section -->
    <div class="sidebar-footer">
      <div class="footer-content">
        <div class="status-indicator">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span class="text-xs text-gray-400">系统正常</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h } from 'vue';
import { useRoute } from 'vue-router';

const currentRoute = useRoute();

// 简单的图标组件
const DashboardIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    class: 'w-5 h-5'
  }, [
    h('path', {
      d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'
    })
  ])
});

const BacktestIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    class: 'w-5 h-5'
  }, [
    h('path', {
      d: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z'
    })
  ])
});

const SchedulerIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    class: 'w-5 h-5'
  }, [
    h('path', {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
    })
  ])
});

const TopIcon = defineComponent({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', class: 'w-5 h-5' }, [
    h('path', { d: 'M12 2l4 8h-8l4-8zm0 9a4 4 0 110 8 4 4 0 010-8z' })
  ])
});

const HistoryIcon = defineComponent({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', class: 'w-5 h-5' }, [
    h('path', { d: 'M13 3a9 9 0 100 18 9 9 0 000-18zm0 2v5.268l4.146 2.414-.646 1.118L12 11V5h1z' })
  ])
});

const routes = ref([
  { path: '/dashboard', name: '仪表盘', icon: DashboardIcon },
  { path: '/backtest', name: '策略回测', icon: BacktestIcon },
  { path: '/backtest-history', name: '回测历史', icon: HistoryIcon },
  { path: '/top-backtest', name: 'Top回测', icon: TopIcon },
  { path: '/scheduler', name: '任务调度', icon: SchedulerIcon },
]);
</script>

<style scoped>
.sidebar {
  @apply w-64 h-full flex flex-col;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(75, 85, 99, 0.3);
}

/* Logo Section */
.logo-section {
  @apply p-6 border-b border-gray-700/30;
}

.logo-container {
  @apply flex items-center space-x-3;
}

.logo-icon {
  @apply relative;
}

.logo-icon::after {
  content: '';
  @apply absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl blur opacity-0;
  transition: opacity 0.3s ease;
}

.logo-container:hover .logo-icon::after {
  @apply opacity-100;
}

.logo-text h1 {
  transition: all 0.3s ease;
}

.logo-container:hover .logo-text h1 {
  transform: scale(1.05);
}

/* Navigation */
.navigation {
  @apply flex-1 px-4 py-6;
}

.nav-header {
  @apply mb-4 px-3;
}

.nav-items {
  @apply space-y-2;
}

.nav-item {
  @apply relative block px-3 py-3 rounded-xl transition-all duration-300;
  text-decoration: none;
}

.nav-item-content {
  @apply flex items-center space-x-3 relative z-10;
}

.nav-icon {
  @apply w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300;
  background: rgba(55, 65, 81, 0.5);
}

.nav-text {
  @apply font-medium text-gray-300 transition-colors duration-300;
}

/* Hover background */
.nav-hover-bg {
  @apply absolute inset-0 rounded-xl opacity-0 transition-all duration-300;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
}

.nav-item:hover .nav-hover-bg {
  @apply opacity-100;
}

.nav-item:hover .nav-icon {
  @apply bg-blue-500/20 text-blue-400;
  transform: scale(1.1);
}

.nav-item:hover .nav-text {
  @apply text-white;
}

/* Active state */
.nav-item-active {
  @apply bg-gradient-to-r from-blue-500/20 to-purple-500/20;
}

.nav-item-active .nav-icon {
  @apply bg-blue-500/30 text-blue-400;
}

.nav-item-active .nav-text {
  @apply text-white font-semibold;
}

/* Active indicator */
.nav-indicator {
  @apply absolute left-0 top-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full;
  transform: translateY(-50%);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

/* Footer */
.sidebar-footer {
  @apply p-4 border-t border-gray-700/30;
}

.footer-content {
  @apply px-3;
}

.status-indicator {
  @apply flex items-center space-x-2;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    @apply w-16;
  }
  
  .logo-text,
  .nav-text,
  .nav-header {
    @apply hidden;
  }
  
  .logo-container {
    @apply justify-center;
  }
  
  .nav-item-content {
    @apply justify-center;
  }
}

/* Animation delays for nav items */
.nav-item:nth-child(1) { animation-delay: 0.1s; }
.nav-item:nth-child(2) { animation-delay: 0.2s; }
.nav-item:nth-child(3) { animation-delay: 0.3s; }
.nav-item:nth-child(4) { animation-delay: 0.4s; }

.nav-item {
  animation: fadeInLeft 0.6s ease-out forwards;
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes fadeInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style> 