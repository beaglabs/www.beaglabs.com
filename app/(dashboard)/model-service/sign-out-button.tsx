"use client"

import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  return (
    <button
      onClick={() => authClient.signOut()}
      className="text-sm text-[#8f7a68] hover:text-[#e5632f] transition-colors"
    >
      Sign Out
    </button>
  )
}
