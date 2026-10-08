'use client'

import { useState } from 'react'

export function InteractiveNav() {
  const [open, setOpen] = useState(false)
  return <header className="nav">
    <nav aria-label="Primary" className="nav-inner">
      <button type="button" className="mobile-toggle" aria-expanded={open} aria-controls="web-nav-links" onClick={() => setOpen(value => !value)}>
        {open ? 'Close menu ×' : 'Menu ☰'}
      </button>
      <div id="web-nav-links" className={`nav-links ${open ? 'nav-open' : ''}`}>
        <a href="#solutions" onClick={() => setOpen(false)}>Solutions</a>
        <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
        <a href="#trial" onClick={() => setOpen(false)}>Trial</a>
      </div>
      <a className="brand" href="/" aria-label="Beag Labs home"><span>B_</span> Beag Labs</a>
    </nav>
  </header>
}
