"use client"

import Link from "next/link"
import type { ReactNode } from "react"

/** Analytics/notification is best effort; never block the user's trial journey. */
export function TrialCtaLink({ children, className, placement }: { children: ReactNode; className?: string; placement: "hero" | "final" }) {
  return <Link href="/provision/commercial" className={className} onClick={() => {
    try {
      const body = JSON.stringify({ event: "trial.cta.clicked", placement })
      if (navigator.sendBeacon) {
        navigator.sendBeacon("https://license.beaglabs.com/api/events/trial-click", new Blob([body], { type: "text/plain" }))
      } else {
        void fetch("/api/events/trial-click", { method: "POST", body, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(() => {})
      }
    } catch { /* trial navigation must always proceed */ }
  }}>{children}</Link>
}
