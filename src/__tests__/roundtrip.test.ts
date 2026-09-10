import { ddToDms } from '../lib/coordinates/dd-to-dms'
import { dmsToDd } from '../lib/coordinates/dms-to-dd'
import type { Axis } from '../lib/coordinates/types'

interface RoundtripCase {
  value: number
  axis: Axis
}

/**
 * Boundary- and precision-heavy sample values. Each value is converted
 * DD → DMS → DD and must land back on (numerically) the same value.
 */
const roundtripCases: RoundtripCase[] = [
  { value: 49.50278, axis: 'latitude' },
  { value: -123.50556, axis: 'longitude' },
  { value: 6.2, axis: 'latitude' },
  { value: -6.2001, axis: 'latitude' },
  { value: 0.5, axis: 'latitude' },
  { value: 89.999, axis: 'latitude' },
  { value: 179.999, axis: 'longitude' },
  { value: -0.001, axis: 'latitude' },
]

describe('DMS ⇄ DD roundtrip', () => {
  roundtripCases.forEach(({ value, axis }) => {
    it(`roundtrips ${value} on the ${axis} axis`, () => {
      const dms = ddToDms(value, axis)
      expect(dmsToDd(dms, axis)).toBeCloseTo(value, 4)
    })
  })
})
