'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import type { Channel } from '@/lib/types'
import {
  Mail,
  RefreshCw,
  ExternalLink,
  Loader2,
  Settings,
  Inbox,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ChannelsPage() {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetch('/api/flue/admin/channels/resend')
      .then((r) => r.json())
      .then((data) => setChannel(data))
      .catch(() =>
        setChannel({
          name: 'resend',
          status: 'disconnected',
          config: {},
          messageCount: 0,
        })
      )
      .finally(() => setLoading(false))
  }, [])

  async function refreshChannel() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/flue/admin/channels/resend')
      const data = await res.json()
      setChannel(data)
      toast.success('Resend channel status refreshed')
    } catch {
      toast.error('Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Channels"
        description="Manage Resend email channel for agent interactions"
      />

      {loading ? (
        <div className="h-64 bg-gray-200 nb-card animate-pulse" />
      ) : (
        <div className="max-w-2xl">
          <div className="nb-card bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Resend Email</h3>
                  <StatusBadge
                    status={channel?.status || 'disconnected'}
                    className="!py-0.5 !px-2 !text-[10px]"
                  />
                </div>
              </div>
              <button
                onClick={refreshChannel}
                disabled={refreshing}
                className="nb-btn-outline px-3 py-1.5 text-xs flex items-center gap-1"
              >
                {refreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-black p-3">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Emails Processed
                  </p>
                  <p className="text-2xl font-extrabold mt-1">
                    {(channel?.messageCount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="border-2 border-black p-3">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Last Activity
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {channel?.lastActivity
                      ? new Date(channel.lastActivity).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
                  How It Works
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Inbox className="w-4 h-4 mt-0.5 text-[var(--accent)]" />
                    <p>
                      <span className="font-bold">Inbound:</span> Resend webhooks deliver
                      incoming emails to the Flue agent, which processes and responds.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Send className="w-4 h-4 mt-0.5 text-[var(--accent)]" />
                    <p>
                      <span className="font-bold">Outbound:</span> Agents use the{' '}
                      <code className="font-mono text-xs bg-gray-100 px-1">send_email</code>{' '}
                      tool to compose and send replies via Resend API.
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
                  Configuration
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-[var(--muted-foreground)]">API Key</span>
                    <span className="font-mono text-xs">
                      {process.env.NEXT_PUBLIC_RESEND_API_KEY
                        ? '••••••••'
                        : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-[var(--muted-foreground)]">Webhook Secret</span>
                    <span className="font-mono text-xs">
                      {process.env.NEXT_PUBLIC_RESEND_WEBHOOK_SECRET
                        ? '••••••••'
                        : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-[var(--muted-foreground)]">Webhook Endpoint</span>
                    <span className="font-mono text-xs">/channels/resend/webhook</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <a
                  href="/api/flue/admin/channels/resend/logs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-chip !py-1 !px-3 !text-xs hover:bg-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Logs
                </a>
                <a
                  href="https://resend.com/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-chip !py-1 !px-3 !text-xs hover:bg-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Resend Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
