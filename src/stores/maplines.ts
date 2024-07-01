import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ExtractLineSegments } from '../package/extractLineSegments'
import type { topojsonExport } from '../package/types'
import { extractLineConnections } from '../package/extractLineConnections'

export const useMapLinesStore = defineStore('MapLines', () => {
  const linesProcessingStatus = ref('unloaded') // unloaded, loaded, loading, processing, error

  const topoJSONimport = ref<null | topojsonExport>(null)

  async function loadTopoJSON() {
    try {
      linesProcessingStatus.value = 'loading'
      const response = await fetch('/ProcessedTJLines.json')
      topoJSONimport.value = await response.json()
      linesProcessingStatus.value = 'loaded'
    } catch (error) {
      console.error('MapLinesLoader: Error loading TopoJSON line connection', error)
      linesProcessingStatus.value = 'error'
    }
  }

  const lineConnections = computed(() => {
    if (!topoJSONimport.value) return []
    return extractLineConnections(topoJSONimport.value)
  })

  const lineSegments = computed(() => {
    if (!topoJSONimport.value) return new Map()
    return ExtractLineSegments(topoJSONimport.value)
  })

  return { linesProcessingStatus, loadTopoJSON, lineConnections, lineSegments }
})
