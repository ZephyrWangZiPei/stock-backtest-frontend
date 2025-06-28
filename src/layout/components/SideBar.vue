<template>
  <div class="bg-gray-800 text-gray-100 w-64 h-full flex flex-col">
    <div class="h-16 flex items-center justify-center text-2xl font-bold text-white shadow-md">
      Stock Scan
    </div>
    <nav class="flex-1 px-2 py-4 space-y-2">
      <router-link
        v-for="route in routes"
        :key="route.path"
        :to="route.path"
        class="flex items-center px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
        :class="{ 'bg-gray-900 text-white': currentRoute.path === route.path }"
      >
        <span class="mx-4 font-medium">{{ route.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const currentRoute = useRoute();
const routes = ref([
  { path: '/dashboard', name: '仪表盘' },
  { path: '/backtest', name: '策略回测' },
  { path: '/watchlist', name: '自选股' },
  { path: '/scheduler', name: '任务调度' },
]);
</script> 