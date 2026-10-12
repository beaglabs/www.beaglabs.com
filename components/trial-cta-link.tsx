"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { analytics } from "@/lib/analytics"

/** Analytics/notification is best effort; never block the user's trial journey. */
export function TrialCtaLink({ children, className, placement }: { children: ReactNode; className?: string; placement: "hero" | "final" }) {
  return <Link href="/provision/commercial" className={className} onClick={() => {
    analytics.track("trial.cta.clicked", {
      placement,
      page: window.location.pathname,
      destination: "/provision/commercial",
    })
  }}>{children}</Link>
}
