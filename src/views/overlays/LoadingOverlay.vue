<script setup lang="ts">
import DSTStandard from '@/components/DS/Text/DST-Standard.vue';
import DSIIcon from '@/components/DS/Icons/DSI-Icon.vue';
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main>
    <section>
      <DSIIcon icon="Loader" />
      <DSTStandard color="secondary">
        <span class="lt">
          {{ t('overlays.loading.application_loading') }}
        </span>
      </DSTStandard>
    </section>
  </main>
</template>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  position: fixed;
  background-color: var(--DSC-Surfaces-Background, #FFFFFF);
  z-index: 1000;
  top: 0;
  left: 0;
}

section {
  text-align: center;
  width: calc(100% - 64px);
  max-width: 536px;
}

span.lt {
  animation: fadeInAtTime 5s;
}


@keyframes fadeInAtTime {

  0%,
  40% {
    opacity: 0;
  }

  45%,
  100% {
    opacity: 1;
  }
}
</style>