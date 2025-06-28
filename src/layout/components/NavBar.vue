<template>
  <div class="h-16 bg-gray-900 text-white flex items-center justify-between px-6 shadow-md">
    <!-- Left side: Breadcrumbs or page title -->
    <div>
      <span class="font-semibold text-lg">{{ pageTitle }}</span>
    </div>
    
    <!-- Right side: Collector Status & User Info -->
    <div class="flex items-center space-x-4">
      <!-- Collector Status -->
      <div class="flex items-center space-x-2" v-if="taskMessage">
        <div 
          class="w-3 h-3 rounded-full"
          :class="{
            'bg-green-500': store.isConnected && !isInProgress,
            'bg-yellow-500 animate-pulse': store.isConnected && isInProgress,
            'bg-red-500': !store.isConnected
          }"
        ></div>
        <span>{{ taskMessage }}</span>
        <!-- Progress Bar -->
        <div v-if="isInProgress" class="w-24 bg-gray-700 rounded-full h-2.5">
          <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: taskProgress + '%' }"></div>
        </div>
      </div>
      
      <!-- User Avatar Placeholder -->
      <div>
        <span>User</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSchedulerStore } from '@/store/scheduler';

const route = useRoute();
const store = useSchedulerStore();

const pageTitle = computed(() => route.meta.title || 'Dashboard');

const dailyUpdateTask = computed(() => store.taskStatus['update_daily_data'] || null);

const isInProgress = computed(() => {
  return dailyUpdateTask.value && dailyUpdateTask.value.progress < 100 && dailyUpdateTask.value.success === undefined;
});

const taskProgress = computed(() => {
  return dailyUpdateTask.value ? dailyUpdateTask.value.progress : 0;
});

const taskMessage = computed(() => {
  if (!store.isConnected) {
    return '数据服务：未连接';
  }
  if (dailyUpdateTask.value) {
    return dailyUpdateTask.value.message;
  }
  return '数据服务：已连接';
});

</script> 