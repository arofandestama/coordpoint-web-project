import { ddToDms } from './ddToDms'
import { CoordinateValidationError } from '@/types/coordinate.types'

describe('ddToDms', () => {
  it('converts 49.50278 latitude to 49°30\'10.01" N', () => {
    expect(ddToDms(49.50278, 'latitude')).toEqual({ degrees: 49, minutes: 30, seconds: 10.01, direction: 'N' })
  })

  it('converts 123.50556 longitude to 123°30\'20.02" E (positive → E)', () => {
    expect(ddToDms(123.50556, 'longitude')).toEqual({ degrees: 123, minutes: 30, seconds: 20.02, direction: 'E' })
  })

  it('converts -123.50556 longitude to 123°30\'20.02" W', () => {
    expect(ddToDms(-123.50556, 'longitude')).toEqual({ degrees: 123, minutes: 30, seconds: 20.02, direction: 'W' })
  })

  it('converts -6.2 latitude to 6°12\'0" S', () => {
    expect(ddToDms(-6.2, 'latitude')).toEqual({ degrees: 6, minutes: 12, seconds: 0, direction: 'S' })
  })

  it('converts 0 to the equator coordinate with direction N', () => {
    expect(ddToDms(0, 'latitude')).toEqual({ degrees: 0, minutes: 0, seconds: 0, direction: 'N' })
  })

  it('converts the 90° latitude boundary', () => {
    expect(ddToDms(90, 'latitude')).toEqual({ degrees: 90, minutes: 0, seconds: 0, direction: 'N' })
  })

  it('converts the -180° longitude boundary to direction W', () => {
    expect(ddToDms(-180, 'longitude')).toEqual({ degrees: 180, minutes: 0, seconds: 0, direction: 'W' })
  })

  it('propagates rounding carries (59.999999 → 60°0\'0" N)', () => {
    expect(ddToDms(59.999999, 'latitude')).toEqual({ degrees: 60, minutes: 0, seconds: 0, direction: 'N' })
  })

  it('throws when latitude exceeds 90', () => {
    expect(() => ddToDms(91, 'latitude')).toThrow(
      new CoordinateValidationError('dd', 'Nilai latitude harus berupa angka antara -90 dan 90.'),
    )
  })

  it('throws when longitude is below -180', () => {
    expect(() => ddToDms(-181, 'longitude')).toThrow(
      new CoordinateValidationError('dd', 'Nilai longitude harus berupa angka antara -180 dan 180.'),
    )
  })

  it('throws when the value is NaN', () => {
    expect(() => ddToDms(Number.NaN, 'latitude')).toThrow(
      new CoordinateValidationError('dd', 'Nilai latitude harus berupa angka antara -90 dan 90.'),
    )
  })
})
