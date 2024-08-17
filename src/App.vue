<script setup lang="ts">
import { RouterView } from 'vue-router'

import { useApplicationStateStore } from './stores/ApplicationState';
import LoadingOverlay from './views/overlays/LoadingOverlay.vue';
import DSSApplicationHeader from './components/DS/Sections/DSS-ApplicationHeader.vue';

const ApplicationState = useApplicationStateStore();

ApplicationState.bootstrap();
</script>

<template>
  <LoadingOverlay v-if="!ApplicationState.app_loaded" />
  <DSSApplicationHeader />
  <RouterView />
</template>
