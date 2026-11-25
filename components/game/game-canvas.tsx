'use client'

import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import type { BuildingId, NpcId, ZoneKey } from '@/data/portfolio'
import { GameEngine, type WorldState } from '@/lib/game/engine'
import { HEIGHT, WIDTH } from '@/lib/game/map'
import { cn } from '@/lib/utils'

type Props = {
  engineRef: MutableRefObject<GameEngine | null>
  onZone: (zone: ZoneKey) => void
  onEnter: (id: BuildingId) => void
  onTalk: (id: NpcId) => void
  onWorld: (state: WorldState) => void
  className?: string
}

export function GameCanvas({ engineRef, onZone, onEnter, onTalk, onWorld, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const callbacks = useRef({ onZone, onEnter, onTalk, onWorld })
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    callbacks.current = { onZone, onEnter, onTalk, onWorld }
  }, [onZone, onEnter, onTalk, onWorld])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const scale = Math.min(width / WIDTH, height / HEIGHT)
      setSize({ w: Math.floor(WIDTH * scale), h: Math.floor(HEIGHT * scale) })
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new GameEngine(canvas, {
      onZone: (z) => callbacks.current.onZone(z),
      onEnter: (id) => callbacks.current.onEnter(id),
      onTalk: (id) => callbacks.current.onTalk(id),
      onWorld: (state) => callbacks.current.onWorld(state),
    })
    engineRef.current = engine
    engine.start()
    return () => {
      engine.stop()
      engineRef.current = null
    }
  }, [engineRef])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const wx = ((e.clientX - rect.left) / rect.width) * WIDTH
    const wy = ((e.clientY - rect.top) / rect.height) * HEIGHT
    engineRef.current?.click(wx, wy)
  }

  return (
    <div ref={wrapRef} className={cn('relative flex items-center justify-center overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        style={{ width: size.w || '100%', height: size.h || 'auto' }}
        className="pixelated block cursor-pointer touch-none select-none"
        role="img"
        aria-label="Pixel art village with Kartik's House, the Project Guild Hall, the Dojo, the Post Office, friends and creatures. Click to walk or talk."
      />
    </div>
  )
}
