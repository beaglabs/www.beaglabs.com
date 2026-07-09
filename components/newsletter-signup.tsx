'use client'

import { useState } from 'react'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="nb-card p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-beag-orange mb-2">Confirmed</div>
        <h2 className="text-2xl font-bold text-beag-black mb-2">You&apos;re in.</h2>
        <p className="text-beag-gray leading-relaxed">
          Check your inbox. You&apos;ll start receiving training recipes, research translations, and experiments this week.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="nb-card p-8">
      <div className="font-mono text-xs uppercase tracking-widest text-beag-orange mb-2">Newsletter</div>
      <h2 className="text-2xl font-bold text-beag-black mb-2">Stay in the loop</h2>
      <p className="text-beag-gray leading-relaxed mb-6">
        Training recipes, research translations, and experiments from Beag Labs. Every Tuesday, Thursday, and Friday.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="flex-1 nb-input"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="nb-btn-primary whitespace-nowrap"
        >
          {status === 'loading' ? 'Sending…' : 'Subscribe'}
        </button>
      </div>

      <div className="font-mono text-[10px] text-beag-gray mt-4 leading-relaxed">
        No spam. No AI-generated fluff. Unsubscribe anytime.
      </div>
    </form>
  )
}
