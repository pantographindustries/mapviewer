import type { coordpair } from './types'
import type { Feature, LineString } from 'geojson'
import length from '@turf/length'
import lineSliceAlong from '@turf/line-slice-along'

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
