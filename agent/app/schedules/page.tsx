'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { formatDate } from '@/lib/utils'
import type { Schedule, Workflow, Agent } from '@/lib/types'
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Loader2,
  Edit,
  Workflow as WorkflowIcon,
  Bot,
  ChevronDown,
  Search,
  X,
  RefreshCw,
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

  // Dropdown data
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingTargets, setLoadingTargets] = useState(false)
  const [targetSearch, setTargetSearch] = useState('')
  const [showTargetDropdown, setShowTargetDropdown] = useState(false)

  useEffect(() => {
    fetch('/api/flue/admin/schedules')
      .then((r) => r.json())
      .then((data) => setSchedules(Array.isArray(data) ? data : []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false))
  }, [])

  // Fetch available targets when type changes or form opens
  useEffect(() => {
    if (!showCreate) return

    setLoadingTargets(true)
    const fetchTargets = async () => {
      try {
        if (formType === 'workflow') {
          const res = await fetch('/api/flue/admin/workflows')
          const data = await res.json()
          setWorkflows(Array.isArray(data) ? data : [])
        } else {
          const res = await fetch('/api/flue/admin/agents')
          const data = await res.json()
          setAgents(Array.isArray(data) ? data : [])
        }
      } catch {
        setWorkflows([])
        setAgents([])
      } finally {
        setLoadingTargets(false)
      }
    }

    fetchTargets()
  }, [formType, showCreate])

  function getTargets() {
    if (formType === 'workflow') {
      return workflows
        .filter(w => !targetSearch || w.name.toLowerCase().includes(targetSearch.toLowerCase()))
        .map(w => ({
          value: w.name,
          label: w.name,
          description: w.description,
          icon: <WorkflowIcon className="w-4 h-4" />,
        }))
    }
    return agents
      .filter(a => !targetSearch || a.name.toLowerCase().includes(targetSearch.toLowerCase()))
      .map(a => ({
        value: a.name,
        label: a.name,
        description: a.description,
        icon: <Bot className="w-4 h-4" />,
      }))
  }

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
    setTargetSearch('')
    setShowTargetDropdown(false)
  }

  const targets = getTargets()
  const selectedTarget = targets.find(t => t.value === formTarget)

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
                onChange={(e) => {
                  setFormType(e.target.value as 'workflow' | 'dispatch')
                  setFormTarget('')
                  setTargetSearch('')
                }}
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="workflow">Workflow Invocation</option>
                <option value="dispatch">Agent Dispatch</option>
              </select>
            </div>
            <div className="relative">
              <label className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1.5">
                Target
              </label>
              <div
                className="w-full border-3 border-black px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer flex items-center justify-between"
                onClick={() => setShowTargetDropdown(!showTargetDropdown)}
              >
                {formTarget ? (
                  <div className="flex items-center gap-2">
                    {selectedTarget?.icon}
                    <span className="font-medium">{formTarget}</span>
                  </div>
                ) : (
                  <span className="text-[var(--muted-foreground)]">
                    Select a {formType === 'workflow' ? 'workflow' : 'agent'}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showTargetDropdown ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown */}
              {showTargetDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 border-3 border-black bg-white shadow-[6px_6px_0px_0px_#111] max-h-60 overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b-2 border-black">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        value={targetSearch}
                        onChange={(e) => setTargetSearch(e.target.value)}
                        placeholder={`Search ${formType === 'workflow' ? 'workflows' : 'agents'}...`}
                        className="w-full border-2 border-black pl-8 pr-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="overflow-y-auto max-h-48">
                    {loadingTargets ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">Loading...</p>
                      </div>
                    ) : targets.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--muted-foreground)]">
                        No {formType === 'workflow' ? 'workflows' : 'agents'} found
                      </div>
                    ) : (
                      targets.map((target) => (
                        <div
                          key={target.value}
                          className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-colors ${
                            formTarget === target.value
                              ? 'bg-[var(--accent)] font-bold'
                              : 'hover:bg-[var(--sidebar-accent)]'
                          }`}
                          onClick={() => {
                            setFormTarget(target.value)
                            setShowTargetDropdown(false)
                            setTargetSearch('')
                          }}
                        >
                          <div className={`w-6 h-6 border-2 border-black flex items-center justify-center ${
                            formTarget === target.value ? 'bg-black text-white' : 'bg-[var(--secondary)]'
                          }`}>
                            {target.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{target.label}</div>
                            {target.description && (
                              <div className="text-[10px] text-[var(--muted-foreground)] truncate">
                                {target.description}
                              </div>
                            )}
                          </div>
                          {formTarget === target.value && (
                            <div className="w-2 h-2 bg-black rounded-full" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                          <WorkflowIcon className="w-3 h-3" />
                        ) : (
                          <Bot className="w-3 h-3" />
                        )}
                        {schedule.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {schedule.type === 'workflow' ? (
                          <WorkflowIcon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        )}
                        <span className="font-mono text-xs">{schedule.target}</span>
                      </div>
                    </td>
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
