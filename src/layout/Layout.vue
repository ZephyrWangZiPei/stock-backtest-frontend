<template>
  <div class="flex h-screen bg-gray-900 text-white">
    <!-- Sidebar -->
    <SideBar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Navbar -->
      <NavBar />

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-6">
        <router-view />
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
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #1a202c; /* A dark background for the whole app */
}

.sidebar-container {
  flex-shrink: 0;
}

.main-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent scrolling on the main container itself */
}

.app-main {
  flex-grow: 1;
  overflow-y: auto; /* Allow scrolling for the page content */
  padding: 20px;
}
</style> 