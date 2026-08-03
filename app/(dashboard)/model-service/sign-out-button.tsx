"use client"

import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  return (
    <button
      onClick={() => authClient.signOut()}
      className="text-sm text-[#777] hover:text-[#ff5f1f] transition-colors"
    >
      Sign Out
    </button>
  )
}
