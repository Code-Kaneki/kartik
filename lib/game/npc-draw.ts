import { BLUSH, SKIN, type Look, type RealmId } from './draw'

type Ctx = CanvasRenderingContext2D

const INK = '#3b2a3f'
const SHADOW = 'rgba(59,42,63,0.22)'

const r = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function painter(ctx: Ctx, ox: number, oy: number, w: number, flip: boolean) {
  return (x: number, y: number, pw: number, ph: number, c: string) =>
    r(ctx, ox + (flip ? w - x - pw : x), oy + y, pw, ph, c)
}

/** Mahi ALWAYS wears a black hoodie and Sam ALWAYS wears a pink hoodie in every theme. */
export const FRIEND_LOOKS: Record<'mahi' | 'rishi' | 'raunak' | 'sam', Look> = {
  mahi: { hair: '#2a1f1d', top: '#1e1c24', topDark: '#121017', string: '#e2dff0', pants: '#343140', shoes: '#f5f0e6' },
  rishi: { hair: '#1f1a24', top: '#e0876a', topDark: '#b8644d', string: '#fff1e6', pants: '#3e4a6b', shoes: '#2d2233' },
  raunak: { hair: '#3a2a20', top: '#5fa8d3', topDark: '#3f86b0', string: '#e6f4fb', pants: '#2f3550', shoes: '#f5f0e6' },
  sam: {
    hair: '#2a1b1f',
    top: '#f48fb1',
    topDark: '#d86b91',
    string: '#fff0f5',
    pants: '#5c426b',
    shoes: '#f5f0e6',
    longHair: true,
    bow: '#e0705f',
  },
}

export function getFriendLook(id: 'mahi' | 'rishi' | 'raunak' | 'sam', realm: RealmId): Look {
  if (id === 'mahi' || id === 'sam') return FRIEND_LOOKS[id]
  if (realm === 'nether') {
    if (id === 'rishi') {
      return { hair: '#1f1a24', top: '#5c1a24', topDark: '#3a0e16', string: '#ffd166', pants: '#211924', shoes: '#3a2a24' }
    }
    return { hair: '#3a2a20', top: '#2b2436', topDark: '#191421', string: '#5ce1e6', pants: '#1a141f', shoes: '#3a2a24' }
  }
  if (realm === 'indian') {
    if (id === 'rishi') {
      return { hair: '#1f1a24', top: '#e63946', topDark: '#b82532', string: '#ffd166', pants: '#fdf6e3', shoes: '#7a4a2a' }
    }
    return { hair: '#3a2a20', top: '#2a9d8f', topDark: '#1d786d', string: '#ffe599', pants: '#fdf6e3', shoes: '#7a4a2a' }
  }
  return FRIEND_LOOKS[id]
}

/** Old wizard, 13x20, feet centered on (cx, by). */
export function drawWizard(ctx: Ctx, cx: number, by: number, t: number, faceLeft: boolean, realm: RealmId = 'overworld') {
  const bob = Math.sin(t * 2.2) > 0 ? 0 : -1
  const ox = Math.round(cx - 6)
  const oy = Math.round(by - 21)
  const P = painter(ctx, ox, oy, 13, faceLeft)
  const robe = realm === 'nether' ? '#3a1622' : realm === 'indian' ? '#e8822a' : '#6a5bb5'
  const robeDark = realm === 'nether' ? '#210a12' : realm === 'indian' ? '#b85d19' : '#4f4294'
  const orb = realm === 'nether' ? '#ff6b2b' : realm === 'indian' ? '#ffd166' : '#a8f0ff'
  const beard = '#f5f0e6'
  r(ctx, cx - 6, by - 1, 12, 2, SHADOW)
  P(11, 4 + bob, 1, 17 - bob, '#8a5f3c')
  const pulse = 0.6 + Math.sin(t * 4) * 0.4
  ctx.globalAlpha = pulse
  P(10, 1 + bob, 3, 3, orb)
  ctx.globalAlpha = 1
  P(11, 2 + bob, 1, 1, '#ffffff')
  P(3, 10 + bob, 7, 3, robe)
  P(2, 13 + bob, 9, 3, robe)
  P(1, 16, 11, 4, robe)
  P(1, 19, 11, 1, robeDark)
  P(2, 13 + bob, 9, 1, '#ffd47a')
  P(6, 14 + bob, 1, 5, robeDark)
  P(9, 12 + bob, 2, 3, robeDark)
  P(10, 14 + bob, 1, 1, SKIN)
  P(4, 7 + bob, 5, 3, SKIN)
  P(5, 8 + bob, 1, 1, INK)
  P(7, 8 + bob, 1, 1, INK)
  P(3, 9 + bob, 7, 2, beard)
  P(4, 11 + bob, 5, 2, beard)
  P(5, 13 + bob, 3, 2, beard)
  P(6, 15 + bob, 1, 1, beard)
  P(1, 6 + bob, 11, 2, robeDark)
  P(3, 4 + bob, 7, 2, robe)
  P(4, 2 + bob, 5, 2, robe)
  P(5, 0 + bob, 3, 2, robe)
  P(7, -1 + bob + (Math.sin(t * 3) > 0 ? 0 : 1), 2, 1, robe)
  P(5, 4 + bob, 1, 1, '#ffd47a')
  P(7, 2 + bob, 1, 1, '#fff6d6')
}

