'use client'

import { useEffect, useState } from 'react'

type Props = { speaker: string; text: string; hint?: string }

export function DialogueBox({ speaker, text, hint }: Props) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(0)
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id)
          return c
        }
        return c + 1
      })
    }, 22)
    return () => window.clearInterval(id)
  }, [text])

  const done = count >= text.length

  return (
    <div className="relative z-20 bg-screen px-2 pb-2 pt-3">
      <span className="absolute left-4 top-0 z-10 border-2 border-ink bg-peach px-2 py-0.5 font-pixel text-[7px] text-ink sm:text-[8px]">
        {speaker}
      </span>
      <button
        type="button"
        onClick={() => setCount(text.length)}
        className="pixel-box flex h-[5.5rem] w-full items-start overflow-hidden bg-cream px-3 pb-1.5 pt-2.5 text-left sm:h-[4.75rem] xl:h-[4.25rem]"
        aria-label="Skip dialogue animation"
      >
        <span className="sr-only" aria-live="polite">
          {speaker}: {text}
        </span>
        <p aria-hidden="true" className="grid flex-1 text-lg leading-5 text-ink sm:text-xl sm:leading-6">
          <span className="invisible col-start-1 row-start-1">{text} {'\u25BC'}</span>
          <span className="col-start-1 row-start-1">
            {text.slice(0, count)}
            {done && <span className="animate-blink ml-1 inline-block text-lavender-deep">{'\u25BC'}</span>}
          </span>
        </p>
        {hint && (
          <span className="ml-2 hidden shrink-0 self-end font-pixel text-[7px] text-ink-soft sm:inline">{hint}</span>
        )}
      </button>
    </div>
  )
}
