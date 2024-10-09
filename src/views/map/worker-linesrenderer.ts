import type { Feature, LineString, Position } from 'geojson'
import length from '@turf/length'
import lineSliceAlong from '@turf/line-slice-along'
import lineOffset from '@turf/line-offset'
import { lineString, multiLineString, featureCollection, polygon } from '@turf/helpers'
import distance from '@turf/distance'
import booleanIntersects from '@turf/boolean-intersects'
import smooth from 'to-smooth'

type coordpair = [number, number]

type topojsonExport = {
  type: 'Topology'
  objects: {
    lines: {
      type: 'GeometryCollection'
      geometries: Array<{
        type: 'LineString'
        arcs: Array<number>
        properties: {
          stroke: string
          title: string
          agency: string
        }
      }>
    }
  }
  arcs: Array<Array<coordpair>>
  bbox: [number, number, number, number]
  upperBounds: coordpair
}

type LineSegment = {
  geometry: Array<coordpair>
  top: coordpair
  bottom: coordpair
  colors: Array<string>
}

type LineConnection = { from: [number, string]; to: [number, string]; color: string }

function extractLineConnections(TopoJsonLines: topojsonExport): Array<LineConnection> {
  const Connections: { from: [number, string]; to: [number, string]; color: string }[] = []

  const ConnectionsDedupe: string[] = []

  for (const line of TopoJsonLines.objects.lines.geometries) {
    line.arcs.reduce((prev, cur) => {
      const fromId = prev < 0 ? prev * -1 - 1 : prev
      const fromPart = prev < 0 ? 'top' : 'bottom'
      const toId = cur < 0 ? cur * -1 - 1 : cur
      const toPart = cur < 0 ? 'bottom' : 'top'

      const DedupeString = [line.properties.stroke, fromId, fromPart, toId, toPart].join(':')

      if (!ConnectionsDedupe.includes(DedupeString)) {
        Connections.push({
          from: [fromId, fromPart],
          to: [toId, toPart],
          color: line.properties.stroke
        })
        ConnectionsDedupe.push(DedupeString)
      }

      return cur
    })
  }

  return Connections
}

function ExtractLineSegments(
  TopoJsonLines: topojsonExport
): Map<
  string,
  { geometry: Array<coordpair>; top: coordpair; bottom: coordpair; colors: Array<string> }
> {
  const Segments = new Map()

  for (let i = 0; i < TopoJsonLines.arcs.length; i++) {
    const colorsInSegment = new Set(
      TopoJsonLines.objects.lines.geometries.map((line) => {
        if (i < 0 ? line.arcs.includes(i * -1 - 1) : line.arcs.includes(i))
          return line.properties.stroke || '#000000'
      })
    )

    Segments.set(`Segment:${i}`, {
      geometry: TopoJsonLines.arcs[i],
      top: TopoJsonLines.arcs[i][0],
      bottom: TopoJsonLines.arcs[i][TopoJsonLines.arcs[i].length - 1],
      colors: [...colorsInSegment].filter((e) => e != null)
    })
  }

  return Segments
}

export function CompareCoords(c1: coordpair, c2: coordpair): boolean {
  return c1[0] == c2[0] && c1[1] == c2[1]
}

function ProcessOffsetLines(
  lineString: Feature<LineString>,
  flags_should_smooth: boolean
): Position[] {
  if (flags_should_smooth) {
    return smooth(lineString.geometry.coordinates, { iteration: 2, factor: 0.75 })
  } else {
    return lineString.geometry.coordinates
  }
}

export function ClipLine(
  line: Feature<LineString>,
  clipdist: number
): [Feature<LineString>, Feature<LineString>, Feature<LineString>] {
  const LineLength = length(line)
  const MinLineLength = LineLength / 3

  /*
  // Throw line when we try clip a line that has fewer than 3 coordinates.
  if (line.geometry.coordinates.length < 3) {
    lineToUse = cleanCoords(
      lineString(
        lineChunk(line, LineLength / 4)
          .features.map((c) => c.geometry.coordinates)
          .flat()
      )
    )
  }*/

  let useMinLength = false
  if (MinLineLength <= clipdist) {
    useMinLength = true
  }

  const actualClipDist = useMinLength ? MinLineLength * 0.9 : clipdist

  const StartDistance = Math.min(MinLineLength, actualClipDist)
  const EndDistance = Math.max(MinLineLength * 2, LineLength - actualClipDist)

  const SlicedLine = lineSliceAlong(line, StartDistance, EndDistance)
  const StartSlicedLine = lineSliceAlong(line, 0, StartDistance)
  const EndSlicedLine = lineSliceAlong(line, EndDistance, LineLength)
  return [StartSlicedLine, SlicedLine, EndSlicedLine]
}

