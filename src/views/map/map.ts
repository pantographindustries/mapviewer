import { cellsToMultiPolygon, gridDisk, latLngToCell, polygonToCells } from 'h3-js'
import { GeoJSONSource, LngLatBounds, Map as MapLibre, addProtocol } from 'maplibre-gl'
import { Protocol as PmTilesProtocol } from 'pmtiles'
import { useApplicationStateStore } from '../../stores/ApplicationState'
import TransitLinesRenderer from './worker-linesrenderer?worker'

const EmptyFeatureCollection = {
  type: 'FeatureCollection',
  features: []
}

export class ConductorMap {
  map: MapLibre

  config = {
    debug: false,
    zoom_transition: 0.25,
    zoom_cutoff_platforms: 12,
    zoom_cutoff_platforms_marker: 14.2,
    zoom_cutoff_insignificant_locations: 12,
    line_width: 1.75,
    line_spacing: 2,
    style: window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : ('light' as 'dark' | 'light')
  }

  styles = {
    light: 'https://api.protomaps.com/styles/v2/white.json?key=a1fff39c9193ecc9',
    dark: 'https://api.protomaps.com/styles/v2/black.json?key=a1fff39c9193ecc9'
  }

  current: {
    zoom: number
    bounds: LngLatBounds
    bounds_polygon: number[][]
    cellsr8: string[]
    cellsr6: string[]
    activeCellRes: number
  }

  loading = {
    loaded_cells: new Map() as Map<string, 'pending' | 'loaded' | 'failed'>,
    loaded_assets: [] as string[],
    waiting_on_lines: false,
    hasLoadedStyle: false
  }

  stores: {
    ApplicationStore: ReturnType<typeof useApplicationStateStore>
  }

  workers: {
    linesrenderer: Worker
  }

