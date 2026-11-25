'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { contact, profile } from '@/data/portfolio'
import { PixelIcon } from '@/components/pixel/pixel-icon'
import { playSfx } from '@/lib/sfx'

type Status = 'idle' | 'sending' | 'sent'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactModal() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    if (!name || !email || !message) return fail('Every field must be filled before the raven can fly.')
    if (!EMAIL_RE.test(email)) return fail('That email looks enchanted. Please double-check it.')
    if (message.length > 2000) return fail('The scroll is too heavy! Keep it under 2000 characters.')
    setError(null)
    setStatus('sending')
    playSfx('whoosh')
    window.setTimeout(() => {
      setStatus('sent')
      playSfx('send')
    }, 1400)
  }

  const fail = (msg: string) => {
    setError(msg)
    playSfx('error')
  }

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      playSfx('copy')
      window.setTimeout(() => setCopied((c) => (c === label ? null : c)), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
      <section className="pixel-box relative overflow-hidden bg-[#fffaf0] p-3 sm:p-4">
        <div className="pointer-events-none absolute inset-1.5 border-2 border-dashed border-peach-deep/50" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-pixel text-[9px] leading-relaxed">{contact.postcardGreeting.toUpperCase()}</p>
            <p className="text-lg leading-none text-ink-soft">To: {profile.name}, Dev Village</p>
          </div>
          <div className="flex size-14 shrink-0 rotate-3 flex-col items-center justify-center border-[3px] border-dotted border-ink bg-sakura" aria-hidden="true">
            <PixelIcon name="blossom" className="size-7 text-cream" accent="#f5c451" />
            <span className="font-pixel text-[5px]">JAPAN</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mt-6 flex flex-col items-center gap-3 py-6 text-center"
              role="status"
            >
              <motion.span
                className="flex size-14 items-center justify-center border-[3px] border-ink bg-sage"
                initial={{ rotate: -20 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260 }}
              >
                <PixelIcon name="star" className="size-8 text-cream" />
              </motion.span>
              <p className="font-pixel text-[10px] leading-relaxed">QUEST COMPLETE!</p>
              <p className="max-w-sm text-xl leading-6 text-ink-soft">
                Your raven has taken flight. Kartik will reply as soon as it lands.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="pixel-btn bg-lavender px-3 py-2 font-pixel text-[8px]"
              >
                SEND ANOTHER
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              noValidate
              className="relative mt-4 flex flex-col gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="font-pixel text-[8px]">NAME</span>
                  <input
                    name="name"
                    autoComplete="name"
                    maxLength={80}
                    required
                    disabled={status === 'sending'}
                    className="border-[3px] border-ink bg-cream px-2 py-1 text-xl outline-none focus:bg-lavender-light"
                    placeholder="Your name"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-pixel text-[8px]">EMAIL</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    required
                    disabled={status === 'sending'}
                    className="border-[3px] border-ink bg-cream px-2 py-1 text-xl outline-none focus:bg-lavender-light"
                    placeholder="you@company.jp"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="font-pixel text-[8px]">MESSAGE</span>
                <textarea
                  name="message"
                  rows={4}
                  maxLength={2000}
                  required
                  disabled={status === 'sending'}
                  className="resize-none border-[3px] border-ink bg-cream px-2 py-1 text-xl leading-6 outline-none [background-image:repeating-linear-gradient(transparent_0_23px,rgb(59_42_63_/_0.12)_23px_24px)] focus:bg-lavender-light"
                  placeholder="Write your message on the postcard..."
                />
              </label>
              {error && (
                <p role="alert" className="border-2 border-peach-deep bg-peach/30 px-2 text-lg leading-6">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-base leading-none text-ink-soft">Delivered by raven post</span>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="pixel-btn relative flex items-center gap-2 overflow-hidden bg-peach px-3 py-2 font-pixel text-[8px] hover:bg-peach-deep hover:text-cream disabled:cursor-wait"
                >
                  <motion.span
                    animate={status === 'sending' ? { x: [0, 60], y: [0, -20], opacity: [1, 0] } : { x: 0, y: 0, opacity: 1 }}
                    transition={status === 'sending' ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY } : { duration: 0 }}
                  >
                    <PixelIcon name="envelope" className="size-3.5" />
                  </motion.span>
                  {status === 'sending' ? 'FLYING...' : 'SEND RAVEN'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-pixel text-[9px]">QUICK LINKS</h3>
        <ul className="flex flex-col gap-2">
          {contact.socials.map((s) => {
            const value = s.label === 'Email' ? contact.email : s.url
            return (
              <li key={s.label} className="pixel-box flex items-center gap-2 bg-cream p-2">
                <a href={s.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 hover:underline">
                  <span className="block font-pixel text-[8px] leading-relaxed">{s.label.toUpperCase()}</span>
                  <span className="block truncate text-base leading-none text-ink-soft">{s.handle}</span>
                </a>
                <button
                  type="button"
                  onClick={() => copy(s.label, value)}
                  aria-label={`Copy ${s.label} link`}
                  className="pixel-btn shrink-0 bg-lavender px-2 py-1 font-pixel text-[7px]"
                >
                  {copied === s.label ? 'COPIED!' : 'COPY'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
