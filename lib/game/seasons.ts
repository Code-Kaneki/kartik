export type SeasonId = 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter'
export type WeatherKind = 'petal' | 'pollen' | 'rain' | 'leaf' | 'snow'

export type SeasonPalette = {
  label: string
  grassA: string
  grassB: string
  grassDark: string
  grassLight: string
  flowers: boolean
  tree: [dark: string, mid: string, light: string]
  weather: WeatherKind
  weatherCount: number
  weatherColors: string[]
  fireflies: boolean
}

export const SEASON_ORDER: SeasonId[] = ['spring', 'summer', 'monsoon', 'autumn', 'winter']

export const SEASONS: Record<SeasonId, SeasonPalette> = {
  spring: {
    label: 'Spring',
    grassA: '#b4dca0',
    grassB: '#acd697',
    grassDark: '#8fc283',
    grassLight: '#cdeab8',
    flowers: true,
    tree: ['#e48aa8', '#f3a6bf', '#fbcadb'],
    weather: 'petal',
    weatherCount: 34,
    weatherColors: ['#f7a8c4', '#fbcadb', '#f3a6bf', '#ffffff'],
    fireflies: true,
  },
  summer: {
    label: 'Summer',
    grassA: '#9fd486',
    grassB: '#97cd7e',
    grassDark: '#76b066',
    grassLight: '#c2e8a6',
    flowers: true,
    tree: ['#4f9a5a', '#6cb66a', '#93d083'],
    weather: 'pollen',
    weatherCount: 16,
    weatherColors: ['#fff6c2', '#ffe58a', '#ffffff'],
    fireflies: true,
  },
  monsoon: {
    label: 'Monsoon',
    grassA: '#8fc59a',
    grassB: '#88bf93',
    grassDark: '#6ea47e',
    grassLight: '#b0dbb6',
    flowers: false,
    tree: ['#3f8462', '#57a072', '#7cbf8c'],
    weather: 'rain',
    weatherCount: 80,
    weatherColors: ['rgba(214,232,255,0.75)', 'rgba(180,210,245,0.65)'],
    fireflies: false,
  },
  autumn: {
    label: 'Autumn',
    grassA: '#d6c890',
    grassB: '#cfc087',
    grassDark: '#b4a26a',
    grassLight: '#e8dbab',
    flowers: false,
    tree: ['#c9643f', '#e08a4a', '#f2b25e'],
    weather: 'leaf',
    weatherCount: 26,
    weatherColors: ['#d9643f', '#e8904a', '#f2b25e', '#b8492f'],
    fireflies: true,
  },
  winter: {
    label: 'Winter',
    grassA: '#eaf0f7',
    grassB: '#e2e9f2',
    grassDark: '#c4d0e0',
    grassLight: '#ffffff',
    flowers: false,
    tree: ['#b9cadd', '#dbe6f2', '#ffffff'],
    weather: 'snow',
    weatherCount: 55,
    weatherColors: ['#ffffff', '#f2f6ff', '#dfe8f7'],
    fireflies: false,
  },
}

/** Length of one full day + night cycle, in seconds. */
export const DAY_LENGTH = 30

/** 0 = full daylight, 1 = full night for a cycle position in [0, 1). */
export function darknessAt(c: number) {
  if (c < 0.42) return 0
  if (c < 0.52) return (c - 0.42) / 0.1
  if (c < 0.9) return 1
  return 1 - (c - 0.9) / 0.1
}

/** Warm sunset/sunrise tint strength for a cycle position. */
export function duskAt(c: number) {
  const bell = (center: number, width: number) => Math.max(0, 1 - Math.abs(c - center) / width)
  return Math.max(bell(0.47, 0.08), bell(0.95, 0.06), bell(-0.05 + 1, 0.06))
}
