import {
  BRIDGE_ROWS,
  BUILDINGS,
  COLS,
  HEIGHT,
  PROPS,
  RIVER_COLS,
  ROWS,
  TILE,
  WIDTH,
  hash,
  isPath,
  isRiver,
  type BuildingLayout,
  type BuildingStyle,
} from './map'

import { SEASONS, type SeasonId, type SeasonPalette } from './seasons'

type Ctx = CanvasRenderingContext2D

export type Dir = 'up' | 'down' | 'left' | 'right'

let pal: SeasonPalette = SEASONS.spring

export function setDrawSeason(id: SeasonId) {
  pal = SEASONS[id]
}

const C = {
  grassA: '#b4dca0',
  grassB: '#acd697',
  grassDark: '#8fc283',
  grassLight: '#cdeab8',
  path: '#ecdab4',
  pathStone: '#dcc59b',
  pathLight: '#f7ecd2',
  pathEdge: '#c9ae84',
  water: '#9dd3e8',
  waterDark: '#7fbfd9',
  waterLight: '#dff4fb',
  bank: '#b79b70',
  wood: '#b98a5c',
  woodDark: '#8a5f3c',
  woodLight: '#d6aa78',
  ink: '#3b2a3f',
  stone: '#cfc8bc',
  stoneDark: '#a49c90',
  glow: '#ffd47a',
}

const r = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

/* ------------------------------------------------------------------ */
/* Character                                                           */
/* ------------------------------------------------------------------ */

export const SKIN = '#f3c9a4'
export const BLUSH = '#f29b9b'

export type Look = {
  hair: string
  top: string
  topDark: string
  string: string
  pants: string
  shoes: string
  skin?: string
  longHair?: boolean
  bow?: string
}

export const KARTIK_LOOK: Look = {
  hair: '#2d2233',
  top: '#8b7bd8',
  topDark: '#6a5bb5',
  string: '#efe8ff',
  pants: '#3e4a6b',
  shoes: '#f5f0e6',
}

