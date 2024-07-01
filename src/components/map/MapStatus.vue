<script setup lang="ts">
import { useMapLinesStore } from '@/stores/maplines'
import { useMapStatusStore } from '@/stores/mapstatus'
import UiLoading from '../ui/UiLoading.vue'
import UiSuccess from '../ui/UiSuccess.vue'
import UiError from '../ui/UiError.vue'
const MapStatusStore = useMapStatusStore()
const MapLinesStore = useMapLinesStore()
</script>

<template>
  <aside class="container">
    <div class="pill">
      <p v-if="MapLinesStore.linesProcessingStatus == 'unloaded'">TopoJSON file unloaded</p>
      <p v-else-if="MapLinesStore.linesProcessingStatus == 'loading'">TopoJSON file loading</p>
      <p v-else-if="MapLinesStore.linesProcessingStatus == 'processing'">
        TopoJSON file processing
      </p>
      <p v-else-if="MapLinesStore.linesProcessingStatus == 'loaded'">TopoJSON file loaded</p>
      <p v-else-if="MapLinesStore.linesProcessingStatus == 'error'">Error loading TopoJSON file</p>
      <UiLoading
        v-if="
          MapLinesStore.linesProcessingStatus == 'loading' ||
          MapLinesStore.linesProcessingStatus == 'processing'
        "
      />
      <UiSuccess v-else-if="MapLinesStore.linesProcessingStatus == 'loaded'" />
      <UiError v-else />
    </div>
    <div class="pill">
      <p v-if="MapStatusStore.isLoading">
        Map is loading {{ MapStatusStore.loadingItems }} item{{
          MapStatusStore.loadingItems !== 1 ? 's' : ''
        }}
      </p>
      <p v-else>Map has loaded</p>
      <UiLoading v-if="MapStatusStore.isLoading" />
      <UiSuccess v-else />
    </div>
  </aside>
</template>

<style scoped>
.pill {
  background-color: #fff;
  border-radius: 100px;

  display: flex;
  flex-flow: row;
  padding: 2px 2px 2px 7px;

  align-items: center;
  gap: 5px;
  width: max-content;
}

.container {
  display: flex;
  flex-flow: column;
  gap: 5px;
  align-items: end;
}
</style>
