'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { buildings, profile, type BuildingId } from '@/data/portfolio'
import { PixelIcon } from '@/components/pixel/pixel-icon'
import { playSfx } from '@/lib/sfx'

const ORDER: BuildingId[] = ['home', 'projects', 'roadmap', 'contact']

type Props = {
  muted: boolean
  onToggleMute: () => void
  onFastTravel: (id: BuildingId) => void
  disabled: boolean
}

export function Hud({ muted, onToggleMute, onFastTravel, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="relative z-30 flex flex-wrap items-center gap-1.5 bg-ink px-2 py-1.5 font-pixel text-[7px] text-cream sm:gap-2 sm:text-[9px]">
      <span className="bg-peach px-1.5 py-1 text-ink">LVL 0{profile.level}</span>
      <h1 className="mr-auto truncate text-[8px] leading-relaxed tracking-tight text-lavender-light sm:text-[10px]">
        KARTIK RAJ <span className="text-sakura">{'\u2014'}</span> DEV QUEST
      </h1>
      <span className="flex items-center gap-1 bg-sage px-1.5 py-1 text-ink">
        <PixelIcon name="blossom" className="size-2.5 text-peach-deep" />
        {profile.goalBadge}
      </span>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            playSfx('blip')
            setOpen((v) => !v)
          }}
          className="flex items-center gap-1 bg-lavender px-1.5 py-1 text-ink transition-colors hover:bg-lavender-light disabled:opacity-50"
        >
          FAST TRAVEL <span aria-hidden="true">{open ? '\u25B4' : '\u25BE'}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              role="menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="pixel-box absolute right-0 top-full z-40 mt-1 w-48 bg-cream p-1 text-ink"
            >
              {ORDER.map((id) => (
                <li key={id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false)
                      onFastTravel(id)
                    }}
                    className="flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-lavender-light focus-visible:bg-lavender-light focus-visible:outline-none"
                  >
                    <PixelIcon name={buildings[id].icon} className="size-3 text-lavender-deep" />
                    <span className="flex flex-col gap-1">
                      <span className="text-[8px]">{buildings[id].name.toUpperCase()}</span>
                      <span className="font-sans text-base leading-none text-ink-soft">{buildings[id].tagline}</span>
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={onToggleMute}
        aria-pressed={!muted}
        aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
        className={`px-1.5 py-1 transition-colors ${muted ? 'bg-ink-soft text-cream/70' : 'bg-peach text-ink'}`}
      >
        SFX {muted ? 'OFF' : 'ON'}
      </button>
    </header>
  )
}