/** Baby dragon, 16x15, feet centered on (cx, by). Faces right unless faceLeft. */
export function drawDragon(ctx: Ctx, cx: number, by: number, t: number, faceLeft: boolean) {
  const breathe = Math.sin(t * 2) > 0 ? 0 : 1
  const wingUp = Math.sin(t * 7) > 0
  const ox = Math.round(cx - 8)
  const oy = Math.round(by - 16)
  const P = painter(ctx, ox, oy, 16, faceLeft)
  const body = '#7cc6a4'
  const dark = '#4f9a7f'
  const belly = '#f6e6b0'
  const wing = '#c9b8ee'
  const wingDark = '#9d88d6'
  r(ctx, cx - 7, by - 1, 14, 2, SHADOW)
  P(0, 11, 3, 2, dark)
  P(1, 9, 2, 2, body)
  P(0, 8, 2, 1, '#f7a8c4')
  if (wingUp) {
    P(4, 1, 4, 6, wing)
    P(3, 0, 2, 2, wing)
    P(4, 1, 1, 6, wingDark)
  } else {
    P(2, 6, 4, 4, wing)
    P(1, 8, 2, 3, wing)
    P(2, 9, 4, 1, wingDark)
  }
  P(3, 7 + breathe, 8, 7 - breathe, body)
  P(5, 8 + breathe, 4, 6 - breathe, belly)
  P(4, 14, 2, 2, dark)
  P(8, 14, 2, 2, dark)
  P(8, 2 + breathe, 6, 5, body)
  P(13, 4 + breathe, 3, 3, body)
  P(15, 4 + breathe, 1, 1, dark)
  P(11, 4 + breathe, 1, 1, INK)
  P(10, 6 + breathe, 1, 1, BLUSH)
  P(9, 0 + breathe, 1, 2, '#fff1a8')
  P(12, 0 + breathe, 1, 2, '#fff1a8')
  P(9, 7 + breathe, 4, 1, dark)
}

/** Bouncy slime (becomes Magma Cube in Nether). */
export function drawSlime(ctx: Ctx, cx: number, by: number, hop: number, t: number, realm: RealmId = 'overworld') {
  const lift = Math.round(hop * 6)
  const squash = hop < 0.08
  const body = realm === 'nether' ? '#4a191c' : realm === 'indian' ? '#f4b942' : '#8fdcc2'
  const dark = realm === 'nether' ? '#290c0e' : realm === 'indian' ? '#d4881e' : '#5fb79c'
  const light = realm === 'nether' ? '#ff7b29' : realm === 'indian' ? '#fff0b3' : '#d8f7ec'
  const eye = realm === 'nether' ? '#ffd166' : INK
  r(ctx, cx - 6 + Math.round(hop * 2), by - 1, 12 - Math.round(hop * 4), 2, SHADOW)
  const ox = Math.round(cx - (squash ? 7 : 6))
  const oy = Math.round(by - (squash ? 7 : 9) - lift)
  if (squash) {
    r(ctx, ox + 2, oy, 10, 1, body)
    r(ctx, ox, oy + 1, 14, 5, body)
    r(ctx, ox + 1, oy + 6, 12, 1, dark)
    r(ctx, ox + 3, oy + 1, 2, 2, light)
    r(ctx, ox + 5, oy + 3, 1, 1, eye)
    r(ctx, ox + 8, oy + 3, 1, 1, eye)
    r(ctx, ox + 6, oy + 5, 2, 1, eye)
    return
  }
  r(ctx, ox + 3, oy, 6, 1, body)
  r(ctx, ox + 1, oy + 1, 10, 2, body)
  r(ctx, ox, oy + 3, 12, 5, body)
  r(ctx, ox + 1, oy + 8, 10, 1, dark)
  r(ctx, ox + 2, oy + 2, 2, 2, light)
  const blink = Math.sin(t * 1.7) > 0.96
  r(ctx, ox + 4, oy + 4, 1, blink ? 1 : 2, eye)
  r(ctx, ox + 7, oy + 4, 1, blink ? 1 : 2, eye)
  r(ctx, ox + 5, oy + 7, 2, 1, eye)
  r(ctx, ox + 3, oy + 6, 1, 1, BLUSH)
  r(ctx, ox + 8, oy + 6, 1, 1, BLUSH)
}

