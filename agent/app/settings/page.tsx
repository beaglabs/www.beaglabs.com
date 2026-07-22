'use client'

import { PageHeader } from '@/components/page-header'
import { Settings, Shield, Server, Database, Bell } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Configure portal and runtime settings" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security */}
        <Link
          href="/settings/security"
          className="nb-card bg-white p-6 hover:bg-[var(--sidebar-accent)] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Security</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                WebAuthn/FIDO2 enrollment, passkey management, zero-trust settings
              </p>
            </div>
          </div>
        </Link>

        {/* Runtime */}
        <div className="nb-card bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Runtime</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Flue runtime configuration, model defaults, timeout settings
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span className="text-[var(--muted-foreground)]">API Endpoint</span>
              <span className="font-mono text-xs">/api/flue</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span className="text-[var(--muted-foreground)]">Database</span>
              <span className="font-mono text-xs">libSQL</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span className="text-[var(--muted-foreground)]">Default Model</span>
              <span className="font-mono text-xs">anthropic/claude-haiku-4-5</span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="nb-card bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Database</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                LibSQL connection, run history, conversation persistence
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span className="text-[var(--muted-foreground)]">Connection</span>
              <span className="font-mono text-xs">file:./data/flue.db</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span className="text-[var(--muted-foreground)]">Provider</span>
              <span className="font-mono text-xs">@flue/libsql</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="nb-card bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Configure alerts for run failures, cost thresholds, and security events
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span className="text-[var(--muted-foreground)]">Discord Alerts</span>
              <span className="nb-chip !py-0 !px-1.5 !text-[9px] bg-green-50 text-green-600 border-green-300">
                Enabled
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-1">
              <span className="text-[var(--muted-foreground)]">Email Alerts</span>
              <span className="nb-chip !py-0 !px-1.5 !text-[9px] bg-green-50 text-green-600 border-green-300">
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
