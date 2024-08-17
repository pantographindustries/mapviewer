<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ConductorMap } from './map';

const mapElement = ref<null | HTMLDivElement>(null)

onMounted(() => {
  if (mapElement.value === null) {
    console.error('MapElement: mapElement is null')
    return;
  } else {
    const cMap = new ConductorMap(mapElement.value as HTMLDivElement);
    onBeforeUnmount(() => {
      cMap.kill()
    })
  }
})
</script>

<template>
  <div ref="mapElement" class="map"></div>
</template>

<style scoped>
.map {
  height: 100%;
}

.map * {
  outline: 0px;
}
</style>