'use client'

import { useState } from 'react'

const SIZES = { sm: 'h-9 w-9 text-[13px]', md: 'h-14 w-14 text-[20px]', lg: 'h-24 w-24 text-[38px]' } as const

/** Logo with a monogram fallback, so a blocked or missing remote image never leaves a hole. */
export function ProductLogo({ name, src, size = 'md' }: { name: string; src?: string; size?: keyof typeof SIZES }) {
  const [failed, setFailed] = useState(false)
  const box = `${SIZES[size]} shrink-0 border-[2.5px] border-[#1a1714] bg-[#fffaf3]`
  if (!src || failed) {
    return (
      <span aria-hidden="true" className={`${box} inline-flex items-center justify-center bg-[#1a1714] font-black tracking-tight text-[#fffaf3]`}>
        {name.trim().charAt(0).toUpperCase()}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" loading="lazy" onError={() => setFailed(true)} className={`${box} ${src === '/papyrus-logo.png' ? 'object-cover' : 'object-contain p-1.5'}`} />
  )
}
