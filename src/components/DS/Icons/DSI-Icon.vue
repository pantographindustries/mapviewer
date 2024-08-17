<script setup lang="ts">
import { icons } from './icons';
const props = defineProps<{
  icon: keyof typeof icons
  size?: 'default' | 'large'
  color?: "secondary" | "standard"
}>()
</script>

<template>
  <span :data-size="props.size || 'default'" :data-color="props.color">
    <component v-bind:is="icons[props.icon]"></component>
  </span>
</template>

<style scoped>
span {
  color: var(--DSC-Text-Secondary, #828282);
}

span[data-color="standard"] {
  color: var(--DSC-Text-Standard, #000);
}

span[data-size='large']>svg {
  width: 48px;
  height: 48px;
}
</style>