  //MARK: Constructor
  constructor(el: HTMLDivElement) {
    //console.log('ConductorMap')

    const protocol = new PmTilesProtocol()
    addProtocol('pmtiles', protocol.tile)

    this.stores = { ApplicationStore: useApplicationStateStore() }

    this.map = new MapLibre({
      container: el,
      style: this.styles[this.config.style],
      center: [151.21, -33.86798],
      zoom: 14.25
    })

    this.current = {
      zoom: this.map.getZoom(),
      bounds: this.map.getBounds(),
      bounds_polygon: [
        this.map.getBounds().getNorthWest().toArray(),
        this.map.getBounds().getNorthEast().toArray(),
        this.map.getBounds().getSouthEast().toArray(),
        this.map.getBounds().getSouthWest().toArray(),
        this.map.getBounds().getNorthWest().toArray()
      ],
      cellsr8: [],
      cellsr6: [],
      activeCellRes: 8
    }

    this.workers = {
      linesrenderer: new TransitLinesRenderer()
    }

    this.workers.linesrenderer.addEventListener('message', async (event) => {
      await this.linesrenderer_worker_message(event)
    })

    this.map.on('load', async () => {
      await this.#event_load()
    })
    this.map.on('styledata', async () => {
      await this.#event_styledata()
    })
    this.map.on('move', async () => {
      await this.#event_move()
    })
    this.map.on('moveend', async () => {
      await this.#event_move_end()
    })
    this.map.on('styleimagemissing', async () => {
      await this.#event_style_image_missing()
    })
    this.map.on('dataloading', async () => {
      await this.#event_dataloading()
    })
    this.map.on('data', async () => {
      await this.#event_data()
    })
    this.map.on('dataabort', async () => {
      await this.#event_dataabort()
    })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      this.#windowevent_change_color_scheme(event)
    })
  }

  //MARK: Source & Layer loading

  async #init_add_sources() {
    this.map.addSource('LinesData', {
      type: 'geojson',
      data: EmptyFeatureCollection as GeoJSON.FeatureCollection,
      lineMetrics: true
    })
  }

  async #init_add_layers() {
    this.map.addLayer(
      {
        id: 'LinesMap',
        type: 'line',
        source: 'LinesData',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': 1000
        },
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
            this.config.line_width,
            23,
            this.config.line_width
          ]
        }
      }
      //'physical_line_waterway_label'
    )
  }

  async #update_move_layers() {
    //console.log(this.map)
    this.map.moveLayer('LinesMap', 'physical_line_waterway_label')
  }

  //MARK: Debugging

  async #add_debug_stuff() {
    if (!this.config.debug) return
    this.map.addSource('debug-source-h3_tiles', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    this.map.addLayer({
      id: 'debug-layer-h3_tiles',
      type: 'fill',
      source: 'debug-source-h3_tiles',
      paint: {
        'fill-color': { type: 'identity', property: 'fill-color' },
        'fill-opacity': 0.1
      }
    })
    this.map.addLayer({
      id: 'debug-layer-outlines-h3_tiles',
      type: 'line',
      source: 'debug-source-h3_tiles',
      paint: {
        'line-color': { type: 'identity', property: 'fill-color' },
        'line-width': 2
      }
    })
    this.map.addLayer({
      id: 'debug-layer-labels-h3_tiles',
      type: 'symbol',
      source: 'debug-source-h3_tiles',
      layout: {
        'text-field': { type: 'identity', property: 'cell-id' },
        'text-font': ['Noto Sans Regular']
      },
      paint: {
        'text-color': '#525252',
        'text-halo-color': '#1f1f1f',
        'text-halo-width': 2
      }
    })
  }

  #debug_update_tiles() {
    if (!this.config.debug) return
    const source = this.map.getSource('debug-source-h3_tiles') as GeoJSONSource
    source.setData({
      type: 'FeatureCollection',
      features: this.current.cellsr8.map((coords) => {
        const state = this.loading.loaded_cells.get(coords) || 'failed'
        const stateMap = {
          pending: '#FFA629',
          loaded: '#14AE5C',
          failed: '#F24822'
        }
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: cellsToMultiPolygon([coords], true)[0]
          },
          properties: {
            'cell-id': coords,
            'fill-color': stateMap[state]
          }
        }
      })
    })
  }

  //MARK: Calculation

  #calculate_visibility() {
    this.current.zoom = this.map.getZoom()
    this.current.bounds = this.map.getBounds()
    this.current.bounds_polygon = [
      this.current.bounds.getNorthWest().toArray(),
      this.current.bounds.getNorthEast().toArray(),
      this.current.bounds.getSouthEast().toArray(),
      this.current.bounds.getSouthWest().toArray(),
      this.current.bounds.getNorthWest().toArray()
    ]
    this.#calculate_h3_cells()
  }

  #calculate_h3_cells() {
    if (this.current.zoom < 8) return

    const activeCellRes = this.current.zoom < 10 ? 6 : 8

    let initial_h3Indexes = polygonToCells(this.current.bounds_polygon, activeCellRes, true)
    if (initial_h3Indexes.length == 0) {
      const center = this.current.bounds.getCenter()
      initial_h3Indexes = [latLngToCell(center.lat, center.lng, activeCellRes)]
    }

    const coverage_h3Indexes = initial_h3Indexes
      .map((idx) => gridDisk(idx, 1))
      .flat()
      .reduce((acc, val) => acc.add(val), new Set<string>())
      .keys()

    if (activeCellRes == 8) this.current.cellsr8 = Array.from(coverage_h3Indexes)
    else this.current.cellsr6 = Array.from(coverage_h3Indexes)

    this.current.activeCellRes = activeCellRes
  }

  //MARK: Workers

  async #download_and_process_lines_data() {
    try {
      this.stores.ApplicationStore.add_loading_item()
      const res = await fetch('/ProcessedTJLines.json')
      const resJson = await res.json()
      this.workers.linesrenderer.postMessage({
        type: 'init',
        data: resJson
      })
    } catch (error) {
      console.error(error)
    } finally {
      this.stores.ApplicationStore.remove_loading_item()
    }
  }

  async linesrenderer_worker_message(event: { data: { type: string; data: any } }) {
    if (event.data.type === 'add_loading_item') {
      this.stores.ApplicationStore.add_loading_item()
    } else if (event.data.type === 'remove_loading_item') {
      this.stores.ApplicationStore.remove_loading_item()
    } else if (event.data.type === 'rendered') {
      await this.#render_lines_data(event.data.data)
    } else if (event.data.type === 'finished_init') {
      await this.#linesrenderer_request_render()
    }
  }

  async #linesrenderer_request_render(force?: boolean) {
    force = force || false
    if (this.loading.waiting_on_lines && force == false) return
    this.loading.waiting_on_lines = true
    this.workers.linesrenderer.postMessage({
      type: 'request_render',
      data: {
        width: this.config.line_width,
        spacing: this.config.line_spacing,
        zoom: this.current.zoom,
        viewbox: this.current.bounds_polygon
      }
    })
  }

  //MARK: Drawing

  async #render_lines_data(data: GeoJSON.FeatureCollection) {
    const source = this.map.getSource('LinesData') as GeoJSONSource
    source.setData(data)
    this.loading.waiting_on_lines = false
  }

  //MARK: Events

  async #event_load() {
    this.#calculate_visibility()
    this.#init_add_sources()
    this.#init_add_layers()

    await this.#add_debug_stuff()

    await this.#event_move()

    this.stores.ApplicationStore.set_map_loaded()

    this.stores.ApplicationStore.reset_loading_items()

    await this.#download_and_process_lines_data()

    //console.log(this.map)
  }

  async #event_styledata() {
    //console.log('ConductorMap.#event_styledata')
  }

  async #event_move() {
    this.#calculate_visibility()
    this.#debug_update_tiles()
    this.#linesrenderer_request_render()
  }

  async #event_move_end() {
    this.#linesrenderer_request_render(true)
  }

  async #event_style_image_missing() {
    // console.log('ConductorMap.#event_style_image_missing')
  }

  async #event_dataloading() {
    //this.stores.ApplicationStore.add_loading_item()
  }

  async #event_data() {
    //this.stores.ApplicationStore.remove_loading_item()
  }

  async #event_dataabort() {
    //this.stores.ApplicationStore.remove_loading_item()
  }

  //MARK: Window Events

  #windowevent_change_color_scheme(event: MediaQueryListEvent) {
    this.map.setStyle(this.styles[event.matches ? 'dark' : 'light'])
    this.#update_move_layers()
  }

  kill() {
    // console.log('ConductorMap.kill')
    this.workers.linesrenderer.terminate()
    this.map.remove()
  }
}