/** Draws a 12x16 villager sprite with its top-left at (ox, oy). frame: 0 idle, 1/2 walk. */
export function drawCharacter(ctx: Ctx, ox: number, oy: number, dir: Dir, frame: number, look: Look = KARTIK_LOOK) {
  const HAIR = look.hair
  const HOODIE = look.top
  const HOODIE_DARK = look.topDark
  const STRING = look.string
  const PANTS = look.pants
  const SHOES = look.shoes
  const SKIN = look.skin ?? '#f3c9a4'
  const flip = dir === 'left'
  const bob = frame === 0 ? 0 : -1
  const P = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(Math.round(ox + (flip ? 12 - x - w : x)), Math.round(oy + y), w, h)
  }

  if (dir === 'down' || dir === 'up') {
    const leftLeg = frame === 1 ? 2 : 3
    const rightLeg = frame === 2 ? 2 : 3
    P(3, 12, 2, leftLeg, PANTS)
    P(7, 12, 2, rightLeg, PANTS)
    P(3, 12 + leftLeg, 2, 1, SHOES)
    P(7, 12 + rightLeg, 2, 1, SHOES)

    P(2, 7 + bob, 8, 5, HOODIE)
    P(2, 11 + bob, 8, 1, HOODIE_DARK)
    P(1, 8 + bob + (frame === 2 ? 1 : 0), 1, 3, HOODIE_DARK)
    P(10, 8 + bob + (frame === 1 ? 1 : 0), 1, 3, HOODIE_DARK)
    P(1, 11 + bob + (frame === 2 ? 1 : 0), 1, 1, SKIN)
    P(10, 11 + bob + (frame === 1 ? 1 : 0), 1, 1, SKIN)

    if (dir === 'down') {
      P(5, 8 + bob, 1, 2, STRING)
      P(6, 8 + bob, 1, 2, STRING)
      P(3, 0 + bob, 6, 1, HAIR)
      P(2, 1 + bob, 8, 3, HAIR)
      P(3, 4 + bob, 6, 3, SKIN)
      P(2, 4 + bob, 1, 2, HAIR)
      P(9, 4 + bob, 1, 2, HAIR)
      P(4, 4 + bob, 2, 1, HAIR)
      P(4, 5 + bob, 1, 1, HAIR)
      P(7, 5 + bob, 1, 1, HAIR)
      P(3, 6 + bob, 1, 1, BLUSH)
      P(8, 6 + bob, 1, 1, BLUSH)
      if (look.longHair) {
        P(1, 3 + bob, 2, 7, HAIR)
        P(9, 3 + bob, 2, 7, HAIR)
      }
      if (look.bow) {
        P(8, 0 + bob, 3, 2, look.bow)
        P(9, 2 + bob, 1, 1, look.bow)
      }
    } else {
      P(3, 7 + bob, 6, 2, HOODIE_DARK)
      P(3, 0 + bob, 6, 1, HAIR)
      P(2, 1 + bob, 8, 6, HAIR)
      P(3, 6 + bob, 6, 1, SKIN)
      if (look.longHair) P(2, 6 + bob, 8, 4, HAIR)
      if (look.bow) P(4, 0 + bob, 4, 2, look.bow)
    }
    return
  }

  // side view (right; left is mirrored)
  let back = 3
  let front = 3
  let backX = 4
  let frontX = 6
  if (frame === 1) {
    backX = 3
    frontX = 7
    back = 2
  } else if (frame === 2) {
    backX = 5
    frontX = 5
    front = 3
  }
  P(backX, 12, 2, back, PANTS)
  P(backX, 12 + back, 2, 1, SHOES)
  P(frontX, 12, 2, front, PANTS)
  P(frontX, 12 + front, 3, 1, SHOES)

  P(3, 7 + bob, 6, 5, HOODIE)
  P(3, 11 + bob, 6, 1, HOODIE_DARK)
  const armX = frame === 1 ? 6 : frame === 2 ? 4 : 5
  P(armX, 8 + bob, 2, 3, HOODIE_DARK)
  P(armX, 11 + bob, 2, 1, SKIN)

  P(3, 0 + bob, 6, 1, HAIR)
  P(2, 1 + bob, 8, 3, HAIR)
  P(4, 4 + bob, 5, 3, SKIN)
  P(2, 4 + bob, 3, 2, HAIR)
  P(8, 4 + bob, 1, 1, HAIR)
  P(7, 5 + bob, 1, 1, HAIR)
  P(8, 6 + bob, 1, 1, BLUSH)
  if (look.longHair) P(1, 3 + bob, 3, 7, HAIR)
  if (look.bow) P(3, 0 + bob, 3, 2, look.bow)
}

/* ------------------------------------------------------------------ */
/* Static background                                                   */
/* ------------------------------------------------------------------ */

function drawGrassTile(ctx: Ctx, c: number, r0: number) {
  const x = c * TILE
  const y = r0 * TILE
  r(ctx, x, y, TILE, TILE, (c + r0) % 2 === 0 ? pal.grassA : pal.grassB)
  const h = hash(c, r0)
  const h2 = hash(r0 + 31, c + 7)
  r(ctx, x + Math.floor(h * 12) + 1, y + Math.floor(h2 * 12) + 2, 1, 2, pal.grassDark)
  r(ctx, x + Math.floor(h * 12) + 2, y + Math.floor(h2 * 12) + 1, 1, 3, pal.grassDark)
  r(ctx, x + Math.floor(h2 * 10) + 3, y + Math.floor(h * 10) + 4, 1, 1, pal.grassLight)
  if (!pal.flowers && h > 0.85 && pal.weather === 'leaf') {
    r(ctx, x + 4 + Math.floor(h2 * 7), y + 5 + Math.floor(h * 6), 2, 1, '#d9643f')
  }
  if (pal.flowers && h > 0.82) {
    const colors = ['#f7a8c4', '#fff6e0', '#ffd98a', '#c9b8ee']
    const fc = colors[Math.floor(h2 * colors.length)]
    const fx = x + 4 + Math.floor(h2 * 7)
    const fy = y + 4 + Math.floor(h * 6)
    r(ctx, fx, fy - 1, 1, 1, fc)
    r(ctx, fx - 1, fy, 3, 1, fc)
    r(ctx, fx, fy + 1, 1, 1, fc)
    r(ctx, fx, fy, 1, 1, '#f5c451')
  }
}

