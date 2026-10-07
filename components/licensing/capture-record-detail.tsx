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
  Mail,
  Network,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Target,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CrmAvatar } from './crm-avatar'
import { CrmCombobox } from './crm-combobox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { LICENSE_CONTROL_PLANE_ORIGIN, licenseFetch } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Kind = 'entity' | 'vehicle' | 'pursuit'
type Collection = { items: Row[] }
type Tab = 'overview' | 'people' | 'entities' | 'pursuits' | 'vehicles' | 'submissions' | 'outreach' | 'documents' | 'references'

function text(row: Row | null | undefined, ...keys: string[]): string {
  if (!row) return '—'
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return '—'
}

function money(cents: unknown) {
  const value = Number(cents)
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value/100)
}

function dateValue(value: unknown) {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(parsed)
}

function Status({ value }: { value: unknown }) {
  const normalized=String(value??'').toLowerCase()
  const bg=['won','submitted','ready','active','replied','completed'].includes(normalized)?'bg-[#d9f99d]':['lost','no_bid','archived','inactive','rejected','cancelled'].includes(normalized)?'bg-[#fecaca]':'bg-[#fff0a6]'
  return <span className={bg+' inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.08em]'}>{String(value??'unknown').replaceAll('_',' ')}</span>
}

function LabelValue({label,children}:{label:string;children:React.ReactNode}) {
  return <div><div className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#777]">{label}</div><div className="mt-1 text-[13px] font-semibold leading-5">{children}</div></div>
}

