'use client'

import { motion } from 'framer-motion'
import { projects, type Project } from '@/data/portfolio'
import { PixelIcon } from '@/components/pixel/pixel-icon'

const RARITY: Record<Project['rarity'], string> = {
  COMMON: 'bg-cream-dark',
  RARE: 'bg-sage',
  EPIC: 'bg-lavender',
  LEGENDARY: 'bg-peach',
}

export function ProjectsModal() {
  return (
    <div className="flex flex-col gap-3">
      <div className="pixel-box flex flex-wrap items-center justify-between gap-2 bg-[#e9cf9e] px-3 py-2">
        <p className="font-pixel text-[8px] leading-relaxed">QUEST BOARD {'\u2014'} COMPLETED ADVENTURES</p>
        <p className="text-lg leading-none text-ink-soft">
          INVENTORY {projects.length}/{projects.length}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {projects.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 10, rotate: i % 2 ? 1 : -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.08 * i, type: 'spring', stiffness: 300, damping: 22 }}
            className="pixel-box relative flex flex-col gap-3 bg-cream p-3"
          >
            <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-ink bg-peach-deep" aria-hidden="true" />
            <div className="flex items-start gap-3">
              <span className={`flex size-11 shrink-0 items-center justify-center border-[3px] border-ink ${RARITY[p.rarity]}`}>
                <PixelIcon name={p.icon} className="size-6 text-ink" />
              </span>
              <div className="min-w-0">
                <span className={`inline-block border-2 border-ink px-1.5 py-0.5 font-pixel text-[6px] ${RARITY[p.rarity]}`}>
                  {p.rarity}
                </span>
                <h3 className="mt-1.5 font-pixel text-[9px] leading-relaxed">{p.title}</h3>
              </div>
            </div>
            <p className="flex-1 text-lg leading-5 text-ink-soft">{p.description}</p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
              {p.tech.map((t) => (
                <li key={t} className="border-2 border-ink bg-lavender-light px-2 text-base leading-5">
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <a
                href={p.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="pixel-btn flex-1 bg-peach px-2 py-1.5 text-center font-pixel text-[8px] hover:bg-peach-deep hover:text-cream"
              >
                {'\u25B6'} DEMO
              </a>
              <a
                href={p.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="pixel-btn flex-1 bg-lavender px-2 py-1.5 text-center font-pixel text-[8px] hover:bg-lavender-deep hover:text-cream"
              >
                {'</>'} GITHUB
              </a>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