function drawPathTile(ctx: Ctx, c: number, r0: number) {
  const x = c * TILE
  const y = r0 * TILE
  r(ctx, x, y, TILE, TILE, C.path)
  const h = hash(c + 5, r0 + 9)
  const stones = [
    [1, 1, 6, 4],
    [9, 2, 5, 5],
    [2, 8, 5, 5],
    [9, 10, 6, 4],
  ]
  stones.forEach(([sx, sy, sw, sh], i) => {
    const ox = Math.floor(hash(c + i, r0) * 2)
    r(ctx, x + sx + ox, y + sy, sw, sh, C.pathStone)
    r(ctx, x + sx + ox, y + sy, sw, 1, C.pathLight)
  })
  if (h > 0.7) r(ctx, x + 7, y + 7, 2, 1, C.pathEdge)
  if (!isPath(c, r0 - 1) && !isRiver(c)) r(ctx, x, y, TILE, 1, C.pathEdge)
  if (!isPath(c, r0 + 1) && !isRiver(c)) r(ctx, x, y + 15, TILE, 1, C.pathEdge)
  if (!isPath(c - 1, r0) && !isRiver(c - 1)) r(ctx, x, y, 1, TILE, C.pathEdge)
  if (!isPath(c + 1, r0) && !isRiver(c + 1)) r(ctx, x + 15, y, 1, TILE, C.pathEdge)
}

function drawRoof(ctx: Ctx, bx: number, by: number, base: string, dark: string, light: string) {
  for (let s = 0; s < 5; s++) {
    const w = 40 + s * 12
    const x = bx + 40 - w / 2
    const y = by - 4 + s * 6
    r(ctx, x, y, w, 6, base)
    r(ctx, x, y, w, 1, light)
    r(ctx, x, y + 5, w, 1, dark)
    for (let k = x + 3 + (s % 2) * 3; k < x + w - 2; k += 6) r(ctx, k, y + 1, 1, 4, dark)
  }
  r(ctx, bx - 4, by + 26, 88, 2, C.ink)
}

function drawWindow(ctx: Ctx, x: number, y: number, frame: string, curtain: string) {
  r(ctx, x - 1, y - 1, 14, 12, frame)
  r(ctx, x, y, 12, 10, '#bfe3f2')
  r(ctx, x, y, 12, 3, '#e6f6fb')
  r(ctx, x + 5, y, 2, 10, frame)
  r(ctx, x, y + 4, 12, 2, frame)
  r(ctx, x, y, 3, 6, curtain)
  r(ctx, x + 9, y, 3, 6, curtain)
}

function drawFlowerBox(ctx: Ctx, x: number, y: number) {
  r(ctx, x - 1, y, 14, 3, C.woodDark)
  for (let i = 0; i < 4; i++) {
    r(ctx, x + i * 3 + 1, y - 2, 2, 2, i % 2 ? '#f7a8c4' : '#fff1a8')
    r(ctx, x + i * 3 + 1, y - 0, 2, 1, '#6f9a6a')
  }
}

function drawEmblem(ctx: Ctx, style: BuildingStyle, cx: number, cy: number) {
  if (style === 'house') {
    r(ctx, cx - 3, cy - 2, 2, 2, '#fff6e0')
    r(ctx, cx + 1, cy - 2, 2, 2, '#fff6e0')
    r(ctx, cx - 3, cy, 6, 2, '#fff6e0')
    r(ctx, cx - 2, cy + 2, 4, 1, '#fff6e0')
    r(ctx, cx - 1, cy + 3, 2, 1, '#fff6e0')
  } else if (style === 'guild') {
    r(ctx, cx - 1, cy - 4, 2, 9, '#fff6e0')
    r(ctx, cx - 3, cy - 2, 6, 1, '#fff6e0')
    r(ctx, cx - 4, cy + 1, 8, 1, '#ffd47a')
    r(ctx, cx - 1, cy + 4, 2, 2, '#ffd47a')
  } else if (style === 'post') {
    r(ctx, cx - 5, cy - 3, 10, 7, '#fff6e0')
    r(ctx, cx - 4, cy - 2, 2, 1, '#c96f5a')
    r(ctx, cx - 2, cy - 1, 1, 1, '#c96f5a')
    r(ctx, cx - 1, cy, 2, 1, '#c96f5a')
    r(ctx, cx + 1, cy - 1, 1, 1, '#c96f5a')
    r(ctx, cx + 2, cy - 2, 2, 1, '#c96f5a')
  }
}

