<script setup lang="ts">
const props = defineProps<{
  color?: "standard" | "secondary"
}>()
</script>

<template>
  <h1 :data-color="props.color">
    <slot />
  </h1>
</template>

<style scoped>
h1 {
  color: var(--DSC-Text-Standard, #000);
  font-feature-settings: 'dlig' on, 'case' on;

  /* DST Application Name */
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: 150%;
  letter-spacing: -0.2px;
}
</style>