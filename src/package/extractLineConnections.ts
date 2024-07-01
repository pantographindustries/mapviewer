import type { LineConnection, topojsonExport } from './types'

export function extractLineConnections(TopoJsonLines: topojsonExport): Array<LineConnection> {
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
