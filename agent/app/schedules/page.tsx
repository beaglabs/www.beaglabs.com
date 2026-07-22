'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { formatDate } from '@/lib/utils'
import type { Schedule } from '@/lib/types'
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Loader2,
  Edit,
  Workflow,
  Bot,
} from 'lucide-react'
import { toast } from 'sonner'

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [triggering, setTriggering] = useState<string | null>(null)

  // Create form
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'workflow' | 'dispatch'>('workflow')
  const [formTarget, setFormTarget] = useState('')
  const [formCron, setFormCron] = useState('')
  const [formTimezone, setFormTimezone] = useState('UTC')
  const [formInput, setFormInput] = useState('{}')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/flue/admin/schedules')
      .then((r) => r.json())
      .then((data) => setSchedules(Array.isArray(data) ? data : []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false))
  }, [])

  async function createSchedule() {
    if (!formName.trim() || !formTarget.trim() || !formCron.trim()) {
      toast.error('Name, target, and cron expression are required')
      return
    }

    let parsedInput: Record<string, unknown> | undefined
    try {
      parsedInput = JSON.parse(formInput)
    } catch {
      toast.error('Input must be valid JSON')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/flue/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          type: formType,
          target: formTarget,
          cron: formCron,
          timezone: formTimezone,
          enabled: true,
          input: parsedInput,
        }),
      })
      const data = await res.json()
      setSchedules((prev) => [...prev, data])
      setShowCreate(false)
      resetForm()
      toast.success(`Schedule "${formName}" created`)
    } catch {
      toast.error('Failed to create schedule')
    } finally {
      setCreating(false)
    }
  }

  async function toggleSchedule(id: string, enabled: boolean) {
    try {
      await fetch(`/api/flue/admin/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      )
      toast.success(`Schedule ${enabled ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update schedule')
    }
  }

  async function triggerSchedule(id: string) {
    setTriggering(id)
    try {
      await fetch(`/api/flue/admin/schedules/${id}/trigger`, { method: 'POST' })
      toast.success('Schedule triggered')
    } catch {
      toast.error('Failed to trigger schedule')
    } finally {
      setTriggering(null)
    }
  }

  async function deleteSchedule(id: string) {
    try {
      await fetch(`/api/flue/admin/schedules/${id}`, { method: 'DELETE' })
      setSchedules((prev) => prev.filter((s) => s.id !== id))
      toast.success('Schedule deleted')
    } catch {
      toast.error('Failed to delete schedule')
    }
  }

  function resetForm() {
    setFormName('')
    setFormType('workflow')
    setFormTarget('')
    setFormCron('')
    setFormTimezone('UTC')
    setFormInput('{}')
  }

  return (
    <>
      <PageHeader title="Schedules" description="Manage recurring workflow invocations and agent dispatches">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </PageHeader>

      {/* Create Form */}
      {showCreate && (
        <div className="nb-card bg-white p-5 mb-6">
          <h3 className="font-bold text-lg mb-4">Create Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., daily-summary"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'workflow' | 'dispatch')}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="workflow">Workflow Invocation</option>
                <option value="dispatch">Agent Dispatch</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Target
              </label>
              <input
                type="text"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                placeholder={formType === 'workflow' ? 'workflow-name' : 'agent-name'}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Cron Expression
              </label>
              <input
                type="text"
                value={formCron}
                onChange={(e) => setFormCron(e.target.value)}
                placeholder="0 9 * * 1-5"
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                min hour day month weekday — e.g., &quot;0 9 * * 1-5&quot; = weekdays at 9am
              </p>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Timezone
              </label>
              <select
                value={formTimezone}
                onChange={(e) => setFormTimezone(e.target.value)}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern</option>
                <option value="America/Chicago">Central</option>
                <option value="America/Denver">Mountain</option>
                <option value="America/Los_Angeles">Pacific</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Input (JSON)
              </label>
              <input
                type="text"
                value={formInput}
                onChange={(e) => setFormInput(e.target.value)}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={createSchedule}
              disabled={creating}
              className="nb-btn-orange px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button onClick={() => { setShowCreate(false); resetForm() }} className="nb-btn-outline px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 nb-card animate-pulse" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-7 h-7" />}
          title="No schedules configured"
          description="Schedules run workflows or dispatch agents on a recurring cron pattern. Create one to automate recurring tasks."
        />
      ) : (
        <div className="nb-card bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-3 border-black bg-[var(--secondary)]">
                  <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Name</th>
                  <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Type</th>
                  <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Target</th>
                  <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Cron</th>
                  <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Status</th>
                  <th className="text-left px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Next Run</th>
                  <th className="text-right px-5 py-3 font-mono text-xs uppercase tracking-[0.14em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-[var(--sidebar-accent)] transition-colors">
                    <td className="px-5 py-3 font-bold">{schedule.name}</td>
                    <td className="px-5 py-3">
                      <span className="nb-chip !py-0.5 !px-2 !text-[10px] flex items-center gap-1 w-fit">
                        {schedule.type === 'workflow' ? (
                          <Workflow className="w-3 h-3" />
                        ) : (
                          <Bot className="w-3 h-3" />
                        )}
                        {schedule.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{schedule.target}</td>
                    <td className="px-5 py-3 font-mono text-xs">{schedule.cron}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={schedule.enabled ? 'active' : 'stopped'} />
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--muted-foreground)]">
                      {schedule.nextRun ? formatDate(schedule.nextRun) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => triggerSchedule(schedule.id)}
                          disabled={triggering === schedule.id}
                          className="nb-btn-outline px-2 py-1 text-xs"
                          title="Trigger now"
                        >
                          {triggering === schedule.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                          className="nb-btn-outline px-2 py-1 text-xs"
                          title={schedule.enabled ? 'Disable' : 'Enable'}
                        >
                          {schedule.enabled ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="nb-btn-outline px-2 py-1 text-xs text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
