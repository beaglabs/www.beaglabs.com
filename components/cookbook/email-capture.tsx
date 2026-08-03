"use client"

import { useState, FormEvent } from "react"

export function EmailCapture() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")

    try {
      const res = await fetch("/api/cookbook/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (res.ok) {
        setStatus("success")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="border-[3px] border-[#111] bg-[#FFF3E6] p-8 text-center">
        <p className="mb-2 text-[18px] font-extrabold leading-tight tracking-[-0.03em] text-[#111]">
          Check your inbox
        </p>
        <p className="text-[13px] leading-relaxed text-[#555]">
          It&rsquo;s on its way. If it doesn&rsquo;t arrive in a few minutes, check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={status === "loading"}
          className="min-w-0 flex-1 border-[3px] border-[#111] bg-white px-5 py-4 text-[16px] text-[#111] placeholder-[#999] outline-none ring-0 transition-shadow focus:shadow-[0_0_0_3px_#ff5f1f] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="nb-btn-orange shrink-0 bg-[#ff5f1f] px-8 py-4 text-[14px] font-extrabold uppercase tracking-[0.06em] text-[#111] disabled:opacity-50"
        >
          {status === "loading" ? "Sending..." : "Get Your Free Copy"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-[11px] font-medium text-[#dc2626]">
          Something went wrong. Try again, or email us at hello@beaglabs.com.
        </p>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#999]">
        Free PDF &middot; No spam &middot; 90+ pages
      </p>
    </form>
  )
}
