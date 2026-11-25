export type SfxName = 'blip' | 'step' | 'chime' | 'whoosh' | 'close' | 'select' | 'send' | 'error' | 'warp' | 'copy' | 'talk' | 'magic' | 'roar' | 'boing' | 'splash'

let audio: AudioContext | null = null
let muted = false

export function setSfxMuted(value: boolean) {
  muted = value
}

function getContext() {
  if (typeof window === 'undefined') return null
  if (!audio) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audio = new Ctor()
  }
  if (audio.state === 'suspended') void audio.resume()
  return audio
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  { type = 'square', volume = 0.05, slideTo }: { type?: OscillatorType; volume?: number; slideTo?: number } = {},
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export function playSfx(name: SfxName) {
  if (muted) return
  const ctx = getContext()
  if (!ctx) return
  switch (name) {
    case 'blip':
      tone(ctx, 880, 0, 0.06, { volume: 0.03 })
      break
    case 'step':
      tone(ctx, 140, 0, 0.04, { type: 'triangle', volume: 0.025 })
      break
    case 'select':
      tone(ctx, 660, 0, 0.05, { volume: 0.035 })
      tone(ctx, 990, 0.05, 0.07, { volume: 0.035 })
      break
    case 'chime':
      tone(ctx, 180, 0, 0.18, { type: 'sawtooth', volume: 0.02, slideTo: 120 })
      ;[784, 988, 1175, 1568].forEach((f, i) => tone(ctx, f, 0.12 + i * 0.08, 0.22, { type: 'triangle', volume: 0.05 }))
      break
    case 'whoosh':
      tone(ctx, 900, 0, 0.35, { type: 'triangle', volume: 0.04, slideTo: 110 })
      break
    case 'close':
      tone(ctx, 660, 0, 0.07, { volume: 0.035 })
      tone(ctx, 440, 0.07, 0.1, { volume: 0.035 })
      tone(ctx, 160, 0.16, 0.12, { type: 'sawtooth', volume: 0.015, slideTo: 90 })
      break
    case 'send':
      ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(ctx, f, i * 0.07, 0.14, { volume: 0.04 }))
      break
    case 'error':
      tone(ctx, 200, 0, 0.12, { volume: 0.04 })
      tone(ctx, 150, 0.12, 0.18, { volume: 0.04 })
      break
    case 'warp':
      tone(ctx, 220, 0, 0.3, { volume: 0.035, slideTo: 1760 })
      break
    case 'talk':
      ;[523, 659, 587].forEach((f, i) => tone(ctx, f, i * 0.05, 0.05, { volume: 0.03 }))
      break
    case 'magic':
      ;[784, 1047, 1319, 1568, 2093, 1568, 2093].forEach((f, i) =>
        tone(ctx, f, i * 0.05, 0.12, { type: 'triangle', volume: 0.04 }),
      )
      break
    case 'roar':
      tone(ctx, 220, 0, 0.45, { type: 'sawtooth', volume: 0.035, slideTo: 70 })
      tone(ctx, 110, 0.05, 0.4, { type: 'square', volume: 0.02, slideTo: 60 })
      break
    case 'boing':
      tone(ctx, 180, 0, 0.25, { type: 'triangle', volume: 0.06, slideTo: 720 })
      break
    case 'splash':
      tone(ctx, 1200, 0, 0.18, { type: 'triangle', volume: 0.03, slideTo: 300 })
      tone(ctx, 500, 0.1, 0.2, { type: 'triangle', volume: 0.025, slideTo: 150 })
      break
    case 'copy':
      tone(ctx, 1047, 0, 0.06, { type: 'triangle', volume: 0.05 })
      tone(ctx, 1568, 0.06, 0.1, { type: 'triangle', volume: 0.05 })
      break
  }
}