/** Koi fish swimming vertically. `jump` lifts it above the water. */
export function drawFish(ctx: Ctx, cx: number, cy: number, goingDown: boolean, jump: number, t: number) {
  const lift = Math.sin(jump * Math.PI) * 14
  const y = Math.round(cy - lift)
  const x = Math.round(cx)
  const orange = '#f39a5a'
  const white = '#fff6e6'
  const tailWag = Math.sin(t * 10) > 0 ? 1 : 0
  if (jump > 0) {
    ctx.fillStyle = 'rgba(59,42,63,0.18)'
    ctx.fillRect(x - 3, Math.round(cy + 4), 6, 1)
  } else {
    ctx.globalAlpha = 0.85
  }
  const dir = goingDown ? 1 : -1
  r(ctx, x - 2, y - 3, 5, 7, orange)
  r(ctx, x - 1, y - 4, 3, 9, orange)
  r(ctx, x - 1, y - 1, 2, 3, white)
  r(ctx, x - 1, y + dir * 3, 1, 1, INK)
  r(ctx, x + 1, y + dir * 3, 1, 1, INK)
  const ty = y - dir * 5
  r(ctx, x - 2 + tailWag, ty, 2, 2, '#e0705f')
  r(ctx, x + 1 - tailWag, ty, 2, 2, '#e0705f')
  r(ctx, x - 3, y, 1, 2, '#e0705f')
  r(ctx, x + 3, y, 1, 2, '#e0705f')
  ctx.globalAlpha = 1
}

/** Tiny pink lotus flower held between Mahi & Sam. */
export function drawLotus(ctx: Ctx, cx: number, cy: number) {
  const x = Math.round(cx)
  const y = Math.round(cy)
  r(ctx, x - 3, y + 1, 6, 1, '#5aa154')
  r(ctx, x - 2, y, 4, 1, '#f48fb1')
  r(ctx, x - 3, y - 1, 6, 1, '#f7b2c9')
  r(ctx, x - 1, y - 2, 2, 1, '#ffd166')
}

/** Tiny food treat (laddu / snack plate) held between Sam & Mahi. */
export function drawFood(ctx: Ctx, cx: number, cy: number) {
  const x = Math.round(cx)
  const y = Math.round(cy)
  r(ctx, x - 3, y + 1, 6, 1, '#fdf6e3')
  r(ctx, x - 2, y - 1, 2, 2, '#ff9f1c')
  r(ctx, x + 1, y - 1, 2, 2, '#ffbf00')
  r(ctx, x - 1, y - 2, 2, 1, '#ffd166')
}

/** Small speech bubble above an NPC. `talking` shows animated dots, otherwise "!". */
export function drawBubble(ctx: Ctx, cx: number, topY: number, t: number, talking: boolean) {
  const bob = Math.round(Math.sin(t * 5) * 1)
  const x = Math.round(cx - 6)
  const y = Math.round(topY - 12 + bob)
  r(ctx, x - 1, y - 1, 14, 10, INK)
  r(ctx, x, y, 12, 8, '#fff6e0')
  r(ctx, x + 5, y + 9, 2, 2, INK)
  r(ctx, x + 5, y + 8, 2, 1, '#fff6e0')
  if (talking) {
    const n = Math.floor(t * 3) % 3
    for (let i = 0; i < 3; i++) r(ctx, x + 2 + i * 3, y + 3, 2, 2, i <= n ? INK : '#d6bf92')
  } else {
    r(ctx, x + 5, y + 1, 2, 4, '#e0705f')
    r(ctx, x + 5, y + 6, 2, 1, '#e0705f')
  }
}
