import type { coordpair, topojsonExport } from './types'

/**
 * Extracts line segments from a TopoJSON object
 * @param {topojsonExport} TopoJsonLines - TopoJSON object containing lines
 * @returns {Map<string, {geometry: Array<coordpair>, top: coordpair, bottom: coordpair, colors: Array<string>}>} - Map of segments
 */
export function ExtractLineSegments(
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
