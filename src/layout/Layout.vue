<template>
  <div class="app-wrapper">
    <!-- Sidebar -->
    <div class="sidebar-container">
      <SideBar />
    </div>

    <!-- Main Content -->
    <div class="main-container">
      <!-- Top Navbar -->
      <div class="navbar-container">
        <NavBar />
      </div>

      <!-- Page Content -->
      <main class="app-main">
        <div class="page-content">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import SideBar from './components/SideBar.vue'
import NavBar from './components/NavBar.vue'
</script>

<style scoped>
.app-wrapper {
  @apply flex h-screen w-screen overflow-hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.sidebar-container {
  @apply flex-shrink-0;
}

.main-container {
  @apply flex-1 flex flex-col min-w-0 overflow-hidden;
  height: 100vh;
}

.navbar-container {
  @apply flex-shrink-0;
  height: 5rem;
}

.app-main {
  @apply flex-1 overflow-hidden;
  height: calc(100vh - 5rem);
}

.page-content {
  @apply h-full w-full overflow-hidden;
}

/* Enhanced scrollbar styling for nested content */
:deep(.page-content) {
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.6) rgba(31, 41, 55, 0.3);
}

:deep(.page-content)::-webkit-scrollbar {
  width: 8px;
}

:deep(.page-content)::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 4px;
}

:deep(.page-content)::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border-radius: 4px;
  border: 1px solid rgba(31, 41, 55, 0.5);
}

:deep(.page-content)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(99, 102, 241, 1), rgba(139, 92, 246, 1));
}
</style> 