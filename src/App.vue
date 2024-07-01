<script setup lang="ts">
import MapElement from './components/map/MapElement.vue'
import MapStatus from './components/map/MapStatus.vue'
import { useMapLinesStore } from './stores/maplines'

import { onMounted } from 'vue'

const MapLinesStore = useMapLinesStore()
onMounted(() => {
  console.log('App: App.vue mounted')
  MapLinesStore.loadTopoJSON()
})
</script>

<template>
  <div class="mapstat">
    <MapStatus />
  </div>
  <div class="mapel">
    <MapElement />
  </div>
</template>

<style scoped>
.mapstat {
  position: absolute;
  bottom: 40px;
  right: 10px;
  z-index: 1000;
}

.mapel {
  width: 100vw;
  height: 100vh;
}
</style>
