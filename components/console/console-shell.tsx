'use client'

import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { buildings, dialogue, type BuildingId, type ZoneKey } from '@/data/portfolio'
import { GameCanvas } from '@/components/game/game-canvas'
import { ActionButtons, DPad, SpeakerGrill, Stickers } from '@/components/console/controls'
import { DialogueBox } from '@/components/console/dialogue-box'
import { Hud } from '@/components/console/hud'
import { RpgModal } from '@/components/modals/rpg-modal'
import { AboutModal } from '@/components/modals/about-modal'
import { ProjectsModal } from '@/components/modals/projects-modal'
import { RoadmapModal } from '@/components/modals/roadmap-modal'
import { ContactModal } from '@/components/modals/contact-modal'
import type { Dir } from '@/lib/game/draw'
import type { GameEngine } from '@/lib/game/engine'
import { playSfx, setSfxMuted } from '@/lib/sfx'

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const A_KEYS = new Set(['Enter', ' ', 'e', 'z', 'j'])
const B_KEYS = new Set(['Escape', 'b', 'x'])
const BUILDING_IDS = new Set<string>(['home', 'projects', 'roadmap', 'contact'])

const MODAL_CONTENT: Record<BuildingId, { subtitle: string; body: React.ReactNode }> = {
  home: { subtitle: 'Character Profile', body: <AboutModal /> },
  projects: { subtitle: 'Quest Board & Inventory', body: <ProjectsModal /> },
  roadmap: { subtitle: '8-Semester Skill Tree', body: <RoadmapModal /> },
  contact: { subtitle: 'Vintage Postcard', body: <ContactModal /> },
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

export function ConsoleShell() {
  const engineRef = useRef<GameEngine | null>(null)
  const [modal, setModal] = useState<BuildingId | null>(null)
  const [zone, setZone] = useState<ZoneKey>('intro')
  const [muted, setMuted] = useState(false)
  const modalRef = useRef(modal)

  useEffect(() => {
    modalRef.current = modal
  }, [modal])

  const handleEnter = useCallback((id: BuildingId) => setModal(id), [])

  const closeModal = useCallback(() => {
    if (!modalRef.current) return
    setModal(null)
    playSfx('close')
    engineRef.current?.exitBuilding()
  }, [])

  const handleDir = useCallback((dir: Dir, down: boolean) => {
    if (modalRef.current) return
    engineRef.current?.setHeld(dir, down)
  }, [])

  const handleA = useCallback(() => {
    if (modalRef.current) return
    engineRef.current?.interact()
  }, [])

  const handleB = useCallback(() => {
    if (modalRef.current) closeModal()
    else playSfx('blip')
  }, [closeModal])

  const handleFastTravel = useCallback((id: BuildingId) => {
    if (modalRef.current) return
    engineRef.current?.fastTravel(id)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      setSfxMuted(next)
      if (!next) playSfx('select')
      return next
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target)
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (modalRef.current) {
        if (key === 'Escape' || (!typing && B_KEYS.has(key))) {
          e.preventDefault()
          closeModal()
        }
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      const dir = KEY_DIRS[key]
      if (dir) {
        e.preventDefault()
        if (!e.repeat) engineRef.current?.setHeld(dir, true)
        return
      }
      const onControl = (e.target as HTMLElement | null)?.closest?.('button, a, [role="menuitem"]')
      if (A_KEYS.has(key) && !onControl) {
        e.preventDefault()
        if (!e.repeat) engineRef.current?.interact()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const dir = KEY_DIRS[key]
      if (dir) engineRef.current?.setHeld(dir, false)
    }
    const onBlur = () => engineRef.current?.clearHeld()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [closeModal])

  useEffect(() => {
    if (modal) engineRef.current?.clearHeld()
  }, [modal])

  const line = dialogue[zone]
  const nearDoor = BUILDING_IDS.has(zone)

  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-lavender-light bg-pixel-dots p-2 sm:p-4">
      <div className="relative flex h-full max-h-[58rem] w-full max-w-[92rem] flex-col gap-3 rounded-[1.75rem] border-4 border-ink bg-lavender p-3 shadow-[8px_8px_0_0_var(--color-ink)] landscape:flex-row landscape:items-center landscape:gap-4 landscape:p-4">
        <div className="pointer-events-none absolute inset-1.5 rounded-[1.4rem] border-2 border-cream/50" aria-hidden="true" />

        <aside className="hidden w-32 shrink-0 flex-col items-center gap-6 landscape:flex xl:w-40">
          <div className="flex items-center gap-1.5 font-pixel text-[7px] text-ink-soft" aria-hidden="true">
            <span className="size-2 rounded-full bg-peach-deep shadow-[0_0_6px_var(--color-peach-deep)]" />
            POWER
          </div>
          <DPad onPress={handleDir} />
          <div className="flex gap-3" aria-hidden="true">
            <span className="h-2.5 w-9 -rotate-12 rounded-full bg-ink-soft/60" />
            <span className="h-2.5 w-9 -rotate-12 rounded-full bg-ink-soft/60" />
          </div>
          <p className="font-pixel text-[6px] leading-relaxed text-ink-soft">WASD / ARROWS</p>
        </aside>

        <section
          aria-label="Game screen"
          className="relative flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden rounded-xl border-4 border-ink bg-screen landscape:h-full landscape:flex-1"
        >
          <Hud muted={muted} onToggleMute={toggleMute} onFastTravel={handleFastTravel} disabled={modal !== null} />
          <GameCanvas
            engineRef={engineRef}
            onZone={setZone}
            onEnter={handleEnter}
            className="aspect-[384/224] w-full landscape:aspect-auto landscape:min-h-0 landscape:flex-1"
          />
          <DialogueBox
            speaker={line.speaker}
            text={line.text}
            hint={nearDoor ? 'A: ENTER' : 'CLICK TO WALK'}
          />
          <AnimatePresence>
            {modal && (
              <RpgModal
                key={modal}
                title={buildings[modal].name.toUpperCase()}
                subtitle={MODAL_CONTENT[modal].subtitle}
                icon={buildings[modal].icon}
                onClose={closeModal}
              >
                {MODAL_CONTENT[modal].body}
              </RpgModal>
            )}
          </AnimatePresence>
        </section>

        <div className="flex min-h-0 flex-1 items-center justify-between gap-2 px-1 landscape:hidden">
          <DPad onPress={handleDir} />
          <div className="flex flex-col items-center gap-3">
            <Stickers />
            <p className="text-center font-pixel text-[7px] leading-relaxed text-ink-soft">
              KARTIK BOY
              <br />
              <span className="text-lavender-deep">ADVANCE</span>
            </p>
          </div>
          <ActionButtons onA={handleA} onB={handleB} />
        </div>

        <aside className="hidden w-32 shrink-0 flex-col items-center gap-6 landscape:flex xl:w-40">
          <Stickers />
          <ActionButtons onA={handleA} onB={handleB} />
          <SpeakerGrill className="mt-2" />
          <p className="font-pixel text-[6px] leading-relaxed text-ink-soft">A: ENTER {'\u00B7'} B: CLOSE</p>
        </aside>
      </div>
    </main>
  )
}
