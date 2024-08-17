import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useApplicationStateStore = defineStore('ApplicationState', () => {
  const initial_load_completed = ref(false)
  const loading_items = ref(0)
  const map_loaded = ref(false)

  const app_loaded = computed(() => initial_load_completed.value && map_loaded.value)

  const should_show_loader_overlay = computed(() => !initial_load_completed.value)

  async function bootstrap() {
    //await new Promise((r) => setTimeout(r, 2000))
    initial_load_completed.value = true
  }

  function set_map_loaded() {
    map_loaded.value = true
  }

  function add_loading_item() {
    loading_items.value++
  }

  function remove_loading_item() {
    loading_items.value--
  }

  function reset_loading_items() {
    loading_items.value = 0
  }

  return {
    bootstrap,
    loading_items,
    initial_load_completed,
    should_show_loader_overlay,
    app_loaded,
    set_map_loaded,
    add_loading_item,
    remove_loading_item,
    reset_loading_items
  }
})
