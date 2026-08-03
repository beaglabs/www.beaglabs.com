"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  useEffect(() => {
    if (!isPending && session) {
      router.push("/model-service/runs")
    }
  }, [isPending, session, router])

  if (isPending || session) {
    return <div className="min-h-screen bg-[#f6f4ef] flex items-center justify-center">
      <p className="text-sm text-[#777]">Loading...</p>
    </div>
  }

  const handleSocial = async (provider: "google" | "github") => {
    setLoading(provider)
    await authClient.signIn.social({
      provider,
      callbackURL: "/model-service/runs",
    })
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading("email")
    const { error: err } = mode === "signin"
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name: email.split("@")[0] })
    if (err) setError(err.message || "Authentication failed")
    else window.location.href = "/model-service/runs"
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ff5f1f] mb-4">
            Beag Labs
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#111] leading-[1.05]">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
        </div>

        <div className="bg-white border border-[#E2E0DB] p-8 space-y-4">
          <button
            onClick={() => handleSocial("google")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 border border-[#E2E0DB] px-4 py-3 text-[14px] font-medium text-[#111] hover:bg-[#f6f4ef] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleSocial("github")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 border border-[#E2E0DB] px-4 py-3 text-[14px] font-medium text-[#111] hover:bg-[#f6f4ef] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Continue with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#E2E0DB]" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-[#999]">or</span></div>
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#E2E0DB] px-4 py-3 text-[14px] text-[#111] placeholder:text-[#999] outline-none focus:border-[#ff5f1f] bg-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-[#E2E0DB] px-4 py-3 text-[14px] text-[#111] placeholder:text-[#999] outline-none focus:border-[#ff5f1f] bg-white"
            />
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading === "email"}
              className="w-full bg-[#111] text-white px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
            >
              {loading === "email" ? "..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#777]">
            {mode === "signin" ? "No account?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-[#ff5f1f] hover:underline font-medium">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
