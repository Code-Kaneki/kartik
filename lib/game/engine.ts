import {
  buildings as buildingContent,
  type BuildingId,
  type FriendId,
  type NpcId,
  type ZoneKey,
} from '@/data/portfolio'
import { playNpcHitSound, playSfx } from '@/lib/sfx'
import {
  doorRect,
  drawBridges,
  drawCharacter,
  drawDoor,
  drawProps,
  drawSign,
  drawWater,
  renderBackground,
  setDrawSeason,
  type Dir,
} from './draw'
import {
  BRIDGE_ROWS,
  BUILDINGS,
  COLS,
  HEIGHT,
  NPC_SPOTS,
  PROPS,
  RIVER_COLS,
  ROWS,
  SLIME_RANGE,
  SPAWN,
  TILE,
  WIDTH,
  findPath,
  isBlocked,
  isBridge,
  isRiver,
  matTile,
  nearestWalkable,
  tileCenter,
  type BuildingLayout,
} from './map'
import { FRIEND_LOOKS, drawBubble, drawDragon, drawFish, drawSlime, drawWizard } from './npc-draw'
import { DAY_LENGTH, SEASONS, SEASON_ORDER, darknessAt, duskAt, type SeasonId } from './seasons'

type Phase = 'free' | 'opening' | 'stepIn' | 'irisOut' | 'inside' | 'irisIn' | 'stepOut' | 'closing' | 'talking'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  isFire?: boolean
  kind?: 'pixel' | 'heart'
}
type Weather = { x: number; y: number; vx: number; vy: number; phase: number; sway: number; color: string; w: number; h: number }
type Ripple = { x: number; y: number; t: number }
type Light = { x: number; y: number; r: number }
type BurnSpot = { x: number; y: number; life: number; max: number; r: number; kind: 'grass' | 'prop' | 'building' }

type FriendState = {
  x: number
  y: number
  dir: Dir
  targetX: number | null
  targetY: number | null
  waitT: number
  animT: number
  frameIdx: number
  burnT: number
}

export type WorldState = { season: SeasonId; night: boolean }

export type EngineCallbacks = {
  onZone: (zone: ZoneKey) => void
  onEnter: (id: BuildingId) => void
  onTalk: (id: NpcId) => void
  onWorld: (state: WorldState) => void
}

const SPEED = 62
const NPC_SPEED = 24
const WIZARD_PANIC_SPEED = 78
const WALK_FRAMES = [0, 1, 0, 2]
const DIR_VECTORS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const FRIEND_IDS: FriendId[] = ['mahi', 'rishi', 'raunak', 'sam']
const NPC_IDS: NpcId[] = ['mahi', 'rishi', 'raunak', 'sam', 'wizard', 'dragon', 'slime', 'fish']
const RIVER_X = RIVER_COLS[0] * TILE + (RIVER_COLS.length * TILE) / 2
const FISH_MIN_Y = 100
const FISH_MAX_Y = 184
const SLIME_Y = SLIME_RANGE.row * TILE + 13

