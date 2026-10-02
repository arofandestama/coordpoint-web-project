import { formatDd } from './dmsToDd'
import { formatDms } from './ddToDms'
import { CoordinateValidationError } from '@/types/coordinate.types'

describe('formatDd', () => {
  it('formats a positive latitude with five decimals and direction N', () => {
    expect(formatDd(49.5027777777, 'latitude')).toBe('49.50278° N')
  })

  it('formats a negative longitude as an absolute value with direction W', () => {
    expect(formatDd(-123.5055555555, 'longitude')).toBe('123.50556° W')
  })

  it('formats a southern latitude with direction S', () => {
    expect(formatDd(-6.2, 'latitude')).toBe('6.20000° S')
  })

  it('supports a custom precision', () => {
    expect(formatDd(49.5, 'latitude', 2)).toBe('49.50° N')
  })
})

describe('formatDms', () => {
  it('formats fractional seconds with two decimals', () => {
    expect(formatDms({ degrees: 49, minutes: 30, seconds: 10.01, direction: 'N' }, 'latitude')).toBe(`49°30'10.01" N`)
  })

  it('formats integer seconds without decimals', () => {
    expect(formatDms({ degrees: 6, minutes: 12, seconds: 0, direction: 'S' }, 'latitude')).toBe(`6°12'0" S`)
  })

  it('formats a western longitude', () => {
    expect(formatDms({ degrees: 123, minutes: 30, seconds: 20.02, direction: 'W' }, 'longitude')).toBe(
      `123°30'20.02" W`,
    )
  })

  it('trims trailing zeros from fractional seconds (10.5 → 10.5)', () => {
    expect(formatDms({ degrees: 10, minutes: 20, seconds: 10.5, direction: 'E' }, 'longitude')).toBe(`10°20'10.5" E`)
  })

  it('throws for out-of-range minutes', () => {
    expect(() => formatDms({ degrees: 10, minutes: 60, seconds: 0, direction: 'E' }, 'longitude')).toThrow(
      new CoordinateValidationError('minutes', 'Menit harus berupa angka antara 0 dan 59.'),
    )
  })
})
