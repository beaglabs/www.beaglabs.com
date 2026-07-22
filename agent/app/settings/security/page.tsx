'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/utils'
import type { WebAuthnCredential } from '@/lib/types'
import {
  Shield,
  ArrowLeft,
  Plus,
  Trash2,
  Key,
  Fingerprint,
  Smartphone,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SecurityPage() {
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [credentialName, setCredentialName] = useState('')

  useEffect(() => {
    fetch('/api/flue/admin/webauthn/credentials')
      .then((r) => r.json())
      .then((data) => setCredentials(Array.isArray(data) ? data : []))
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false))
  }, [])

  async function enrollCredential() {
    if (!credentialName.trim()) {
      toast.error('Please enter a name for this credential')
      return
    }

    setEnrolling(true)
    try {
      // Step 1: Get registration options from server
      const optionsRes = await fetch('/api/flue/admin/webauthn/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: credentialName }),
      })
      const options = await optionsRes.json()

      // Step 2: Use browser WebAuthn API
      const { startRegistration } = await import('@simplewebauthn/browser')
      const credential = await startRegistration(options)

      // Step 3: Send response to server for verification
      const verifyRes = await fetch('/api/flue/admin/webauthn/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: credentialName, credential }),
      })
      const result = await verifyRes.json()

      if (result.verified) {
        setCredentials((prev) => [
          ...prev,
          {
            id: result.credentialId,
            name: credentialName,
            createdAt: new Date().toISOString(),
            deviceType: credential.response?.attestationObject ? 'platform' : 'cross-platform',
          },
        ])
        setCredentialName('')
        toast.success('Passkey enrolled successfully')
      } else {
        toast.error('Enrollment verification failed')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error('Enrollment was cancelled')
      } else {
        toast.error('Failed to enroll passkey')
      }
    } finally {
      setEnrolling(false)
    }
  }

  async function removeCredential(id: string) {
    try {
      await fetch(`/api/flue/admin/webauthn/credentials/${id}`, { method: 'DELETE' })
      setCredentials((prev) => prev.filter((c) => c.id !== id))
      toast.success('Credential removed')
    } catch {
      toast.error('Failed to remove credential')
    }
  }

  function getDeviceIcon(type: string) {
    switch (type) {
      case 'platform':
        return <Fingerprint className="w-5 h-5" />
      case 'cross-platform':
        return <Key className="w-5 h-5" />
      default:
        return <Smartphone className="w-5 h-5" />
    }
  }

  return (
    <>
      <PageHeader title="Security" description="FIDO2/WebAuthn enrollment and zero-trust identity verification">
        <Link
          href="/settings"
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enroll New Passkey */}
          <div className="nb-card bg-white p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Enroll New Passkey
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Register a FIDO2/WebAuthn security key or platform authenticator for
              phishing-resistant authentication. Supports YubiKey, Touch ID, Windows Hello,
              and synced passkeys.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
                placeholder="e.g., YubiKey 5 NFC, MacBook Touch ID"
                className="flex-1 border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                onClick={enrollCredential}
                disabled={enrolling || !credentialName.trim()}
                className="nb-btn-orange px-4 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {enrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Enroll
              </button>
            </div>
          </div>

          {/* Registered Credentials */}
          <div className="nb-card bg-white">
            <div className="px-6 py-4 border-b-3 border-black">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Key className="w-5 h-5" />
                Registered Passkeys ({credentials.length})
              </h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">
                Loading credentials...
              </div>
            ) : credentials.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-[var(--secondary)] border-2 border-black flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7" />
                </div>
                <h4 className="font-bold">No passkeys enrolled</h4>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Enroll a security key or platform authenticator to enable passwordless login
                </p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-[var(--sidebar-accent)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--secondary)] border-2 border-black flex items-center justify-center">
                        {getDeviceIcon(cred.deviceType)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{cred.name}</p>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span className="capitalize">{cred.deviceType}</span>
                          <span>·</span>
                          <span>Added {formatDate(cred.createdAt)}</span>
                          {cred.lastUsed && (
                            <>
                              <span>·</span>
                              <span>Last used {formatDate(cred.lastUsed)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCredential(cred.id)}
                      className="nb-btn-outline px-3 py-1.5 text-xs text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Zero Trust Status */}
          <div className="nb-card bg-white p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Zero Trust Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Phishing-Resistant MFA</span>
                {credentials.length > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">FIDO2 Enrolled</span>
                {credentials.length > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup Key</span>
                {credentials.length >= 2 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Identity Verification</span>
                <StatusBadge
                  status={credentials.length > 0 ? 'active' : 'idle'}
                  className="!py-0 !px-1.5 !text-[9px]"
                />
              </div>
            </div>
          </div>

          {/* Supported Authenticators */}
          <div className="nb-card bg-white p-5">
            <h3 className="font-bold text-sm mb-3">Supported Authenticators</h3>
            <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3" />
                <span>YubiKey 5 Series (USB-A/C/NFC)</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3" />
                <span>SoloKeys</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3" />
                <span>Google Titan Security Key</span>
              </div>
              <div className="flex items-center gap-2">
                <Fingerprint className="w-3 h-3" />
                <span>Touch ID / Face ID</span>
              </div>
              <div className="flex items-center gap-2">
                <Fingerprint className="w-3 h-3" />
                <span>Windows Hello</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-3 h-3" />
                <span>Synced Passkeys (iCloud, Google, 1Password)</span>
              </div>
            </div>
          </div>

          {/* NIST References */}
          <div className="nb-card bg-white p-5">
            <h3 className="font-bold text-sm mb-3">Compliance References</h3>
            <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
              <p>NIST SP 800-207 (Zero Trust)</p>
              <p>NIST SP 800-63B (AAL3)</p>
              <p>CISA Zero Trust Maturity Model</p>
              <p>FIDO Alliance WebAuthn Spec</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
