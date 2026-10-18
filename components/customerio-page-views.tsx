"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { customerIoPageView } from "@/lib/customerio-browser"

/** A Customer.io page view per client-side navigation; the snippet sends the first one itself. */
export function CustomerIoPageViews() {
  const pathname = usePathname()
  useEffect(() => { if (pathname) customerIoPageView(pathname) }, [pathname])
  return null
}
