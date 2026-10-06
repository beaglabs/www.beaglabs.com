"use client"

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  RefreshCw,
  Save,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CrmAvatar } from './crm-avatar'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { LICENSE_CONTROL_PLANE_ORIGIN, licenseFetch } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Kind = 'people' | 'customers' | 'opportunities' | 'orders'
type Collection = { items: Row[] }
type Tab = 'details' | 'people' | 'references' | 'attachments' | 'activity'

function text(row: Row | null | undefined, ...keys: string[]): string {
  if (!row) return '—'
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return '—'
}

function money(cents: unknown): string {
  const value = Number(cents)
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value / 100)
}

function dateTime(value: unknown): string {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(parsed)
}

function fileSize(value: unknown): string {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Linked file'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusClass(value: unknown): string {
  const status = String(value ?? '').toLowerCase()
  if (['active','customer','qualified','booked','fulfilled','closed_won','active_customer'].includes(status)) return 'bg-[#d9f99d]'
  if (['new','contacted','prospect','identified','pilot_proposed','technical_validation','procurement','verbal','draft','nurture'].includes(status)) return 'bg-[#fff0a6]'
  if (['inactive','closed','closed_lost','cancelled','refunded','archived','do_not_contact'].includes(status)) return 'bg-[#fecaca]'
  return 'bg-white'
}

function Status({ value }: { value: unknown }) {
  return <span className={`${statusClass(value)} inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.08em]`}>{String(value ?? 'unknown').replaceAll('_',' ')}</span>
}