const WINDOW_OFFSETS: Record<BuildingLayout['style'], [number, number][]> = {
  house: [
    [17, 39],
    [63, 39],
  ],
  guild: [[63, 39]],
  dojo: [
    [15, 34],
    [65, 34],
  ],
  post: [
    [17, 39],
    [63, 39],
  ],
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private bg: HTMLCanvasElement
  private light: HTMLCanvasElement
  private lightCtx: CanvasRenderingContext2D | null
  private raf = 0
  private last = 0
  private time = 0
  private font = 'monospace'

  private player = { x: 0, y: 0, dir: 'down' as Dir, moving: false, animT: 0, frameIdx: 0, alpha: 1 }
  private path: { x: number; y: number }[] = []
  private pendingBuilding: BuildingId | null = null
  private pendingNpc: NpcId | null = null
  private held: Dir[] = []

  private phase: Phase = 'free'
  private phaseT = 0
  private active: BuildingLayout | null = null
  private doors: Record<BuildingId, number> = { home: 0, projects: 0, roadmap: 0, contact: 0 }

  private particles: Particle[] = []
  private burns: BurnSpot[] = []
  private weather: Weather[] = []
  private ripples: Ripple[] = []
  private zone: ZoneKey = 'intro'
  private hasMoved = false

  private talkId: NpcId | null = null
  private friends = Object.fromEntries(
    FRIEND_IDS.map((id, idx) => {
      const c = tileCenter(NPC_SPOTS[id].col, NPC_SPOTS[id].row)
      return [
        id,
        {
          x: c.x,
          y: c.y,
          dir: 'down' as Dir,
          targetX: null,
          targetY: null,
          waitT: 2 + idx * 1.3,
          animT: 0,
          frameIdx: 0,
          burnT: 0,
        },
      ]
    }),
  ) as Record<FriendId, FriendState>

  private wizard = {
    ...tileCenter(NPC_SPOTS.wizard.col, NPC_SPOTS.wizard.row),
    faceLeft: true,
    targetX: null as number | null,
    targetY: null as number | null,
    waitT: 3.5,
    burnT: 0,
    panicDirT: 0,
    panicVx: 0,
    panicVy: 0,
  }

  private dragon = {
    ...tileCenter(NPC_SPOTS.dragon.col, NPC_SPOTS.dragon.row),
    faceLeft: false,
    fireT: 0,
    nextFire: 3.5,
    flyT: 0,
    boltT: 0,
    boltX: 160,
    boltY: 90,
    nextBolt: 6,
  }

  private slime = { x: SLIME_RANGE.minCol * TILE + 8, dir: 1, hopT: 0, hop: 0, boostT: 0, burnT: 0 }
  private fish = { x: RIVER_X, y: 140, down: true, jump: -1, nextJump: 4 }

  // Easter egg: Sam & Mahi meet on the bridge and pop hearts
  private bridgeDate = {
    state: 'idle' as 'idle' | 'walking' | 'sitting',
    cooldown: 16,
    sitT: 0,
    heartT: 0,
    row: BRIDGE_ROWS[0],
  }

  private season: SeasonId = 'spring'
  private cycle = 0.05
  private dark = 0
  private flash = 0
  private lastWorld = ''
  private staticLights: Light[] = []

  constructor(
    private canvas: HTMLCanvasElement,
    private cb: EngineCallbacks,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
    ctx.imageSmoothingEnabled = false
    this.bg = document.createElement('canvas')
    this.bg.width = WIDTH
    this.bg.height = HEIGHT
    this.light = document.createElement('canvas')
    this.light.width = WIDTH
    this.light.height = HEIGHT
    this.lightCtx = this.light.getContext('2d')

    const spawn = tileCenter(SPAWN.col, SPAWN.row)
    this.player.x = spawn.x
    this.player.y = spawn.y

    this.staticLights = this.buildStaticLights()
    this.applySeason('spring', false)
    this.loadFont()
  }

  private loadFont() {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--font-press-start').trim()
      if (v) this.font = v
    }
    read()
    document.fonts?.ready.then(read).catch(() => {})
  }

  start() {
    this.last = performance.now()
    this.emitWorld(true)
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.update(dt)
      this.render()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.raf)
  }

  /* ---------------------------- input API ---------------------------- */

  click(wx: number, wy: number) {
    if (this.phase !== 'free') return
    this.ripples.push({ x: wx, y: wy, t: 0 })
    playSfx('blip')
    const npc = NPC_IDS.find((id) => {
      const a = this.npcAnchor(id)
      const halfW = id === 'dragon' ? 12 : 9
      return Math.abs(wx - a.x) <= halfW && wy >= a.top - 4 && wy <= a.y + 9
    })
    if (npc) {
      this.walkToNpc(npc)
      return
    }
    const hit = BUILDINGS.find(
      (b) => wx >= b.x * TILE - 4 && wx <= (b.x + b.w) * TILE + 4 && wy >= b.y * TILE - 16 && wy <= (b.y + b.h) * TILE,
    )
    if (hit) {
      this.walkToBuilding(hit)
      return
    }
    const target = nearestWalkable(Math.floor(wx / TILE), Math.floor(wy / TILE))
    this.walkToTile(target.col, target.row, null)
  }

  setHeld(dir: Dir, down: boolean) {
    this.held = this.held.filter((d) => d !== dir)
    if (down) this.held.push(dir)
  }

  clearHeld() {
    this.held = []
  }

  interact() {
    if (this.phase !== 'free') return
    let best: BuildingLayout | null = null
    let bestDist = Infinity
    for (const b of BUILDINGS) {
      const m = matTile(b)
      const c = tileCenter(m.col, m.row)
      const dist = Math.hypot(c.x - this.player.x, c.y - this.player.y)
      if (dist < bestDist) {
        bestDist = dist
        best = b
      }
    }
    const npc = this.nearestNpc()
    if (npc && npc.dist <= this.talkRange(npc.id)) {
      this.beginTalk(npc.id)
      return
    }
    if (npc && npc.dist < 56 && npc.dist < bestDist) {
      playSfx('select')
      this.walkToNpc(npc.id)
      return
    }
    if (!best) return
    playSfx('select')
    if (bestDist < 12) this.beginEnter(best)
    else this.walkToBuilding(best)
  }

  fastTravel(id: BuildingId) {
    if (this.phase !== 'free') return
    const b = BUILDINGS.find((x) => x.id === id)
    if (!b) return
    const from = { x: this.player.x, y: this.player.y }
    const m = matTile(b)
    const c = tileCenter(m.col, m.row)
    this.burst(from.x, from.y - 6, 18, ['#c9b8ee', '#fff6e0', '#f6b6c8'])
    this.player.x = c.x
    this.player.y = c.y
    this.path = []
    this.pendingBuilding = null
    this.pendingNpc = null
    this.hasMoved = true
    this.burst(c.x, c.y - 6, 18, ['#c9b8ee', '#fff6e0', '#f6b6c8'])
    playSfx('warp')
    this.beginEnter(b)
  }

  exitBuilding() {
    if (this.phase !== 'inside') return
    this.phase = 'irisIn'
    this.phaseT = 0
  }

  endTalk() {
    if (this.phase !== 'talking') return
    this.phase = 'free'
    this.talkId = null
  }

  npcAction(id: NpcId) {
    if (id === 'dragon') {
      this.dragon.fireT = 1.4
      playSfx('roar')
    } else if (id === 'slime') {
      this.slime.boostT = 1
      playSfx('boing')
    } else if (id === 'fish') {
      if (this.fish.jump < 0) this.startFishJump()
    }
  }

  setTimeOfDay(kind: 'day' | 'night') {
    this.cycle = kind === 'day' ? 0.05 : 0.58
    this.castSpell()
    this.emitWorld()
  }

  setSeason(id: SeasonId) {
    this.castSpell()
    this.applySeason(id, true)
  }

  /* ------------------------------- NPCs ------------------------------ */

  private npcAnchor(id: NpcId) {
    if (id === 'wizard') return { x: this.wizard.x, y: this.wizard.y, top: this.wizard.y + 5 - 22 }
    if (id === 'dragon') return { x: this.dragon.x, y: this.dragon.y, top: this.dragon.y + 6 - 17 }
    if (id === 'slime') return { x: this.slime.x, y: SLIME_Y - 5, top: SLIME_Y - 10 - this.slime.hop * 6 }
    if (id === 'fish') {
      const lift = this.fish.jump > 0 ? Math.sin(this.fish.jump * Math.PI) * 14 : 0
      return { x: this.fish.x, y: this.fish.y, top: this.fish.y - 6 - lift }
    }
    const f = this.friends[id]
    return { x: f.x, y: f.y, top: f.y - 12 }
  }

  private talkRange(id: NpcId) {
    return id === 'fish' ? 34 : 26
  }

  private nearestNpc() {
    let best: { id: NpcId; dist: number } | null = null
    for (const id of NPC_IDS) {
      const a = this.npcAnchor(id)
      const dist = Math.hypot(a.x - this.player.x, a.y - this.player.y)
      if (!best || dist < best.dist) best = { id, dist }
    }
    return best
  }

  private walkToNpc(id: NpcId) {
    const a = this.npcAnchor(id)
    const col = Math.floor(a.x / TILE)
    const row = Math.floor(a.y / TILE)
    const candidates: { col: number; row: number }[] = []
    if (id === 'fish') {
      candidates.push({ col: RIVER_COLS[0] - 1, row }, { col: RIVER_COLS[RIVER_COLS.length - 1] + 1, row })
    } else if (id === 'slime' || id === 'dragon') {
      candidates.push(nearestWalkable(col, row))
    } else {
      for (const [dx, dy] of [
        [0, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 0],
      ]) {
        if (!isBlocked(col + dx, row + dy)) candidates.push({ col: col + dx, row: row + dy })
      }
      if (!candidates.length) candidates.push(nearestWalkable(col, row))
    }
    const start = this.playerTile()
    if (candidates.some((c) => c.col === start.col && c.row === start.row)) {
      this.beginTalk(id)
      return
    }
    let bestPath: { col: number; row: number }[] | null = null
    for (const c of candidates) {
      const p = findPath(start, c)
      if (p && (!bestPath || p.length < bestPath.length)) bestPath = p
    }
    if (!bestPath) return
    this.path = [tileCenter(start.col, start.row), ...bestPath.map((t) => tileCenter(t.col, t.row))]
    this.pendingBuilding = null
    this.pendingNpc = id
    this.hasMoved = true
  }

  private beginTalk(id: NpcId) {
    const a = this.npcAnchor(id)
    const p = this.player
    const dx = a.x - p.x
    const dy = a.y - p.y
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
    p.moving = false
    this.path = []
    this.held = []
    this.pendingNpc = null
    this.pendingBuilding = null
    if (id === 'wizard') this.wizard.faceLeft = p.x < this.wizard.x
    else if (id === 'dragon') this.dragon.faceLeft = p.x < this.dragon.x
    else if (id !== 'slime' && id !== 'fish') {
      this.friends[id].dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : dy > 0 ? 'up' : 'down'
    }
    this.phase = 'talking'
    this.talkId = id
    this.setZone(id)
    playSfx('talk')
    this.cb.onTalk(id)
  }

  private startFishJump() {
    this.fish.jump = 0
    this.splash(this.fish.x, this.fish.y + 2)
    playSfx('splash')
  }

  private isNpcWalkable(x: number, y: number) {
    if (x < 10 || x > WIDTH - 10 || y < 10 || y > HEIGHT - 10) return false
    const col = Math.floor(x / TILE)
    const row = Math.floor(y / TILE)
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false
    if (isRiver(col) && !isBridge(col, row)) return false
    for (const b of BUILDINGS) {
      if (col >= b.x && col < b.x + b.w && row >= b.y && row < b.y + b.h) return false
    }
    for (const p of PROPS) {
      if (p.col === col && p.row === row) return false
    }
    return true
  }

  private pickNearbyTarget(x: number, y: number, radiusTiles = 3) {
    const baseCol = Math.floor(x / TILE)
    const baseRow = Math.floor(y / TILE)
    for (let tries = 0; tries < 10; tries++) {
      const nc = Math.max(1, Math.min(COLS - 2, baseCol + Math.floor((Math.random() - 0.5) * radiusTiles * 2)))
      const nr = Math.max(1, Math.min(ROWS - 2, baseRow + Math.floor((Math.random() - 0.5) * radiusTiles * 2)))
      const c = tileCenter(nc, nr)
      if (this.isNpcWalkable(c.x, c.y)) return c
    }
    return null
  }

  private addBurn(x: number, y: number, kind: BurnSpot['kind'], r = 7) {
    if (this.burns.length >= 26) return
    if (this.burns.some((b) => Math.hypot(b.x - x, b.y - y) < 10)) return
    this.burns.push({ x, y, life: 0, max: 2.2 + Math.random() * 1.4, r, kind })
  }

  private spawnFlameOn(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 10,
      vy: -14 - Math.random() * 18,
      life: 0,
      max: 0.35 + Math.random() * 0.25,
      color: ['#fff6d6', '#ffd47a', '#f39a5a', '#e0705f'][Math.floor(Math.random() * 4)],
      size: Math.random() > 0.5 ? 2 : 3,
    })
  }

  private updateBridgeDate(dt: number, paused: (id: NpcId) => boolean) {
    const bd = this.bridgeDate
    const sam = this.friends.sam
    const mahi = this.friends.mahi
    if (paused('sam') || paused('mahi')) return

    if (bd.state === 'idle') {
      bd.cooldown -= dt
      if (bd.cooldown <= 0) {
        bd.state = 'walking'
        bd.row = BRIDGE_ROWS[Math.random() < 0.5 ? 0 : 1]
        const y = bd.row * TILE + 8
        mahi.targetX = RIVER_X - 7
        mahi.targetY = y
        sam.targetX = RIVER_X + 7
        sam.targetY = y
      }
      return
    }

    if (bd.state === 'walking') {
      const mahiArrived = mahi.targetX === null
      const samArrived = sam.targetX === null
      if (mahiArrived && samArrived) {
        bd.state = 'sitting'
        bd.sitT = 5.5
        bd.heartT = 0.2
        mahi.dir = 'right'
        sam.dir = 'left'
      }
      return
    }

    if (bd.state === 'sitting') {
      bd.sitT -= dt
      bd.heartT -= dt
      mahi.dir = 'right'
      sam.dir = 'left'
      if (bd.heartT <= 0) {
        bd.heartT = 0.75
        this.particles.push({
          x: (mahi.x + sam.x) / 2 + (Math.random() - 0.5) * 8,
          y: mahi.y - 12,
          vx: (Math.random() - 0.5) * 8,
          vy: -14,
          life: 0,
          max: 1.1,
          color: '#f26a8d',
          size: 3,
          kind: 'heart',
        })
      }
      if (bd.sitT <= 0) {
        bd.state = 'idle'
        bd.cooldown = 22 + Math.random() * 18
        const mt = this.pickNearbyTarget(mahi.x - 40, mahi.y, 4)
        const st = this.pickNearbyTarget(sam.x + 40, sam.y, 4)
        if (mt) {
          mahi.targetX = mt.x
          mahi.targetY = mt.y
        }
        if (st) {
          sam.targetX = st.x
          sam.targetY = st.y
        }
      }
    }
  }

  private updateNpcs(dt: number) {
    const t = this.time
    const paused = (id: NpcId) => this.talkId === id || this.pendingNpc === id

    // Sam & Mahi bridge date easter egg
    this.updateBridgeDate(dt, paused)

    // Friends random wandering & burn flames
    for (const id of FRIEND_IDS) {
      const f = this.friends[id]
      if (f.burnT > 0) {
        f.burnT = Math.max(0, f.burnT - dt)
        if (Math.random() < dt * 14) this.spawnFlameOn(f.x, f.y - 4)
      }
      if (paused(id)) {
        f.frameIdx = 0
        continue
      }
      const inBridgeSit = this.bridgeDate.state === 'sitting' && (id === 'sam' || id === 'mahi')
      if (inBridgeSit) {
        f.frameIdx = 0
        continue
      }
      if (f.targetX !== null && f.targetY !== null) {
        const dx = f.targetX - f.x
        const dy = f.targetY - f.y
        const dist = Math.hypot(dx, dy)
        const step = NPC_SPEED * dt
        if (dist <= step) {
          f.x = f.targetX
          f.y = f.targetY
          f.targetX = null
          f.targetY = null
          f.frameIdx = 0
          f.waitT = 2.5 + Math.random() * 4.5
        } else {
          const nx = f.x + (dx / dist) * step
          const ny = f.y + (dy / dist) * step
          if (Math.abs(dx) > Math.abs(dy)) f.dir = dx > 0 ? 'right' : 'left'
          else f.dir = dy > 0 ? 'down' : 'up'
          const allowBridge = this.bridgeDate.state === 'walking' && (id === 'sam' || id === 'mahi')
          if (allowBridge || this.isNpcWalkable(nx, ny)) {
            f.x = nx
            f.y = ny
            f.animT += dt
            if (f.animT > 0.18) {
              f.animT = 0
              f.frameIdx = (f.frameIdx + 1) % WALK_FRAMES.length
            }
          } else {
            f.targetX = null
            f.targetY = null
            f.frameIdx = 0
            f.waitT = 1.5 + Math.random() * 2.5
          }
        }
      } else {
        f.waitT -= dt
        if (f.waitT <= 0) {
          const next = this.pickNearbyTarget(f.x, f.y, 3)
          if (next) {
            f.targetX = next.x
            f.targetY = next.y
          } else {
            f.waitT = 2
          }
        }
      }
    }

    // Wizard: random wandering OR panic-running in every direction when on fire!
    const w = this.wizard
    if (w.burnT > 0) {
      w.burnT = Math.max(0, w.burnT - dt)
      if (Math.random() < dt * 20) this.spawnFlameOn(w.x, w.y - 8)
      if (!paused('wizard')) {
        w.panicDirT -= dt
        if (w.panicDirT <= 0) {
          w.panicDirT = 0.22 + Math.random() * 0.28
          const a = Math.random() * Math.PI * 2
          w.panicVx = Math.cos(a) * WIZARD_PANIC_SPEED
          w.panicVy = Math.sin(a) * WIZARD_PANIC_SPEED
          w.faceLeft = w.panicVx < 0
        }
        const nx = w.x + w.panicVx * dt
        const ny = w.y + w.panicVy * dt
        if (this.isNpcWalkable(nx, w.y)) w.x = nx
        else w.panicVx *= -1
        if (this.isNpcWalkable(w.x, ny)) w.y = ny
        else w.panicVy *= -1
        w.faceLeft = w.panicVx < 0
      }
    } else if (!paused('wizard')) {
      if (w.targetX !== null && w.targetY !== null) {
        const dx = w.targetX - w.x
        const dy = w.targetY - w.y
        const dist = Math.hypot(dx, dy)
        const step = 18 * dt
        if (dist <= step) {
          w.x = w.targetX
          w.y = w.targetY
          w.targetX = null
          w.targetY = null
          w.waitT = 3 + Math.random() * 4
        } else {
          const nx = w.x + (dx / dist) * step
          const ny = w.y + (dy / dist) * step
          w.faceLeft = dx < 0
          if (this.isNpcWalkable(nx, ny)) {
            w.x = nx
            w.y = ny
          } else {
            w.targetX = null
            w.targetY = null
            w.waitT = 2
          }
        }
      } else {
        w.waitT -= dt
        if (w.waitT <= 0) {
          const next = this.pickNearbyTarget(w.x, w.y, 2)
          if (next) {
            w.targetX = next.x
            w.targetY = next.y
          } else {
            w.waitT = 2.5
          }
        }
      }
    }

    // slime hops along the southern path
    const s = this.slime
    if (s.burnT > 0) {
      s.burnT = Math.max(0, s.burnT - dt)
      if (Math.random() < dt * 12) this.spawnFlameOn(s.x, SLIME_Y - 6)
    }
    s.hopT += dt
    const period = 0.7
    const k = (s.hopT % period) / period
    const baseHop = k < 0.6 ? Math.sin((k / 0.6) * Math.PI) : 0
    if (s.boostT > 0) {
      s.boostT = Math.max(0, s.boostT - dt / 0.9)
      s.hop = Math.sin((1 - s.boostT) * Math.PI) * 2.6
    } else {
      s.hop = baseHop
    }
    if (!paused('slime') && baseHop > 0 && s.boostT <= 0) {
      s.x += s.dir * 22 * dt
      const minX = SLIME_RANGE.minCol * TILE + 8
      const maxX = SLIME_RANGE.maxCol * TILE + 8
      if (s.x > maxX || s.x < minX) {
        s.x = Math.max(minX, Math.min(maxX, s.x))
        s.dir *= -1
      }
    }

    // koi swims up & down the river and leaps now and then
    const f = this.fish
    if (!paused('fish')) {
      f.y += (f.down ? 1 : -1) * 18 * dt
      if (f.y > FISH_MAX_Y) f.down = false
      if (f.y < FISH_MIN_Y) f.down = true
    }
    f.x = RIVER_X + Math.sin(t * 1.3) * 5
    if (f.jump >= 0) {
      f.jump += dt / 0.9
      if (f.jump >= 1) {
        f.jump = -1
        f.nextJump = 5 + Math.random() * 5
        this.splash(f.x, f.y + 2)
      }
    } else {
      f.nextJump -= dt
      if (f.nextJump <= 0 && !paused('fish')) this.startFishJump()
      if (Math.random() < dt * 1.5) {
        this.particles.push({ x: f.x + (Math.random() - 0.5) * 4, y: f.y - 2, vx: 0, vy: -10, life: 0, max: 0.6, color: '#dff4fb', size: 1 })
      }
    }

    // dragon flying patrol, random fire & random lightning
    const d = this.dragon
    if (!paused('dragon')) {
      d.flyT += dt * 0.35
      const prevX = d.x
      d.x = WIDTH * 0.5 + Math.sin(d.flyT) * (WIDTH * 0.36)
      d.y = 78 + Math.sin(d.flyT * 2) * 36
      if (Math.abs(d.x - prevX) > 0.01) d.faceLeft = d.x < prevX
      d.nextFire -= dt
      if (d.nextFire <= 0 && d.fireT <= 0) {
        d.fireT = 1.2
        d.nextFire = 3.5 + Math.random() * 4.5
      }
      d.nextBolt -= dt
      if (d.nextBolt <= 0) {
        d.boltT = 0.28
        d.boltX = Math.max(24, Math.min(WIDTH - 24, d.x + (Math.random() - 0.5) * 90))
        d.boltY = Math.max(48, Math.min(HEIGHT - 24, d.y + 20 + Math.random() * 60))
        d.nextBolt = 5 + Math.random() * 6
        this.flash = Math.max(this.flash, 0.35)
        this.burst(d.boltX, d.boltY, 10, ['#ffffff', '#a8f0ff', '#fff6d6'])
        this.addBurn(d.boltX, d.boltY, 'grass', 9)
      }
    }
    if (d.boltT > 0) d.boltT = Math.max(0, d.boltT - dt)

    const mouthX = d.x + (d.faceLeft ? -9 : 9)
    const mouthY = d.y + 6 - 11
    if (d.fireT > 0) {
      d.fireT -= dt
      for (let i = 0; i < 3; i++) {
        const dir = d.faceLeft ? -1 : 1
        this.particles.push({
          x: mouthX,
          y: mouthY + (Math.random() - 0.5) * 2,
          vx: dir * (55 + Math.random() * 45),
          vy: (Math.random() - 0.5) * 26 + 12,
          life: 0,
          max: 0.45 + Math.random() * 0.3,
          color: ['#fff6d6', '#ffd47a', '#f39a5a', '#e0705f'][Math.floor(Math.random() * 4)],
          size: Math.random() > 0.5 ? 2 : 3,
          isFire: true,
        })
      }
    } else if (Math.random() < dt * 0.8) {
      this.particles.push({ x: mouthX, y: mouthY, vx: (d.faceLeft ? -1 : 1) * 4, vy: -10, life: 0, max: 1.1, color: 'rgba(255,255,255,0.65)', size: 2 })
    }

    // wizard staff sparkles
    if (Math.random() < dt * 2.5) {
      const orbX = this.wizard.x + (this.wizard.faceLeft ? -5 : 5)
      this.particles.push({
        x: orbX + (Math.random() - 0.5) * 4,
        y: this.wizard.y + 5 - 20,
        vx: (Math.random() - 0.5) * 8,
        vy: -8 - Math.random() * 8,
        life: 0,
        max: 0.8,
        color: Math.random() > 0.5 ? '#a8f0ff' : '#fff6d6',
        size: 1,
      })
    }
  }

  private castSpell() {
    const wx = this.wizard.x
    const wy = this.wizard.y - 8
    this.burst(wx, wy, 28, ['#a8f0ff', '#c9b8ee', '#fff6d6', '#ffd47a'])
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        vx: 0,
        vy: -12,
        life: 0,
        max: 0.6 + Math.random() * 0.6,
        color: Math.random() > 0.5 ? '#fff6d6' : '#c9b8ee',
        size: 1,
      })
    }
    this.flash = 1
    playSfx('magic')
  }

  /* --------------------------- day & season -------------------------- */

  private applySeason(id: SeasonId, announce: boolean) {
    this.season = id
    setDrawSeason(id)
    const bctx = this.bg.getContext('2d')
    if (bctx) {
      bctx.clearRect(0, 0, WIDTH, HEIGHT)
      renderBackground(bctx)
    }
    const count = SEASONS[id].weatherCount
    this.weather = Array.from({ length: count }, () => this.makeWeather(true))
    if (announce) {
      this.flash = Math.max(this.flash, 0.8)
      this.emitWorld()
    }
  }

  private updateCycle(dt: number) {
    this.cycle += dt / DAY_LENGTH
    if (this.cycle >= 1) {
      this.cycle -= 1
      const next = SEASON_ORDER[(SEASON_ORDER.indexOf(this.season) + 1) % SEASON_ORDER.length]
      this.applySeason(next, true)
    }
    const target = darknessAt(this.cycle)
    this.dark += (target - this.dark) * Math.min(1, dt * 3)
    this.flash = Math.max(0, this.flash - dt / 0.6)
    this.emitWorld()
  }

  private emitWorld(force = false) {
    const night = darknessAt(this.cycle) > 0.5
    const key = `${this.season}:${night}`
    if (!force && key === this.lastWorld) return
    this.lastWorld = key
    this.cb.onWorld({ season: this.season, night })
  }

  private buildStaticLights(): Light[] {
    const lights: Light[] = []
    for (const p of PROPS) if (p.kind === 'lantern') lights.push({ x: p.col * TILE + 8, y: p.row * TILE + 7, r: 30 })
    for (const b of BUILDINGS) {
      const d = doorRect(b)
      lights.push({ x: d.x + d.w / 2, y: d.y + d.h - 2, r: 20 })
      for (const [ox, oy] of WINDOW_OFFSETS[b.style]) lights.push({ x: b.x * TILE + ox, y: b.y * TILE + oy, r: 16 })
    }
    return lights
  }

  /* ----------------------------- movement ---------------------------- */

  private playerTile() {
    return { col: Math.floor(this.player.x / TILE), row: Math.floor(this.player.y / TILE) }
  }

  private walkToBuilding(b: BuildingLayout) {
    const m = matTile(b)
    this.walkToTile(m.col, m.row, b.id)
  }

  private walkToTile(col: number, row: number, building: BuildingId | null) {
    const start = this.playerTile()
    const tiles = findPath(start, { col, row })
    if (!tiles) return
    const startCenter = tileCenter(start.col, start.row)
    this.path = [startCenter, ...tiles.map((t) => tileCenter(t.col, t.row))]
    this.pendingBuilding = building
    this.pendingNpc = null
    this.hasMoved = true
  }

  private collides(x: number, y: number) {
    const pts = [
      [x - 4, y - 2],
      [x + 4, y - 2],
      [x - 4, y + 4],
      [x + 4, y + 4],
    ]
    return pts.some(([px, py]) => isBlocked(Math.floor(px / TILE), Math.floor(py / TILE)))
  }

  private buildingAtMat(col: number, row: number) {
    return BUILDINGS.find((b) => {
      const m = matTile(b)
      return m.col === col && m.row === row
    })
  }

  private updateFree(dt: number) {
    const p = this.player
    if (this.held.length) {
      this.path = []
      this.pendingBuilding = null
      this.pendingNpc = null
      this.hasMoved = true
      const dir = this.held[this.held.length - 1]
      p.dir = dir
      const [vx, vy] = DIR_VECTORS[dir]
      const step = SPEED * dt
      const nx = p.x + vx * step
      const ny = p.y + vy * step
      let moved = false
      if (!this.collides(nx, p.y)) {
        p.x = nx
        moved = moved || vx !== 0
      }
      if (!this.collides(p.x, ny)) {
        p.y = ny
        moved = moved || vy !== 0
      }
      p.x = Math.max(6, Math.min(WIDTH - 6, p.x))
      p.y = Math.max(4, Math.min(HEIGHT - 6, p.y))
      p.moving = moved
      if (dir === 'up' && !moved) {
        const t = this.playerTile()
        const b = this.buildingAtMat(t.col, t.row)
        if (b && Math.abs(p.x - tileCenter(t.col, t.row).x) < 7) this.beginEnter(b)
      }
      return
    }

    if (!this.path.length) {
      p.moving = false
      return
    }
    const target = this.path[0]
    const dx = target.x - p.x
    const dy = target.y - p.y
    const dist = Math.hypot(dx, dy)
    const step = SPEED * dt
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left'
      else p.dir = dy > 0 ? 'down' : 'up'
    }
    if (dist <= step) {
      p.x = target.x
      p.y = target.y
      this.path.shift()
      if (!this.path.length) {
        p.moving = false
        if (this.pendingNpc) {
          this.beginTalk(this.pendingNpc)
          return
        }
        const t = this.playerTile()
        const atMat = this.buildingAtMat(t.col, t.row)
        const pending = this.pendingBuilding ? BUILDINGS.find((b) => b.id === this.pendingBuilding) : undefined
        this.pendingBuilding = null
        const b = pending ?? atMat
        if (b) this.beginEnter(b)
      }
    } else {
      p.x += (dx / dist) * step
      p.y += (dy / dist) * step
      p.moving = true
    }
  }

  /* -------------------------- door sequence -------------------------- */

  private beginEnter(b: BuildingLayout) {
    const m = matTile(b)
    const c = tileCenter(m.col, m.row)
    this.player.x = c.x
    this.player.y = c.y
    this.player.dir = 'up'
    this.player.moving = false
    this.path = []
    this.held = []
    this.active = b
    this.phase = 'opening'
    this.phaseT = 0
    this.setZone(b.id)
    playSfx('chime')
  }

  private updateSequence(dt: number) {
    const b = this.active
    if (!b) return
    this.phaseT += dt
    const m = matTile(b)
    const mat = tileCenter(m.col, m.row)
    const d = doorRect(b)
    const doorY = d.y + d.h - 6

    if (this.phase === 'opening') {
      if (this.doors[b.id] > 0.25 && Math.random() < 0.7) this.sparkleAtDoor(b)
      if (this.doors[b.id] >= 1 && this.phaseT > 0.55) this.next('stepIn')
    } else if (this.phase === 'stepIn') {
      const k = Math.min(1, this.phaseT / 0.45)
      this.player.y = mat.y + (doorY - mat.y) * k
      this.player.moving = true
      this.player.alpha = 1 - k * 0.7
      if (Math.random() < 0.5) this.sparkleAtDoor(b)
      if (k >= 1) {
        this.player.moving = false
        this.next('irisOut')
        playSfx('whoosh')
      }
    } else if (this.phase === 'irisOut') {
      if (this.phaseT >= 0.5) {
        this.next('inside')
        this.cb.onEnter(b.id)
      }
    } else if (this.phase === 'irisIn') {
      if (this.phaseT >= 0.45) {
        this.next('stepOut')
        this.player.dir = 'down'
      }
    } else if (this.phase === 'stepOut') {
      const k = Math.min(1, this.phaseT / 0.4)
      this.player.y = doorY + (mat.y - doorY) * k
      this.player.alpha = 0.3 + k * 0.7
      this.player.moving = true
      if (k >= 1) {
        this.player.moving = false
        this.player.alpha = 1
        this.next('closing')
      }
    } else if (this.phase === 'closing') {
      if (this.doors[b.id] <= 0) {
        this.phase = 'free'
        this.active = null
      }
    }
  }

  private next(phase: Phase) {
    this.phase = phase
    this.phaseT = 0
  }

  private updateDoors(dt: number) {
    for (const b of BUILDINGS) {
      const open =
        this.active?.id === b.id && this.phase !== 'closing' && this.phase !== 'free' && this.phase !== 'talking'
      const target = open ? 1 : 0
      const cur = this.doors[b.id]
      const speed = dt / 0.4
      this.doors[b.id] = target > cur ? Math.min(1, cur + speed) : Math.max(0, cur - speed)
    }
  }

  /* ------------------------------ zones ------------------------------ */

  private setZone(z: ZoneKey) {
    if (z === this.zone) return
    this.zone = z
    this.cb.onZone(z)
  }

  private computeZone() {
    if (!this.hasMoved) return
    const p = this.player
    const npc = this.nearestNpc()
    if (npc && npc.dist <= this.talkRange(npc.id)) return this.setZone(npc.id)
    for (const b of BUILDINGS) {
      const m = matTile(b)
      const c = tileCenter(m.col, m.row)
      if (Math.hypot(c.x - p.x, c.y - p.y) < 30) return this.setZone(b.id)
    }
    const t = this.playerTile()
    if (isBridge(t.col, t.row)) return this.setZone('bridge')
    for (const prop of PROPS) {
      const c = tileCenter(prop.col, prop.row)
      const dist = Math.hypot(c.x - p.x, c.y - p.y)
      if (prop.kind === 'notice' && dist < 22) return this.setZone('notice')
      if (prop.kind === 'tree' && dist < 22) return this.setZone('sakura')
    }
    if (isRiver(t.col - 1) || isRiver(t.col + 1)) return this.setZone('river')
    this.setZone('village')
  }

  /* ---------------------------- particles ---------------------------- */

  private makeWeather(randomY = false): Weather {
    const s = SEASONS[this.season]
    const color = s.weatherColors[Math.floor(Math.random() * s.weatherColors.length)]
    const x = Math.random() * (WIDTH + 60) - 40
    const y = randomY ? Math.random() * HEIGHT : -6 - Math.random() * 40
    const phase = Math.random() * Math.PI * 2
    switch (s.weather) {
      case 'rain':
        return { x, y, vx: -28, vy: 170 + Math.random() * 50, phase, sway: 0, color, w: 1, h: 4 }
      case 'snow': {
        const big = Math.random() > 0.6
        return { x, y, vx: -2 + Math.random() * 4, vy: 10 + Math.random() * 10, phase, sway: 8, color, w: big ? 2 : 1, h: big ? 2 : 1 }
      }
      case 'leaf':
        return { x, y, vx: 6 + Math.random() * 8, vy: 14 + Math.random() * 8, phase, sway: 16, color, w: Math.random() > 0.5 ? 3 : 2, h: 2 }
      case 'pollen':
        return {
          x: Math.random() * WIDTH,
          y: Math.random() * HEIGHT,
          vx: -3 + Math.random() * 6,
          vy: -4 + Math.random() * 3,
          phase,
          sway: 6,
          color,
          w: 1,
          h: 1,
        }
      default:
        return { x, y, vx: 8 + Math.random() * 10, vy: 10 + Math.random() * 12, phase, sway: 10, color, w: Math.random() > 0.5 ? 2 : 3, h: 2 }
    }
  }

  private sparkleAtDoor(b: BuildingLayout) {
    const d = doorRect(b)
    this.particles.push({
      x: d.x + Math.random() * d.w,
      y: d.y + 4 + Math.random() * (d.h - 4),
      vx: (Math.random() - 0.5) * 14,
      vy: -14 - Math.random() * 16,
      life: 0,
      max: 0.7 + Math.random() * 0.5,
      color: Math.random() > 0.4 ? '#fff6d6' : '#ffd47a',
      size: Math.random() > 0.7 ? 2 : 1,
    })
  }

  private splash(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 30,
        life: 0,
        max: 0.5,
        color: ['#ffffff', '#dff4fb', '#9dd3e8'][i % 3],
        size: Math.random() > 0.5 ? 2 : 1,
      })
    }
  }

  private burst(x: number, y: number, n: number, colors: string[]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const s = 20 + Math.random() * 30
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0,
        max: 0.5 + Math.random() * 0.3,
        color: colors[i % colors.length],
        size: 2,
      })
    }
  }

  private updateParticles(dt: number) {
    for (const pt of this.particles) {
      pt.life += dt
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
      pt.vx *= 0.96
      if (pt.isFire) {
        // 1. Check NPC hits
        for (const id of NPC_IDS) {
          if (id === 'dragon') continue
          const a = this.npcAnchor(id)
          if (Math.hypot(pt.x - a.x, pt.y - a.y) < 16) {
            pt.isFire = false
            playNpcHitSound()
            if (id === 'wizard') {
              this.wizard.burnT = 3.2
              this.wizard.panicDirT = 0
            } else if (id === 'slime') {
              this.slime.burnT = 2.5
            } else if (id !== 'fish') {
              this.friends[id].burnT = 2.5
            }
            break
          }
        }
        // 2. Check Buildings, Trees/Props, and Grass
        if (pt.isFire && pt.life > pt.max * 0.45) {
          const hitBuilding = BUILDINGS.find(
            (b) => pt.x >= b.x * TILE && pt.x <= (b.x + b.w) * TILE && pt.y >= b.y * TILE && pt.y <= (b.y + b.h) * TILE,
          )
          if (hitBuilding) {
            pt.isFire = false
            this.addBurn(pt.x, pt.y, 'building', 10)
          } else {
            const hitProp = PROPS.find((pr) => Math.hypot(pt.x - (pr.col * TILE + 8), pt.y - (pr.row * TILE + 8)) < 14)
            if (hitProp) {
              pt.isFire = false
              this.addBurn(hitProp.col * TILE + 8, hitProp.row * TILE + 6, 'prop', 11)
            } else if (!isRiver(Math.floor(pt.x / TILE)) && Math.random() < 0.25) {
              pt.isFire = false
              this.addBurn(pt.x, pt.y, 'grass', 7)
            }
          }
        }
      }
    }
    this.particles = this.particles.filter((pt) => pt.life < pt.max)

    // Update burning grass, trees, and buildings
    for (const b of this.burns) {
      b.life += dt
      if (Math.random() < dt * 10) {
        this.particles.push({
          x: b.x + (Math.random() - 0.5) * b.r,
          y: b.y + (Math.random() - 0.5) * (b.r * 0.6),
          vx: (Math.random() - 0.5) * 8,
          vy: -12 - Math.random() * 14,
          life: 0,
          max: 0.35 + Math.random() * 0.25,
          color: ['#fff6d6', '#ffd47a', '#f39a5a', '#e0705f'][Math.floor(Math.random() * 4)],
          size: Math.random() > 0.5 ? 2 : 1,
        })
      }
      if (Math.random() < dt * 3) {
        this.particles.push({
          x: b.x + (Math.random() - 0.5) * b.r,
          y: b.y - 4,
          vx: 3,
          vy: -10,
          life: 0,
          max: 0.7,
          color: 'rgba(60,50,65,0.45)',
          size: 2,
        })
      }
    }
    this.burns = this.burns.filter((b) => b.life < b.max)

    const kind = SEASONS[this.season].weather
    for (const w of this.weather) {
      w.phase += dt * 2
      w.x += (w.vx + Math.sin(w.phase) * w.sway) * dt
      w.y += w.vy * dt
      if (kind === 'pollen') {
        if (w.x < 0) w.x += WIDTH
        if (w.x > WIDTH) w.x -= WIDTH
        if (w.y < 0) w.y += HEIGHT
        if (w.y > HEIGHT) w.y -= HEIGHT
        continue
      }
      const groundY = kind === 'rain' ? HEIGHT * (0.2 + ((w.phase * 13) % 1) * 0.8) : HEIGHT + 6
      if (w.y > groundY || w.x > WIDTH + 6 || w.x < -46) {
        if (kind === 'rain' && w.y <= HEIGHT) {
          this.particles.push({ x: w.x - 1, y: w.y, vx: -10, vy: -8, life: 0, max: 0.2, color: 'rgba(230,242,255,0.8)', size: 1 })
          this.particles.push({ x: w.x + 1, y: w.y, vx: 10, vy: -8, life: 0, max: 0.2, color: 'rgba(230,242,255,0.8)', size: 1 })
        }
        Object.assign(w, this.makeWeather())
      }
    }

    for (const rp of this.ripples) rp.t += dt
    this.ripples = this.ripples.filter((rp) => rp.t < 0.5)

    const home = BUILDINGS.find((b) => b.style === 'house')
    if (home && Math.random() < dt * 3) {
      this.particles.push({
        x: home.x * TILE + 60,
        y: home.y * TILE - 12,
        vx: 4 + Math.random() * 4,
        vy: -8 - Math.random() * 4,
        life: 0,
        max: 1.6,
        color: 'rgba(255,255,255,0.7)',
        size: 3,
      })
    }
  }

  /* --------------------------- update/render ------------------------- */

  private update(dt: number) {
    this.time += dt
    if (this.phase === 'free') {
      this.updateFree(dt)
      if (this.phase === 'free') this.computeZone()
    } else if (this.phase !== 'talking') {
      this.updateSequence(dt)
    }
    this.updateDoors(dt)
    this.updateNpcs(dt)
    this.updateParticles(dt)
    this.updateCycle(dt)

    const p = this.player
    if (p.moving) {
      p.animT += dt
      if (p.animT > 0.13) {
        p.animT = 0
        p.frameIdx = (p.frameIdx + 1) % WALK_FRAMES.length
        if (WALK_FRAMES[p.frameIdx] === 1 && this.phase === 'free') playSfx('step')
      }
    } else {
      p.frameIdx = 0
      p.animT = 0
    }
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    const px = Math.round(x)
    const py = Math.round(y)
    ctx.fillStyle = color
    ctx.fillRect(px - 2, py - 1, 2, 1)
    ctx.fillRect(px + 1, py - 1, 2, 1)
    ctx.fillRect(px - 2, py, 5, 2)
    ctx.fillRect(px - 1, py + 2, 3, 1)
    ctx.fillRect(px, py + 3, 1, 1)
  }

  private render() {
    const ctx = this.ctx
    const t = this.time
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    drawWater(ctx, t)
    if (this.season === 'winter') {
      ctx.fillStyle = 'rgba(240,248,255,0.35)'
      ctx.fillRect(RIVER_COLS[0] * TILE, 0, RIVER_COLS.length * TILE, HEIGHT)
    }
    ctx.drawImage(this.bg, 0, 0)
    drawFish(ctx, this.fish.x, this.fish.y, this.fish.down, Math.max(0, this.fish.jump), t)
    drawBridges(ctx)
    for (const b of BUILDINGS) drawDoor(ctx, b, this.doors[b.id], t)

    // Render scorch/ember glow on burning grass/props/buildings
    for (const b of this.burns) {
      const k = 1 - b.life / b.max
      ctx.globalAlpha = 0.35 * k
      ctx.fillStyle = '#3b2218'
      ctx.fillRect(Math.round(b.x - b.r * 0.6), Math.round(b.y - b.r * 0.3), Math.round(b.r * 1.2), Math.round(b.r * 0.7))
      ctx.globalAlpha = 0.65 * k
      ctx.fillStyle = Math.sin(t * 16 + b.x) > 0 ? '#f39a5a' : '#ffd47a'
      ctx.fillRect(Math.round(b.x - 2), Math.round(b.y - 2), 4, 3)
      ctx.globalAlpha = 1
    }

    const p = this.player
    const entities: { y: number; draw: () => void }[] = PROPS.map((prop) => ({
      y: prop.row * TILE + 14,
      draw: () => drawProps(ctx, prop.kind, prop.col, prop.row, t),
    }))
    for (const id of FRIEND_IDS) {
      const f = this.friends[id]
      entities.push({
        y: f.y + 4,
        draw: () => {
          ctx.fillStyle = 'rgba(59,42,63,0.22)'
          ctx.fillRect(Math.round(f.x - 5), Math.round(f.y + 4), 10, 2)
          const frame = f.targetX !== null ? WALK_FRAMES[f.frameIdx] : Math.sin(t * 1.5 + f.x) > 0.92 ? 1 : 0
          drawCharacter(ctx, Math.round(f.x - 6), Math.round(f.y - 11), f.dir, frame, FRIEND_LOOKS[id])
        },
      })
    }
    entities.push({ y: this.wizard.y + 5, draw: () => drawWizard(ctx, this.wizard.x, this.wizard.y + 5, t, this.wizard.faceLeft) })
    entities.push({ y: this.dragon.y + 6, draw: () => drawDragon(ctx, this.dragon.x, this.dragon.y + 6, t, this.dragon.faceLeft) })
    entities.push({ y: SLIME_Y, draw: () => drawSlime(ctx, this.slime.x, SLIME_Y, this.slime.hop, t) })
    entities.push({
      y: p.y + 4,
      draw: () => {
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = 'rgba(59,42,63,0.22)'
        ctx.fillRect(Math.round(p.x - 5), Math.round(p.y + 4), 10, 2)
        drawCharacter(ctx, Math.round(p.x - 6), Math.round(p.y - 11), p.dir, WALK_FRAMES[p.frameIdx])
        ctx.globalAlpha = 1
      },
    })
    entities.sort((a, b) => a.y - b.y).forEach((e) => e.draw())

    for (const pt of this.particles) {
      ctx.globalAlpha = 1 - pt.life / pt.max
      if (pt.kind === 'heart') {
        this.drawHeart(ctx, pt.x, pt.y, pt.color)
      } else {
        ctx.fillStyle = pt.color
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size)
      }
    }
    ctx.globalAlpha = 1

    for (const w of this.weather) {
      ctx.fillStyle = w.color
      ctx.fillRect(Math.round(w.x), Math.round(w.y), w.w, w.h)
    }

    if (this.dragon.boltT > 0) {
      const bx = Math.round(this.dragon.boltX)
      const by = Math.round(this.dragon.boltY)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx, 0)
      ctx.lineTo(bx - 5, by * 0.35)
      ctx.lineTo(bx + 4, by * 0.65)
      ctx.lineTo(bx, by)
      ctx.stroke()
      ctx.strokeStyle = '#a8f0ff'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    this.renderLighting()

    for (const rp of this.ripples) {
      const k = rp.t / 0.5
      const rad = 2 + k * 9
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#fff6e0'
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.fillRect(Math.round(rp.x + Math.cos(a) * rad) - 1, Math.round(rp.y + Math.sin(a) * rad * 0.6) - 1, 2, 2)
      }
      ctx.fillStyle = '#8b78bf'
      ctx.fillRect(Math.round(rp.x) - 1, Math.round(rp.y) - 1, 2, 2)
      ctx.globalAlpha = 1
    }

    for (const b of BUILDINGS) {
      drawSign(ctx, b, buildingContent[b.id].sign, this.font, t, this.zone === b.id && this.phase === 'free')
    }

    const bubbleId = this.talkId ?? (this.phase === 'free' && NPC_IDS.includes(this.zone as NpcId) ? (this.zone as NpcId) : null)
    if (bubbleId) {
      const a = this.npcAnchor(bubbleId)
      drawBubble(ctx, a.x, a.top, t, this.talkId === bubbleId)
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,250,240,${(this.flash * 0.55).toFixed(3)})`
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }

    this.renderIris()
  }

  private renderLighting() {
    const ctx = this.ctx
    const t = this.time
    const d = this.dark
    const season = SEASONS[this.season]

    if (this.season === 'monsoon') {
      ctx.fillStyle = `rgba(60,72,110,${(0.14 * (1 - d)).toFixed(3)})`
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }

    const dusk = duskAt(this.cycle)
    if (dusk > 0.01) {
      ctx.fillStyle = `rgba(255,140,90,${(0.2 * dusk).toFixed(3)})`
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }

    if (d < 0.01) return
    const lights: Light[] = [
      ...this.staticLights,
      { x: this.player.x, y: this.player.y - 4, r: 30 },
      { x: this.wizard.x + (this.wizard.faceLeft ? -5 : 5), y: this.wizard.y - 14, r: 22 },
    ]
    if (this.dragon.fireT > 0) lights.push({ x: this.dragon.x + (this.dragon.faceLeft ? -18 : 18), y: this.dragon.y - 5, r: 34 })
    for (const b of this.burns) lights.push({ x: b.x, y: b.y, r: 22 })

    const l = this.lightCtx
    if (l) {
      l.globalCompositeOperation = 'source-over'
      l.clearRect(0, 0, WIDTH, HEIGHT)
      l.fillStyle = `rgba(22,18,58,${(0.64 * d).toFixed(3)})`
      l.fillRect(0, 0, WIDTH, HEIGHT)
      l.globalCompositeOperation = 'destination-out'
      for (const li of lights) {
        const flicker = li.r + Math.sin(t * 6 + li.x) * 1.5
        const g = l.createRadialGradient(li.x, li.y, 0, li.x, li.y, flicker)
        g.addColorStop(0, 'rgba(0,0,0,0.95)')
        g.addColorStop(0.55, 'rgba(0,0,0,0.5)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        l.fillStyle = g
        l.fillRect(li.x - flicker, li.y - flicker, flicker * 2, flicker * 2)
      }
      l.globalCompositeOperation = 'source-over'
      ctx.drawImage(this.light, 0, 0)
    }

    ctx.globalCompositeOperation = 'lighter'
    for (const li of this.staticLights) {
      const g = ctx.createRadialGradient(li.x, li.y, 0, li.x, li.y, li.r * 0.7)
      g.addColorStop(0, `rgba(255,180,90,${(0.22 * d).toFixed(3)})`)
      g.addColorStop(1, 'rgba(255,180,90,0)')
      ctx.fillStyle = g
      ctx.fillRect(li.x - li.r, li.y - li.r, li.r * 2, li.r * 2)
    }
    ctx.globalCompositeOperation = 'source-over'

    if (season.fireflies) {
      for (let i = 0; i < 14; i++) {
        const bx = 20 + ((i * 97) % (WIDTH - 40))
        const by = 20 + ((i * 53) % (HEIGHT - 40))
        const x = Math.round(bx + Math.sin(t * 0.6 + i * 1.7) * 16)
        const y = Math.round(by + Math.cos(t * 0.8 + i) * 10)
        const a = d * (0.45 + 0.55 * Math.sin(t * 3 + i * 2))
        if (a <= 0.05) continue
        ctx.globalAlpha = a * 0.35
        ctx.fillStyle = '#e8ff9a'
        ctx.fillRect(x - 1, y - 1, 3, 3)
        ctx.globalAlpha = a
        ctx.fillStyle = '#fbffd6'
        ctx.fillRect(x, y, 1, 1)
      }
      ctx.globalAlpha = 1
    }
  }

  private renderIris() {
    const b = this.active
    if (!b) return
    let k = -1
    if (this.phase === 'irisOut') k = Math.min(1, this.phaseT / 0.5)
    else if (this.phase === 'inside') k = 1
    else if (this.phase === 'irisIn') k = 1 - Math.min(1, this.phaseT / 0.45)
    if (k < 0) return
    const d = doorRect(b)
    const cx = d.x + d.w / 2
    const cy = d.y + d.h / 2
    const maxR = Math.hypot(WIDTH, HEIGHT)
    const radius = Math.max(0, Math.round(((1 - k) * maxR) / 4) * 4)
    const ctx = this.ctx
    ctx.fillStyle = '#241a2b'
    ctx.beginPath()
    ctx.rect(0, 0, WIDTH, HEIGHT)
    if (radius > 0) ctx.arc(cx, cy, radius, 0, Math.PI * 2, true)
    ctx.fill('evenodd')
  }
}