function array(row: Row | null, key: string): Row[] {
  const value=row?.[key]
  return Array.isArray(value)?value as Row[]:[]
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center border-[3px] border-dashed border-[#111] bg-[#FAFAF9] px-6 py-10 text-center">
    <div className="flex h-14 w-14 items-center justify-center border-[3px] border-[#111] bg-[#fff1e9] shadow-[4px_4px_0_#111]"><Icon className="h-6 w-6"/></div>
    <div className="mt-5 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#ff5f1f]">Nothing here yet</div>
    <div className="mt-2 text-[18px] font-extrabold">{title}</div>
    <p className="mt-2 max-w-md text-[12px] leading-5 text-[#666]">{description}</p>
  </div>
}

export function CaptureRecordDetail({kind,id}:{kind:Kind;id:string}) {
  const [record,setRecord]=useState<Row|null>(null)
  const [allEntities,setAllEntities]=useState<Row[]>([])
  const [allPeople,setAllPeople]=useState<Row[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [deleteOpen,setDeleteOpen]=useState(false)
  const [editOpen,setEditOpen]=useState(false)
  const [tab,setTab]=useState<Tab>('overview')

  const [entityLink,setEntityLink]=useState({organizationId:'',role:kind==='vehicle'?'prime_holder':'prime',notes:''})
  const [personLink,setPersonLink]=useState({personId:'',role:'stakeholder',notes:''})
  const [submissionOpen,setSubmissionOpen]=useState(false)
  const [submissionForm,setSubmissionForm]=useState({name:'',submissionType:'capability_statement',status:'planned',dueAt:'',deliveryMethod:'email',destination:'',notes:''})
  const [engagementForm,setEngagementForm]=useState({channel:'linkedin',direction:'outbound',status:'completed',organizationId:'',personId:'',subject:'',body:'',outcome:'',followUpAt:''})
  const [referenceForm,setReferenceForm]=useState({referenceType:'sam_notice',identifier:'',url:'',label:''})
  const [entityEdit,setEntityEdit]=useState({entityKind:'other',legalName:'',displayName:'',uei:'',cageCode:'',domain:'',parentEntityId:'',websiteUrl:'',linkedinUrl:'',logoUrl:'',trackingStatus:'active',summary:''})
  const [documentTarget,setDocumentTarget]=useState<{resourceType:Kind|'submission';resourceId:string;direction:string;documentType:string;status:string;description:string}>({resourceType:kind,resourceId:id,direction:'reference',documentType:'other',status:'reference',description:''})

  const endpoint=kind==='entity'?'/api/v2/capture/entities/'+encodeURIComponent(id):kind==='vehicle'?'/api/v2/capture/vehicles/'+encodeURIComponent(id):'/api/v2/capture/pursuits/'+encodeURIComponent(id)

  const load=useCallback(async()=>{
    setLoading(true)
    try {
      const [detail,entities,people]=await Promise.all([
        licenseFetch<Row>(endpoint),
        licenseFetch<Collection>('/api/v2/capture/entities'),
        licenseFetch<Collection>('/api/v2/crm/people?limit=500'),
      ])
      setRecord(detail)
      if(kind==='entity') setEntityEdit({
        entityKind:String(detail.entity_kind??'other'),
        legalName:String(detail.legal_name??''),
        displayName:String(detail.display_name??''),
        uei:String(detail.uei??''),
        cageCode:String(detail.cage_code??''),
        domain:String(detail.domain??''),
        parentEntityId:String(detail.parent_organization_id??''),
        websiteUrl:String(detail.website_url??''),
        linkedinUrl:String(detail.linkedin_url??''),
        logoUrl:String(detail.custom_logo_url??''),
        trackingStatus:String(detail.tracking_status??detail.status??'active'),
        summary:String(detail.summary??''),
      })
      setAllEntities(entities.items)
      setAllPeople(people.items)
      if(kind==='entity') setEngagementForm((value)=>({...value,organizationId:id}))
      if(kind==='vehicle') setDocumentTarget((value)=>({...value,resourceType:'vehicle',resourceId:id}))
      if(kind==='pursuit') setDocumentTarget((value)=>({...value,resourceType:'pursuit',resourceId:id}))
    } catch(error) {
      toast.error(error instanceof Error?error.message:'Unable to load record.')
    } finally { setLoading(false) }
  },[endpoint,id,kind])

  useEffect(()=>{void load()},[load])

  const tabs=useMemo<Tab[]>(()=>{
    if(kind==='entity') return ['overview','people','pursuits','vehicles','outreach','documents','references']
    if(kind==='vehicle') return ['overview','entities','pursuits','outreach','documents','references']
    return ['overview','entities','people','submissions','outreach','documents','references']
  },[kind])

  const title=kind==='entity'?text(record,'display_name','legal_name'):kind==='vehicle'?text(record,'vehicle_name'):text(record,'title')
  const people=array(record,'people')
  const entities=array(record,'entities')
  const pursuits=array(record,'pursuits')
  const vehicles=array(record,'vehicles')
  const submissions=array(record,'submissions')
  const documents=array(record,'documents')
  const engagements=array(record,'engagements')
  const references=array(record,'references')

  const addEntity=async()=>{
    if(!entityLink.organizationId)return
    setBusy(true)
    try {
      const path=kind==='vehicle'?'/api/v2/capture/vehicles/'+encodeURIComponent(id)+'/entities':'/api/v2/capture/pursuits/'+encodeURIComponent(id)+'/entities'
      await licenseFetch(path,{method:'POST',body:JSON.stringify({...entityLink,isPrimary:false,notes:entityLink.notes||null})})
      setEntityLink({organizationId:'',role:kind==='vehicle'?'prime_holder':'prime',notes:''}); toast.success('Entity linked.'); await load()
    } catch(error){toast.error(error instanceof Error?error.message:'Unable to link entity.')} finally{setBusy(false)}
  }

  const addPerson=async()=>{
    if(kind!=='pursuit'||!personLink.personId)return
    setBusy(true)
    try {
      await licenseFetch('/api/v2/capture/pursuits/'+encodeURIComponent(id)+'/people',{method:'POST',body:JSON.stringify({...personLink,isPrimary:false,notes:personLink.notes||null})})
      setPersonLink({personId:'',role:'stakeholder',notes:''});toast.success('Person linked.');await load()
    }catch(error){toast.error(error instanceof Error?error.message:'Unable to link person.')}finally{setBusy(false)}
  }

  const createSubmission=async(event:React.FormEvent)=>{
    event.preventDefault()
    setBusy(true)
    try {
      await licenseFetch('/api/v2/capture/pursuits/'+encodeURIComponent(id)+'/submissions',{method:'POST',body:JSON.stringify({...submissionForm,dueAt:submissionForm.dueAt||null,destination:submissionForm.destination||null,notes:submissionForm.notes||null})})
      setSubmissionOpen(false);setSubmissionForm({name:'',submissionType:'capability_statement',status:'planned',dueAt:'',deliveryMethod:'email',destination:'',notes:''});toast.success('Submission package created.');await load()
    }catch(error){toast.error(error instanceof Error?error.message:'Unable to create submission package.')}finally{setBusy(false)}
  }

  const addEngagement=async()=>{
    if(!engagementForm.body.trim()&&!engagementForm.subject.trim())return
    setBusy(true)
    try{
      await licenseFetch('/api/v2/capture/engagements',{method:'POST',body:JSON.stringify({
        ...engagementForm,
        organizationId:engagementForm.organizationId|| (kind==='entity'?id:null),
        pursuitId:kind==='pursuit'?id:null,
        vehicleId:kind==='vehicle'?id:null,
        personId:engagementForm.personId||null,
        followUpAt:engagementForm.followUpAt||null,
        subject:engagementForm.subject||null,
        body:engagementForm.body||null,
        outcome:engagementForm.outcome||null,
      })})
      setEngagementForm((value)=>({...value,subject:'',body:'',outcome:'',followUpAt:''}));toast.success('Engagement logged.');await load()
    }catch(error){toast.error(error instanceof Error?error.message:'Unable to log engagement.')}finally{setBusy(false)}
  }

  const addReference=async()=>{
    if(!referenceForm.identifier.trim())return
    setBusy(true)
    try{
      await licenseFetch('/api/v2/capture/references',{method:'POST',body:JSON.stringify({resourceType:kind,resourceId:id,...referenceForm,url:referenceForm.url||null,label:referenceForm.label||null})})
      setReferenceForm({referenceType:'sam_notice',identifier:'',url:'',label:''});toast.success('Reference attached.');await load()
    }catch(error){toast.error(error instanceof Error?error.message:'Unable to add reference.')}finally{setBusy(false)}
  }

  const updateEntity=async(event:React.FormEvent)=>{
    event.preventDefault()
    if(kind!=='entity')return
    setBusy(true)
    try{
      await licenseFetch(endpoint,{method:'PUT',body:JSON.stringify({
        ...entityEdit,
        displayName:entityEdit.displayName||null,
        uei:entityEdit.uei||null,
        cageCode:entityEdit.cageCode||null,
        domain:entityEdit.domain||null,
        parentEntityId:entityEdit.parentEntityId||null,
        websiteUrl:entityEdit.websiteUrl||null,
        linkedinUrl:entityEdit.linkedinUrl||null,
        logoUrl:entityEdit.logoUrl||null,
        summary:entityEdit.summary||null,
        tags:Array.isArray(record?.tags)?record.tags:[],
        naics:Array.isArray(record?.naics)?record.naics:[],
        psc:Array.isArray(record?.psc)?record.psc:[],
        smallBusinessPrograms:Array.isArray(record?.smallBusinessPrograms)?record.smallBusinessPrograms:[],
      })})
      setEditOpen(false)
      toast.success('Entity updated.')
      await load()
    }catch(error){
      toast.error(error instanceof Error?error.message:'Unable to update entity.')
    }finally{setBusy(false)}
  }

  const deleteRecord=async()=>{
    setBusy(true)
    try{
      await licenseFetch(endpoint,{method:'DELETE'})
      toast.success(kind.charAt(0).toUpperCase()+kind.slice(1)+' deleted.')
      window.location.assign('/licensing')
    }catch(error){
      toast.error(error instanceof Error?error.message:'Unable to delete record.')
      setBusy(false)
      setDeleteOpen(false)
    }
  }

  const uploadDocument=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0]
    if(!file)return
    setBusy(true)
    try{
      const form=new FormData()
      form.set('file',file)
      form.set('resourceType',documentTarget.resourceType)
      form.set('resourceId',documentTarget.resourceId)
      form.set('direction',documentTarget.direction)
      form.set('documentType',documentTarget.documentType)
      form.set('status',documentTarget.status)
      form.set('description',documentTarget.description)
      await licenseFetch('/api/v2/capture/documents',{method:'POST',body:form})
      event.target.value='';toast.success('Document added.');await load()
    }catch(error){toast.error(error instanceof Error?error.message:'Unable to upload document.')}finally{setBusy(false)}
  }

  if(loading&&!record)return <div className="flex min-h-[520px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-6 py-4 font-mono text-[10px] font-black uppercase"><Loader2 className="h-4 w-4 animate-spin"/>Loading record</div></div>
  if(!record)return <div className="nb-panel p-8">Record not found.</div>

  const summary=<Summary kind={kind} record={record}/>

  return <div className="mx-auto max-w-[1500px]">
    <div className="mb-6 flex flex-col gap-4 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4"><Link href="/licensing" className="nb-btn-white inline-flex h-10 w-10 items-center justify-center p-0"><ArrowLeft className="h-4 w-4"/></Link><div><div className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#ff5f1f]">{kind}</div><h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.04em]">{title}</h1><div className="mt-2"><Status value={record.stage??record.status??record.tracking_status}/></div></div></div>
      <div className="flex flex-wrap items-center gap-3">{kind==='entity'?<Dialog open={editOpen} onOpenChange={setEditOpen}><DialogTrigger asChild><button type="button" className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><Pencil className="h-3.5 w-3.5"/>Edit entity</button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-[3px] border-[#111] p-0 sm:max-w-4xl"><DialogHeader className="border-b-[3px] border-[#111] bg-[#fff1e9] p-6"><DialogTitle>Edit entity</DialogTitle><DialogDescription>Update the entity identity, hierarchy, links, and logo. Custom logos override the automatic Logo.dev result.</DialogDescription></DialogHeader><form onSubmit={updateEntity}><div className="grid gap-x-6 gap-y-5 p-7 md:grid-cols-2"><label><span className="text-[11px] font-bold">Entity type</span><CrmCombobox className="mt-1.5" value={entityEdit.entityKind} onValueChange={(value)=>setEntityEdit({...entityEdit,entityKind:value})} options={['federal_agency','office','program','contracting_office','prime','integrator','reseller','distributor','commercial','university','state_local','nonprofit','partner','other'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search entity types…"/></label><label><span className="text-[11px] font-bold">Tracking status</span><CrmCombobox className="mt-1.5" value={entityEdit.trackingStatus} onValueChange={(value)=>setEntityEdit({...entityEdit,trackingStatus:value})} options={['active','watching','inactive','archived'].map((value)=>({value,label:value}))}/></label><label><span className="text-[11px] font-bold">Legal name</span><input required className="nb-input mt-1.5 w-full" value={entityEdit.legalName} onChange={(e)=>setEntityEdit({...entityEdit,legalName:e.target.value})}/></label><label><span className="text-[11px] font-bold">Display name</span><input className="nb-input mt-1.5 w-full" value={entityEdit.displayName} onChange={(e)=>setEntityEdit({...entityEdit,displayName:e.target.value})}/></label><label><span className="text-[11px] font-bold">Parent entity</span><CrmCombobox className="mt-1.5" value={entityEdit.parentEntityId} onValueChange={(value)=>setEntityEdit({...entityEdit,parentEntityId:value})} options={[{value:'',label:'None'},...allEntities.filter((entity)=>text(entity,'id')!==id).map((entity)=>({value:text(entity,'id'),label:text(entity,'display_name','legal_name')}))]} searchPlaceholder="Search parent entities…"/></label><label><span className="text-[11px] font-bold">Domain</span><input className="nb-input mt-1.5 w-full" value={entityEdit.domain} onChange={(e)=>setEntityEdit({...entityEdit,domain:e.target.value})}/></label><label><span className="text-[11px] font-bold">UEI</span><input className="nb-input mt-1.5 w-full font-mono" value={entityEdit.uei} onChange={(e)=>setEntityEdit({...entityEdit,uei:e.target.value})}/></label><label><span className="text-[11px] font-bold">CAGE</span><input className="nb-input mt-1.5 w-full font-mono" value={entityEdit.cageCode} onChange={(e)=>setEntityEdit({...entityEdit,cageCode:e.target.value})}/></label><label><span className="text-[11px] font-bold">Website</span><input type="url" className="nb-input mt-1.5 w-full" value={entityEdit.websiteUrl} onChange={(e)=>setEntityEdit({...entityEdit,websiteUrl:e.target.value})}/></label><label><span className="text-[11px] font-bold">LinkedIn</span><input type="url" className="nb-input mt-1.5 w-full" value={entityEdit.linkedinUrl} onChange={(e)=>setEntityEdit({...entityEdit,linkedinUrl:e.target.value})}/></label><label className="md:col-span-2"><span className="text-[11px] font-bold">Custom logo URL</span><div className="mt-1.5 grid gap-3 sm:grid-cols-[1fr_auto]"><input type="url" className="nb-input w-full" value={entityEdit.logoUrl} onChange={(e)=>setEntityEdit({...entityEdit,logoUrl:e.target.value})} placeholder="https://…/logo.png"/>{(entityEdit.logoUrl||record.logo_url)?<img src={entityEdit.logoUrl||String(record.logo_url)} alt="" className="h-12 w-12 border-2 border-[#111] bg-white object-contain p-1 shadow-[2px_2px_0_#111]"/>:null}</div><span className="mt-2 block text-[10px] leading-4 text-[#666]">Leave blank to use the automatic domain-based Logo.dev image. Entering a URL overwrites any existing custom logo.</span></label><label className="md:col-span-2"><span className="text-[11px] font-bold">Summary</span><textarea className="nb-input mt-1.5 min-h-28 w-full" value={entityEdit.summary} onChange={(e)=>setEntityEdit({...entityEdit,summary:e.target.value})}/></label></div><DialogFooter className="border-t-[3px] border-[#111] p-5"><button type="button" onClick={()=>setEditOpen(false)} className="nb-btn-white px-5 py-2.5 font-mono text-[9px] font-black uppercase">Cancel</button><button disabled={busy} className="nb-btn-orange px-5 py-2.5 font-mono text-[9px] font-black uppercase disabled:opacity-50">{busy?'Saving…':'Save changes'}</button></DialogFooter></form></DialogContent></Dialog>:null}<button onClick={()=>void load()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><RefreshCw className={loading?'h-3.5 w-3.5 animate-spin':'h-3.5 w-3.5'}/>Refresh</button><AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogTrigger asChild><button type="button" disabled={busy} className="inline-flex items-center gap-2 border-[3px] border-[#111] bg-[#fee2e2] px-4 py-2.5 font-mono text-[9px] font-black uppercase shadow-[3px_3px_0_#111] disabled:opacity-50"><Trash2 className="h-3.5 w-3.5"/>Delete</button></AlertDialogTrigger><AlertDialogContent className="rounded-none border-[3px] border-[#111] bg-white p-0 shadow-[7px_7px_0_#111]"><AlertDialogHeader className="border-b-[3px] border-[#111] bg-[#fee2e2] p-6"><AlertDialogTitle>Delete {kind}?</AlertDialogTitle><AlertDialogDescription>This permanently deletes <strong>{title}</strong> and removes CRM links owned by this record. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="p-5"><AlertDialogCancel disabled={busy} className="nb-btn-white rounded-none">Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event)=>{event.preventDefault();void deleteRecord()}} className="rounded-none border-[3px] border-[#111] bg-[#ef4444] px-5 py-2.5 font-mono text-[9px] font-black uppercase text-white shadow-[3px_3px_0_#111] hover:bg-[#dc2626]">{busy?'Deleting…':'Delete permanently'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
    </div>

    <div className="hidden h-[720px] min-h-0 overflow-hidden border-[3px] border-[#111] bg-white shadow-[7px_7px_0_#111] lg:block xl:h-[calc(100dvh-12rem)] xl:min-h-[720px] xl:max-h-[980px]">
      <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
        <ResizablePanel defaultSize={31} minSize={24} className="min-h-0 min-w-0"><div className="h-full min-h-0 overflow-y-auto bg-[#FAFAF9] p-6">{summary}</div></ResizablePanel>
        <ResizableHandle withHandle className="w-[3px] bg-[#111]"/>
        <ResizablePanel defaultSize={69} minSize={42} className="min-h-0 min-w-0 overflow-hidden"><Workspace/></ResizablePanel>
      </ResizablePanelGroup>
    </div>
    <div className="space-y-5 lg:hidden"><section className="nb-panel p-5">{summary}</section><section className="nb-panel overflow-hidden"><Workspace/></section></div>
  </div>

  function Workspace(){
    return <div className="h-full min-h-0 overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex overflow-x-auto border-b-[3px] border-[#111] bg-[#111] p-2">{tabs.map((value)=><button key={value} onClick={()=>setTab(value)} className={'border-2 px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.1em] '+(tab===value?'border-[#111] bg-[#ff5f1f]':'border-white/40 bg-white')}>{value}</button>)}</div>
      <div className="p-5 lg:p-7">
        {tab==='overview'?<Overview kind={kind} record={record as Row}/>:null}

        {tab==='people'?<div><div className="flex items-center gap-2"><Users className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">People</h2></div>{people.length?<div className="mt-5 grid gap-3">{people.map((person)=><Link key={text(person,'id')} href={'/licensing/people/'+encodeURIComponent(text(person,'id'))} className="flex items-center gap-3 border-2 border-[#111] bg-[#FAFAF9] p-3"><CrmAvatar firstName={text(person,'first_name')} lastName={text(person,'last_name')} avatarUrl={person.avatar_url?String(person.avatar_url):null} linkedinUrl={person.linkedin_url?String(person.linkedin_url):null}/><div><div className="font-extrabold">{text(person,'first_name')} {text(person,'last_name')}</div><div className="text-[11px] text-[#777]">{text(person,'title')} · {text(person,'role')}</div></div></Link>)}</div>:<EmptyState icon={Users} title="No people linked" description={kind==='pursuit'?'Attach a stakeholder below to connect people to this pursuit.':'People associated with this entity will appear here.'}/>} {kind==='pursuit'?<div className="mt-6 grid gap-3 border-t-2 border-[#111] pt-5 md:grid-cols-[1fr_180px_auto]"><CrmCombobox value={personLink.personId} onValueChange={(value)=>setPersonLink({...personLink,personId:value})} options={allPeople.map((person)=>({value:text(person,'id'),label:text(person,'first_name')+' '+text(person,'last_name')+' — '+text(person,'organization_name')}))} placeholder="Select person…" searchPlaceholder="Search people…"/><input className="nb-input" value={personLink.role} onChange={(e)=>setPersonLink({...personLink,role:e.target.value})} placeholder="Role"/><button disabled={busy||!personLink.personId} onClick={()=>void addPerson()} className="nb-btn-orange px-4 py-2.5 font-mono text-[9px] font-black uppercase"><UserPlus className="mr-2 inline h-3.5 w-3.5"/>Attach</button></div>:null}</div>:null}

        {tab==='entities'?<div><div className="flex items-center gap-2"><Building2 className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Entities & roles</h2></div><p className="mt-2 text-[12px] text-[#666]">The same organization can be buyer, agency, prime, teammate, incumbent, reseller, distributor, sponsor, or another role depending on this record.</p>{entities.length?<div className="mt-5 grid gap-3">{entities.map((entity)=><Link key={text(entity,'id')+text(entity,'role')} href={'/licensing/entities/'+encodeURIComponent(text(entity,'id'))} className="border-2 border-[#111] bg-[#FAFAF9] p-4"><div className="font-extrabold">{text(entity,'display_name','legal_name')}</div><div className="mt-1 font-mono text-[9px] font-black uppercase text-[#ff5f1f]">{text(entity,'role')}</div></Link>)}</div>:<EmptyState icon={Building2} title="No entities linked" description="Attach an organization below to define its role on this record."/>} {kind!=='entity'?<div className="mt-6 grid gap-3 border-t-2 border-[#111] pt-5 md:grid-cols-[1fr_180px_auto]"><CrmCombobox value={entityLink.organizationId} onValueChange={(value)=>setEntityLink({...entityLink,organizationId:value})} options={allEntities.map((entity)=>({value:text(entity,'id'),label:text(entity,'display_name','legal_name')}))} placeholder="Select entity…" searchPlaceholder="Search entities…"/><input className="nb-input" value={entityLink.role} onChange={(e)=>setEntityLink({...entityLink,role:e.target.value})} placeholder="Role"/><button disabled={busy||!entityLink.organizationId} onClick={()=>void addEntity()} className="nb-btn-orange px-4 py-2.5 font-mono text-[9px] font-black uppercase">Attach entity</button></div>:null}</div>:null}

        {tab==='pursuits'?<div><div className="flex items-center gap-2"><Target className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Pursuits</h2></div>{pursuits.length?<div className="mt-5 grid gap-3">{pursuits.map((p)=><Link key={text(p,'id')} href={'/licensing/pursuits/'+encodeURIComponent(text(p,'id'))} className="border-2 border-[#111] bg-[#FAFAF9] p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-extrabold">{text(p,'title')}</div><div className="mt-1 font-mono text-[9px] uppercase text-[#777]">{text(p,'pursuit_type')}</div></div><Status value={p.stage}/></div></Link>)}</div>:<EmptyState icon={Target} title="No pursuits linked" description="Opportunities connected to this record will appear here once they are added."/>}</div>:null}

        {tab==='vehicles'?<div><div className="flex items-center gap-2"><Network className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Vehicles</h2></div>{vehicles.length?<div className="mt-5 grid gap-3">{vehicles.map((vehicle)=><Link key={text(vehicle,'id')} href={'/licensing/vehicles/'+encodeURIComponent(text(vehicle,'id'))} className="border-2 border-[#111] bg-[#FAFAF9] p-4"><div className="font-extrabold">{text(vehicle,'vehicle_name')}</div><div className="mt-1 font-mono text-[9px] uppercase text-[#777]">{text(vehicle,'vehicle_kind')} · {text(vehicle,'role')}</div></Link>)}</div>:<EmptyState icon={Network} title="No vehicles linked" description="Contract vehicles associated with this record will appear here once they are linked."/>}</div>:null}

        {tab==='submissions'?<div><div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Send className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Submission packages</h2></div><p className="mt-2 text-[12px] text-[#666]">Track what you intend to send, when it is due, and the files that belong to that package.</p></div><Dialog open={submissionOpen} onOpenChange={setSubmissionOpen}><DialogTrigger asChild><button className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><Plus className="h-3.5 w-3.5"/>Add package</button></DialogTrigger><DialogContent className="rounded-none border-[3px] border-[#111] p-0 sm:max-w-2xl"><DialogHeader className="border-b-[3px] border-[#111] bg-[#fff1e9] p-6"><DialogTitle>Create submission package</DialogTitle><DialogDescription>Examples: capability statement, white paper, solution brief, quote, technical volume, full proposal, forms.</DialogDescription></DialogHeader><form onSubmit={createSubmission}><div className="grid gap-x-6 gap-y-5 p-7 md:grid-cols-2"><label><span className="text-[11px] font-bold">Name</span><input required className="nb-input mt-1.5 w-full" value={submissionForm.name} onChange={(e)=>setSubmissionForm({...submissionForm,name:e.target.value})}/></label><label><span className="text-[11px] font-bold">Type</span><CrmCombobox className="mt-1.5" value={submissionForm.submissionType} onValueChange={(value)=>setSubmissionForm({...submissionForm,submissionType:value})} options={['capability_statement','white_paper','solution_brief','quote','technical_volume','cost_volume','full_proposal','forms','email_package','other'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search package types…"/></label><label><span className="text-[11px] font-bold">Status</span><CrmCombobox className="mt-1.5" value={submissionForm.status} onValueChange={(value)=>setSubmissionForm({...submissionForm,status:value})} options={['planned','drafting','review','ready','submitted','accepted','rejected','superseded'].map((value)=>({value,label:value}))} searchPlaceholder="Search statuses…"/></label><label><span className="text-[11px] font-bold">Due</span><input type="date" className="nb-input mt-1.5 w-full" value={submissionForm.dueAt} onChange={(e)=>setSubmissionForm({...submissionForm,dueAt:e.target.value})}/></label><label><span className="text-[11px] font-bold">Delivery</span><input className="nb-input mt-1.5 w-full" value={submissionForm.deliveryMethod} onChange={(e)=>setSubmissionForm({...submissionForm,deliveryMethod:e.target.value})}/></label><label><span className="text-[11px] font-bold">Destination</span><input className="nb-input mt-1.5 w-full" value={submissionForm.destination} onChange={(e)=>setSubmissionForm({...submissionForm,destination:e.target.value})}/></label></div><DialogFooter className="border-t-[3px] border-[#111] p-4"><button className="nb-btn-orange px-5 py-2.5 font-mono text-[9px] font-black uppercase">Create package</button></DialogFooter></form></DialogContent></Dialog></div>{submissions.length?<div className="mt-5 grid gap-3">{submissions.map((sub)=><button key={text(sub,'id')} onClick={()=>setDocumentTarget({...documentTarget,resourceType:'submission',resourceId:text(sub,'id'),direction:'outbound',status:'planned'})} className="text-left border-2 border-[#111] bg-[#FAFAF9] p-4 hover:bg-[#fff1e9]"><div className="flex items-start justify-between gap-3"><div><div className="font-extrabold">{text(sub,'name')}</div><div className="mt-1 font-mono text-[9px] uppercase text-[#777]">{text(sub,'submission_type')} · due {dateValue(sub.due_at)}</div></div><Status value={sub.status}/></div><div className="mt-2 text-[11px] text-[#666]">Click to make this the target for uploaded outbound files.</div></button>)}</div>:<EmptyState icon={Send} title="No submission packages" description="Add the first package to track due dates, delivery details, and the exact files you plan to send."/>}</div>:null}

        {tab==='outreach'?<div><div className="flex items-center gap-2"><Mail className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Outreach & engagement</h2></div><div className="mt-5 grid gap-3 border-2 border-[#111] bg-[#FAFAF9] p-4 md:grid-cols-2"><CrmCombobox value={engagementForm.channel} onValueChange={(value)=>setEngagementForm({...engagementForm,channel:value})} options={['linkedin','email','call','meeting','teams','event','portal','other'].map((value)=>({value,label:value}))} searchPlaceholder="Search channels…"/><CrmCombobox value={engagementForm.personId} onValueChange={(value)=>setEngagementForm({...engagementForm,personId:value})} options={[{value:'',label:'No person'},...allPeople.map((p)=>({value:text(p,'id'),label:text(p,'first_name')+' '+text(p,'last_name')}))]} searchPlaceholder="Search people…"/>{kind!=='entity'?<CrmCombobox value={engagementForm.organizationId} onValueChange={(value)=>setEngagementForm({...engagementForm,organizationId:value})} options={[{value:'',label:'No entity'},...allEntities.map((e)=>({value:text(e,'id'),label:text(e,'display_name','legal_name')}))]} searchPlaceholder="Search entities…"/>:null}<input className="nb-input" value={engagementForm.subject} onChange={(e)=>setEngagementForm({...engagementForm,subject:e.target.value})} placeholder="Subject / purpose"/><textarea className="nb-input min-h-24 md:col-span-2" value={engagementForm.body} onChange={(e)=>setEngagementForm({...engagementForm,body:e.target.value})} placeholder="What happened? Message sent, meeting notes, discussion…"/><input type="datetime-local" className="nb-input" value={engagementForm.followUpAt} onChange={(e)=>setEngagementForm({...engagementForm,followUpAt:e.target.value})}/><button disabled={busy} onClick={()=>void addEngagement()} className="nb-btn-orange px-4 py-2.5 font-mono text-[9px] font-black uppercase">Log engagement</button></div>{engagements.length?<div className="mt-6 border-l-[3px] border-[#111] pl-5">{engagements.map((eng)=><div key={text(eng,'id')} className="relative mb-5 border-2 border-[#111] bg-white p-4 before:absolute before:-left-[29px] before:top-4 before:h-3 before:w-3 before:border-2 before:border-[#111] before:bg-[#ff5f1f]"><div className="flex items-center justify-between gap-3"><div className="font-mono text-[9px] font-black uppercase text-[#ff5f1f]">{text(eng,'channel')} · {text(eng,'direction')}</div><div className="text-[10px] text-[#777]">{dateValue(eng.occurred_at)}</div></div><div className="mt-2 font-extrabold">{text(eng,'subject')}</div>{eng.body?<p className="mt-2 whitespace-pre-wrap text-[13px] leading-6">{String(eng.body)}</p>:null}{eng.follow_up_at?<div className="mt-3 font-mono text-[9px] font-black uppercase">Follow up {dateValue(eng.follow_up_at)}</div>:null}</div>)}</div>:<EmptyState icon={Mail} title="No engagement history" description="Log an email, LinkedIn message, call, meeting, or other touchpoint above to start the timeline."/>}</div>:null}

        {tab==='documents'?<div><div className="flex items-center gap-2"><Paperclip className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">Documents</h2></div><p className="mt-2 text-[12px] text-[#666]">Reference material and outbound artifacts are separate. On a pursuit, choose a submission package to track the exact files you plan to send.</p><div className="mt-5 grid gap-3 border-2 border-[#111] bg-[#FAFAF9] p-4 md:grid-cols-2"><label><span className="text-[10px] font-bold">Target</span><CrmCombobox className="mt-1.5" value={documentTarget.resourceType+':'+documentTarget.resourceId} onValueChange={(value)=>{const [resourceType,resourceId]=value.split(':');setDocumentTarget({...documentTarget,resourceType:resourceType as Kind|'submission',resourceId,direction:resourceType==='submission'?'outbound':'reference',status:resourceType==='submission'?'planned':'reference'})}} options={[{value:kind+':'+id,label:kind+' record'},...(kind==='pursuit'?submissions.map((item)=>({value:'submission:'+text(item,'id'),label:'Package: '+text(item,'name')})):[])]} searchPlaceholder="Search targets…"/></label><label><span className="text-[10px] font-bold">Document type</span><CrmCombobox className="mt-1.5" value={documentTarget.documentType} onValueChange={(value)=>setDocumentTarget({...documentTarget,documentType:value})} options={['capability_statement','white_paper','solution_brief','quote','proposal','technical_volume','cost_volume','form','contract','reference','other'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search document types…"/></label><label><span className="text-[10px] font-bold">Direction</span><CrmCombobox className="mt-1.5" value={documentTarget.direction} onValueChange={(value)=>setDocumentTarget({...documentTarget,direction:value})} options={['reference','outbound','inbound'].map((value)=>({value,label:value}))}/></label><label><span className="text-[10px] font-bold">Status</span><CrmCombobox className="mt-1.5" value={documentTarget.status} onValueChange={(value)=>setDocumentTarget({...documentTarget,status:value})} options={['reference','planned','draft','review','final','sent','received','superseded'].map((value)=>({value,label:value}))}/></label><label className="md:col-span-2 flex cursor-pointer items-center justify-center gap-2 border-[3px] border-dashed border-[#111] bg-[#fff1e9] p-6 font-mono text-[10px] font-black uppercase"><Paperclip className="h-4 w-4"/>{busy?'Working…':'Choose file · max 25 MB'}<input type="file" className="sr-only" disabled={busy} onChange={uploadDocument}/></label></div>{documents.length?<div className="mt-5 grid gap-3">{documents.map((doc)=><Attachment key={text(doc,'id')} state="done"><AttachmentMedia><FileText className="h-5 w-5"/></AttachmentMedia><AttachmentContent><AttachmentTitle>{text(doc,'file_name')}</AttachmentTitle><AttachmentDescription>{text(doc,'document_type')} · {text(doc,'direction')} · {text(doc,'status')} · {doc.resource_type==='submission'?'submission package':text(doc,'resource_type')}</AttachmentDescription></AttachmentContent><AttachmentActions><AttachmentAction onClick={()=>window.open(LICENSE_CONTROL_PLANE_ORIGIN+'/api/v2/capture/documents/'+encodeURIComponent(text(doc,'id'))+'/download','_blank')}><Download className="h-3.5 w-3.5"/></AttachmentAction></AttachmentActions></Attachment>)}</div>:<EmptyState icon={Paperclip} title="No documents attached" description="Choose a file above to add reference material or outbound artifacts to this record."/>}</div>:null}

        {tab==='references'?<div><div className="flex items-center gap-2"><Link2 className="h-5 w-5"/><h2 className="text-[22px] font-extrabold">External references</h2></div>{references.length?<div className="mt-5 grid gap-3">{references.map((ref)=><div key={text(ref,'id')} className="border-2 border-[#111] bg-[#FAFAF9] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#ff5f1f]">{text(ref,'reference_type')}</div><div className="mt-1 font-mono text-[12px] font-black">{text(ref,'identifier')}</div>{ref.url?<a href={String(ref.url)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold underline">Open source <ExternalLink className="h-3 w-3"/></a>:null}</div>)}</div>:<EmptyState icon={Link2} title="No external references" description="Attach a solicitation, SAM notice, contract, vehicle, or other source identifier below."/>}<div className="mt-6 grid gap-3 border-t-2 border-[#111] pt-5 md:grid-cols-2"><CrmCombobox value={referenceForm.referenceType} onValueChange={(value)=>setReferenceForm({...referenceForm,referenceType:value})} options={['sam_notice','sam_award','solicitation','prime_contract','subcontract','task_order','vehicle','uei','cage','other'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search reference types…"/><input className="nb-input font-mono" value={referenceForm.identifier} onChange={(e)=>setReferenceForm({...referenceForm,identifier:e.target.value})} placeholder="Identifier"/><input type="url" className="nb-input" value={referenceForm.url} onChange={(e)=>setReferenceForm({...referenceForm,url:e.target.value})} placeholder="Source URL"/><button disabled={busy||!referenceForm.identifier.trim()} onClick={()=>void addReference()} className="nb-btn-orange px-4 py-2.5 font-mono text-[9px] font-black uppercase">Attach reference</button></div></div>:null}
      </div>
    </div>
  }
}

function Summary({kind,record}:{kind:Kind;record:Row}) {
  if(kind==='entity') return <div><div className="flex items-center gap-4">{record.logo_url?<img src={String(record.logo_url)} alt="" className="h-16 w-16 border-[3px] border-[#111] bg-white object-contain p-2 shadow-[4px_4px_0_#111]"/>:<div className="flex h-16 w-16 items-center justify-center border-[3px] border-[#111] bg-[#ffd7c7] shadow-[4px_4px_0_#111]"><Building2 className="h-8 w-8"/></div>}<div><div className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#777]">{text(record,'entity_kind').replaceAll('_',' ')}</div><div className="mt-1 text-[21px] font-extrabold">{text(record,'display_name','legal_name')}</div></div></div><div className="mt-7 grid gap-5"><LabelValue label="Type">{text(record,'entity_kind').replaceAll('_',' ')}</LabelValue><LabelValue label="UEI">{text(record,'uei')}</LabelValue><LabelValue label="CAGE">{text(record,'cage_code')}</LabelValue><LabelValue label="Parent">{text(record,'parent_name')}</LabelValue><LabelValue label="Domain">{text(record,'domain')}</LabelValue></div></div>
  if(kind==='vehicle') return <div><Network className="h-9 w-9"/><div className="mt-4 text-[21px] font-extrabold">{text(record,'vehicle_name')}</div><div className="mt-7 grid gap-5"><LabelValue label="Kind">{text(record,'vehicle_kind').replaceAll('_',' ')}</LabelValue><LabelValue label="Number">{text(record,'vehicle_number')}</LabelValue><LabelValue label="Owner / sponsor">{text(record,'owner_name')}</LabelValue><LabelValue label="Managing entity">{text(record,'managing_name')}</LabelValue><LabelValue label="End">{dateValue(record.end_date)}</LabelValue></div></div>
  return <div><Target className="h-9 w-9"/><div className="mt-4 text-[21px] font-extrabold">{text(record,'title')}</div><div className="mt-7 grid gap-5"><LabelValue label="Motion">{text(record,'pursuit_type').replaceAll('_',' ')}</LabelValue><LabelValue label="Primary entity">{text(record,'target_entity_name')}</LabelValue><LabelValue label="Vehicle">{text(record,'vehicle_name')}</LabelValue><LabelValue label="Identifier">{text(record,'identifier')}</LabelValue><LabelValue label="Due">{dateValue(record.due_at)}</LabelValue><LabelValue label="Value">{money(record.estimated_value_cents)}</LabelValue><LabelValue label="Next action">{text(record,'next_action')}</LabelValue></div></div>
}

function Overview({kind,record}:{kind:Kind;record:Row}) {
  if(kind==='entity') return <div><h2 className="text-[22px] font-extrabold">Entity overview</h2><p className="mt-3 text-[13px] leading-6 text-[#666]">{text(record,'summary')}</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{[['People',array(record,'people').length],['Pursuits',array(record,'pursuits').length],['Vehicles',array(record,'vehicles').length]].map(([label,value])=><div key={String(label)} className="border-2 border-[#111] bg-[#FAFAF9] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">{label}</div><div className="mt-2 text-[28px] font-extrabold">{value}</div></div>)}</div></div>
  if(kind==='vehicle') return <div><h2 className="text-[22px] font-extrabold">Vehicle overview</h2><p className="mt-3 text-[13px] leading-6 text-[#666]">{text(record,'summary')}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="border-2 border-[#111] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Linked entities</div><div className="mt-2 text-[28px] font-extrabold">{array(record,'entities').length}</div></div><div className="border-2 border-[#111] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Pursuits</div><div className="mt-2 text-[28px] font-extrabold">{array(record,'pursuits').length}</div></div></div></div>
  return <div><h2 className="text-[22px] font-extrabold">Pursuit overview</h2><p className="mt-3 text-[13px] leading-6 text-[#666]">{text(record,'summary')}</p><div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="border-2 border-[#111] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Entities</div><div className="mt-2 text-[28px] font-extrabold">{array(record,'entities').length}</div></div><div className="border-2 border-[#111] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">People</div><div className="mt-2 text-[28px] font-extrabold">{array(record,'people').length}</div></div><div className="border-2 border-[#111] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Submission packages</div><div className="mt-2 text-[28px] font-extrabold">{array(record,'submissions').length}</div></div></div></div>
}
