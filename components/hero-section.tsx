"use client"

import Link from "next/link"
import { useId, useState } from "react"
import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react"
import { HeroBackdrop } from "@/components/hero-backdrop"
import { analytics } from "@/lib/analytics"
import { papyrusSignupUrl } from "@/lib/papyrus-links"

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function HeroSection() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "invalid" | "loading" | "done" | "error">("idle")
  const id = useId()
  const hintId = `${id}-hint`

  async function claimCredit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === "loading" || state === "done") return
    const address = email.trim()
    if (!EMAIL.test(address)) { setState("invalid"); return }
    setState("loading")
    const destination = papyrusSignupUrl(address)
    analytics.heroEmailSubmitted(address, { page: window.location.pathname, destination: "papyrus.beaglabs.com" })
    try {
      const res = await fetch("/api/newsletter/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, offer: "papyrus-compute-credit" }),
      })
      if (!res.ok) throw new Error("signup failed")
      setState("done")
      // Straight on to Papyrus with the email filled in; the short pause lets the confirmation register.
      window.setTimeout(() => window.location.assign(destination), 900)
    } catch {
      setState("error")
    }
  }

  const problem = state === "invalid" || state === "error"
  const hint = state === "invalid"
    ? "Enter a work email like you@company.com."
    : state === "error"
      ? "That didn't go through. Check the email and try again."
      : "One email with your credit code · No card required"

  return (
    <section id="compute-credit" className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#000000] text-[#111]">
      <HeroBackdrop />

      {/* Copy sits in a solid card, so the dots stay crisp everywhere else */}
      <div className="relative z-20 mx-auto flex min-h-[calc(100svh-67px)] max-w-[880px] flex-col items-center justify-center px-6 py-20">
        <div className="w-full border-[3px] border-[#111] bg-white px-6 py-10 text-center shadow-[10px_10px_0_#111] sm:px-12 sm:py-12">
          <span className="nb-label mb-6 inline-block !bg-[#ff5f1f]">Papyrus · Customer-hosted software</span>

          <h1 className="display-black mb-6 text-[length:min(48px,9.2vw)] leading-[.92] [overflow-wrap:normal] sm:text-[64px] lg:text-[76px]">
            Building the Superintelligent ERP
          </h1>

          <div className="mx-auto mb-6 h-[3px] w-full max-w-[420px] bg-[#111]" />

          <p className="mx-auto mb-8 max-w-[580px] text-[16px] font-semibold leading-[1.65] text-[#333] sm:text-[18px]">
            Your existing ERP stays the system of record. Papyrus orchestrates complex operations across entities, teams, and legacy systems.
          </p>

          {state === "done" ? (
            <div role="status" className="mx-auto flex w-full max-w-[580px] items-center justify-center gap-3 border-[3px] border-[#111] bg-[#16a34a] px-5 py-4 text-white shadow-[5px_5px_0_#111]">
              <Check className="h-5 w-5 shrink-0" strokeWidth={3} />
              <p className="text-sm font-extrabold uppercase tracking-wide">Credit on its way to {email.trim()} · Opening Papyrus…</p>
            </div>
          ) : (
            <form onSubmit={claimCredit} noValidate className="mx-auto w-full max-w-[580px] text-left">
              <label htmlFor={id} className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[.14em] text-[#111]">
                Work email
              </label>
              <div className={`flex flex-col border-[3px] bg-white shadow-[5px_5px_0_#111] transition-shadow focus-within:shadow-[7px_7px_0_#ff5f1f] sm:flex-row ${problem ? "border-[#c2410c]" : "border-[#111]"}`}>
                <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                  <Mail className="h-5 w-5 shrink-0 text-[#111]" strokeWidth={2.5} aria-hidden="true" />
                  <input
                    id={id}
                    type="email"
                    inputMode="email"
                    required
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="you@company.com"
                    value={email}
                    aria-invalid={problem || undefined}
                    aria-describedby={hintId}
                    onChange={(event) => { setEmail(event.target.value); if (problem) setState("idle") }}
                    className="h-[56px] min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-[#111] placeholder:font-medium placeholder:text-[#8a8a8a] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="inline-flex h-[56px] shrink-0 items-center justify-center gap-2 border-t-[3px] border-[#111] bg-[#ff5f1f] px-5 text-[12px] font-black uppercase tracking-[.06em] text-[#111] transition-colors hover:bg-[#111] hover:text-white focus-visible:bg-[#111] focus-visible:text-white focus-visible:outline-none disabled:cursor-wait disabled:opacity-80 sm:border-l-[3px] sm:border-t-0"
                >
                  {state === "loading"
                    ? <><LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={3} aria-hidden="true" /> Claiming…</>
                    : <>Get a $1k Papyrus Compute Credit <ArrowRight className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></>}
                </button>
              </div>
              <p id={hintId} role={problem ? "alert" : undefined} className={`mt-3 font-mono text-[10px] font-bold uppercase tracking-wide ${problem ? "text-[#c2410c]" : "text-[#555]"}`}>
                {hint}
              </p>
            </form>
          )}

          <Link
            href="/agentic-erp"
            className="mt-6 inline-flex items-center gap-2 border-b-2 border-[#111] pb-0.5 text-[12px] font-extrabold uppercase tracking-[.08em] text-[#111] hover:border-[#ff5f1f] hover:text-[#ff5f1f]"
          >
            Or explore Papyrus first <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  )
}
