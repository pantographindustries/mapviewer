import { describe, expect, test } from 'vitest'
import type { topojsonExport } from './types'
import { ExtractLineSegments } from './extractLineSegments'

const testData: topojsonExport = {
  type: 'Topology',
  objects: {
    lines: {
      type: 'GeometryCollection',
      geometries: [
        {
          type: 'LineString',
          arcs: [0, 1, 2],
          properties: { title: 'TestLine1:FF0000', stroke: '#FF0000', agency: 'TestAgency1' }
        }
      ]
    }
  },
  arcs: [
    [
      [0, 0],
      [5, 5]
    ],
    [
      [5, 5],
      [7, 7]
    ],
    [
      [7, 7],
      [10, 10]
    ]
  ],
  bbox: [0, 0, 10, 10],
  upperBounds: [0, 0]
}

const successfulTestData = {
  'Segment:0': {
    geometry: [
      [0, 0],
      [5, 5]
    ],
    top: [0, 0],
    bottom: [5, 5],
    colors: ['#FF0000']
  },
  'Segment:1': {
    geometry: [
      [5, 5],
      [7, 7]
    ],
    top: [5, 5],
    bottom: [7, 7],
    colors: ['#FF0000']
  },
  'Segment:2': {
    geometry: [
      [7, 7],
      [10, 10]
    ],
    top: [7, 7],
    bottom: [10, 10],
    colors: ['#FF0000']
  }
}

describe('ExtractLineSegments', () => {
  const lineSegments = ExtractLineSegments(testData)
  const lsAsobject = Object.fromEntries(lineSegments)

  test('ExtractLineSegments returns segments', () => {
    expect(lsAsobject).toMatchObject(successfulTestData)
  })
})
