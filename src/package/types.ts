export type coordpair = [number, number]

export type topojsonExport = {
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

export type LineSegment = {
  geometry: Array<coordpair>
  top: coordpair
  bottom: coordpair
  colors: Array<string>
}

export type LineConnection = { from: [number, string]; to: [number, string]; color: string }
