"use client"

import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export function OrgPicker({ firstOrgId }: { firstOrgId: string }) {
  useEffect(() => {
    authClient.organization.setActive({ organizationId: firstOrgId }).then(() => {
      window.location.reload()
    })
  }, [firstOrgId])

  return (
    <div className="max-w-[480px] mx-auto py-24 text-center">
      <p className="text-[17px] font-semibold text-[#111]">Setting up your workspace...</p>
      <p className="text-sm text-[#777] mt-2">One moment while we get things ready.</p>
    </div>
  )
}
