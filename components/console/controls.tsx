'use client'

import { useState } from 'react'
import type { Dir } from '@/lib/game/draw'
import { PixelIcon } from '@/components/pixel/pixel-icon'
import { cn } from '@/lib/utils'

const ARROWS: Record<Dir, string> = { up: '\u25B2', down: '\u25BC', left: '\u25C0', right: '\u25B6' }

function DirButton({
  dir,
  className,
  onPress,
}: {
  dir: Dir
  className: string
  onPress: (dir: Dir, down: boolean) => void
}) {
  const [pressed, setPressed] = useState(false)
  const release = () => {
    setPressed(false)
    onPress(dir, false)
  }
  return (
    <button
      type="button"
      aria-label={`Move ${dir}`}
      data-pressed={pressed}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setPressed(true)
        onPress(dir, true)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'flex items-center justify-center bg-ink text-[10px] text-lavender-light/70 transition-colors data-[pressed=true]:bg-ink-soft data-[pressed=true]:text-cream',
        className,
      )}
    >
      <span aria-hidden="true">{ARROWS[dir]}</span>
    </button>
  )
}

export function DPad({ onPress }: { onPress: (dir: Dir, down: boolean) => void }) {
  return (
    <div
      role="group"
      aria-label="Directional pad"
      className="relative grid size-28 touch-none select-none grid-cols-3 grid-rows-3 drop-shadow-[3px_3px_0_rgb(59_42_63_/_0.35)] sm:size-32"
    >
      <DirButton dir="up" onPress={onPress} className="col-start-2 row-start-1 rounded-t-md" />
      <DirButton dir="left" onPress={onPress} className="col-start-1 row-start-2 rounded-l-md" />
      <div className="col-start-2 row-start-2 flex items-center justify-center bg-ink" aria-hidden="true">
        <span className="size-3 rounded-full bg-ink-soft/60" />
      </div>
      <DirButton dir="right" onPress={onPress} className="col-start-3 row-start-2 rounded-r-md" />
      <DirButton dir="down" onPress={onPress} className="col-start-2 row-start-3 rounded-b-md" />
    </div>
  )
}

function RoundButton({
  label,
  sub,
  onClick,
  className,
  ariaLabel,
}: {
  label: string
  sub: string
  onClick: () => void
  className: string
  ariaLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className={cn(
          'pixel-btn flex size-14 items-center justify-center rounded-full font-pixel text-sm text-ink sm:size-16 sm:text-base',
          className,
        )}
      >
        {label}
      </button>
      <span className="font-pixel text-[7px] text-ink-soft">{sub}</span>
    </div>
  )
}

export function ActionButtons({ onA, onB }: { onA: () => void; onB: () => void }) {
  return (
    <div className="flex -rotate-12 items-end gap-3 select-none">
      <div className="translate-y-4">
        <RoundButton label="B" sub="CLOSE" ariaLabel="B button: close window" onClick={onB} className="bg-lavender" />
      </div>
      <RoundButton label="A" sub="ENTER" ariaLabel="A button: open nearest door" onClick={onA} className="bg-peach" />
    </div>
  )
}

export function Stickers({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none flex items-center gap-2', className)} aria-hidden="true">
      <span className="rotate-12 rounded-sm border-2 border-ink bg-cream p-1">
        <PixelIcon name="star" className="size-4 text-peach-deep" />
      </span>
      <span className="-rotate-6 rounded-sm border-2 border-ink bg-sakura p-1">
        <PixelIcon name="blossom" className="size-5 text-cream" accent="#f5c451" />
      </span>
      <span className="rotate-3 rounded-sm border-2 border-ink bg-sage p-1">
        <PixelIcon name="heart" className="size-3.5 text-peach-deep" />
      </span>
    </div>
  )
}

export function SpeakerGrill({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-4 gap-1.5', className)} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="size-1.5 rounded-full bg-ink/25" />
      ))}
    </div>
  )
}
