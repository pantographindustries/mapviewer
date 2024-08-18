import type { Feature, LineString } from 'geojson'
import length from '@turf/length'
import lineSliceAlong from '@turf/line-slice-along'
import lineOffset from '@turf/line-offset'
import { lineString, multiLineString, featureCollection } from '@turf/helpers'
import distance from '@turf/distance'

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

export function ClipLine(line: Feature<LineString>, clipdist: number): Feature<LineString> {
  const LineLength = length(line)
  const MinLineLength = LineLength / 3

  // Throw line when we try clip a line that's smaller than a third of the distance asked OR has fewer than 4 coordinates.
  if (MinLineLength <= clipdist || line.geometry.coordinates.length < 4) {
    return line
  }

  const StartDistance = Math.min(MinLineLength, clipdist)
  const EndDistance = Math.max(MinLineLength * 2, LineLength - clipdist)

  const SlicedLine = lineSliceAlong(line, StartDistance, EndDistance)
  return SlicedLine
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

  renderLines(RequestedSpacing: number) {
    this.#add_loading_item()
    const spacing = Math.max(0.00005, Math.min(0.3, RequestedSpacing))

    const RenderedColourLine = new Map()
    const ColourSegmentsEndpoints = new Map()

    for (const [segment_id, segment] of this.LineSegments.entries()) {
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

      const colors = shouldReverseColor
        ? [...colors_sorted_by_luminosity].reverse()
        : colors_sorted_by_luminosity

      const linespace = spacing * 2
      const totallines = segment.colors.length

      const line = lineString(segment.geometry) as Feature<LineString>
      const line_clipped = ClipLine(line, Math.max(0.005, spacing * 5))

      for (let i = 0; i < totallines; i++) {
        const color = colors[i]
        const lineoffset = i * linespace - ((totallines - 1) * linespace) / 2

        const line_clipped_offset = lineOffset(line_clipped, lineoffset)

        const line_processed = line_clipped_offset.geometry.coordinates

        ColourSegmentsEndpoints.set(`${segment_id}:${color}:top`, line_processed[0])
        ColourSegmentsEndpoints.set(
          `${segment_id}:${color}:bottom`,
          line_processed[line_processed.length - 1]
        )

        if (RenderedColourLine.has(color)) {
          RenderedColourLine.get(color).push(line_processed)
        } else {
          RenderedColourLine.set(color, [line_processed])
        }
      }
    }

    for (const connection of this.LineConnections) {
      const coords = [
        ColourSegmentsEndpoints.get(
          `Segment:${connection.from[0]}:${connection.color}:${connection.from[1]}`
        ),
        ColourSegmentsEndpoints.get(
          `Segment:${connection.to[0]}:${connection.color}:${connection.to[1]}`
        )
      ]

      if (!coords.includes(undefined)) {
        RenderedColourLine.get(connection.color).push(coords)
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
    return featureCollection(rendered)
  }

  message_init(data: any) {
    this.processTopologies(data)
    postMessage({ type: 'finished_init' })
  }

  message_request_render(line_width: number, zoom: number) {
    const spacing = ScaleSpacing(line_width, zoom)
    const rendered = this.renderLines(spacing)
    postMessage({ type: 'rendered', data: rendered })
  }
}

const worker = new LinesRendererWorker()

addEventListener('message', (event: { data: { type: string; data: any } }) => {
  if (event.data.type === 'init') {
    worker.message_init(event.data.data)
  } else if (event.data.type === 'request_render') {
    worker.message_request_render(event.data.data.width, event.data.data.zoom)
  }
})