function drawHouse(ctx: Ctx, b: BuildingLayout) {
  const bx = b.x * TILE
  const by = b.y * TILE
  r(ctx, bx + 56, by - 10, 9, 16, '#b86b5a')
  r(ctx, bx + 55, by - 11, 11, 3, '#8f4f44')
  r(ctx, bx + 4, by + 26, 72, 38, '#f6d8b8')
  for (let y = by + 30; y < by + 60; y += 6) r(ctx, bx + 4, y, 72, 1, '#ecc8a3')
  r(ctx, bx + 4, by + 26, 2, 38, '#a86f4c')
  r(ctx, bx + 74, by + 26, 2, 38, '#a86f4c')
  drawRoof(ctx, bx, by, '#df8383', '#bf6670', '#f2a7a2')
  drawEmblem(ctx, 'house', bx + 40, by + 10)
  drawWindow(ctx, bx + 11, by + 34, '#a86f4c', '#c9b8ee')
  drawWindow(ctx, bx + 57, by + 34, '#a86f4c', '#c9b8ee')
  drawFlowerBox(ctx, bx + 11, by + 45)
  drawFlowerBox(ctx, bx + 57, by + 45)
}

function drawGuild(ctx: Ctx, b: BuildingLayout) {
  const bx = b.x * TILE
  const by = b.y * TILE
  r(ctx, bx + 4, by + 26, 72, 38, '#d9a86c')
  for (let y = by + 29; y < by + 62; y += 5) r(ctx, bx + 4, y, 72, 1, '#bd8a52')
  r(ctx, bx + 4, by + 26, 3, 38, '#8a5f3c')
  r(ctx, bx + 73, by + 26, 3, 38, '#8a5f3c')
  drawRoof(ctx, bx, by, '#a995d6', '#8670bd', '#c9b8ee')
  drawEmblem(ctx, 'guild', bx + 40, by + 10)
  // quest board
  r(ctx, bx + 9, by + 32, 18, 16, '#8a5f3c')
  r(ctx, bx + 10, by + 33, 16, 14, '#e9cf9e')
  r(ctx, bx + 12, by + 35, 5, 4, '#fff6e0')
  r(ctx, bx + 19, by + 35, 5, 5, '#f7b89b')
  r(ctx, bx + 13, by + 41, 6, 4, '#c9b8ee')
  r(ctx, bx + 20, by + 42, 4, 3, '#fff6e0')
  drawWindow(ctx, bx + 57, by + 34, '#8a5f3c', '#f7b89b')
  // banners
  r(ctx, bx + 30, by + 28, 3, 10, '#e0876a')
  r(ctx, bx + 47, by + 28, 3, 10, '#e0876a')
  r(ctx, bx + 30, by + 38, 1, 1, '#e0876a')
  r(ctx, bx + 49, by + 38, 1, 1, '#e0876a')
}

