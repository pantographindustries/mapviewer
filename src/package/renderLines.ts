import lineOffset from '@turf/line-offset'
import { lineString, multiLineString, featureCollection } from '@turf/helpers'
import { ClipLine } from './utilities'
import type { LineConnection, LineSegment } from './types'
import type { Feature, LineString } from 'geojson'
import distance from '@turf/distance'

export class lineRenderer {
  LineSegments: Map<string, LineSegment> = new Map()
  LineConnections: Array<LineConnection> = []

  constructor() {}

  resetLineSegments() {
    this.LineSegments = new Map()
  }

  resetLineConnections() {
    this.LineConnections = []
  }

  addLineSegment(SegmentID: string, Segment: LineSegment) {
    this.LineSegments.set(SegmentID, Segment)
  }

  addLineConnection(Connection: LineConnection) {
    this.LineConnections.push(Connection)
  }

  renderLines(RequestedSpacing: number) {
    const spacing = Math.max(0.00005, Math.min(0.3, RequestedSpacing))

    const RenderedColourLine = new Map()
    const ColourSegmentsEndpoints = new Map()

    for (const [segment_id, segment] of this.LineSegments.entries()) {
      const shouldReverseColor =
        distance([0, 0], segment.geometry[0]) >
        distance([0, 0], segment.geometry[segment.geometry.length - 1])
      const colors = shouldReverseColor
        ? [...segment.colors.sort()].reverse()
        : segment.colors.sort()

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

    return featureCollection(rendered)
  }
}
