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
  border-bottom: 1px solid var(--DSC-Surfaces-Divider, #E0E0E0);

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

section:before {
  background-color: var(--DSC-Surfaces-Background);
  opacity: 0.6;
}

section:after {
  width: 100%;
  height: var(--DSS-ApplicationHeader-Height);
  content: "";
  z-index: -11;
  left: 0px;
  top: 0px;
  position: fixed;
  backdrop-filter: blur(5px);

}
</style>