function drawDojo(ctx: Ctx, b: BuildingLayout) {
  const bx = b.x * TILE
  const by = b.y * TILE
  r(ctx, bx + 4, by + 26, 72, 38, '#f4ecd8')
  for (const px of [4, 22, 54, 72]) r(ctx, bx + px, by + 26, 4, 38, '#5b4636')
  r(ctx, bx + 4, by + 40, 72, 2, '#5b4636')
  // shoji windows
  for (const wx of [9, 59]) {
    r(ctx, bx + wx, by + 30, 12, 9, '#fffaf0')
    r(ctx, bx + wx + 4, by + 30, 1, 9, '#c9bba0')
    r(ctx, bx + wx + 8, by + 30, 1, 9, '#c9bba0')
    r(ctx, bx + wx, by + 34, 12, 1, '#c9bba0')
  }
  // roof - two tiered with upturned eaves
  const roof = '#5f7f8a'
  const roofDark = '#46626c'
  const roofLight = '#86a5ae'
  r(ctx, bx + 18, by - 2, 44, 4, roofDark)
  r(ctx, bx + 14, by - 5, 4, 4, roofDark)
  r(ctx, bx + 62, by - 5, 4, 4, roofDark)
  r(ctx, bx + 12, by + 2, 56, 8, roof)
  r(ctx, bx + 12, by + 2, 56, 1, roofLight)
  r(ctx, bx + 4, by + 10, 72, 4, roofDark)
  r(ctx, bx + 1, by + 7, 4, 4, roofDark)
  r(ctx, bx + 75, by + 7, 4, 4, roofDark)
  r(ctx, bx + 20, by + 14, 40, 4, '#f4ecd8')
  r(ctx, bx + 26, by + 14, 28, 4, '#e86a5c')
  r(ctx, bx + 0, by + 18, 80, 8, roof)
  r(ctx, bx + 0, by + 18, 80, 1, roofLight)
  for (let k = bx + 3; k < bx + 78; k += 5) r(ctx, k, by + 19, 1, 6, roofDark)
  r(ctx, bx - 4, by + 24, 88, 3, roofDark)
  r(ctx, bx - 7, by + 20, 4, 4, roofDark)
  r(ctx, bx + 83, by + 20, 4, 4, roofDark)
  // lanterns beside door
  for (const lx of [27, 49]) {
    r(ctx, bx + lx, by + 43, 1, 2, C.ink)
    r(ctx, bx + lx - 2, by + 45, 5, 7, '#e86a5c')
    r(ctx, bx + lx - 2, by + 47, 5, 1, '#f9b19f')
    r(ctx, bx + lx - 1, by + 52, 3, 1, C.ink)
  }
}

function drawPost(ctx: Ctx, b: BuildingLayout) {
  const bx = b.x * TILE
  const by = b.y * TILE
  r(ctx, bx + 4, by + 26, 72, 38, '#cfe3f0')
  for (let x = bx + 8; x < bx + 76; x += 8) r(ctx, x, by + 26, 1, 38, '#b8d2e3')
  r(ctx, bx + 4, by + 26, 2, 38, '#7f9fb5')
  r(ctx, bx + 74, by + 26, 2, 38, '#7f9fb5')
  drawRoof(ctx, bx, by, '#f3a46b', '#d9824c', '#f8c79c')
  drawEmblem(ctx, 'post', bx + 40, by + 10)
  drawWindow(ctx, bx + 11, by + 34, '#7f9fb5', '#fff6e0')
  drawWindow(ctx, bx + 57, by + 34, '#7f9fb5', '#fff6e0')
  r(ctx, bx + 26, by + 30, 28, 9, '#fff6e0')
  r(ctx, bx + 26, by + 30, 28, 1, '#e0876a')
  r(ctx, bx + 26, by + 38, 28, 1, '#e0876a')
  r(ctx, bx + 30, by + 33, 3, 3, '#e0876a')
  r(ctx, bx + 36, by + 33, 3, 3, '#7f9fb5')
  r(ctx, bx + 42, by + 33, 3, 3, '#e0876a')
  r(ctx, bx + 48, by + 33, 3, 3, '#7f9fb5')
}

const MAT_COLORS: Record<BuildingStyle, string> = {
  house: '#e0876a',
  guild: '#8670bd',
  dojo: '#6f9a6a',
  post: '#d9824c',
}