function LabelValue({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#777]">{label}</div><div className="mt-1 text-[13px] font-semibold leading-5">{children}</div></div>
}

const endpointFor = (kind: Kind, id: string) => `/api/v2/crm/${kind}/${encodeURIComponent(id)}`
const RESOURCE_TYPE_BY_KIND = {
  people: 'person',
  customers: 'organization',
  opportunities: 'opportunity',
  orders: 'order',
} as const

const RECORD_LABEL_BY_KIND = {
  people: 'person',
  customers: 'customer',
  opportunities: 'opportunity',
  orders: 'order',
} as const

const resourceTypeFor = (kind: Kind) => RESOURCE_TYPE_BY_KIND[kind]

export function CrmRecordDetail({ kind, id }: { kind: Kind; id: string }) {
  const [record, setRecord] = useState<Row | null>(null)
  const [allPeople, setAllPeople] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('details')
  const [busy, setBusy] = useState(false)
  const [personLink, setPersonLink] = useState({ personId: '', role: 'stakeholder' })
  const [referenceForm, setReferenceForm] = useState({ referenceType: 'sam_notice', identifier: '', url: '', label: '' })
  const [note, setNote] = useState('')
  const [orderEdit, setOrderEdit] = useState({ contractNumber: '', taskOrderNumber: '', poNumber: '', status: 'draft' })
  const [personEdit, setPersonEdit] = useState({ organizationId: '', leadStage: 'new', linkedinUrl: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const requests: Promise<unknown>[] = [licenseFetch<Row>(endpointFor(kind, id))]
      if (kind !== 'people') requests.push(licenseFetch<Collection>('/api/v2/crm/people?limit=500'))
      if (kind === 'people') requests.push(licenseFetch<Collection>('/api/v2/crm/customers?limit=500'))
      const result = await Promise.all(requests)
      const next = result[0] as Row
      setRecord(next)
      if (kind !== 'people') setAllPeople((result[1] as Collection).items)
      if (kind === 'people') setCustomers((result[1] as Collection).items)
      if (kind === 'orders') setOrderEdit({ contractNumber: text(next,'contract_number') === '—' ? '' : text(next,'contract_number'), taskOrderNumber: text(next,'task_order_number') === '—' ? '' : text(next,'task_order_number'), poNumber: text(next,'po_number') === '—' ? '' : text(next,'po_number'), status: text(next,'status') })
      if (kind === 'people') setPersonEdit({ organizationId: text(next,'organization_id') === '—' ? '' : text(next,'organization_id'), leadStage: text(next,'lead_stage'), linkedinUrl: text(next,'linkedin_url') === '—' ? '' : text(next,'linkedin_url') })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load CRM record.')
    } finally { setLoading(false) }
  }, [id, kind])

  useEffect(() => { void load() }, [load])

  const title = useMemo(() => {
    if (!record) return 'CRM record'
    if (kind === 'people') return `${text(record,'first_name')} ${text(record,'last_name')}`
    if (kind === 'customers') return text(record,'display_name','legal_name')
    if (kind === 'opportunities') return text(record,'name')
    return `Order · ${text(record,'customer_name')}`
  }, [kind, record])

  const linkedPeople = useMemo(() => {
    if (!record) return []
    const value = record.people
    return Array.isArray(value) ? value as Row[] : []
  }, [record])

  const references = useMemo(() => {
    if (!record) return []
    const value = record.references
    return Array.isArray(value) ? value as Row[] : []
  }, [record])

  const attachments = useMemo(() => {
    if (!record) return []
    const value = record.attachments
    return Array.isArray(value) ? value as Row[] : []
  }, [record])

  const activities = useMemo(() => {
    if (!record) return []
    const value = record.activities
    return Array.isArray(value) ? value as Row[] : []
  }, [record])

  const updatePerson = async () => {
    setBusy(true)
    try {
      await licenseFetch(endpointFor(kind, id), {
        method: 'PATCH',
        body: JSON.stringify({ organizationId: personEdit.organizationId || null, leadStage: personEdit.leadStage, linkedinUrl: personEdit.linkedinUrl || null }),
      })
      toast.success('Person updated.')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update person.') }
    finally { setBusy(false) }
  }

  const refreshAvatar = async () => {
    setBusy(true)
    try {
      await licenseFetch(`/api/v2/crm/people/${encodeURIComponent(id)}/refresh-avatar`, { method: 'POST', body: '{}' })
      toast.success('LinkedIn avatar refresh attempted.')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to refresh avatar.') }
    finally { setBusy(false) }
  }

  const updateOrder = async () => {
    setBusy(true)
    try {
      await licenseFetch(endpointFor(kind, id), {
        method: 'PATCH',
        body: JSON.stringify({ contractNumber: orderEdit.contractNumber || null, taskOrderNumber: orderEdit.taskOrderNumber || null, poNumber: orderEdit.poNumber || null, status: orderEdit.status }),
      })
      toast.success('Order details updated.')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update order.') }
    finally { setBusy(false) }
  }

  const addPerson = async () => {
    if (!personLink.personId) return
    setBusy(true)
    try {
      if (kind === 'customers') {
        await licenseFetch(`/api/v2/crm/people/${encodeURIComponent(personLink.personId)}`, { method: 'PATCH', body: JSON.stringify({ organizationId: id }) })
      } else {
        await licenseFetch('/api/v2/crm/links', {
          method: 'POST',
          body: JSON.stringify({ personId: personLink.personId, resourceType: resourceTypeFor(kind), resourceId: id, role: personLink.role }),
        })
      }
      setPersonLink({ personId: '', role: 'stakeholder' })
      toast.success('Person attached.')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to attach person.') }
    finally { setBusy(false) }
  }

  const addReference = async () => {
    if (!referenceForm.identifier.trim()) return
    setBusy(true)
    try {
      await licenseFetch('/api/v2/crm/references', {
        method: 'POST',
        body: JSON.stringify({
          resourceType: resourceTypeFor(kind),
          resourceId: id,
          referenceType: referenceForm.referenceType,
          identifier: referenceForm.identifier,
          url: referenceForm.url || null,
          label: referenceForm.label || null,
        }),
      })
      setReferenceForm({ referenceType: 'sam_notice', identifier: '', url: '', label: '' })
      toast.success('Procurement reference attached.')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to attach reference.') }
    finally { setBusy(false) }
  }

  const deleteReference = async (referenceId: string) => {
    setBusy(true)
    try {
      await licenseFetch(`/api/v2/crm/references/${encodeURIComponent(referenceId)}`, { method: 'DELETE' })
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to remove reference.') }
    finally { setBusy(false) }
  }

  const uploadAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.set('file', file)
      form.set('resourceType', resourceTypeFor(kind))
      form.set('resourceId', id)
      await licenseFetch('/api/v2/crm/attachments', { method: 'POST', body: form })
      toast.success('Attachment uploaded.')
      event.target.value = ''
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to upload attachment.') }
    finally { setBusy(false) }
  }

  const deleteAttachment = async (attachmentId: string) => {
    setBusy(true)
    try {
      await licenseFetch(`/api/v2/crm/attachments/${encodeURIComponent(attachmentId)}`, { method: 'DELETE' })
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to remove attachment.') }
    finally { setBusy(false) }
  }

  const addNote = async () => {
    if (!note.trim()) return
    setBusy(true)
    try {
      await licenseFetch('/api/v2/crm/activities', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: kind === 'customers' ? id : record?.customer_organization_id ?? record?.organization_id ?? null,
          personId: kind === 'people' ? id : null,
          resourceType: resourceTypeFor(kind),
          resourceId: id,
          activityType: 'note',
          body: note,
        }),
      })
      setNote('')
      toast.success('Note added.')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to add note.') }
    finally { setBusy(false) }
  }

  if (loading && !record) return <div className="flex min-h-[520px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-6 py-4 font-mono text-[10px] font-black uppercase"><Loader2 className="h-4 w-4 animate-spin" /> Loading CRM record</div></div>
  if (!record) return <div className="nb-panel p-8"><p className="font-extrabold">CRM record not found.</p><Link href="/licensing" className="mt-4 inline-flex items-center gap-2 font-bold underline"><ArrowLeft className="h-4 w-4" />Back to CRM</Link></div>

  const status = kind === 'people' ? record.lead_stage : kind === 'customers' ? record.account_stage ?? record.status : record.status ?? record.stage

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-6 flex flex-col gap-5 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/licensing" className="nb-btn-white inline-flex h-10 w-10 shrink-0 items-center justify-center p-0"><ArrowLeft className="h-4 w-4" /></Link>
          {kind === 'people' ? <CrmAvatar firstName={text(record,'first_name')} lastName={text(record,'last_name')} avatarUrl={record.avatar_url ? String(record.avatar_url) : null} linkedinUrl={record.linkedin_url ? String(record.linkedin_url) : null} size="lg" /> : null}
          <div className="min-w-0"><div className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#ff5f1f]">{RECORD_LABEL_BY_KIND[kind]} record</div><h1 className="mt-1 truncate text-[28px] font-extrabold tracking-[-0.04em]">{title}</h1><div className="mt-2 flex flex-wrap items-center gap-2"><Status value={status} /><span className="font-mono text-[9px] text-[#888]">{id}</span></div></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
      </div>

      <div className="hidden min-h-[720px] border-[3px] border-[#111] bg-white shadow-[7px_7px_0_#111] lg:block">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={34} minSize={25}>
            <div className="h-full overflow-y-auto bg-[#FAFAF9] p-6">
              <Summary kind={kind} record={record} />
              {kind === 'people' ? (
                <div className="mt-7 space-y-4 border-t-2 border-[#111] pt-6">
                  <div className="font-mono text-[9px] font-black uppercase tracking-[0.13em]">Edit lead</div>
                  <label className="block"><span className="text-[11px] font-bold">Entity</span><select className="nb-input mt-1.5 w-full" value={personEdit.organizationId} onChange={(e)=>setPersonEdit({...personEdit,organizationId:e.target.value})}><option value="">No entity</option>{customers.map((row)=><option key={text(row,'id')} value={text(row,'id')}>{text(row,'display_name','legal_name')}</option>)}</select></label>
                  <label className="block"><span className="text-[11px] font-bold">Stage</span><select className="nb-input mt-1.5 w-full" value={personEdit.leadStage} onChange={(e)=>setPersonEdit({...personEdit,leadStage:e.target.value})}>{['new','contacted','qualified','nurture','customer','closed','do_not_contact'].map((value)=><option key={value}>{value}</option>)}</select></label>
                  <label className="block"><span className="text-[11px] font-bold">LinkedIn</span><input className="nb-input mt-1.5 w-full" value={personEdit.linkedinUrl} onChange={(e)=>setPersonEdit({...personEdit,linkedinUrl:e.target.value})} /></label>
                  <div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={()=>void updatePerson()} className="nb-btn-orange inline-flex items-center justify-center gap-2 px-3 py-2.5 font-mono text-[9px] font-black uppercase"><Save className="h-3.5 w-3.5"/>Save</button><button disabled={busy || !personEdit.linkedinUrl} onClick={()=>void refreshAvatar()} className="nb-btn-white inline-flex items-center justify-center gap-2 px-3 py-2.5 font-mono text-[9px] font-black uppercase"><RefreshCw className="h-3.5 w-3.5"/>Avatar</button></div>
                </div>
              ) : null}
              {kind === 'orders' ? (
                <div className="mt-7 space-y-4 border-t-2 border-[#111] pt-6">
                  <div className="font-mono text-[9px] font-black uppercase tracking-[0.13em]">Order fields</div>
                  <label className="block"><span className="text-[11px] font-bold">Contract number</span><input className="nb-input mt-1.5 w-full font-mono text-[11px]" value={orderEdit.contractNumber} onChange={(e)=>setOrderEdit({...orderEdit,contractNumber:e.target.value})}/></label>
                  <label className="block"><span className="text-[11px] font-bold">Task order</span><input className="nb-input mt-1.5 w-full font-mono text-[11px]" value={orderEdit.taskOrderNumber} onChange={(e)=>setOrderEdit({...orderEdit,taskOrderNumber:e.target.value})}/></label>
                  <label className="block"><span className="text-[11px] font-bold">PO number</span><input className="nb-input mt-1.5 w-full font-mono text-[11px]" value={orderEdit.poNumber} onChange={(e)=>setOrderEdit({...orderEdit,poNumber:e.target.value})}/></label>
                  <label className="block"><span className="text-[11px] font-bold">Status</span><select className="nb-input mt-1.5 w-full" value={orderEdit.status} onChange={(e)=>setOrderEdit({...orderEdit,status:e.target.value})}>{['draft','booked','fulfilled','cancelled','refunded'].map((value)=><option key={value}>{value}</option>)}</select></label>
                  <button disabled={busy} onClick={()=>void updateOrder()} className="nb-btn-orange inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 font-mono text-[9px] font-black uppercase"><Save className="h-3.5 w-3.5"/>Save order</button>
                </div>
              ) : null}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="w-[3px] bg-[#111]" />
          <ResizablePanel defaultSize={66} minSize={40}>
            <RecordWorkspace kind={kind} record={record} tab={tab} setTab={setTab} linkedPeople={kind === 'customers' ? (Array.isArray(record.people) ? record.people as Row[] : []) : linkedPeople} allPeople={allPeople} personLink={personLink} setPersonLink={setPersonLink} addPerson={addPerson} references={references} referenceForm={referenceForm} setReferenceForm={setReferenceForm} addReference={addReference} deleteReference={deleteReference} attachments={attachments} uploadAttachment={uploadAttachment} deleteAttachment={deleteAttachment} activities={activities} note={note} setNote={setNote} addNote={addNote} busy={busy} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="space-y-6 lg:hidden">
        <section className="nb-panel p-5"><Summary kind={kind} record={record} /></section>
        <section className="nb-panel overflow-hidden"><RecordWorkspace kind={kind} record={record} tab={tab} setTab={setTab} linkedPeople={kind === 'customers' ? (Array.isArray(record.people) ? record.people as Row[] : []) : linkedPeople} allPeople={allPeople} personLink={personLink} setPersonLink={setPersonLink} addPerson={addPerson} references={references} referenceForm={referenceForm} setReferenceForm={setReferenceForm} addReference={addReference} deleteReference={deleteReference} attachments={attachments} uploadAttachment={uploadAttachment} deleteAttachment={deleteAttachment} activities={activities} note={note} setNote={setNote} addNote={addNote} busy={busy} /></section>
      </div>
    </div>
  )
}

function Summary({ kind, record }: { kind: Kind; record: Row }) {
  if (kind === 'people') {
    return <div><div className="flex items-center gap-4"><CrmAvatar firstName={text(record,'first_name')} lastName={text(record,'last_name')} avatarUrl={record.avatar_url ? String(record.avatar_url) : null} linkedinUrl={record.linkedin_url ? String(record.linkedin_url) : null} size="lg"/><div><div className="text-[20px] font-extrabold">{text(record,'first_name')} {text(record,'last_name')}</div><div className="mt-1 text-[13px] text-[#666]">{text(record,'title')}</div></div></div><div className="mt-7 grid gap-5"><LabelValue label="Entity">{text(record,'organization_name')}</LabelValue><LabelValue label="Email">{text(record,'email')}</LabelValue><LabelValue label="Phone">{text(record,'phone')}</LabelValue><LabelValue label="Source">{text(record,'lead_source')}</LabelValue>{record.linkedin_url ? <LabelValue label="LinkedIn"><a href={String(record.linkedin_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">Open profile <ExternalLink className="h-3 w-3"/></a></LabelValue> : null}</div></div>
  }
  if (kind === 'customers') {
    return <div><div className="flex items-center gap-3">{record.logo_url ? <img src={String(record.logo_url)} alt="" className="h-14 w-14 border-2 border-[#111] bg-white object-contain p-1 shadow-[3px_3px_0_#111]"/> : <Building2 className="h-10 w-10"/>}<div><div className="text-[20px] font-extrabold">{text(record,'display_name','legal_name')}</div><div className="mt-1 text-[12px] text-[#666]">{text(record,'organization_type').replaceAll('_',' ')}</div></div></div><div className="mt-7 grid gap-5"><LabelValue label="Legal name">{text(record,'legal_name')}</LabelValue><LabelValue label="UEI">{text(record,'uei')}</LabelValue><LabelValue label="CAGE">{text(record,'cage_code')}</LabelValue><LabelValue label="Domain">{text(record,'domain')}</LabelValue><LabelValue label="Account stage">{text(record,'account_stage')}</LabelValue></div></div>
  }
  if (kind === 'opportunities') {
    return <div><BriefcaseBusiness className="h-8 w-8"/><div className="mt-4 text-[20px] font-extrabold">{text(record,'name')}</div><div className="mt-7 grid gap-5"><LabelValue label="Customer">{text(record,'customer_name')}</LabelValue><LabelValue label="Stage">{text(record,'stage')}</LabelValue><LabelValue label="Estimated value">{money(record.estimated_value_cents)}</LabelValue><LabelValue label="Expected close">{dateTime(record.expected_close_date)}</LabelValue></div></div>
  }
  return <div><FileText className="h-8 w-8"/><div className="mt-4 text-[20px] font-extrabold">Commercial order</div><div className="mt-7 grid gap-5"><LabelValue label="Customer">{text(record,'customer_name')}</LabelValue><LabelValue label="Total">{money(record.total_cents)}</LabelValue><LabelValue label="Contract">{text(record,'contract_number')}</LabelValue><LabelValue label="Task order">{text(record,'task_order_number')}</LabelValue><LabelValue label="PO">{text(record,'po_number')}</LabelValue><LabelValue label="Opportunity">{text(record,'opportunity_name')}</LabelValue></div></div>
}

function RecordWorkspace(props: {
  kind: Kind
  record: Row
  tab: Tab
  setTab: (tab: Tab) => void
  linkedPeople: Row[]
  allPeople: Row[]
  personLink: { personId: string; role: string }
  setPersonLink: (value: { personId: string; role: string }) => void
  addPerson: () => void
  references: Row[]
  referenceForm: { referenceType: string; identifier: string; url: string; label: string }
  setReferenceForm: (value: { referenceType: string; identifier: string; url: string; label: string }) => void
  addReference: () => void
  deleteReference: (id: string) => void
  attachments: Row[]
  uploadAttachment: (event: React.ChangeEvent<HTMLInputElement>) => void
  deleteAttachment: (id: string) => void
  activities: Row[]
  note: string
  setNote: (value: string) => void
  addNote: () => void
  busy: boolean
}) {
  const { kind, record, tab, setTab, linkedPeople, allPeople, personLink, setPersonLink, addPerson, references, referenceForm, setReferenceForm, addReference, deleteReference, attachments, uploadAttachment, deleteAttachment, activities, note, setNote, addNote, busy } = props
  const tabs: Tab[] = kind === 'people' ? ['details','attachments','activity'] : ['details','people','references','attachments','activity']

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex overflow-x-auto border-b-[3px] border-[#111] bg-[#111] p-2">
        {tabs.map((value)=><button key={value} onClick={()=>setTab(value)} className={`border-2 px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.1em] ${tab===value?'border-[#111] bg-[#ff5f1f]':'border-white/40 bg-white'}`}>{value}</button>)}
      </div>
      <div className="p-5 lg:p-7">
        {tab === 'details' ? <Details kind={kind} record={record}/> : null}
        {tab === 'people' && kind !== 'people' ? <div><div className="flex items-center gap-2"><Users className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">People on this record</h2></div><div className="mt-5 grid gap-3">{linkedPeople.length ? linkedPeople.map((person)=><div key={text(person,'id')} className="flex items-center gap-3 border-2 border-[#111] bg-[#FAFAF9] p-3"><CrmAvatar firstName={text(person,'first_name')} lastName={text(person,'last_name')} avatarUrl={person.avatar_url?String(person.avatar_url):null} linkedinUrl={person.linkedin_url?String(person.linkedin_url):null}/><div className="min-w-0 flex-1"><Link href={`/licensing/people/${encodeURIComponent(text(person,'id'))}`} className="font-extrabold underline">{text(person,'first_name')} {text(person,'last_name')}</Link><div className="mt-1 text-[11px] text-[#777]">{text(person,'title')} · {text(person,'role')}</div></div></div>) : <div className="border-2 border-dashed border-[#aaa] p-5 text-[12px] font-semibold text-[#777]">No people linked yet.</div>}</div><div className="mt-6 grid gap-3 border-t-2 border-[#111] pt-5 md:grid-cols-[1fr_180px_auto]"><select className="nb-input" value={personLink.personId} onChange={(e)=>setPersonLink({...personLink,personId:e.target.value})}><option value="">Select person…</option>{allPeople.map((person)=><option key={text(person,'id')} value={text(person,'id')}>{text(person,'first_name')} {text(person,'last_name')} — {text(person,'organization_name')}</option>)}</select><input className="nb-input" value={personLink.role} onChange={(e)=>setPersonLink({...personLink,role:e.target.value})} placeholder="Role"/><button disabled={busy||!personLink.personId} onClick={()=>void addPerson()} className="nb-btn-orange inline-flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><UserPlus className="h-3.5 w-3.5"/>Attach</button></div></div> : null}
        {tab === 'references' && kind !== 'people' ? <div><div className="flex items-center gap-2"><Link2 className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Procurement references</h2></div><p className="mt-2 text-[12px] leading-5 text-[#666]">Attach structured identifiers instead of burying them in notes: SAM.gov notice IDs, SAM award IDs, solicitation numbers, prime contracts, subcontracts, task orders, POs, or vehicle IDs.</p><div className="mt-5 grid gap-3">{references.length ? references.map((reference)=><div key={text(reference,'id')} className="flex items-center gap-3 border-2 border-[#111] bg-[#FAFAF9] p-4"><div className="min-w-0 flex-1"><div className="font-mono text-[9px] font-black uppercase text-[#ff5f1f]">{text(reference,'reference_type').replaceAll('_',' ')}</div><div className="mt-1 break-all font-mono text-[12px] font-black">{text(reference,'identifier')}</div>{reference.label?<div className="mt-1 text-[12px]">{String(reference.label)}</div>:null}{reference.url?<a href={String(reference.url)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold underline">Open source <ExternalLink className="h-3 w-3"/></a>:null}</div><button disabled={busy} onClick={()=>void deleteReference(text(reference,'id'))} className="nb-btn-white h-9 w-9 p-0"><Trash2 className="mx-auto h-3.5 w-3.5"/></button></div>) : <div className="border-2 border-dashed border-[#aaa] p-5 text-[12px] font-semibold text-[#777]">No structured references yet.</div>}</div><div className="mt-6 grid gap-3 border-t-2 border-[#111] pt-5 md:grid-cols-2"><select className="nb-input" value={referenceForm.referenceType} onChange={(e)=>setReferenceForm({...referenceForm,referenceType:e.target.value})}>{['sam_notice','sam_award','solicitation','prime_contract','subcontract','task_order','purchase_order','vehicle','other'].map((value)=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</select><input className="nb-input font-mono text-[11px]" value={referenceForm.identifier} onChange={(e)=>setReferenceForm({...referenceForm,identifier:e.target.value})} placeholder="Identifier"/><input type="url" className="nb-input" value={referenceForm.url} onChange={(e)=>setReferenceForm({...referenceForm,url:e.target.value})} placeholder="Source URL (optional)"/><button disabled={busy||!referenceForm.identifier.trim()} onClick={()=>void addReference()} className="nb-btn-orange px-4 py-2.5 font-mono text-[9px] font-black uppercase">Attach reference</button></div></div> : null}
        {tab === 'attachments' ? <div><div className="flex items-center gap-2"><Paperclip className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Attachments</h2></div><p className="mt-2 text-[12px] leading-5 text-[#666]">Contracts, proposals, purchase orders, award documents, and supporting files are kept in private R2 object storage with CRM metadata in Turso.</p><label className="mt-5 flex cursor-pointer items-center justify-center gap-2 border-[3px] border-dashed border-[#111] bg-[#fff1e9] p-6 font-mono text-[10px] font-black uppercase hover:bg-[#ffd7c7]"><Paperclip className="h-4 w-4"/>{busy?'Working…':'Choose file · max 25 MB'}<input type="file" className="sr-only" disabled={busy} onChange={uploadAttachment}/></label><div className="mt-5 grid gap-3">{attachments.map((attachment)=><Attachment key={text(attachment,'id')} state="done"><AttachmentMedia><FileText className="h-5 w-5"/></AttachmentMedia><AttachmentContent><AttachmentTitle>{text(attachment,'file_name')}</AttachmentTitle><AttachmentDescription>{text(attachment,'content_type')} · {fileSize(attachment.size_bytes)} · {dateTime(attachment.created_at)}</AttachmentDescription></AttachmentContent><AttachmentActions><AttachmentAction onClick={()=>window.open(`${LICENSE_CONTROL_PLANE_ORIGIN}/api/v2/crm/attachments/${encodeURIComponent(text(attachment,'id'))}/download`,'_blank')} aria-label="Download"><Download className="h-3.5 w-3.5"/></AttachmentAction><AttachmentAction onClick={()=>void deleteAttachment(text(attachment,'id'))} aria-label="Remove"><Trash2 className="h-3.5 w-3.5"/></AttachmentAction></AttachmentActions></Attachment>)}</div></div> : null}
        {tab === 'activity' ? <div><div className="flex items-center gap-2"><MessageSquarePlus className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Activity</h2></div><div className="mt-5 flex gap-2"><textarea className="nb-input min-h-24 flex-1" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Add a CRM note, next step, meeting summary…"/><button disabled={busy||!note.trim()} onClick={()=>void addNote()} className="nb-btn-orange self-end px-4 py-3 font-mono text-[9px] font-black uppercase">Add note</button></div><div className="mt-6 border-l-[3px] border-[#111] pl-5">{activities.length?activities.map((activity)=><div key={text(activity,'id')} className="relative mb-5 border-2 border-[#111] bg-[#FAFAF9] p-4 before:absolute before:-left-[29px] before:top-4 before:h-3 before:w-3 before:border-2 before:border-[#111] before:bg-[#ff5f1f]"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-mono text-[9px] font-black uppercase text-[#ff5f1f]">{text(activity,'activity_type')}</div><div className="text-[10px] text-[#777]">{dateTime(activity.occurred_at)}</div></div>{activity.subject?<div className="mt-2 font-extrabold">{String(activity.subject)}</div>:null}{activity.body?<p className="mt-2 whitespace-pre-wrap text-[13px] leading-6">{String(activity.body)}</p>:null}</div>):<div className="text-[12px] font-semibold text-[#777]">No activity yet.</div>}</div></div> : null}
      </div>
    </div>
  )
}

function Details({ kind, record }: { kind: Kind; record: Row }) {
  if (kind === 'customers') {
    const people = Array.isArray(record.people) ? record.people as Row[] : []
    const opps = Array.isArray(record.opportunities) ? record.opportunities as Row[] : []
    const orders = Array.isArray(record.orders) ? record.orders as Row[] : []
    return <div><h2 className="text-[22px] font-extrabold">Entity overview</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{[['People',people.length],['Opportunities',opps.length],['Orders',orders.length]].map(([label,value])=><div key={String(label)} className="border-2 border-[#111] bg-[#FAFAF9] p-4 shadow-[3px_3px_0_#111]"><div className="font-mono text-[9px] font-black uppercase text-[#777]">{label}</div><div className="mt-2 text-[28px] font-extrabold">{value}</div></div>)}</div>{record.notes?<p className="mt-6 whitespace-pre-wrap border-t-2 border-[#111] pt-5 text-[13px] leading-6">{String(record.notes)}</p>:null}</div>
  }
  if (kind === 'opportunities') {
    const orders = Array.isArray(record.orders) ? record.orders as Row[] : []
    return <div><h2 className="text-[22px] font-extrabold">Opportunity overview</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><LabelValue label="Customer">{text(record,'customer_name')}</LabelValue><LabelValue label="Value">{money(record.estimated_value_cents)}</LabelValue><LabelValue label="Stage">{text(record,'stage')}</LabelValue><LabelValue label="Expected close">{dateTime(record.expected_close_date)}</LabelValue></div><div className="mt-7 border-t-2 border-[#111] pt-5"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Orders created from opportunity</div><div className="mt-2 text-[28px] font-extrabold">{orders.length}</div></div></div>
  }
  if (kind === 'orders') {
    const items = Array.isArray(record.items) ? record.items as Row[] : []
    const entitlements = Array.isArray(record.entitlements) ? record.entitlements as Row[] : []
    return <div><h2 className="text-[22px] font-extrabold">Order overview</h2><div className="mt-5 grid gap-4">{items.map((item)=><div key={text(item,'id')} className="flex items-center justify-between gap-4 border-2 border-[#111] bg-[#FAFAF9] p-4"><div><div className="font-extrabold">{text(item,'name')}</div><div className="mt-1 font-mono text-[9px] text-[#777]">{text(item,'sku')} × {text(item,'quantity')}</div></div><div className="font-mono text-[12px] font-black">{money(item.extended_price_cents)}</div></div>)}</div><div className="mt-7 border-t-2 border-[#111] pt-5"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Entitlements</div><div className="mt-3 grid gap-2">{entitlements.length?entitlements.map((ent)=><div key={text(ent,'id')} className="flex items-center justify-between border-2 border-[#111] p-3"><span className="font-mono text-[10px]">{text(ent,'sku')}</span><Status value={ent.status}/></div>):<span className="text-[12px] text-[#777]">No entitlement issued yet.</span>}</div></div></div>
  }
  const links = Array.isArray(record.links) ? record.links as Row[] : []
  return <div><h2 className="text-[22px] font-extrabold">Person overview</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><LabelValue label="Lead stage">{text(record,'lead_stage')}</LabelValue><LabelValue label="Relationship">{text(record,'relationship_type')}</LabelValue><LabelValue label="Last contacted">{dateTime(record.last_contacted_at)}</LabelValue><LabelValue label="Next follow-up">{dateTime(record.next_follow_up_at)}</LabelValue></div>{record.notes?<p className="mt-6 whitespace-pre-wrap border-t-2 border-[#111] pt-5 text-[13px] leading-6">{String(record.notes)}</p>:null}<div className="mt-7 border-t-2 border-[#111] pt-5"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Linked records</div><div className="mt-2 text-[28px] font-extrabold">{links.length}</div></div></div>
}
