import { describe, expect, test } from 'vitest'
import type { topojsonExport } from './types'
import { extractLineConnections } from './extractLineConnections'

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
        },
        {
          type: 'LineString',
          arcs: [0, 1, 3],
          properties: { title: 'TestLine2:00FF00', stroke: '#00FF00', agency: 'TestAgency1' }
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
    ],
    [
      [7, 7],
      [7, 10]
    ]
  ],
  bbox: [0, 0, 10, 10],
  upperBounds: [0, 0]
}

const successfulTestData = [
  { from: [0, 'bottom'], to: [1, 'top'], color: '#FF0000' },
  { from: [1, 'bottom'], to: [2, 'top'], color: '#FF0000' },
  { from: [0, 'bottom'], to: [1, 'top'], color: '#00FF00' },
  { from: [1, 'bottom'], to: [3, 'top'], color: '#00FF00' }
]

describe('ExtractLineConnections', () => {
  const lineConnections = extractLineConnections(testData)

  test('There are four connections', () => {
    expect(lineConnections).toHaveLength(4)
  })

  test('Connections are correct', () => {
    expect(lineConnections).toEqual(successfulTestData)
  })
})
