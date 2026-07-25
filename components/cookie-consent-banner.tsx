"use client"

import * as React from "react"
import posthog from "posthog-js"

const CONSENT_KEY = "beaglabs_consent"

export type Consent = "accepted" | "rejected" | null

export function getConsent(): Consent {
  if (typeof document === "undefined") return null
  const fromCookie = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${CONSENT_KEY}=`))
    ?.split("=")[1]
  const fromStorage = localStorage.getItem(CONSENT_KEY)
  const value = fromCookie ?? fromStorage
  if (value === "accepted") return "accepted"
  if (value === "rejected") return "rejected"
  return null
}

export function setConsent(consent: "accepted" | "rejected") {
  const value = consent
  document.cookie = `${CONSENT_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  localStorage.setItem(CONSENT_KEY, value)
  if (consent === "accepted") {
    initPosthog()
  }
}

function initPosthog() {
  if (typeof window === "undefined") return
  if ((window as any).__posthogInitialized) return
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: '2026-01-30',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  })
  ;(window as any).__posthogInitialized = true
}

export function PosthogConsentGate() {
  React.useEffect(() => {
    const consent = getConsent()
    if (consent === "accepted") {
      initPosthog()
    }
  }, [])
  return null
}

export function CookieConsentBanner() {
  const [consent, setConsentState] = React.useState<Consent>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const stored = getConsent()
    if (stored) {
      setConsentState(stored)
    } else {
      const timer = setTimeout(() => setVisible(true), 300)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleAccept() {
    setConsent("accepted")
    setConsentState("accepted")
    setVisible(false)
  }

  function handleReject() {
    setConsent("rejected")
    setConsentState("rejected")
    setVisible(false)
  }

  if (consent !== null || !visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-4 sm:px-6 lg:px-9">
        <div className="border-[3px] border-[#111] bg-[#FAFAF9] p-5 shadow-[4px_4px_0px_0px_#111] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-[14px] font-bold leading-[1.4] text-[#111] sm:text-[15px]">
                We use cookies and analytics to improve your experience.
              </p>
              <p className="mt-1 text-[12px] leading-[1.5] text-[#555] sm:text-[13px]">
                Posthog helps us understand usage patterns. No personal data is shared with third parties.{" "}
                <a href="/privacy" className="underline underline-offset-2 hover:text-[#FF5F1F]">
                  Privacy Policy
                </a>.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                onClick={handleReject}
                className="border-[3px] border-[#111] bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[#111] hover:bg-[#FFF3E6]"
              >
                Reject All
              </button>
              <button
                onClick={handleAccept}
                className="border-[3px] border-[#111] bg-[#FF5F1F] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-white hover:bg-[#e05012]"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
