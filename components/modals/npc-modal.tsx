'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { npcs, wizardLines, type NpcId } from '@/data/portfolio'
import { SEASONS, SEASON_ORDER, type SeasonId } from '@/lib/game/seasons'
import type { WorldState } from '@/lib/game/engine'

type Props = {
  id: NpcId
  world: WorldState
  onClose: () => void
  onAction: (id: NpcId) => void
  onSetTime: (kind: 'day' | 'night') => void
  onSetSeason: (season: SeasonId) => void
}

export function NpcModal({ id, world, onClose, onAction, onSetTime, onSetSeason }: Props) {
  const npc = npcs[id]
  const [reply, setReply] = useState<string | null>(null)
  const [showSeasons, setShowSeasons] = useState(false)

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-ink/50 sm:absolute"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="npc-modal-title"
        className="pixel-box fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg bg-cream p-3 text-ink sm:absolute sm:inset-x-4 sm:bottom-4 sm:p-4"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <div className="flex items-center justify-between gap-2 border-b-2 border-ink pb-2">
          <div>
            <h2 id="npc-modal-title" className="font-pixel text-[10px] leading-relaxed text-ink">
              {npc.name.toUpperCase()}
            </h2>
            <p className="text-base leading-none text-ink-soft">{npc.role}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-lavender px-2 py-1 font-pixel text-[8px] hover:bg-peach"
          >
            B: CLOSE
          </button>
        </div>

        <p className="mt-3 text-xl leading-6 text-ink">
          {reply ?? (showSeasons ? wizardLines.seasonPrompt : npc.greeting)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {npc.link && (
            <a
              href={npc.link.url}
              target="_blank"
              rel="noreferrer"
              className="pixel-btn bg-sage px-3 py-1.5 font-pixel text-[8px] text-ink hover:bg-peach"
            >
              {'▶'} {npc.link.label.toUpperCase()}
            </a>
          )}

          {npc.action && (
            <button
              type="button"
              onClick={() => {
                onAction(id)
                setReply(npc.action!.reply)
              }}
              className="pixel-btn bg-peach px-3 py-1.5 font-pixel text-[8px] text-ink hover:bg-peach-deep hover:text-cream"
            >
              {'★'} {npc.action.label.toUpperCase()}
            </button>
          )}

          {id === 'wizard' && !showSeasons && (
            <>
              <button
                type="button"
                onClick={() => {
                  const next = world.night ? 'day' : 'night'
                  onSetTime(next)
                  setReply(next === 'day' ? wizardLines.day : wizardLines.night)
                }}
                className="pixel-btn bg-lavender px-3 py-1.5 font-pixel text-[8px] text-ink hover:bg-lavender-deep hover:text-cream"
              >
                {world.night ? 'SUMMON DAY' : 'SUMMON NIGHT'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReply(null)
                  setShowSeasons(true)
                }}
                className="pixel-btn bg-peach px-3 py-1.5 font-pixel text-[8px] text-ink hover:bg-peach-deep hover:text-cream"
              >
                CHANGE SEASON
              </button>
            </>
          )}

          {id === 'wizard' && showSeasons && (
            <>
              {SEASON_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onSetSeason(s)
                    setShowSeasons(false)
                    setReply(wizardLines.season(SEASONS[s].label))
                  }}
                  className={`pixel-btn px-2.5 py-1.5 font-pixel text-[8px] ${
                    world.season === s ? 'bg-sage text-ink' : 'bg-cream-dark text-ink hover:bg-lavender-light'
                  }`}
                >
                  {SEASONS[s].label.toUpperCase()}
                </button>
              ))}
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="pixel-btn ml-auto bg-cream-dark px-3 py-1.5 font-pixel text-[8px] text-ink hover:bg-lavender-light"
          >
            {npc.farewell.toUpperCase()}
          </button>
        </div>
      </motion.div>
    </>
  )
}
