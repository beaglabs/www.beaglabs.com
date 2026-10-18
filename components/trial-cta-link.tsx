"use client"

import type { ReactNode } from "react"
import { analytics } from "@/lib/analytics"
import { PAPYRUS_SIGNUP_URL } from "@/lib/papyrus-links"

type Placement = Parameters<typeof analytics.track>[1]["placement"]

/** Every "Try Papyrus" button: papyrus.beaglabs.com signup. Analytics is best effort; never block the visitor. */
export function TrialCtaLink({ children, className, placement }: { children: ReactNode; className?: string; placement: Placement }) {
  return <a href={PAPYRUS_SIGNUP_URL} className={className} onClick={() => {
    analytics.track("trial.cta.clicked", {
      placement,
      page: window.location.pathname,
      destination: "papyrus.beaglabs.com",
    })
  }}>{children}</a>
}
