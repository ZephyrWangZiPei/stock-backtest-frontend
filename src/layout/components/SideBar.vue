<template>
  <div
    class="sidebar-container"
    :class="{ 'is-collapsed': isCollapse }"
  >
    <!-- Logo Section -->
    <div class="logo-section">
      <div class="logo-container">
        <div class="logo-icon">
          <el-icon :size="24">
            <TrendCharts />
          </el-icon>
        </div>
        <div
          v-if="!isCollapse"
          class="logo-text"
        >
          Stock Scan
        </div>
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
        <template #title>{{ (route.meta as any).title }}</template>
      </el-menu-item>
    </el-menu>

    <!-- Collapse Button -->
    <div class="collapse-button-container">
      <el-button
        @click="toggleCollapse"
        link
        class="collapse-button"
      >
        <el-icon :size="16">
          <component :is="isCollapse ? ArrowRightBold : ArrowLeftBold" />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ElMenu,
  ElMenuItem,
  ElIcon,
  ElButton,
} from 'element-plus';
import {
  Odometer,
  TrendCharts,
  DataAnalysis,
  ArrowLeftBold,
  ArrowRightBold,
  Document,
  Filter,
  Cpu,
  Select,
  Star,
} from '@element-plus/icons-vue';

const currentRoute = useRoute();
const router = useRouter();
const isCollapse = ref(false);

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 图标映射
const iconMap: Record<string, any> = {
  'Odometer': Odometer,
  'TrendCharts': TrendCharts,
  'DataAnalysis': DataAnalysis,
  'Document': Document,
  'Filter': Filter,
  'Cpu': Cpu,
  'Select': Select,
  'Star': Star,
};

// 从路由配置中获取菜单�?
const menuRoutes = computed(() => {
  const routes = router.getRoutes();
  return routes
    .filter(route => route.meta && (route.meta as any).title && route.path !== '/')
    .map(route => ({
      ...route,
      meta: {
        ...route.meta,
        icon: iconMap[(route.meta as any).icon as string] || Document
      }
    }));
});
</script>

<style scoped>
.sidebar-container {
  @apply h-full flex flex-col;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  transition: width 0.3s ease;
  width: 240px;
}

.sidebar-container.is-collapsed {
  width: 64px;
}

.logo-section {
  @apply p-4 border-b;
  border-color: rgba(148, 163, 184, 0.1);
}

.logo-container {
  @apply flex items-center;
  min-height: 40px;
  transition: justify-content 0.3s ease;
  padding: 4px 0;
}

.sidebar-container.is-collapsed .logo-container {
  @apply justify-center;
}

.sidebar-container:not(.is-collapsed) .logo-container {
  @apply justify-start;
}

.logo-icon {
  @apply flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  transition: transform 0.3s ease;
  margin: 0;
}

.sidebar-container.is-collapsed .logo-icon {
  transform: scale(1.1);
}

.logo-text {
  @apply text-lg font-bold ml-3;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: opacity 0.3s ease, width 0.3s ease, margin 0.3s ease;
  overflow: hidden;
  white-space: nowrap;
  line-height: 1;
  align-self: center;
  display: flex;
  align-items: center;
  height: 32px;
  margin: 0;
  padding: 0;
}

.sidebar-container.is-collapsed .logo-text {
  opacity: 0;
  width: 0;
  padding: 0;
  margin: 0;
}

.el-menu-vertical-demo {
  flex-grow: 1;
  padding: 1rem 0;
  background-color: transparent;
  border: none;
}

.collapse-button-container {
  @apply flex justify-center p-3 border-t;
  border-color: rgba(148, 163, 184, 0.1);
}

.collapse-button {
  @apply w-8 h-8 rounded-lg;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
  transition: all 0.2s ease;
}

.collapse-button:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

/* Element Plus 菜单样式覆盖 */
:deep(.el-menu) {
  background-color: transparent;
  border: none;
}

:deep(.el-menu-item) {
  color: #94a3b8;
  background-color: transparent;
  border: none;
  margin: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  height: 44px;
  line-height: 44px;
}

:deep(.el-menu-item:hover) {
  color: #e2e8f0;
  background-color: rgba(148, 163, 184, 0.1);
}

:deep(.el-menu-item.is-active) {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
  font-weight: 500;
}

:deep(.el-menu-item .el-icon) {
  color: inherit;
  margin-right: 12px;
}

:deep(.el-menu--collapse .el-menu-item) {
  margin: 0.25rem;
  padding: 0 12px;
}

:deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin-right: 0;
}
</style> 
