'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { currentSemester, finalBoss, roadmap } from '@/data/portfolio'
import { PixelIcon } from '@/components/pixel/pixel-icon'
import { playSfx } from '@/lib/sfx'
import { cn } from '@/lib/utils'

type Status = 'cleared' | 'current' | 'locked'

const statusOf = (sem: number): Status => (sem < currentSemester ? 'cleared' : sem === currentSemester ? 'current' : 'locked')

const STATUS_STYLE: Record<Status, string> = {
  cleared: 'bg-sage',
  current: 'bg-peach',
  locked: 'bg-cream-dark',
}

const STATUS_LABEL: Record<Status, string> = { cleared: 'CLEARED', current: 'IN PROGRESS', locked: 'LOCKED' }

export function RoadmapModal() {
  const [selected, setSelected] = useState(currentSemester)
  const totalXp = roadmap.reduce((s, r) => s + r.xp, 0)
  const earnedXp = roadmap.filter((r) => r.sem < currentSemester).reduce((s, r) => s + r.xp, 0)
  const pct = Math.round((earnedXp / totalXp) * 100)
  const active = roadmap.find((r) => r.sem === selected) ?? roadmap[0]
  const activeStatus = statusOf(active.sem)

  return (
    <div className="flex flex-col gap-4">
      <section className="pixel-box bg-cream p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-pixel text-[9px]">QUEST PROGRESS</h3>
          <span className="text-lg leading-none text-ink-soft">
            {earnedXp} / {totalXp} XP {'\u00B7'} SEM {currentSemester} OF 8
          </span>
        </div>
        <div className="mt-2 h-4 border-[3px] border-ink bg-cream-dark">
          <motion.div
            className="h-full bg-[repeating-linear-gradient(90deg,var(--color-lavender-deep)_0_8px,var(--color-lavender)_8px_12px)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct, 3)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      </section>

      <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Eight semester skill tree">
        {roadmap.map((r, i) => {
          const status = statusOf(r.sem)
          const isSelected = selected === r.sem
          return (
            <motion.li
              key={r.sem}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  playSfx('select')
                  setSelected(r.sem)
                }}
                className={cn(
                  'pixel-box relative flex h-full w-full flex-col items-start gap-1 p-2 text-left transition-transform hover:-translate-y-0.5',
                  STATUS_STYLE[status],
                  isSelected && 'outline-[3px] outline-offset-2 outline-lavender-deep',
                  status === 'locked' && 'text-ink-soft',
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="font-pixel text-[8px]">{r.label.toUpperCase()}</span>
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border-2 border-ink font-pixel text-[7px]',
                      status === 'cleared' ? 'bg-sage-deep text-cream' : status === 'current' ? 'bg-cream' : 'bg-ink-soft/30',
                    )}
                    aria-hidden="true"
                  >
                    {status === 'cleared' ? '\u2713' : status === 'current' ? '!' : '?'}
                  </span>
                </span>
                <span className="text-base leading-5">{r.skills.join(' \u00B7 ')}</span>
                <span className="mt-auto border-2 border-ink bg-cream px-1 font-pixel text-[6px] leading-relaxed text-ink">
                  +{r.xp} XP
                </span>
                {status === 'current' && (
                  <motion.span
                    className="absolute -top-2 right-2 border-2 border-ink bg-cream px-1 font-pixel text-[6px] text-ink"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
                  >
                    YOU
                  </motion.span>
                )}
              </button>
            </motion.li>
          )
        })}
      </ol>

      <AnimatePresence mode="wait">
        <motion.section
          key={active.sem}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="pixel-box bg-cream p-3"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('border-2 border-ink px-1.5 py-0.5 font-pixel text-[7px]', STATUS_STYLE[activeStatus])}>
              {STATUS_LABEL[activeStatus]}
            </span>
            <h3 className="font-pixel text-[9px] leading-relaxed">
              {active.label.toUpperCase()}: {active.title.toUpperCase()}
            </h3>
          </div>
          <p className="mt-2 text-xl leading-6">{active.description}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skills unlocked">
            {active.skills.map((s) => (
              <li key={s} className="border-2 border-ink bg-lavender-light px-2 text-base leading-5">
                {s}
              </li>
            ))}
          </ul>
        </motion.section>
      </AnimatePresence>

      <section className="pixel-box relative overflow-hidden bg-ink p-4 text-cream">
        <div className="flex items-center gap-3">
          <motion.span
            className="flex size-12 shrink-0 items-center justify-center border-[3px] border-cream bg-peach-deep"
            animate={{ rotate: [0, -4, 4, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.4 }}
          >
            <PixelIcon name="trophy" className="size-7 text-cream" />
          </motion.span>
          <div>
            <p className="font-pixel text-[8px] text-peach">{finalBoss.title.toUpperCase()}</p>
            <p className="mt-1 font-pixel text-xs leading-relaxed sm:text-sm">{finalBoss.name.toUpperCase()}</p>
            <p className="mt-1 text-lg leading-5 text-lavender-light">{finalBoss.description}</p>
          </div>
        </div>
        <PixelIcon name="blossom" className="absolute -right-2 -bottom-2 size-16 text-sakura/30" accent="#f6b6c8" />
      </section>
    </div>
  )
}
