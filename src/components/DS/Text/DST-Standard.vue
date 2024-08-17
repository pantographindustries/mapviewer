<script setup lang="ts">
const props = defineProps<{
  color?: "standard" | "secondary"
  selected?: 'selected' | 'selected-alt'
  emphasis?: boolean
  isLink?: boolean
}>()
</script>

<template>

  <span :data-color="props.color" :data-selected="props.selected" :data-emphasis="props.emphasis" v-if="isLink">
    <slot />
  </span>
  <p :data-color="props.color" :data-selected="props.selected" :data-emphasis="props.emphasis" v-else>
    <slot />
  </p>
</template>

<style scoped>
p,
span {
  color: var(--DSC-Text-Standard, #000);
  font-feature-settings: 'dlig' on, 'case' on;

  /* DST Standard */
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  letter-spacing: -0.16px;
}

p[data-emphasis="true"],
span[data-emphasis="true"] {
  font-weight: 700;
}

p[data-color="secondary"],
span[data-color="secondary"] {
  color: var(--DSC-Text-Secondary, #828282);
}

p[data-selected="selected"],
span[data-selected="selected"] {
  font-weight: 700;
  text-decoration-line: underline;
  cursor: pointer;
}

p[data-selected="selected-alt"],
span[data-selected="selected-alt"] {
  font-weight: 700;
  cursor: pointer;
}

p[data-selected="selected"]:focus,
p[data-selected="selected"]:hover,
span[data-selected="selected"]:focus,
span[data-selected="selected"]:hover {
  font-weight: 700;
  text-decoration-style: dotted;
}

p[data-selected="selected-alt"]:focus,
p[data-selected="selected-alt"]:hover,
span[data-selected="selected-alt"]:focus,
span[data-selected="selected-alt"]:hover {
  font-weight: 700;
  text-decoration-line: underline;
}
</style>