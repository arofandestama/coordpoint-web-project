import { dmsToDd } from '../lib/coordinates/dms-to-dd'
import { CoordinateValidationError } from '../lib/coordinates/types'

describe('dmsToDd', () => {
  it("converts 49°30'10\" N to a positive decimal latitude", () => {
    expect(dmsToDd({ degrees: 49, minutes: 30, seconds: 10, direction: 'N' }, 'latitude')).toBeCloseTo(49.502778, 5)
  })

  it("converts 123°30'20\" W to a negative decimal longitude", () => {
    expect(dmsToDd({ degrees: 123, minutes: 30, seconds: 20, direction: 'W' }, 'longitude')).toBeCloseTo(-123.505556, 5)
  })

  it("treats E as a positive longitude", () => {
    expect(dmsToDd({ degrees: 123, minutes: 30, seconds: 20, direction: 'E' }, 'longitude')).toBeCloseTo(123.505556, 5)
  })

  it("treats S as a negative latitude", () => {
    expect(dmsToDd({ degrees: 6, minutes: 12, seconds: 0, direction: 'S' }, 'latitude')).toBeCloseTo(-6.2, 5)
  })

  it('converts the zero coordinate to exactly 0', () => {
    expect(dmsToDd({ degrees: 0, minutes: 0, seconds: 0, direction: 'N' }, 'latitude')).toBe(0)
  })

  it('throws when minutes exceed 59', () => {
    expect(() => dmsToDd({ degrees: 49, minutes: 60, seconds: 0, direction: 'N' }, 'latitude')).toThrow(
      new CoordinateValidationError('minutes', 'Menit harus berupa angka antara 0 dan 59.'),
    )
  })

  it('throws when seconds reach 60', () => {
    expect(() => dmsToDd({ degrees: 49, minutes: 30, seconds: 60, direction: 'N' }, 'latitude')).toThrow(
      new CoordinateValidationError('seconds', 'Detik harus berupa angka antara 0 dan 59.999.'),
    )
  })

  it('throws when latitude degrees exceed 90', () => {
    expect(() => dmsToDd({ degrees: 91, minutes: 0, seconds: 0, direction: 'N' }, 'latitude')).toThrow(
      new CoordinateValidationError('degrees', 'Derajat latitude harus berupa angka antara 0 dan 90.'),
    )
  })

  it('throws when longitude degrees exceed 180', () => {
    expect(() => dmsToDd({ degrees: 181, minutes: 0, seconds: 0, direction: 'E' }, 'longitude')).toThrow(
      new CoordinateValidationError('degrees', 'Derajat longitude harus berupa angka antara 0 dan 180.'),
    )
  })

  it('throws when degrees are negative', () => {
    expect(() => dmsToDd({ degrees: -1, minutes: 0, seconds: 0, direction: 'E' }, 'longitude')).toThrow(
      new CoordinateValidationError('degrees', 'Derajat longitude harus berupa angka antara 0 dan 180.'),
    )
  })

  it('throws when degrees are NaN', () => {
    expect(() => dmsToDd({ degrees: Number.NaN, minutes: 0, seconds: 0, direction: 'N' }, 'latitude')).toThrow(
      new CoordinateValidationError('degrees', 'Derajat latitude harus berupa angka antara 0 dan 90.'),
    )
  })

  it("throws when a latitude coordinate uses an E/W direction", () => {
    expect(() => dmsToDd({ degrees: 10, minutes: 0, seconds: 0, direction: 'E' }, 'latitude')).toThrow(
      new CoordinateValidationError('direction', 'Arah latitude harus N atau S.'),
    )
  })
})
