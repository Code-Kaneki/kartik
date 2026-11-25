'use client'

import { motion } from 'framer-motion'
import { profile } from '@/data/portfolio'
import { PixelAvatar } from '@/components/pixel/pixel-avatar'
import { PixelIcon } from '@/components/pixel/pixel-icon'

const BAR_COLORS = {
  lavender: 'bg-lavender-deep',
  sage: 'bg-sage-deep',
  peach: 'bg-peach-deep',
  sakura: 'bg-sakura',
}

const INFO = [
  { label: 'HOMETOWN', value: profile.hometown, icon: 'house' as const },
  { label: 'EDUCATION', value: profile.education, icon: 'scroll' as const },
  { label: 'HOBBIES', value: profile.hobbies.join(' & '), icon: 'heart' as const },
]

export function AboutModal() {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,15rem)_1fr]">
      <section className="pixel-box flex flex-col items-center gap-3 bg-lavender-light p-4 text-center">
        <div className="pixel-box bg-sage p-2">
          <PixelAvatar className="h-28 w-24 sm:h-32 sm:w-28" />
        </div>
        <div>
          <p className="font-pixel text-sm leading-relaxed">{profile.name.toUpperCase()}</p>
          <p className="text-lg leading-none text-ink-soft">
            LV.{String(profile.level).padStart(2, '0')} {profile.className}
          </p>
        </div>
        <div className="w-full">
          <div className="flex justify-between font-pixel text-[7px]">
            <span>HP</span>
            <span>100/100</span>
          </div>
          <div className="mt-1 h-2.5 border-2 border-ink bg-cream">
            <div className="h-full w-full bg-sage-deep" />
          </div>
          <div className="mt-2 flex justify-between font-pixel text-[7px]">
            <span>XP</span>
            <span>NEXT: SDE-1</span>
          </div>
          <div className="mt-1 h-2.5 border-2 border-ink bg-cream">
            <motion.div
              className="h-full bg-peach-deep"
              initial={{ width: 0 }}
              animate={{ width: '38%' }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <p className="pixel-box bg-cream p-3 text-xl leading-6">{profile.bio}</p>

        <dl className="grid gap-2 sm:grid-cols-3">
          {INFO.map((item) => (
            <div key={item.label} className="pixel-box bg-cream p-3">
              <dt className="flex items-center gap-1.5 font-pixel text-[8px] text-lavender-deep">
                <PixelIcon name={item.icon} className="size-3" />
                {item.label}
              </dt>
              <dd className="mt-1.5 text-lg leading-5">{item.value}</dd>
            </div>
          ))}
        </dl>

        <section className="pixel-box bg-peach/40 p-3">
          <h3 className="flex items-center gap-2 font-pixel text-[9px]">
            <PixelIcon name="flag" className="size-3.5 text-peach-deep" />
            MAIN QUEST
          </h3>
          <p className="mt-2 text-xl leading-6">{profile.mainQuest}</p>
        </section>

        <section>
          <h3 className="font-pixel text-[9px]">STATS</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {profile.stats.map((s, i) => (
              <li key={s.label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-2">
                <span className="font-pixel text-[7px] leading-relaxed">{s.label}</span>
                <div className="h-3 border-2 border-ink bg-cream">
                  <motion.div
                    className={`h-full ${BAR_COLORS[s.color]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-right text-lg leading-none">{s.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-pixel text-[9px]">TRAITS</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {profile.traits.map((t) => (
              <li key={t.label} className="pixel-box flex items-center gap-2 bg-cream p-2">
                <span className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-lavender">
                  <PixelIcon name={t.icon} className="size-4 text-ink" />
                </span>
                <span>
                  <span className="block font-pixel text-[8px] leading-relaxed">{t.label}</span>
                  <span className="block text-base leading-none text-ink-soft">{t.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
