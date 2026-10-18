"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { InteractiveDots } from "@/components/ui/interactive-dots"

export function HeroSection() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  async function claimCredit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === "loading" || state === "done") return
    setState("loading")
    try {
      const res = await fetch("/api/newsletter/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error("signup failed")
      setState("done")
    } catch {
      setState("error")
    }
  }

  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-white text-[#111]">
      {/* Papyrus preview video behind everything */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <video
          className="h-full w-full object-cover motion-reduce:hidden"
          src="/hero/clip-1.mp4"
          poster="/hero/poster-1.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hidden h-full w-full object-cover motion-reduce:block" src="/hero/poster-1.jpg" alt="" />
        {/* Soft veil so the field reads as paper, not video */}
        <div className="absolute inset-0 bg-white/60" />
      </div>

      {/* Dot field: the pointer pushes dots aside and the video shows through the gaps */}
      <InteractiveDots
        className="absolute inset-0 z-10"
        colors={["#ff5f1f", "#ff8a5c", "#ffb894", "#111111", "#ffc9b0"]}
        spacing={22}
        dotRadius={8}
        repelForce={0.7}
        repelDistance={14000}
      />

      {/* Readability wash behind the copy block */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: "radial-gradient(ellipse 60% 55% at 50% 46%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)" }}
      />

      <div className="relative z-20 mx-auto flex min-h-[calc(100svh-67px)] max-w-[900px] flex-col items-center justify-center gap-7 px-6 py-20 text-center">
        <span className="nb-label inline-block !bg-[#ff5f1f]">Papyrus · Customer-hosted software</span>

        <h1 className="display-black text-[54px] leading-[.92] sm:text-[76px] lg:text-[96px]">
          Solving the boring problems.
        </h1>

        <div className="h-[3px] w-full max-w-[420px] bg-[#111]" />

        <p className="max-w-[600px] text-[17px] font-semibold leading-[1.65] text-[#333] sm:text-[19px]">
          Give Papyrus a document, a legacy workflow, or an internal process. It turns repetitive work into governed,
          reviewable actions on your own infrastructure.
        </p>

        {state === "done" ? (
          <div className="flex w-full max-w-[560px] items-center justify-center gap-3 border-[3px] border-[#111] bg-[#16a34a] px-5 py-4 text-white shadow-[5px_5px_0_#111]">
            <Check className="h-5 w-5 shrink-0" strokeWidth={3} />
            <p className="text-sm font-extrabold uppercase tracking-wide">
              You&apos;re in — your $1k compute credit is headed to {email}
            </p>
          </div>
        ) : (
          <form onSubmit={claimCredit} className="w-full max-w-[560px]">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-credit-email" className="sr-only">
                Work email
              </label>
              <input
                id="hero-credit-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@agency.gov"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-[52px] min-w-0 flex-1 border-[3px] border-[#111] bg-white px-4 text-[15px] font-semibold text-[#111] placeholder:font-medium placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#ff5f1f] focus:ring-offset-2"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 border-[3px] border-[#111] bg-[#ff5f1f] px-5 text-[12px] font-black uppercase tracking-[.06em] text-[#111] shadow-[4px_4px_0_#111] transition hover:-translate-x-px hover:-translate-y-px hover:bg-[#ffdfcf] hover:shadow-[6px_6px_0_#111] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {state === "loading" ? "Claiming…" : "Get a $1k Papyrus Compute Credit"}
                {state !== "loading" && <ArrowRight className="h-4 w-4" strokeWidth={3} />}
              </button>
            </div>
            {state === "error" && (
              <p role="alert" className="mt-3 font-mono text-[11px] font-bold uppercase tracking-wide text-[#c2410c]">
                That didn&apos;t work — check the email and try again.
              </p>
            )}
          </form>
        )}

        <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#555]">
          One email with your credit code · No card required
        </p>

        <Link
          href="/products/papyrus"
          className="mt-1 inline-flex items-center gap-2 border-b-2 border-[#111] pb-0.5 text-[12px] font-extrabold uppercase tracking-[.08em] text-[#111] hover:border-[#ff5f1f] hover:text-[#ff5f1f]"
        >
          Or explore Papyrus first <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
        </Link>
      </div>
    </section>
  )
}
