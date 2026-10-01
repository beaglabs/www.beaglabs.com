'use client'

import { useState } from 'react'

const BOOKING_URL =
  'https://bookings.cloud.microsoft/bookwithme/user/be687874d69f4ede995ae233db37c9e4@beaglabs.com?anonymous&ismsaljsauthenabled&ep=plink'

interface PostCtaSocialProps {
  title: string
  url: string
}

export function PostCtaSocial({ title, url }: PostCtaSocialProps) {
  const [copied, setCopied] = useState(false)
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <section className="mt-14 border-t-[3px] border-[#111] pt-8" aria-label="Share this article or book a call">
      <div className="rounded-[24px] border-[3px] border-[#111] bg-[#ff5f1f] p-6 shadow-[5px_5px_0px_0px_#111] sm:p-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#111]">Have a challenge we can help with?</p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="max-w-xl text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#111] sm:text-3xl">Let’s talk about what’s next.</h2>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border-[2px] border-[#111] bg-[#111] px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Book a call <span className="ml-2" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#111]">Share this article</span>
        <div className="flex flex-wrap gap-2">
          <a className="rounded-full border-2 border-[#111] px-4 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-[#111] hover:text-white" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a className="rounded-full border-2 border-[#111] px-4 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-[#111] hover:text-white" href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer">X</a>
          <a className="rounded-full border-2 border-[#111] px-4 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-[#111] hover:text-white" href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}>Email</a>
          <button className="rounded-full border-2 border-[#111] px-4 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-[#111] hover:text-white" type="button" onClick={copyLink}>{copied ? 'Copied!' : 'Copy link'}</button>
        </div>
      </div>
    </section>
  )
}
