'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import type { PixelIconName } from '@/data/portfolio'
import { PixelIcon } from '@/components/pixel/pixel-icon'

type Props = {
  title: string
  subtitle: string
  icon: PixelIconName
  onClose: () => void
  children: ReactNode
}

export function RpgModal({ title, subtitle, icon, onClose, children }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    return () => previouslyFocused?.focus?.({ preventScroll: true })
  }, [])

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-ink/60 sm:absolute"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rpg-modal-title"
        className="pixel-box fixed inset-2 z-50 flex flex-col overflow-hidden bg-cream text-ink sm:absolute sm:inset-2 md:inset-3"
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <header className="flex items-center gap-2 border-b-[3px] border-ink bg-lavender px-3 py-2">
          <span className="flex size-8 items-center justify-center border-2 border-ink bg-cream">
            <PixelIcon name={icon} className="size-5 text-lavender-deep" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="rpg-modal-title" className="truncate font-pixel text-[9px] leading-relaxed sm:text-xs">
              {title}
            </h2>
            <p className="truncate text-base leading-none text-ink-soft">{subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="pixel-btn flex items-center gap-1.5 bg-cream px-2 py-1.5 font-pixel text-[8px] hover:bg-peach focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-lavender-deep text-[7px] text-cream">
              B
            </span>
            CLOSE
          </button>
        </header>
        <div className="pixel-scroll flex-1 overflow-y-auto bg-pixel-dots p-3 sm:p-4">{children}</div>
      </motion.div>
    </>
  )
}
