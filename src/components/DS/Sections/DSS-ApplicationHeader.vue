<script setup lang="ts">
import DSTApplicationName from '@/components/DS/Text/DST-ApplicationName.vue';
import DSIIcon from '@/components/DS/Icons/DSI-Icon.vue';
import { useApplicationStateStore } from '@/stores/ApplicationState';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const ApplicationState = useApplicationStateStore();

const isLoading = ref(0);

watch(() => ApplicationState.loading_items, (new_val) => {
  if (new_val > 0) {
    isLoading.value = 2
  } else {
    isLoading.value = 1
  }
});

const interval = setInterval(() => {
  if (isLoading.value > 0 && isLoading.value <= 1) {
    isLoading.value -= 0.1;
  }
}, 100);

onUnmounted(() => {
  clearInterval(interval);
});

const should_show_loader = computed(() => isLoading.value > 0);

</script>

<template>
  <section>
    <div class="scrim">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <DSTApplicationName>{{ t("navigation.applicationName") }}</DSTApplicationName>
    <DSIIcon icon="Loader" v-if="should_show_loader" />
  </section>
</template>

<style scoped>
section {
  display: flex;
  padding: 16px 24px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  width: 100%;


  height: var(--DSS-ApplicationHeader-Height);

  z-index: 1;
  top: 0px;
  position: fixed;

}

section:before,
section:after {
  width: 100%;
  height: var(--DSS-ApplicationHeader-Height);
  content: "";
  z-index: -1;
  left: 0px;
  top: 0px;
  position: fixed;
}

section:after {
  width: 100%;
  height: var(--DSS-ApplicationHeader-Height);
  content: "";
  z-index: -11;
  left: 0px;
  top: 0px;
  position: fixed;

}


.scrim {
  position: fixed;
  z-index: 1;
  inset: auto 0 0 0;
  height: var(--DSS-ApplicationHeader-Height);
  pointer-events: none;
  transform: rotate(180deg);
  top: 0px;
}

.scrim>div,
.scrim::before,
.scrim::after {
  position: absolute;
  inset: 0;
}

.scrim::before {
  content: "";
  z-index: 1;
  backdrop-filter: blur(0.5px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 1) 12.5%,
      rgba(0, 0, 0, 1) 25%,
      rgba(0, 0, 0, 0) 37.5%);
}

.scrim>div:nth-of-type(1) {
  z-index: 2;
  backdrop-filter: blur(1px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 12.5%,
      rgba(0, 0, 0, 1) 25%,
      rgba(0, 0, 0, 1) 37.5%,
      rgba(0, 0, 0, 0) 50%);
}

.scrim>div:nth-of-type(2) {
  z-index: 3;
  backdrop-filter: blur(2px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 25%,
      rgba(0, 0, 0, 1) 37.5%,
      rgba(0, 0, 0, 1) 50%,
      rgba(0, 0, 0, 0) 62.5%);
}

.scrim>div:nth-of-type(3) {
  z-index: 4;
  backdrop-filter: blur(4px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 37.5%,
      rgba(0, 0, 0, 1) 50%,
      rgba(0, 0, 0, 1) 62.5%,
      rgba(0, 0, 0, 0) 75%);
}

.scrim>div:nth-of-type(4) {
  z-index: 5;
  backdrop-filter: blur(8px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 50%,
      rgba(0, 0, 0, 1) 62.5%,
      rgba(0, 0, 0, 1) 75%,
      rgba(0, 0, 0, 0) 87.5%);
}

.scrim>div:nth-of-type(5) {
  z-index: 6;
  backdrop-filter: blur(16px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 62.5%,
      rgba(0, 0, 0, 1) 75%,
      rgba(0, 0, 0, 1) 87.5%,
      rgba(0, 0, 0, 0) 100%);
}

.scrim>div:nth-of-type(6) {
  z-index: 7;
  backdrop-filter: blur(32px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 75%,
      rgba(0, 0, 0, 1) 87.5%,
      rgba(0, 0, 0, 1) 100%);
}

.scrim::after {
  content: "";
  z-index: 8;
  backdrop-filter: blur(64px);
  mask: linear-gradient(to bottom,
      rgba(0, 0, 0, 0) 87.5%,
      rgba(0, 0, 0, 1) 100%);
}
</style>