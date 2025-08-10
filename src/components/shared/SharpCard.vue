<template>
  <section class="sharp-card">
    <header v-if="$slots.title" class="sharp-card__header">
      <slot name="title" />
    </header>
    <div class="sharp-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
.sharp-card {
  background: $color-surface;
  border: $border-width solid $color-border;
}
.sharp-card__header { padding: $space-3 $space-4; border-bottom: $border-width solid $color-border; }
.sharp-card__body { padding: $space-4; }
</style> 