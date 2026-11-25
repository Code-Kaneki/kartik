'use client'

import { useEffect, useRef } from 'react'
import { drawCharacter } from '@/lib/game/draw'
import { cn } from '@/lib/utils'

export function PixelAvatar({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    let frame = 0
    const paint = () => {
      ctx.clearRect(0, 0, 16, 18)
      ctx.fillStyle = 'rgba(59,42,63,0.2)'
      ctx.fillRect(3, 16, 10, 2)
      drawCharacter(ctx, 2, 1 + (frame % 2 === 0 ? 0 : 1), 'down', 0)
      frame++
    }
    paint()
    const id = window.setInterval(paint, 600)
    return () => window.clearInterval(id)
  }, [])

  return (
    <canvas
      ref={ref}
      width={16}
      height={18}
      className={cn('pixelated', className)}
      role="img"
      aria-label="Pixel avatar of Kartik in a lavender hoodie"
    />
  )
}
