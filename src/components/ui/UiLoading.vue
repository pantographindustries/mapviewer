<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="12"
      cy="12"
      r="11"
      stroke="#D97706"
      stroke-width="2"
      stroke-dasharray="7 2"
      class="spin"
    />
  </svg>
</template>

<style scoped>
@keyframes spin {
  to {
    stroke-dashoffset: -70;
  }
}

.spin {
  animation: spin 1s linear infinite;
}
</style>
