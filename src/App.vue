<template>
  <router-view />
</template>

<script setup lang="ts">
// This is the root component.
// The router will inject views here.
</script>

<style>
/* Resetting default margin and padding for the whole app */
body, html, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: #0f172a; /* Enhanced dark background */
  overflow: auto; /* 允许页面滚动 */
}

/* Global font styles */
#app {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  width: 100vw;
}

/* Global scrollbar styles */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.6) rgba(31, 41, 55, 0.3);
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border-radius: 4px;
  border: 1px solid rgba(31, 41, 55, 0.5);
}

*::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(99, 102, 241, 1), rgba(139, 92, 246, 1));
}

*::-webkit-scrollbar-corner {
  background: rgba(31, 41, 55, 0.3);
}

/* Remove default focus outlines and add custom ones */
* {
  outline: none;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid rgba(99, 102, 241, 0.6);
  outline-offset: 2px;
}

/* Smooth transitions for all elements */
* {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

/* Disable text selection on UI elements */
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
