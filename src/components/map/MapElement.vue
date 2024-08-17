<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Protocol } from 'pmtiles'
import { GeoJSONSource, Map, addProtocol } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMapStatusStore } from '../../stores/mapstatus'
import { lineRenderer } from '@/package/renderLines'
import { useMapLinesStore } from '@/stores/maplines'

const MapStatusStore = useMapStatusStore()
const MapLinesStore = useMapLinesStore()

const mapElement = ref<null | HTMLDivElement>(null)

let map: null | Map = null

if (MapStatusStore.definedProtocol == false) {
  let protocol = new Protocol()
  addProtocol('pmtiles', protocol.tile)
  MapStatusStore.setDefinedProtocol()
}

const lineWidth = 2

function ScaleSpacing(width: number, zoom: number) {
  const w = Math.max(1, width)
  const z = Math.round(zoom * 100) / 100
  const numerator = 0.025 * w ** 2 - 0.04 * w + 0.1
  const scalef = numerator / 2 ** (z - 10)
  return scalef
}

const renderer = new lineRenderer()

watch(
  () => MapLinesStore.lineSegments,
  (lineSegments) => {
    renderer.resetLineSegments()
    for (const [key, value] of lineSegments) {
      renderer.addLineSegment(key, JSON.parse(JSON.stringify(value)))
    }
  }
)
watch(
  () => MapLinesStore.lineConnections,
  (lineConnections) => {
    renderer.resetLineConnections()
    for (const connection of lineConnections) {
      renderer.addLineConnection(JSON.parse(JSON.stringify(connection)))
    }
  }
)

onMounted(() => {
  if (mapElement.value === null) {
    console.error(
      'MapElement: mapElement is still null - Map will not load as there is no container for it to load in.'
    )
    return
  }

  map = new Map({
    container: mapElement.value,
    style: 'https://api.protomaps.com/styles/v2/light.json?key=a1fff39c9193ecc9',
    center: [151.2164, -33.8548],
    zoom: 12
  })

  // add events

  map.on('dataloading', (e) => {
    if (e.dataType !== 'style') {
      MapStatusStore.addLoadingItem()
    }
  })

  map.on('data', (e) => {
    if (e.dataType !== 'style') {
      MapStatusStore.removeLoadingItem()
    }
  })

  map.on('dataabort', (e) => {
    if (e.dataType !== 'style') {
      MapStatusStore.removeLoadingItem()
    }
  })

  // load our data
  map.on('load', () => {
    if (map === null) {
      console.error('MapElement: map is null - cannot load data')
      return
    }
    map.addSource('LinesData', {
      type: 'geojson',
      data: renderer.renderLines(ScaleSpacing(lineWidth, 12.55)),
      lineMetrics: true
    })
    map.addLayer({
      id: 'LinesMap',
      type: 'line',
      source: 'LinesData',
      paint: {
        'line-color': { type: 'identity', property: 'stroke' },
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5,
          0.5,
          7,
          1,
          8,
          lineWidth,
          23,
          lineWidth
        ]
      }
    })
    map.on('zoom', () => {
      const source = map?.getSource('LinesData') as GeoJSONSource
      source.setData(renderer.renderLines(ScaleSpacing(lineWidth, map?.getZoom() || 12)))
    })
  })
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
  }
})
</script>

<template>
  <main>
    <div ref="mapElement"></div>
  </main>
</template>

<style scoped>
main,
main>div {
  width: 100%;
  height: 100%;
}
</style>
