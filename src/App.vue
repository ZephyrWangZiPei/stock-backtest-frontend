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
  background-color: #1a202c; /* Default dark background */
}

/* Global font styles */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
