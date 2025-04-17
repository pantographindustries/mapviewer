<script setup lang="ts">
declare global {
  interface Window {
    pageInitialLoad: DOMHighResTimeStamp
  }
}

import DSTStandard from '@/components/DS/Text/DST-Standard.vue';
import DSIIcon from '@/components/DS/Icons/DSI-Icon.vue';
import { useI18n } from 'vue-i18n'

import { onUnmounted } from 'vue'

const { t } = useI18n();

var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
  const loader = document.querySelector('#bootsplash.bootsplash');
  if (!loader) return
  loader.outerHTML = ''
}


onUnmounted(() => {
  removeHtmlEmbeddedLoadScreen()

});

function removeHtmlEmbeddedLoadScreen() {
  const timeout = performance.now() - window.pageInitialLoad < 1000 ? 1000 : 1000;

  setTimeout(() => {
    const loader = document.querySelector('#bootsplash.bootsplash')
    if (!loader) return
    loader.classList.add('load-state--loaded')
    setTimeout(() => {
      loader.outerHTML = ''
    }, 1000)
  }, timeout)
}


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