function drawBuilding(ctx: Ctx, b: BuildingLayout) {
  const bx = b.x * TILE
  const by = b.y * TILE
  r(ctx, bx + 2, by + 62, 76, 3, 'rgba(59,42,63,0.18)')
  if (b.style === 'house') drawHouse(ctx, b)
  if (b.style === 'guild') drawGuild(ctx, b)
  if (b.style === 'dojo') drawDojo(ctx, b)
  if (b.style === 'post') drawPost(ctx, b)
  r(ctx, bx + 4, by + 60, 72, 4, '#b8a998')
  r(ctx, bx + 4, by + 60, 72, 1, '#d6cabb')
  // step + welcome mat
  r(ctx, bx + 31, by + 64, 18, 2, '#b8a998')
  r(ctx, bx + 33, by + 67, 14, 6, MAT_COLORS[b.style])
  r(ctx, bx + 34, by + 68, 12, 1, 'rgba(255,255,255,0.35)')
  r(ctx, bx + 34, by + 71, 12, 1, 'rgba(0,0,0,0.12)')
}

export function renderBackground(ctx: Ctx) {
  ctx.imageSmoothingEnabled = false
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (isRiver(col)) continue
      if (isPath(col, row)) drawPathTile(ctx, col, row)
      else drawGrassTile(ctx, col, row)
    }
  }
  // river banks
  const left = RIVER_COLS[0] * TILE
  const right = (RIVER_COLS[RIVER_COLS.length - 1] + 1) * TILE
  for (let y = 0; y < HEIGHT; y += 4) {
    const wob = hash(y, 3) > 0.5 ? 1 : 0
    r(ctx, left - 2 - wob, y, 2 + wob, 4, C.bank)
    r(ctx, right, y, 2 + (1 - wob), 4, C.bank)
  }
  for (const b of BUILDINGS) drawBuilding(ctx, b)
}

/* ------------------------------------------------------------------ */
/* Animated / dynamic layers                                           */
/* ------------------------------------------------------------------ */

export function drawWater(ctx: Ctx, t: number) {
  const left = RIVER_COLS[0] * TILE
  const w = RIVER_COLS.length * TILE
  r(ctx, left, 0, w, HEIGHT, C.water)
  for (let i = 0; i < 26; i++) {
    const x = left + 2 + Math.floor(hash(i, 11) * (w - 8))
    const y = (Math.floor(hash(i, 5) * HEIGHT) + t * 18) % HEIGHT
    r(ctx, x, y, 4, 1, C.waterDark)
    r(ctx, x + 1, y + 1, 3, 1, C.waterDark)
  }
  for (let i = 0; i < 14; i++) {
    const x = left + 3 + Math.floor(hash(i, 23) * (w - 8))
    const y = (Math.floor(hash(i, 17) * HEIGHT) + t * 26) % HEIGHT
    const twinkle = Math.sin(t * 4 + i) > 0 ? 3 : 2
    r(ctx, x, y, twinkle, 1, C.waterLight)
  }
  r(ctx, left, 0, 1, HEIGHT, C.waterDark)
  r(ctx, left + w - 1, 0, 1, HEIGHT, C.waterDark)
}

export function drawBridges(ctx: Ctx) {
  const left = RIVER_COLS[0] * TILE - 5
  const w = RIVER_COLS.length * TILE + 10
  for (const row of BRIDGE_ROWS) {
    const y = row * TILE
    r(ctx, left, y + 1, w, 15, C.wood)
    for (let x = left; x < left + w; x += 4) {
      r(ctx, x, y + 1, 1, 15, C.woodDark)
      r(ctx, x + 1, y + 2, 1, 1, C.woodLight)
    }
    r(ctx, left, y - 2, w, 3, C.woodDark)
    r(ctx, left, y + 14, w, 3, C.woodDark)
    r(ctx, left, y - 2, w, 1, C.woodLight)
    for (const px of [left, left + w - 3, left + Math.floor(w / 2) - 1]) {
      r(ctx, px, y - 5, 3, 6, C.woodDark)
      r(ctx, px, y + 12, 3, 6, C.woodDark)
    }
  }
}

export function doorRect(b: BuildingLayout) {
  return { x: b.x * TILE + 33, y: b.y * TILE + 44, w: 14, h: 20 }
}