function ScaleSpacing(width: number, zoom: number) {
  const w = Math.max(1, width)
  const z = Math.round(zoom * 100) / 100
  const numerator = 0.025 * w ** 2 - 0.04 * w + 0.1
  const scalef = numerator / 2 ** (z - 10)
  return scalef
}

class LinesRendererWorker {
  LineSegments: Map<string, LineSegment> = new Map()
  LineConnections: Array<LineConnection> = []

  constructor() {}

  #add_loading_item() {
    postMessage({ type: 'add_loading_item' })
  }

  #remove_loading_item() {
    postMessage({ type: 'remove_loading_item' })
  }

  processTopologies(data: topojsonExport) {
    this.#add_loading_item()

    this.LineSegments = new Map()
    this.LineConnections = []

    const line_connections = extractLineConnections(data)
    const line_segments = ExtractLineSegments(data)

    for (const [key, segment] of line_segments.entries()) {
      this.LineSegments.set(key, segment)
    }

    for (const connection of line_connections) {
      this.LineConnections.push(connection)
    }

    this.#remove_loading_item()
  }

  renderLines(RequestedSpacing: number, viewbox: number[][]) {
    this.#add_loading_item()

    const time_start = performance.now()

    const spacing = Math.max(0.00005, Math.min(0.3, RequestedSpacing))

    const RenderedColourLine = new Map()
    const ColourSegmentsEndpoints = new Map()

    const shouldSortColors = true

    const viewport = polygon([viewbox])

    let r_segs_dbg = 0,
      s_segs_dbg = 0

    const flags_should_smooth = spacing < 0.007,
      flags_should_smooth_coords = spacing < 0.11

    for (const [segment_id, segment] of this.LineSegments.entries()) {
      const line = lineString(segment.geometry) as Feature<LineString>

      if (!booleanIntersects(viewport, line)) {
        s_segs_dbg++
        continue
      } else {
        r_segs_dbg++
      }

      const shouldReverseColor =
        distance([0, 0], segment.geometry[0]) >
        distance([0, 0], segment.geometry[segment.geometry.length - 1])

      const colors_sorted_by_luminosity = segment.colors.sort((a, b) => {
        const luminosityA =
          0.2126 * Math.pow(parseInt(a.substring(1, 2), 16) / 255, 2.2) +
          0.7152 * Math.pow(parseInt(a.substring(3, 2), 16) / 255, 2.2) +
          0.0722 * Math.pow(parseInt(a.substring(5, 2), 16) / 255, 2.2)
        const luminosityB =
          0.2126 * Math.pow(parseInt(b.substring(1, 2), 16) / 255, 2.2) +
          0.7152 * Math.pow(parseInt(b.substring(3, 2), 16) / 255, 2.2) +
          0.0722 * Math.pow(parseInt(b.substring(5, 2), 16) / 255, 2.2)
        return luminosityA - luminosityB
      })

      const colors_sorted = shouldReverseColor
        ? [...colors_sorted_by_luminosity].reverse()
        : colors_sorted_by_luminosity

      const colors = shouldSortColors ? colors_sorted : segment.colors

      const linespace = spacing * 2
      const totallines = segment.colors.length

      const line_clipped = ClipLine(line, Math.max(0.0049, spacing * 5) * 6)[1]

      for (let i = 0; i < totallines; i++) {
        const color = colors[i]

        const lineoffset = i * linespace - ((totallines - 1) * linespace) / 2

        const line_clipped_offset = lineOffset(line_clipped, lineoffset)

        const offset_clipped = ClipLine(line_clipped_offset, Math.max(0.0049, spacing * 5) * 6)

        const line_processed = ProcessOffsetLines(offset_clipped[1], flags_should_smooth)

        console.log(offset_clipped)

        ColourSegmentsEndpoints.set(
          `${segment_id}:${color}:top`,
          offset_clipped[0].geometry.coordinates[0]
        )

        ColourSegmentsEndpoints.set(
          `${segment_id}:${color}:top:buffer`,
          offset_clipped[0].geometry.coordinates
        )

        ColourSegmentsEndpoints.set(
          `${segment_id}:${color}:bottom`,
          offset_clipped[2].geometry.coordinates[offset_clipped[2].geometry.coordinates.length - 1]
        )

        ColourSegmentsEndpoints.set(
          `${segment_id}:${color}:bottom:buffer`,
          offset_clipped[2].geometry.coordinates
        )

        if (RenderedColourLine.has(color)) {
          RenderedColourLine.get(color).push(line_processed)
        } else {
          RenderedColourLine.set(color, [line_processed])
        }
      }
    }

    for (const connection of this.LineConnections) {
      const TopBufferBit = [
        /* 
        ColourSegmentsEndpoints.get(
          `Segment:${connection.to[0]}:${connection.color}:${connection.to[1]}`
        ), */
        ...(connection.to[1] == 'top'
          ? ColourSegmentsEndpoints.get(
              `Segment:${connection.to[0]}:${connection.color}:${connection.to[1]}:buffer`
            ) || []
          : (
              ColourSegmentsEndpoints.get(
                `Segment:${connection.to[0]}:${connection.color}:${connection.to[1]}:buffer`
              ) || []
            )
              .slice()
              .reverse())
      ]

      const BottomBufferBit = [
        ...(connection.from[1] == 'bottom'
          ? ColourSegmentsEndpoints.get(
              `Segment:${connection.from[0]}:${connection.color}:${connection.from[1]}:buffer`
            ) || []
          : (
              ColourSegmentsEndpoints.get(
                `Segment:${connection.from[0]}:${connection.color}:${connection.from[1]}:buffer`
              ) || []
            )
              .slice()
              .reverse())
      ]

      console.log(connection.to[1], TopBufferBit, connection.from[1], BottomBufferBit)

      const coords = [
        ...(connection.from[1] == 'bottom'
          ? ColourSegmentsEndpoints.get(
              `Segment:${connection.from[0]}:${connection.color}:${connection.from[1]}:buffer`
            ) || []
          : (
              ColourSegmentsEndpoints.get(
                `Segment:${connection.from[0]}:${connection.color}:${connection.from[1]}:buffer`
              ) || []
            )
              .slice()
              .reverse()),
        ...(connection.to[1] == 'top'
          ? ColourSegmentsEndpoints.get(
              `Segment:${connection.to[0]}:${connection.color}:${connection.to[1]}:buffer`
            ) || []
          : (
              ColourSegmentsEndpoints.get(
                `Segment:${connection.to[0]}:${connection.color}:${connection.to[1]}:buffer`
              ) || []
            )
              .slice()
              .reverse())
      ]

      if (!coords.includes(undefined)) {
        const ln = flags_should_smooth_coords
          ? smooth(coords, { iteration: 7, factor: 0.75 })
          : coords

        if (RenderedColourLine.has(connection.color)) {
          RenderedColourLine.get(connection.color).push(ln)
        } else {
          RenderedColourLine.set(connection.color, [ln])
        }
      }
    }

    const rendered = []

    for (const [color, coords] of RenderedColourLine.entries()) {
      rendered.push(
        multiLineString(coords, {
          id: color,
          stroke: color
        })
      )
    }

    this.#remove_loading_item()

    const time_end = performance.now()

    /*console.log(
      'rendered',
      Math.round(time_end - time_start) + 'ms',
      'r_segs_dbg',
      r_segs_dbg,
      's_segs_dbg',
      s_segs_dbg,
      'scale',
      spacing,
      'smoothing',
      flags_should_smooth
    )*/

    return featureCollection(rendered)
  }

  message_init(data: any) {
    this.processTopologies(data)
    postMessage({ type: 'finished_init' })
  }

  message_request_render(line_width: number, zoom: number, viewbox: number[][]) {
    const spacing = ScaleSpacing(line_width, zoom)
    const rendered = this.renderLines(spacing, viewbox)
    postMessage({ type: 'rendered', data: rendered })
  }
}

const worker = new LinesRendererWorker()

addEventListener('message', (event: { data: { type: string; data: any } }) => {
  if (event.data.type === 'init') {
    worker.message_init(event.data.data)
  } else if (event.data.type === 'request_render') {
    worker.message_request_render(
      event.data.data.width,
      event.data.data.zoom,
      event.data.data.viewbox
    )
  }
})
