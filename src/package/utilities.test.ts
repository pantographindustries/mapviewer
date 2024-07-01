import { describe, expect, test } from 'vitest'
import { CompareCoords } from './utilities'
import type { coordpair } from './types'

describe('Utilities: CompareCoords', () => {
  test('Two of the same coordinates compare to be the same', () => {
    const a: coordpair = [1, 2]
    const b: coordpair = [1, 2]

    expect(CompareCoords(a, b)).toBeTruthy()
  })
  test('Two different coordinates compare to not be the same', () => {
    const a: coordpair = [1, 2]
    const b: coordpair = [2, 1]

    expect(CompareCoords(a, b)).toBeFalsy()
  })
})