export function drawDoor(ctx: Ctx, b: BuildingLayout, progress: number, t: number) {
  const d = doorRect(b)
  r(ctx, d.x - 2, d.y - 2, d.w + 4, d.h + 2, C.ink)
  if (b.style === 'dojo') r(ctx, d.x - 3, d.y - 3, d.w + 6, 2, '#5b4636')
  if (progress > 0) {
    const flicker = 0.85 + Math.sin(t * 9) * 0.05
    r(ctx, d.x, d.y, d.w, d.h, '#ffbf5e')
    ctx.globalAlpha = flicker
    r(ctx, d.x + 2, d.y + 2, d.w - 4, d.h - 2, '#ffe39a')
    r(ctx, d.x + 4, d.y + 5, d.w - 8, d.h - 7, '#fff6d6')
    ctx.globalAlpha = 1
  }
  const panelW = Math.round(d.w * (1 - progress))
  if (panelW > 0) {
    const isDojo = b.style === 'dojo'
    const base = isDojo ? '#efe4c8' : '#a0663e'
    const dark = isDojo ? '#5b4636' : '#7a4a2a'
    r(ctx, d.x, d.y, panelW, d.h, base)
    if (isDojo) {
      for (let y = d.y + 4; y < d.y + d.h; y += 5) r(ctx, d.x, y, panelW, 1, dark)
      if (panelW > 6) r(ctx, d.x + Math.floor(panelW / 2), d.y, 1, d.h, dark)
    } else {
      for (let x = d.x + 4; x < d.x + panelW; x += 4) r(ctx, x, d.y, 1, d.h, dark)
      r(ctx, d.x, d.y + 4, panelW, 1, dark)
      r(ctx, d.x, d.y + 14, panelW, 1, dark)
    }
    if (progress > 0) r(ctx, d.x + panelW - 1, d.y, 1, d.h, dark)
    if (panelW > 6) r(ctx, d.x + panelW - 4, d.y + 10, 2, 2, '#ffd47a')
  }
  if (progress > 0) {
    ctx.globalAlpha = 0.35 * progress
    r(ctx, d.x - 1, d.y + d.h, d.w + 2, 5, C.glow)
    r(ctx, d.x - 3, d.y + d.h + 5, d.w + 6, 5, C.glow)
    ctx.globalAlpha = 1
  }
}

export function drawTree(ctx: Ctx, col: number, row: number, t: number) {
  const cx = col * TILE + 8
  const base = row * TILE + 15
  const sway = Math.round(Math.sin(t * 1.3 + col) * 0.8)
  r(ctx, cx - 9, base - 1, 18, 3, 'rgba(59,42,63,0.18)')
  r(ctx, cx - 2, base - 12, 4, 12, '#7a5236')
  r(ctx, cx - 2, base - 12, 1, 12, '#93663f')
  r(ctx, cx + 2, base - 8, 3, 2, '#7a5236')
  const ox = cx + sway
  const oy = base - 30
  const [dark, mid, light] = pal.tree
  const blobs: [number, number, number, number, string][] = [
    [-12, 6, 24, 12, dark],
    [-10, 2, 20, 18, dark],
    [-8, 0, 16, 20, dark],
    [-11, 4, 22, 10, mid],
    [-8, 1, 15, 12, mid],
    [-6, 1, 9, 6, light],
    [2, 6, 6, 4, light],
    [-9, 10, 5, 3, light],
  ]
  for (const [x, y, w, h, c] of blobs) r(ctx, ox + x, oy + y, w, h, c)
  r(ctx, ox - 4, oy + 3, 1, 1, '#ffffff')
  r(ctx, ox + 5, oy + 8, 1, 1, '#ffffff')
  r(ctx, ox - 7, oy + 12, 1, 1, '#ffffff')
}

export function drawLantern(ctx: Ctx, col: number, row: number, t: number) {
  const x = col * TILE + 4
  const y = row * TILE
  r(ctx, x - 1, y + 14, 10, 2, 'rgba(59,42,63,0.18)')
  r(ctx, x + 2, y + 9, 4, 6, C.stoneDark)
  r(ctx, x, y + 13, 8, 2, C.stone)
  r(ctx, x + 1, y + 4, 6, 5, C.stone)
  const glow = 0.75 + Math.sin(t * 3 + col) * 0.2
  ctx.globalAlpha = glow
  r(ctx, x + 2, y + 5, 4, 3, C.glow)
  ctx.globalAlpha = 1
  r(ctx, x - 1, y + 2, 10, 2, C.stoneDark)
  r(ctx, x + 2, y, 4, 2, C.stoneDark)
}

