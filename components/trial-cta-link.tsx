"use client"

import type { ReactNode } from "react"
import { analytics } from "@/lib/analytics"
import { PAPYRUS_MARKETPLACE_URL } from "@/lib/marketplace"

/** Analytics/notification is best effort; never block the user's trial journey. */
export function TrialCtaLink({ children, className, placement }: { children: ReactNode; className?: string; placement: "hero" | "final" }) {
  return <a href={PAPYRUS_MARKETPLACE_URL} target="_blank" rel="noopener noreferrer" className={className} onClick={() => {
    analytics.track("trial.cta.clicked", {
      placement,
      page: window.location.pathname,
      destination: "azure-marketplace",
    })
  }}>{children}</a>
}
