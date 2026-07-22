'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Key, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

type Step = 'email' | 'verify' | 'passkey' | 'register-passkey'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) router.push('/')
      })
      .catch(() => {})
  }, [router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const allowedDomain = 'beaglabs.com'

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const domain = email.split('@')[1]
    if (domain !== allowedDomain) {
      setError(`Only @${allowedDomain} emails are allowed`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'send' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send code')
      }

      setStep('verify')
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, action: 'verify' }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')

      setUserId(data.user.id)

      // Check if user has passkeys registered
      const authRes = await fetch('/api/auth/webauthn/authenticate/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const authData = await authRes.json()

      // If user has no credentials, go straight to registration
      if (authData.status === 'no-credentials' || authData.status === 'no-user') {
        setStep('register-passkey')
      } else {
        setStep('passkey')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePasskeyAuth = async () => {
    setError('')
    setLoading(true)

    try {
      // Get authentication options
      const optionsRes = await fetch('/api/auth/webauthn/authenticate/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const options = await optionsRes.json()

      // If user doesn't exist or has no credentials, go to registration
      if (options.status === 'no-user' || options.status === 'no-credentials') {
        setStep('register-passkey')
        setLoading(false)
        return
      }

      // Use browser WebAuthn API
      const { startAuthentication } = await import('@simplewebauthn/browser')
      const credential = await startAuthentication(options)

      // Verify authentication
      const verifyRes = await fetch('/api/auth/webauthn/authenticate/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, credential }),
      })

      const result = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(result.error || 'Authentication failed')

      router.push('/')
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Authentication was cancelled')
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterPasskey = async (credentialName: string) => {
    setError('')
    setLoading(true)

    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/webauthn/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: credentialName, email }),
      })

      const options = await optionsRes.json()

      // Use browser WebAuthn API
      const { startRegistration } = await import('@simplewebauthn/browser')
      const credential = await startRegistration(options)

      // Verify registration
      const verifyRes = await fetch('/api/auth/webauthn/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: credentialName, credential, email }),
      })

      const result = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(result.error || 'Registration failed')

      router.push('/')
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Registration was cancelled')
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-[440px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--accent)] border-3 border-black mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Portal</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Sign in with your passkey
          </p>
        </div>

        {/* Card */}
        <div className="nb-card bg-white p-6">
          {/* Step: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`name@${allowedDomain}`}
                    required
                    className="w-full border-3 border-black pl-10 pr-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Only @beaglabs.com emails are allowed
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-600 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="nb-btn-orange w-full px-4 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step: Verify Email */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Verification Code
                </label>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  We sent a 6-digit code to <span className="font-bold">{email}</span>
                </p>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-600 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="nb-btn-orange w-full px-4 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Verify Code
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCode('')
                    setStep('email')
                  }}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Use a different email
                </button>
                {countdown > 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Resend code in {countdown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-sm text-[var(--accent)] hover:underline font-bold mt-2 block w-full"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step: Passkey Auth */}
          {step === 'passkey' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--secondary)] border-2 border-black mb-4">
                  <Key className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg">Use your passkey</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Authenticate with your registered passkey to continue
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-600 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handlePasskeyAuth}
                disabled={loading}
                className="nb-btn-orange w-full px-4 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Authenticate with Passkey
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('register-passkey')}
                className="nb-btn-outline w-full px-4 py-3 text-sm flex items-center justify-center gap-2"
              >
                Register a new passkey
              </button>
            </div>
          )}

          {/* Step: Register Passkey */}
          {step === 'register-passkey' && (
            <PasskeyRegistration
              onRegister={handleRegisterPasskey}
              onBack={() => setStep('passkey')}
              loading={loading}
              error={error}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          <p>Secured with FIDO2/WebAuthn</p>
          <p className="mt-1">NIST SP 800-63B AAL3 Compliant</p>
        </div>
      </div>
    </div>
  )
}

function PasskeyRegistration({
  onRegister,
  onBack,
  loading,
  error,
}: {
  onRegister: (name: string) => void
  onBack: () => void
  loading: boolean
  error: string
}) {
  const [credentialName, setCredentialName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (credentialName.trim()) {
      onRegister(credentialName)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--accent)] border-2 border-black mb-4">
          <Key className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-lg">Register a passkey</h3>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Create a passkey for passwordless sign-in
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">
          Passkey Name
        </label>
        <input
          type="text"
          value={credentialName}
          onChange={(e) => setCredentialName(e.target.value)}
          placeholder="e.g., MacBook Touch ID, YubiKey"
          required
          className="w-full border-3 border-black px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-600 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !credentialName.trim()}
        className="nb-btn-orange w-full px-4 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Key className="w-4 h-4" />
            Register Passkey
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] py-2"
      >
        Back to authentication
      </button>
    </form>
  )
}