export function drawNotice(ctx: Ctx, col: number, row: number) {
  const x = col * TILE
  const y = row * TILE
  r(ctx, x + 2, y + 14, 12, 2, 'rgba(59,42,63,0.18)')
  r(ctx, x + 3, y + 8, 2, 7, C.woodDark)
  r(ctx, x + 11, y + 8, 2, 7, C.woodDark)
  r(ctx, x + 1, y + 1, 14, 9, C.woodDark)
  r(ctx, x + 2, y + 2, 12, 7, C.woodLight)
  r(ctx, x + 3, y + 3, 4, 3, '#fff6e0')
  r(ctx, x + 8, y + 4, 5, 3, '#f7b89b')
}

export function drawMailbox(ctx: Ctx, col: number, row: number, t: number) {
  const x = col * TILE + 3
  const y = row * TILE
  r(ctx, x, y + 14, 11, 2, 'rgba(59,42,63,0.18)')
  r(ctx, x + 4, y + 8, 3, 7, C.woodDark)
  r(ctx, x, y + 2, 11, 7, '#e0705f')
  r(ctx, x + 1, y + 1, 9, 1, '#e0705f')
  r(ctx, x + 1, y + 2, 9, 1, '#f39a8a')
  r(ctx, x + 2, y + 5, 7, 1, '#9e4637')
  const flag = Math.sin(t * 2) > 0 ? 0 : 1
  r(ctx, x + 10, y + 1 + flag, 1, 5, '#3b2a3f')
  r(ctx, x + 11, y + 1 + flag, 3, 2, '#ffd47a')
}

export function drawProps(ctx: Ctx, kind: (typeof PROPS)[number]['kind'], col: number, row: number, t: number) {
  if (kind === 'tree') drawTree(ctx, col, row, t)
  else if (kind === 'lantern') drawLantern(ctx, col, row, t)
  else if (kind === 'notice') drawNotice(ctx, col, row)
  else drawMailbox(ctx, col, row, t)
}

export function drawSign(ctx: Ctx, b: BuildingLayout, text: string, font: string, t: number, highlighted: boolean) {
  ctx.font = `8px ${font}`
  const tw = Math.ceil(ctx.measureText(text).width)
  const w = tw + 12
  const h = 13
  const cx = b.x * TILE + 40
  const bob = Math.round(Math.sin(t * 2.2 + b.x) * 1.5)
  const x = Math.round(cx - w / 2)
  const y = b.y * TILE - 15 + bob
  r(ctx, x + 2, y + h + 3 - bob, w - 4, 2, 'rgba(59,42,63,0.15)')
  r(ctx, x - 1, y - 1, w + 2, h + 2, C.ink)
  r(ctx, x, y, w, h, highlighted ? '#fff6e0' : '#f3e2bf')
  r(ctx, x, y, w, 1, '#ffffff')
  r(ctx, x, y + h - 1, w, 1, highlighted ? '#f7b89b' : '#d6bf92')
  r(ctx, x + 2, y + 2, 1, 1, C.woodDark)
  r(ctx, x + w - 3, y + 2, 1, 1, C.woodDark)
  ctx.fillStyle = C.ink
  ctx.textBaseline = 'top'
  ctx.fillText(text, x + 6, y + 3)
  if (highlighted) {
    const nudge = Math.round(Math.abs(Math.sin(t * 5)) * 2)
    const ay = y + 3
    const lx = x - 6 - nudge
    const rx = x + w + 3 + nudge
    r(ctx, lx, ay, 1, 7, '#e0876a')
    r(ctx, lx + 1, ay + 1, 1, 5, '#e0876a')
    r(ctx, lx + 2, ay + 2, 1, 3, '#e0876a')
    r(ctx, rx + 2, ay, 1, 7, '#e0876a')
    r(ctx, rx + 1, ay + 1, 1, 5, '#e0876a')
    r(ctx, rx, ay + 2, 1, 3, '#e0876a')
  }
}

export { WIDTH, HEIGHT }
