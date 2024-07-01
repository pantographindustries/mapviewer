import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMapStatusStore = defineStore('MapStatus', () => {
  const definedProtocol = ref(false)

  function setDefinedProtocol() {
    definedProtocol.value = true
  }

  const loadingItems = ref(0)
  const isLoading = computed(() => loadingItems.value > 0)
  function addLoadingItem() {
    loadingItems.value++
  }
  function removeLoadingItem() {
    loadingItems.value = Math.abs(loadingItems.value - 1)
  }

  return {
    definedProtocol,
    setDefinedProtocol,
    loadingItems,
    isLoading,
    addLoadingItem,
    removeLoadingItem
  }
})
