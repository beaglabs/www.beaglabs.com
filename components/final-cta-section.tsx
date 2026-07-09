"use client"

import { useState, FormEvent } from "react"

export function FinalCTASection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

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
      if (res.ok) setStatus("success")
      else setStatus("idle")
    } catch {
      setStatus("idle")
    }
  }

  return (
    <section className="border-t-[3px] border-[#111] bg-[#111] text-white px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center text-center">
        <span className="nb-label mb-5 inline-block bg-[#FF5F1F] text-[#111] border-[#FF5F1F] shadow-[3px_3px_0px_0px_#FF5F1F]/20">
          Free Cookbook
        </span>

        <h2 className="mb-4 max-w-[720px] text-[42px] font-extrabold leading-[0.96] tracking-[-0.05em] text-white lg:text-[56px]">
          Get the 2026 ML Training Cookbook
        </h2>

        <p className="mb-10 max-w-[560px] text-[18px] leading-[1.65] text-[#C9C9C9] font-medium">
          50+ pages of battle-tested recipes for fine-tuning, distillation, and
          on-prem deployment. No fluff.
        </p>

        {status === "success" ? (
          <div className="max-w-[520px] border-[3px] border-[#FF5F1F] bg-[#FFF3E6] p-5 text-center">
            <p className="text-[14px] font-extrabold text-[#111]">Check your inbox</p>
            <p className="mt-1 text-[11px] text-[#555]">The cookbook is on its way.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full max-w-[520px] gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={status === "loading"}
              className="min-w-0 flex-1 border-[3px] border-white/30 bg-transparent px-4 py-3 text-[14px] font-medium text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5F1F] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="border-[3px] border-white bg-[#FF5F1F] px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#111] whitespace-nowrap hover:bg-white transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send It"}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
