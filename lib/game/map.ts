import type { BuildingId } from '@/data/portfolio'

export const TILE = 16
export const COLS = 24
export const ROWS = 14
export const WIDTH = COLS * TILE
export const HEIGHT = ROWS * TILE

export type BuildingStyle = 'house' | 'guild' | 'dojo' | 'post'

export type BuildingLayout = {
  id: BuildingId
  style: BuildingStyle
  x: number
  y: number
  w: number
  h: number
}

export const BUILDINGS: BuildingLayout[] = [
  { id: 'home', style: 'house', x: 1, y: 1, w: 5, h: 4 },
  { id: 'projects', style: 'guild', x: 18, y: 1, w: 5, h: 4 },
  { id: 'roadmap', style: 'dojo', x: 1, y: 8, w: 5, h: 4 },
  { id: 'contact', style: 'post', x: 18, y: 8, w: 5, h: 4 },
]

export const RIVER_COLS = [11, 12]
export const BRIDGE_ROWS = [5, 12]
export const SPAWN = { col: 8, row: 8 }

export type Prop = { kind: 'tree' | 'lantern' | 'notice' | 'mailbox'; col: number; row: number }

export const PROPS: Prop[] = [
  { kind: 'tree', col: 7, row: 2 },
  { kind: 'tree', col: 16, row: 2 },
  { kind: 'tree', col: 7, row: 10 },
  { kind: 'tree', col: 16, row: 10 },
  { kind: 'tree', col: 0, row: 7 },
  { kind: 'tree', col: 23, row: 7 },
  { kind: 'tree', col: 10, row: 10 },
  { kind: 'tree', col: 13, row: 2 },
  { kind: 'lantern', col: 10, row: 4 },
  { kind: 'lantern', col: 13, row: 6 },
  { kind: 'lantern', col: 10, row: 13 },
  { kind: 'lantern', col: 13, row: 11 },
  { kind: 'notice', col: 9, row: 7 },
  { kind: 'mailbox', col: 23, row: 11 },
]

export type StaticNpcId = 'mahi' | 'rishi' | 'raunak' | 'sam' | 'wizard' | 'dragon'

/** Tiles occupied by stationary NPCs. The slime and fish roam and are not tile-blocking. */
export const NPC_SPOTS: Record<StaticNpcId, { col: number; row: number }> = {
  mahi: { col: 6, row: 6 },
  rishi: { col: 17, row: 6 },
  raunak: { col: 22, row: 6 },
  sam: { col: 5, row: 13 },
  wizard: { col: 14, row: 6 },
  dragon: { col: 9, row: 1 },
}

export const SLIME_RANGE = { minCol: 17, maxCol: 22, row: 13 }

export const doorTile = (b: BuildingLayout) => ({ col: b.x + Math.floor(b.w / 2), row: b.y + b.h - 1 })
export const matTile = (b: BuildingLayout) => ({ col: b.x + Math.floor(b.w / 2), row: b.y + b.h })

export const tileCenter = (col: number, row: number) => ({ x: col * TILE + 8, y: row * TILE + 8 })

function buildPathSet() {
  const set = new Set<string>()
  for (let c = 0; c < COLS; c++) {
    set.add(`${c},5`)
    set.add(`${c},12`)
  }
  for (let r = 5; r <= 12; r++) {
    set.add(`8,${r}`)
    set.add(`15,${r}`)
  }
  for (let c = 8; c <= 10; c++) {
    set.add(`${c},8`)
    set.add(`${c},9`)
  }
  for (let c = 13; c <= 15; c++) {
    set.add(`${c},8`)
    set.add(`${c},9`)
  }
  return set
}

export const PATH_TILES = buildPathSet()
export const isPath = (c: number, r: number) => PATH_TILES.has(`${c},${r}`)
export const isRiver = (c: number) => RIVER_COLS.includes(c)
export const isBridge = (c: number, r: number) => isRiver(c) && BRIDGE_ROWS.includes(r)

function buildBlocked() {
  const grid: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  for (const b of BUILDINGS) {
    for (let r = b.y; r < b.y + b.h; r++) for (let c = b.x; c < b.x + b.w; c++) grid[r][c] = true
  }
  for (let r = 0; r < ROWS; r++) for (const c of RIVER_COLS) if (!BRIDGE_ROWS.includes(r)) grid[r][c] = true
  for (const p of PROPS) grid[p.row][p.col] = true
  for (const s of Object.values(NPC_SPOTS)) grid[s.row][s.col] = true
  return grid
}

export const BLOCKED = buildBlocked()

export const isBlocked = (c: number, r: number) =>
  c < 0 || r < 0 || c >= COLS || r >= ROWS || BLOCKED[r][c]

const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

/** Breadth-first search on the 4-directional tile grid. Returns tiles after the start tile. */
export function findPath(from: { col: number; row: number }, to: { col: number; row: number }) {
  if (isBlocked(to.col, to.row)) return null
  const key = (c: number, r: number) => r * COLS + c
  const prev = new Map<number, number>()
  const start = key(from.col, from.row)
  const goal = key(to.col, to.row)
  const queue = [start]
  prev.set(start, -1)
  while (queue.length) {
    const cur = queue.shift() as number
    if (cur === goal) break
    const c = cur % COLS
    const r = Math.floor(cur / COLS)
    for (const [dx, dy] of DIRS) {
      const nc = c + dx
      const nr = r + dy
      if (isBlocked(nc, nr)) continue
      const k = key(nc, nr)
      if (prev.has(k)) continue
      prev.set(k, cur)
      queue.push(k)
    }
  }
  if (!prev.has(goal)) return null
  const out: { col: number; row: number }[] = []
  let k = goal
  while (k !== start) {
    out.unshift({ col: k % COLS, row: Math.floor(k / COLS) })
    k = prev.get(k) as number
  }
  return out
}

/** Nearest walkable tile to the given tile (spiral BFS). */
export function nearestWalkable(col: number, row: number) {
  col = Math.max(0, Math.min(COLS - 1, col))
  row = Math.max(0, Math.min(ROWS - 1, row))
  if (!isBlocked(col, row)) return { col, row }
  const seen = new Set<number>([row * COLS + col])
  const queue = [{ col, row }]
  while (queue.length) {
    const t = queue.shift() as { col: number; row: number }
    for (const [dx, dy] of DIRS) {
      const nc = t.col + dx
      const nr = t.row + dy
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue
      const k = nr * COLS + nc
      if (seen.has(k)) continue
      seen.add(k)
      if (!isBlocked(nc, nr)) return { col: nc, row: nr }
      queue.push({ col: nc, row: nr })
    }
  }
  return { col: SPAWN.col, row: SPAWN.row }
}

/** Deterministic hash used for procedural tile decoration. */
export function hash(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
