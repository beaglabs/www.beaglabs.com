"use client"

import {
  Activity,
  Building2,
  CheckCircle2,
  FileKey2,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Network,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Target,
  UserPlus,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CrmAvatar } from './crm-avatar'
import { CrmCombobox } from './crm-combobox'
import { CrmDataTable, type CrmColumn } from './crm-data-table'
import { OrganizationLicensePanel } from './organization-license-panel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LicenseControlPlaneError, licenseFetch, licensingCallbackUrl } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Collection = { items: Row[] }
type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type Dashboard = {
  entities: number
  vehicles: number
  activePursuits: number
  pursuitValueCents: number
  dueSoon: number
  followUpsDue: number
  openSubmissions: number
}
type Tab = 'overview' | 'people' | 'entities' | 'pursuits' | 'vehicles' | 'orders' | 'entitlements' | 'licensing' | 'audit' | 'settings'

const tabs: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'people', label: 'People', icon: Users },
  { id: 'entities', label: 'Entities', icon: Building2 },
  { id: 'pursuits', label: 'Pursuits', icon: Target },
  { id: 'vehicles', label: 'Vehicles', icon: Network },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'entitlements', label: 'Entitlements', icon: PackageCheck },
  { id: 'licensing', label: 'Licensing', icon: FileKey2 },
  { id: 'audit', label: 'Audit', icon: Activity },
  { id: 'settings', label: 'Settings', icon: RotateCcw },
]

function text(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return '—'
}

function numberValue(row: Row, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value)) return value
  }
  return 0
}

function money(cents: unknown) {
  const value = Number(cents)
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value / 100)
}

function dateValue(value: unknown) {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}

function statusClass(value: unknown) {
  const normalized = String(value ?? '').toLowerCase()
  if (['active','qualified','booked','fulfilled','won','submitted','ready','replied'].includes(normalized)) return 'bg-[#d9f99d]'
  if (['watching','researching','outreach','shaping','teaming','drafting','review','evaluation','negotiation','planned','normal'].includes(normalized)) return 'bg-[#fff0a6]'
  if (['inactive','lost','no_bid','archived','cancelled','refunded'].includes(normalized)) return 'bg-[#fecaca]'
  return 'bg-white'
}

function Status({ value }: { value: unknown }) {
  return <span className={statusClass(value) + ' inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.08em]'}>{String(value ?? 'unknown').replaceAll('_',' ')}</span>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="min-w-0"><div className="mb-2 block font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#555]">{label}</div>{children}{hint ? <div className="mt-2 text-[11px] font-medium leading-5 text-[#777]">{hint}</div> : null}</div>
}

function PanelTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div><span className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#ff5f1f]">{eyebrow}</span><h2 className="mt-2 text-[25px] font-extrabold tracking-[-0.035em]">{title}</h2>{copy ? <p className="mt-2 max-w-3xl text-[13px] font-medium leading-6 text-[#666]">{copy}</p> : null}</div>
}

export function CaptureConsole() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [dashboard, setDashboard] = useState<Dashboard>({ entities: 0, vehicles: 0, activePursuits: 0, pursuitValueCents: 0, dueSoon: 0, followUpsDue: 0, openSubmissions: 0 })
  const [people, setPeople] = useState<Row[]>([])
  const [entities, setEntities] = useState<Row[]>([])
  const [pursuits, setPursuits] = useState<Row[]>([])
  const [vehicles, setVehicles] = useState<Row[]>([])
  const [orders, setOrders] = useState<Row[]>([])
  const [products, setProducts] = useState<Row[]>([])
  const [entitlements, setEntitlements] = useState<Row[]>([])
  const [orderItems, setOrderItems] = useState<Row[]>([])
  const [audit, setAudit] = useState<Row[]>([])
  const [issuance, setIssuance] = useState<{ issuanceId: string; document: Record<string, unknown> } | null>(null)
  const [resetConfirm, setResetConfirm] = useState('')

  const [personOpen, setPersonOpen] = useState(false)
  const [entityOpen, setEntityOpen] = useState(false)
  const [pursuitOpen, setPursuitOpen] = useState(false)
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)

  const [personForm, setPersonForm] = useState({ firstName:'',lastName:'',title:'',email:'',phone:'',linkedinUrl:'',organizationId:'',leadStage:'new',leadSource:'LinkedIn' })
  const [entityForm, setEntityForm] = useState({ entityKind:'federal_agency',legalName:'',displayName:'',uei:'',cageCode:'',domain:'',parentEntityId:'',websiteUrl:'',summary:'' })
  const [pursuitForm, setPursuitForm] = useState({ title:'',pursuitType:'direct_sale',stage:'watching',priority:'normal',targetEntityId:'',primaryVehicleId:'',identifier:'',sourceUrl:'',dueAt:'',estimatedValueDollars:'',nextAction:'' })
  const [vehicleForm, setVehicleForm] = useState({ name:'',vehicleKind:'idiq',vehicleNumber:'',ownerEntityId:'',managingEntityId:'',status:'active',sourceUrl:'',endDate:'',summary:'' })
  const [orderForm, setOrderForm] = useState({ customerOrganizationId:'',sku:'',unitPriceDollars:'',status:'booked',opportunityId:'' })
  const [entitlementForm, setEntitlementForm] = useState({ orderId:'', orderItemId:'' })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [d,p,e,pu,v,o,prod,ent,aud] = await Promise.all([
        licenseFetch<Dashboard>('/api/v2/capture/dashboard'),
        licenseFetch<Collection>('/api/v2/crm/people?limit=500'),
        licenseFetch<Collection>('/api/v2/capture/entities'),
        licenseFetch<Collection>('/api/v2/capture/pursuits'),
        licenseFetch<Collection>('/api/v2/capture/vehicles'),
        licenseFetch<Collection>('/api/v2/crm/orders?limit=500'),
        licenseFetch<Collection>('/api/v1/products'),
        licenseFetch<Collection>('/api/v1/entitlements?limit=500'),
        licenseFetch<Collection>('/api/v1/audit?limit=250'),
      ])
      setDashboard(d); setPeople(p.items); setEntities(e.items); setPursuits(pu.items); setVehicles(v.items); setOrders(o.items); setProducts(prod.items); setEntitlements(ent.items); setAudit(aud.items)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) setAdmin(null)
      else toast.error(error instanceof Error ? error.message : 'Unable to load capture CRM.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void licenseFetch<{ admin: Admin }>('/api/v1/me').then((result)=>setAdmin(result.admin)).catch((error)=>{
      if (!(error instanceof LicenseControlPlaneError && error.status === 401)) toast.error(error instanceof Error ? error.message : 'Unable to verify administrator session.')
      setAdmin(null)
    }).finally(()=>setChecking(false))
  }, [])
  useEffect(()=>{ if(admin) void loadAll() },[admin,loadAll])

  useEffect(()=>{
    if(!entitlementForm.orderId){
      setOrderItems([])
      setEntitlementForm((current)=>({...current,orderItemId:''}))
      return
    }
    void licenseFetch<Row & { items?: Row[] }>(`/api/v1/orders/${encodeURIComponent(entitlementForm.orderId)}`)
      .then((result)=>{
        const items=Array.isArray(result.items)?result.items:[]
        setOrderItems(items)
        setEntitlementForm((current)=>({...current,orderItemId:items[0]?text(items[0],'id'):''}))
      })
      .catch((error)=>toast.error(error instanceof Error?error.message:'Unable to load order items.'))
  },[entitlementForm.orderId])

  const signIn = async () => {
    setSigningIn(true)
    try {
      const result = await licenseFetch<{url?:string}>('/api/auth/sign-in/social',{method:'POST',body:JSON.stringify({provider:'microsoft',callbackURL:licensingCallbackUrl('/licensing'),errorCallbackURL:licensingCallbackUrl('/licensing?auth=error')})})
      if(!result.url) throw new Error('Microsoft sign-in did not return an authorization URL.')
      window.location.assign(result.url)
    } catch(error) { setSigningIn(false); toast.error(error instanceof Error ? error.message : 'Unable to start Microsoft sign-in.') }
  }

  const createPerson = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v2/crm/people',{method:'POST',body:JSON.stringify({...personForm,organizationId:personForm.organizationId||null,title:personForm.title||null,email:personForm.email||null,phone:personForm.phone||null,linkedinUrl:personForm.linkedinUrl||null})})
      setPersonOpen(false); setPersonForm({firstName:'',lastName:'',title:'',email:'',phone:'',linkedinUrl:'',organizationId:'',leadStage:'new',leadSource:'LinkedIn'}); toast.success('Person added.'); await loadAll()
    } catch(error) { toast.error(error instanceof Error ? error.message : 'Unable to add person.') }
  }

  const createEntity = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v2/capture/entities',{method:'POST',body:JSON.stringify({...entityForm,displayName:entityForm.displayName||null,uei:entityForm.uei||null,cageCode:entityForm.cageCode||null,domain:entityForm.domain||null,parentEntityId:entityForm.parentEntityId||null,websiteUrl:entityForm.websiteUrl||null,summary:entityForm.summary||null,tags:[],naics:[],psc:[],smallBusinessPrograms:[]})})
      setEntityOpen(false); setEntityForm({entityKind:'federal_agency',legalName:'',displayName:'',uei:'',cageCode:'',domain:'',parentEntityId:'',websiteUrl:'',summary:''}); toast.success('Entity created.'); await loadAll()
    } catch(error) { toast.error(error instanceof Error ? error.message : 'Unable to create entity.') }
  }

  const createPursuit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const value=pursuitForm.estimatedValueDollars.trim()?Number(pursuitForm.estimatedValueDollars):null
      await licenseFetch('/api/v2/capture/pursuits',{method:'POST',body:JSON.stringify({...pursuitForm,targetEntityId:pursuitForm.targetEntityId||null,primaryVehicleId:pursuitForm.primaryVehicleId||null,identifier:pursuitForm.identifier||null,sourceUrl:pursuitForm.sourceUrl||null,dueAt:pursuitForm.dueAt||null,estimatedValueCents:value===null?null:Math.round(value*100),nextAction:pursuitForm.nextAction||null,tags:[]})})
      setPursuitOpen(false); setPursuitForm({title:'',pursuitType:'direct_sale',stage:'watching',priority:'normal',targetEntityId:'',primaryVehicleId:'',identifier:'',sourceUrl:'',dueAt:'',estimatedValueDollars:'',nextAction:''}); toast.success('Pursuit created.'); await loadAll()
    } catch(error) { toast.error(error instanceof Error ? error.message : 'Unable to create pursuit.') }
  }

  const createVehicle = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v2/capture/vehicles',{method:'POST',body:JSON.stringify({...vehicleForm,vehicleNumber:vehicleForm.vehicleNumber||null,ownerEntityId:vehicleForm.ownerEntityId||null,managingEntityId:vehicleForm.managingEntityId||null,sourceUrl:vehicleForm.sourceUrl||null,endDate:vehicleForm.endDate||null,summary:vehicleForm.summary||null,tags:[]})})
      setVehicleOpen(false); setVehicleForm({name:'',vehicleKind:'idiq',vehicleNumber:'',ownerEntityId:'',managingEntityId:'',status:'active',sourceUrl:'',endDate:'',summary:''}); toast.success('Vehicle created.'); await loadAll()
    } catch(error) { toast.error(error instanceof Error ? error.message : 'Unable to create vehicle.') }
  }

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!orderForm.customerOrganizationId || !orderForm.sku) {
      toast.error('Select an entity and internal SKU.')
      return
    }
    try {
      const value=orderForm.unitPriceDollars.trim()?Number(orderForm.unitPriceDollars):null
      await licenseFetch('/api/v1/orders',{method:'POST',body:JSON.stringify({customerOrganizationId:orderForm.customerOrganizationId,status:orderForm.status,currency:'USD',items:[{sku:orderForm.sku,quantity:1,discountCents:0,...(value!==null?{unitPriceCents:Math.round(value*100)}:{})}]})})
      setOrderOpen(false); toast.success('Order recorded.'); await loadAll()
    } catch(error) { toast.error(error instanceof Error ? error.message : 'Unable to create order.') }
  }

  const createEntitlement = async (event: React.FormEvent) => {
    event.preventDefault()
    if(!entitlementForm.orderItemId){
      toast.error('Select a booked order item.')
      return
    }
    try{
      await licenseFetch('/api/v1/entitlements',{
        method:'POST',
        body:JSON.stringify({
          orderItemId:entitlementForm.orderItemId,
          validFrom:new Date().toISOString(),
          notes:'Issued from Beag Labs capture CRM',
        }),
      })
      setEntitlementForm({orderId:'',orderItemId:''})
      setOrderItems([])
      toast.success('Entitlement provisioned.')
      await loadAll()
    }catch(error){
      toast.error(error instanceof Error?error.message:'Unable to provision entitlement.')
    }
  }

  const deleteRow = async (endpoint: string, label: string) => {
    try{
      await licenseFetch(endpoint,{method:'DELETE'})
      toast.success(label+' deleted.')
      await loadAll()
    }catch(error){
      toast.error(error instanceof Error?error.message:'Unable to delete '+label.toLowerCase()+'.')
    }
  }

  const overviewCards: Array<[string, number, typeof Target]> = [
    ['Active pursuits', dashboard.activePursuits, Target],
    ['Vehicles', dashboard.vehicles, Network],
    ['Entities', dashboard.entities, Building2],
    ['Due in 14 days', dashboard.dueSoon, Activity],
  ]

  const peopleColumns=useMemo<CrmColumn<Row>[]>(()=>[
    {id:'person',label:'Person',sortValue:(r)=>text(r,'last_name')+' '+text(r,'first_name'),render:(r)=><div className="flex items-center gap-3"><CrmAvatar firstName={text(r,'first_name')} lastName={text(r,'last_name')} avatarUrl={r.avatar_url?String(r.avatar_url):null} linkedinUrl={r.linkedin_url?String(r.linkedin_url):null}/><div><div className="font-extrabold">{text(r,'first_name')} {text(r,'last_name')}</div><div className="mt-1 text-[11px] text-[#777]">{text(r,'title')}</div></div></div>},
    {id:'entity',label:'Entity',sortValue:(r)=>text(r,'organization_name'),render:(r)=><span className="font-bold">{text(r,'organization_name')}</span>},
    {id:'stage',label:'Relationship',sortValue:(r)=>text(r,'lead_stage'),render:(r)=><Status value={r.lead_stage}/>},
    {id:'email',label:'Email',sortValue:(r)=>text(r,'email'),render:(r)=><span className="text-[12px]">{text(r,'email')}</span>},
  ],[])

  const entityColumns=useMemo<CrmColumn<Row>[]>(()=>[
    {id:'entity',label:'Entity',sortValue:(r)=>text(r,'display_name','legal_name'),render:(r)=><div className="flex items-center gap-3">{r.logo_url?<img src={String(r.logo_url)} alt="" className="h-10 w-10 shrink-0 border-2 border-[#111] bg-white object-contain p-1 shadow-[2px_2px_0_#111]"/>:<div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#111] bg-[#ffd7c7] font-mono text-[10px] font-black shadow-[2px_2px_0_#111]">{text(r,'display_name','legal_name').slice(0,2).toUpperCase()}</div>}<div><div className="font-extrabold">{text(r,'display_name','legal_name')}</div><div className="mt-1 text-[11px] text-[#777]">{text(r,'entity_kind').replaceAll('_',' ')}</div></div></div>},
    {id:'uei',label:'UEI / CAGE',sortValue:(r)=>text(r,'uei'),render:(r)=><span className="font-mono text-[10px]">{text(r,'uei')} / {text(r,'cage_code')}</span>},
    {id:'people',label:'People',sortValue:(r)=>numberValue(r,'people_count'),render:(r)=><span className="font-mono font-black">{numberValue(r,'people_count')}</span>},
    {id:'pursuits',label:'Pursuits',sortValue:(r)=>numberValue(r,'pursuit_count'),render:(r)=><span className="font-mono font-black">{numberValue(r,'pursuit_count')}</span>},
    {id:'vehicles',label:'Vehicles',sortValue:(r)=>numberValue(r,'vehicle_count'),render:(r)=><span className="font-mono font-black">{numberValue(r,'vehicle_count')}</span>},
  ],[])

  const pursuitColumns=useMemo<CrmColumn<Row>[]>(()=>[
    {id:'pursuit',label:'Pursuit',sortValue:(r)=>text(r,'title'),render:(r)=><div><div className="font-extrabold">{text(r,'title')}</div><div className="mt-1 font-mono text-[9px] text-[#777]">{text(r,'pursuit_type').replaceAll('_',' ')}</div></div>},
    {id:'stage',label:'Stage',sortValue:(r)=>text(r,'stage'),render:(r)=><Status value={r.stage}/>},
    {id:'entity',label:'Primary entity',sortValue:(r)=>text(r,'target_entity_name'),render:(r)=><span className="text-[12px] font-semibold">{text(r,'target_entity_name')}</span>},
    {id:'vehicle',label:'Vehicle',sortValue:(r)=>text(r,'vehicle_name'),render:(r)=><span className="text-[12px]">{text(r,'vehicle_name')}</span>},
    {id:'due',label:'Due',sortValue:(r)=>text(r,'due_at'),render:(r)=><span className="text-[12px]">{dateValue(r.due_at)}</span>},
    {id:'value',label:'Value',sortValue:(r)=>numberValue(r,'estimated_value_cents'),render:(r)=><span className="font-mono text-[11px] font-black">{money(r.estimated_value_cents)}</span>},
    {id:'subs',label:'Packages',sortValue:(r)=>numberValue(r,'submission_count'),render:(r)=><span className="font-mono font-black">{numberValue(r,'submission_count')}</span>},
  ],[])

  const vehicleColumns=useMemo<CrmColumn<Row>[]>(()=>[
    {id:'vehicle',label:'Vehicle',sortValue:(r)=>text(r,'vehicle_name'),render:(r)=><div><div className="font-extrabold">{text(r,'vehicle_name')}</div><div className="mt-1 font-mono text-[9px] text-[#777]">{text(r,'vehicle_kind').replaceAll('_',' ')}</div></div>},
    {id:'number',label:'Number',sortValue:(r)=>text(r,'vehicle_number'),render:(r)=><span className="font-mono text-[10px]">{text(r,'vehicle_number')}</span>},
    {id:'owner',label:'Owner / sponsor',sortValue:(r)=>text(r,'owner_name'),render:(r)=><span className="text-[12px] font-semibold">{text(r,'owner_name')}</span>},
    {id:'status',label:'Status',sortValue:(r)=>text(r,'status'),render:(r)=><Status value={r.status}/>},
    {id:'pursuits',label:'Pursuits',sortValue:(r)=>numberValue(r,'pursuit_count'),render:(r)=><span className="font-mono font-black">{numberValue(r,'pursuit_count')}</span>},
    {id:'entities',label:'Entities',sortValue:(r)=>numberValue(r,'entity_count'),render:(r)=><span className="font-mono font-black">{numberValue(r,'entity_count')}</span>},
  ],[])

  const orderColumns=useMemo<CrmColumn<Row>[]>(()=>[
    {id:'entity',label:'Entity',sortValue:(r)=>text(r,'customer_name'),render:(r)=><div><div className="font-extrabold">{text(r,'customer_name')}</div><div className="mt-1 font-mono text-[9px] text-[#888]">{text(r,'id')}</div></div>},
    {id:'status',label:'Status',sortValue:(r)=>text(r,'status'),render:(r)=><Status value={r.status}/>},
    {id:'total',label:'Total',sortValue:(r)=>numberValue(r,'total_cents'),render:(r)=><span className="font-mono font-black">{money(r.total_cents)}</span>},
    {id:'contract',label:'Contract',sortValue:(r)=>text(r,'contract_number'),render:(r)=><span className="font-mono text-[10px]">{text(r,'contract_number')}</span>},
  ],[])

  const entitlementColumns=useMemo<CrmColumn<Row>[]>(()=>[
    {id:'customer',label:'Customer',sortValue:(r)=>text(r,'customer_name'),render:(r)=><div><div className="font-extrabold">{text(r,'customer_name')}</div><div className="mt-1 font-mono text-[9px] text-[#888]">{text(r,'sku')}</div></div>},
    {id:'status',label:'Status',sortValue:(r)=>text(r,'status'),render:(r)=><Status value={r.status}/>},
    {id:'valid',label:'Validity',sortValue:(r)=>text(r,'valid_from'),render:(r)=><div className="text-[11px]"><div>{dateValue(r.valid_from)}</div><div className="mt-1 text-[#777]">to {dateValue(r.valid_until)}</div></div>},
    {id:'limit',label:'Deployment limit',sortValue:(r)=>numberValue(r,'deployment_limit'),render:(r)=><span className="font-mono font-black">{numberValue(r,'deployment_limit')}</span>},
  ],[])

  if(checking) return <div className="flex min-h-[520px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[11px] font-bold uppercase"><Loader2 className="h-4 w-4 animate-spin"/>Checking administrator session</div></div>
  if(!admin) return <div className="mx-auto max-w-[760px] border-[3px] border-[#111] bg-white p-8 shadow-[8px_8px_0_#ff5f1f]"><KeyRound className="h-9 w-9"/><h2 className="mt-5 text-[34px] font-extrabold">Administrator sign in</h2><p className="mt-3 text-[14px] leading-6 text-[#666]">Capture, outreach, commercial records, and licensing are private.</p><button onClick={signIn} disabled={signingIn} className="nb-btn-orange mt-7 flex w-full items-center justify-center gap-2 px-5 py-4 font-mono text-[10px] font-black uppercase">{signingIn?<Loader2 className="h-4 w-4 animate-spin"/>:<LogIn className="h-4 w-4"/>}Continue with Microsoft</button></div>

  const headerButton=(label:string,onClick:()=>void)=><button onClick={onClick} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase"><Plus className="h-4 w-4"/>{label}</button>

  return <div className="mx-auto max-w-[1480px] space-y-8">
    <div className="flex flex-col gap-4 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111] md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center border-[3px] border-[#111] bg-[#d9f99d]"><CheckCircle2 className="h-5 w-5"/></div><div><div className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#777]">Capture + relationship CRM</div><div className="mt-1 text-[16px] font-extrabold">{admin.name||admin.email||'Beag Labs Admin'}</div></div></div><div className="flex gap-3"><button onClick={()=>void loadAll()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><RefreshCw className={loading?'h-3.5 w-3.5 animate-spin':'h-3.5 w-3.5'}/>Refresh</button><button onClick={()=>void licenseFetch('/api/auth/sign-out',{method:'POST',body:'{}'}).finally(()=>setAdmin(null))} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><LogOut className="h-3.5 w-3.5"/>Sign out</button></div></div>
    <div className="overflow-x-auto border-[3px] border-[#111] bg-[#111] p-2"><div className="flex min-w-max gap-2">{tabs.map((item)=>{const Icon=item.icon;return <button key={item.id} onClick={()=>setTab(item.id)} className={'flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] '+(tab===item.id?'border-[#111] bg-[#ff5f1f]':'border-white/40 bg-white')}><Icon className="h-3.5 w-3.5"/>{item.label}</button>})}</div></div>

    {tab==='overview'?<div className="space-y-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{overviewCards.map(([label,value,Icon])=><div key={String(label)} className="border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111]"><div className="flex justify-between"><div><div className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#666]">{String(label)}</div><div className="mt-2 text-[38px] font-extrabold">{String(value)}</div></div><Icon className="h-5 w-5"/></div></div>)}</div><div className="grid gap-6 lg:grid-cols-3"><section className="nb-panel p-6"><PanelTitle eyebrow="Tracked value" title={money(dashboard.pursuitValueCents)} copy="Estimated value across all active pursuits, whether direct, subcontract, vehicle, or solicitation."/></section><section className="nb-panel p-6"><PanelTitle eyebrow="Outbound packages" title={String(dashboard.openSubmissions)} copy="Planned, drafting, review, or ready submission packages."/></section><section className="nb-panel p-6"><PanelTitle eyebrow="Follow-ups" title={String(dashboard.followUpsDue)} copy="Engagement follow-ups due in the next seven days."/></section></div><section className="border-[3px] border-[#111] bg-[#111] p-6 text-white shadow-[6px_6px_0_#ff5f1f]"><div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff9b70]">Universal relationship model</div><h2 className="mt-3 text-[26px] font-extrabold">Entity → Vehicle → Pursuit → Submission → Award / Order.</h2><p className="mt-3 max-w-5xl text-[14px] leading-6 text-[#ccc]">A Pursuit can be a direct sale, subcontracting motion, RFP, CSO, BAA, SBIR, task order, OEM/reseller conversation, pilot, or teaming effort. People and outreach can attach at any level.</p></section></div>:null}

    {tab==='people'?<div className="space-y-5"><section className="flex flex-col gap-4 border-b-[3px] border-[#111] pb-5 lg:flex-row lg:items-end lg:justify-between"><PanelTitle eyebrow="People" title="Contacts & relationships" copy="People can exist independently, attach to an Entity, and participate in multiple pursuits or vehicle relationships."/><Dialog open={personOpen} onOpenChange={setPersonOpen}><DialogTrigger asChild>{headerButton('Add person',()=>{})}</DialogTrigger><DialogContent className="rounded-none border-[3px] border-[#111] p-0 sm:max-w-3xl"><DialogHeader className="border-b-[3px] border-[#111] bg-[#fff1e9] p-6"><DialogTitle>Add person</DialogTitle><DialogDescription>Create a contact for sales, capture, teaming, or subcontract outreach.</DialogDescription></DialogHeader><form onSubmit={createPerson}><div className="grid gap-x-6 gap-y-5 p-7 md:grid-cols-2"><Field label="First name"><input required className="nb-input w-full" value={personForm.firstName} onChange={(e)=>setPersonForm({...personForm,firstName:e.target.value})}/></Field><Field label="Last name"><input required className="nb-input w-full" value={personForm.lastName} onChange={(e)=>setPersonForm({...personForm,lastName:e.target.value})}/></Field><Field label="Title"><input className="nb-input w-full" value={personForm.title} onChange={(e)=>setPersonForm({...personForm,title:e.target.value})}/></Field><Field label="Email"><input className="nb-input w-full" type="email" value={personForm.email} onChange={(e)=>setPersonForm({...personForm,email:e.target.value})}/></Field><Field label="LinkedIn"><input className="nb-input w-full" type="url" value={personForm.linkedinUrl} onChange={(e)=>setPersonForm({...personForm,linkedinUrl:e.target.value})}/></Field><Field label="Entity"><CrmCombobox value={personForm.organizationId} onValueChange={(value)=>setPersonForm({...personForm,organizationId:value})} options={[{value:'',label:'Unattached'},...entities.map((r)=>({value:text(r,'id'),label:text(r,'display_name','legal_name')}))]} searchPlaceholder="Search entities…"/></Field></div><DialogFooter className="border-t-[3px] border-[#111] p-5"><button className="nb-btn-orange px-5 py-2.5 font-mono text-[10px] font-black uppercase"><UserPlus className="mr-2 inline h-4 w-4"/>Add person</button></DialogFooter></form></DialogContent></Dialog></section><section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]"><CrmDataTable rows={people} columns={peopleColumns} rowKey={(r)=>text(r,'id')} searchText={(r)=>[text(r,'first_name'),text(r,'last_name'),text(r,'title'),text(r,'organization_name'),text(r,'email')].join(' ')} onRowClick={(r)=>window.location.assign('/licensing/people/'+encodeURIComponent(text(r,'id')))} onDeleteRow={(r)=>deleteRow('/api/v2/crm/people/'+encodeURIComponent(text(r,'id')),'Person')} deleteLabel={(r)=>text(r,'first_name')+' '+text(r,'last_name')}/></section></div>:null}

    {tab==='entities'?<div className="space-y-5"><section className="flex flex-col gap-4 border-b-[3px] border-[#111] pb-5 lg:flex-row lg:items-end lg:justify-between"><PanelTitle eyebrow="Entities" title="Agencies, offices, primes, partners & organizations" copy="One universal organization record. Role is contextual: buyer on one pursuit, prime or reseller on another."/><Dialog open={entityOpen} onOpenChange={setEntityOpen}><DialogTrigger asChild>{headerButton('Add entity',()=>{})}</DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-[3px] border-[#111] p-0 sm:max-w-3xl"><DialogHeader className="border-b-[3px] border-[#111] bg-[#fff1e9] p-6"><DialogTitle>Create entity</DialogTitle><DialogDescription>Track an agency, office, prime, integrator, reseller, company, university, program, or other organization.</DialogDescription></DialogHeader><form onSubmit={createEntity}><div className="grid gap-x-6 gap-y-5 p-7 md:grid-cols-2"><Field label="Entity type"><CrmCombobox value={entityForm.entityKind} onValueChange={(value)=>setEntityForm({...entityForm,entityKind:value})} options={['federal_agency','office','program','contracting_office','prime','integrator','reseller','distributor','commercial','university','state_local','nonprofit','partner','other'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search entity types…"/></Field><Field label="Legal name"><input required className="nb-input w-full" value={entityForm.legalName} onChange={(e)=>setEntityForm({...entityForm,legalName:e.target.value})}/></Field><Field label="Display name"><input className="nb-input w-full" value={entityForm.displayName} onChange={(e)=>setEntityForm({...entityForm,displayName:e.target.value})}/></Field><Field label="Parent entity"><CrmCombobox value={entityForm.parentEntityId} onValueChange={(value)=>setEntityForm({...entityForm,parentEntityId:value})} options={[{value:'',label:'None'},...entities.map((r)=>({value:text(r,'id'),label:text(r,'display_name','legal_name')}))]} searchPlaceholder="Search parent entities…"/></Field><Field label="UEI"><input className="nb-input w-full font-mono" value={entityForm.uei} onChange={(e)=>setEntityForm({...entityForm,uei:e.target.value})}/></Field><Field label="CAGE"><input className="nb-input w-full font-mono" value={entityForm.cageCode} onChange={(e)=>setEntityForm({...entityForm,cageCode:e.target.value})}/></Field><Field label="Domain"><input className="nb-input w-full" value={entityForm.domain} onChange={(e)=>setEntityForm({...entityForm,domain:e.target.value})}/></Field><Field label="Website"><input className="nb-input w-full" type="url" value={entityForm.websiteUrl} onChange={(e)=>setEntityForm({...entityForm,websiteUrl:e.target.value})}/></Field></div><DialogFooter className="border-t-[3px] border-[#111] p-5"><button className="nb-btn-orange px-5 py-2.5 font-mono text-[10px] font-black uppercase">Create entity</button></DialogFooter></form></DialogContent></Dialog></section><section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]"><CrmDataTable rows={entities} columns={entityColumns} rowKey={(r)=>text(r,'id')} searchText={(r)=>[text(r,'legal_name'),text(r,'display_name'),text(r,'entity_kind'),text(r,'uei'),text(r,'cage_code')].join(' ')} onRowClick={(r)=>window.location.assign('/licensing/entities/'+encodeURIComponent(text(r,'id')))} onDeleteRow={(r)=>deleteRow('/api/v2/capture/entities/'+encodeURIComponent(text(r,'id')),'Entity')} deleteLabel={(r)=>text(r,'display_name','legal_name')}/></section></div>:null}

    {tab==='pursuits'?<div className="space-y-5"><section className="flex flex-col gap-4 border-b-[3px] border-[#111] pb-5 lg:flex-row lg:items-end lg:justify-between"><PanelTitle eyebrow="Pursuits" title="Sales, capture, teaming & subcontracting motions" copy="Use one pursuit model for RFPs, CSOs, BAAs, SBIRs, task orders, direct sales, prime outreach, OEM/reseller motions, pilots, and partnerships."/><Dialog open={pursuitOpen} onOpenChange={setPursuitOpen}><DialogTrigger asChild>{headerButton('Add pursuit',()=>{})}</DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-[3px] border-[#111] p-0 sm:max-w-4xl"><DialogHeader className="border-b-[3px] border-[#111] bg-[#fff1e9] p-6"><DialogTitle>Create pursuit</DialogTitle><DialogDescription>The pursuit type describes the motion; the Entity and Vehicle are optional and can be linked later.</DialogDescription></DialogHeader><form onSubmit={createPursuit}><div className="grid gap-x-6 gap-y-5 p-7 md:grid-cols-2"><Field label="Title"><input required className="nb-input w-full" value={pursuitForm.title} onChange={(e)=>setPursuitForm({...pursuitForm,title:e.target.value})}/></Field><Field label="Type"><CrmCombobox value={pursuitForm.pursuitType} onValueChange={(value)=>setPursuitForm({...pursuitForm,pursuitType:value})} options={['direct_sale','subcontract','prime_teaming','rfp','rfi','cso','baa','sbir','task_order','ota','pilot','reseller','oem','partnership','vehicle_capture','other'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search pursuit types…"/></Field><Field label="Stage"><CrmCombobox value={pursuitForm.stage} onValueChange={(value)=>setPursuitForm({...pursuitForm,stage:value})} options={['watching','researching','outreach','shaping','qualifying','teaming','drafting','review','submitted','evaluation','negotiation','won','lost','no_bid','paused','archived'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search stages…"/></Field><Field label="Primary entity"><CrmCombobox value={pursuitForm.targetEntityId} onValueChange={(value)=>setPursuitForm({...pursuitForm,targetEntityId:value})} options={[{value:'',label:'None yet'},...entities.map((r)=>({value:text(r,'id'),label:text(r,'display_name','legal_name')}))]} searchPlaceholder="Search entities…"/></Field><Field label="Vehicle"><CrmCombobox value={pursuitForm.primaryVehicleId} onValueChange={(value)=>setPursuitForm({...pursuitForm,primaryVehicleId:value})} options={[{value:'',label:'No vehicle'},...vehicles.map((r)=>({value:text(r,'id'),label:text(r,'vehicle_name')}))]} searchPlaceholder="Search vehicles…"/></Field><Field label="Solicitation / identifier"><input className="nb-input w-full font-mono" value={pursuitForm.identifier} onChange={(e)=>setPursuitForm({...pursuitForm,identifier:e.target.value})}/></Field><Field label="Due date"><input className="nb-input w-full" type="date" value={pursuitForm.dueAt} onChange={(e)=>setPursuitForm({...pursuitForm,dueAt:e.target.value})}/></Field><Field label="Estimated value"><input className="nb-input w-full" type="number" min="0" value={pursuitForm.estimatedValueDollars} onChange={(e)=>setPursuitForm({...pursuitForm,estimatedValueDollars:e.target.value})}/></Field><Field label="Source URL"><input className="nb-input w-full" type="url" value={pursuitForm.sourceUrl} onChange={(e)=>setPursuitForm({...pursuitForm,sourceUrl:e.target.value})}/></Field><Field label="Next action"><input className="nb-input w-full" value={pursuitForm.nextAction} onChange={(e)=>setPursuitForm({...pursuitForm,nextAction:e.target.value})}/></Field></div><DialogFooter className="border-t-[3px] border-[#111] p-5"><button className="nb-btn-orange px-5 py-2.5 font-mono text-[10px] font-black uppercase">Create pursuit</button></DialogFooter></form></DialogContent></Dialog></section><section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]"><CrmDataTable rows={pursuits} columns={pursuitColumns} rowKey={(r)=>text(r,'id')} searchText={(r)=>[text(r,'title'),text(r,'pursuit_type'),text(r,'target_entity_name'),text(r,'vehicle_name'),text(r,'identifier')].join(' ')} onRowClick={(r)=>window.location.assign('/licensing/pursuits/'+encodeURIComponent(text(r,'id')))} onDeleteRow={(r)=>deleteRow('/api/v2/capture/pursuits/'+encodeURIComponent(text(r,'id')),'Pursuit')} deleteLabel={(r)=>text(r,'title')}/></section></div>:null}

    {tab==='vehicles'?<div className="space-y-5"><section className="flex flex-col gap-4 border-b-[3px] border-[#111] pb-5 lg:flex-row lg:items-end lg:justify-between"><PanelTitle eyebrow="Vehicles" title="Procurement & channel vehicles" copy="Track IDIQs, GWACs, BOAs, BPAs, OTA/CSO/BAA programs, prime contracts, marketplace/channel programs, and reusable contracting routes."/><Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}><DialogTrigger asChild>{headerButton('Add vehicle',()=>{})}</DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-[3px] border-[#111] p-0 sm:max-w-3xl"><DialogHeader className="border-b-[3px] border-[#111] bg-[#fff1e9] p-6"><DialogTitle>Create vehicle</DialogTitle><DialogDescription>Vehicles are reusable routes or umbrella mechanisms; individual RFPs/task orders belong in Pursuits.</DialogDescription></DialogHeader><form onSubmit={createVehicle}><div className="grid gap-x-6 gap-y-5 p-7 md:grid-cols-2"><Field label="Name"><input required className="nb-input w-full" value={vehicleForm.name} onChange={(e)=>setVehicleForm({...vehicleForm,name:e.target.value})}/></Field><Field label="Type"><CrmCombobox value={vehicleForm.vehicleKind} onValueChange={(value)=>setVehicleForm({...vehicleForm,vehicleKind:value})} options={['idiq','gwac','boa','bpa','ota','cso','baa','sbir_program','prime_contract','subcontract','task_order','marketplace','channel_program','other'].map((value)=>({value,label:value.replaceAll('_',' ')}))} searchPlaceholder="Search vehicle types…"/></Field><Field label="Number"><input className="nb-input w-full font-mono" value={vehicleForm.vehicleNumber} onChange={(e)=>setVehicleForm({...vehicleForm,vehicleNumber:e.target.value})}/></Field><Field label="Owner / sponsor"><CrmCombobox value={vehicleForm.ownerEntityId} onValueChange={(value)=>setVehicleForm({...vehicleForm,ownerEntityId:value})} options={[{value:'',label:'None'},...entities.map((r)=>({value:text(r,'id'),label:text(r,'display_name','legal_name')}))]} searchPlaceholder="Search entities…"/></Field><Field label="Managing entity"><CrmCombobox value={vehicleForm.managingEntityId} onValueChange={(value)=>setVehicleForm({...vehicleForm,managingEntityId:value})} options={[{value:'',label:'None'},...entities.map((r)=>({value:text(r,'id'),label:text(r,'display_name','legal_name')}))]} searchPlaceholder="Search entities…"/></Field><Field label="End date"><input className="nb-input w-full" type="date" value={vehicleForm.endDate} onChange={(e)=>setVehicleForm({...vehicleForm,endDate:e.target.value})}/></Field><Field label="Source URL"><input className="nb-input w-full" type="url" value={vehicleForm.sourceUrl} onChange={(e)=>setVehicleForm({...vehicleForm,sourceUrl:e.target.value})}/></Field></div><DialogFooter className="border-t-[3px] border-[#111] p-5"><button className="nb-btn-orange px-5 py-2.5 font-mono text-[10px] font-black uppercase">Create vehicle</button></DialogFooter></form></DialogContent></Dialog></section><section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]"><CrmDataTable rows={vehicles} columns={vehicleColumns} rowKey={(r)=>text(r,'id')} searchText={(r)=>[text(r,'vehicle_name'),text(r,'vehicle_kind'),text(r,'vehicle_number'),text(r,'owner_name')].join(' ')} onRowClick={(r)=>window.location.assign('/licensing/vehicles/'+encodeURIComponent(text(r,'id')))} onDeleteRow={(r)=>deleteRow('/api/v2/capture/vehicles/'+encodeURIComponent(text(r,'id')),'Vehicle')} deleteLabel={(r)=>text(r,'vehicle_name')}/></section></div>:null}

    {tab==='orders'?<div className="space-y-5"><section className="flex flex-col gap-4 border-b-[3px] border-[#111] pb-5 lg:flex-row lg:items-end lg:justify-between"><PanelTitle eyebrow="Commercial conversion" title="Orders" copy="Orders are downstream commercial records. Keep capture and outreach in Pursuits; create an order once terms actually exist."/><Dialog open={orderOpen} onOpenChange={setOrderOpen}><DialogTrigger asChild>{headerButton('Add order',()=>{})}</DialogTrigger><DialogContent className="rounded-none border-[3px] border-[#111] p-0 sm:max-w-3xl"><DialogHeader className="border-b-[3px] border-[#111] bg-[#fff1e9] p-6"><DialogTitle>Record order</DialogTitle><DialogDescription>Convert a relationship into a commercial record without changing how the pursuit itself is tracked.</DialogDescription></DialogHeader><form onSubmit={createOrder}><div className="grid gap-x-6 gap-y-5 p-7 md:grid-cols-2"><Field label="Entity"><CrmCombobox required value={orderForm.customerOrganizationId} onValueChange={(value)=>setOrderForm({...orderForm,customerOrganizationId:value})} options={entities.map((r)=>({value:text(r,'id'),label:text(r,'display_name','legal_name')}))} placeholder="Select entity…" searchPlaceholder="Search entities…"/></Field><Field label="Internal SKU"><CrmCombobox required value={orderForm.sku} onValueChange={(value)=>setOrderForm({...orderForm,sku:value})} options={products.filter((r)=>text(r,'provisioning_type')==='license').map((r)=>({value:text(r,'sku'),label:text(r,'sku')+' — '+text(r,'name')}))} placeholder="Select SKU…" searchPlaceholder="Search SKUs…"/></Field><Field label="Agreed price"><input className="nb-input w-full" type="number" min="0" value={orderForm.unitPriceDollars} onChange={(e)=>setOrderForm({...orderForm,unitPriceDollars:e.target.value})}/></Field></div><DialogFooter className="border-t-[3px] border-[#111] p-5"><button className="nb-btn-orange px-5 py-2.5 font-mono text-[10px] font-black uppercase">Record order</button></DialogFooter></form></DialogContent></Dialog></section><section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]"><CrmDataTable rows={orders} columns={orderColumns} rowKey={(r)=>text(r,'id')} searchText={(r)=>[text(r,'customer_name'),text(r,'contract_number'),text(r,'id')].join(' ')} onRowClick={(r)=>window.location.assign('/licensing/orders/'+encodeURIComponent(text(r,'id')))} onDeleteRow={(r)=>deleteRow('/api/v2/crm/orders/'+encodeURIComponent(text(r,'id')),'Order')} deleteLabel={(r)=>'order for '+text(r,'customer_name')}/></section></div>:null}

    {tab==='entitlements'?<div className="mx-auto max-w-[1180px] space-y-7">
      <div className="mx-auto max-w-2xl text-center"><span className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Provisioning</span><h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em]">Entitlements</h2><p className="mt-2 text-[13px] leading-6 text-[#666]">Convert a booked software order item into the entitlement that controls features, profiles, term, and license issuance.</p></div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createEntitlement} className="nb-panel h-fit p-6">
          <PanelTitle eyebrow="Grant" title="Provision entitlement" copy="Only booked or fulfilled software order items can be provisioned."/>
          <div className="mt-5 space-y-5">
            <Field label="Booked order"><CrmCombobox value={entitlementForm.orderId} onValueChange={(value)=>setEntitlementForm({orderId:value,orderItemId:''})} options={orders.filter((row)=>['booked','fulfilled'].includes(text(row,'status'))).map((row)=>({value:text(row,'id'),label:text(row,'customer_name')+' — '+text(row,'id')}))} placeholder="Select order…" searchPlaceholder="Search booked orders…"/></Field>
            <Field label="Order item"><CrmCombobox value={entitlementForm.orderItemId} disabled={!entitlementForm.orderId} onValueChange={(value)=>setEntitlementForm((current)=>({...current,orderItemId:value}))} options={orderItems.map((row)=>({value:text(row,'id'),label:text(row,'sku','product_id')+' × '+numberValue(row,'quantity')}))} placeholder={entitlementForm.orderId?'Select item…':'Select an order first'} searchPlaceholder="Search order items…"/></Field>
            <button disabled={!entitlementForm.orderItemId} className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase disabled:cursor-not-allowed disabled:opacity-50">Provision entitlement</button>
          </div>
        </form>
        <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
          <CrmDataTable rows={entitlements} columns={entitlementColumns} rowKey={(r)=>text(r,'id')} searchText={(r)=>[text(r,'customer_name'),text(r,'sku'),text(r,'id'),text(r,'status')].join(' ')} empty="No entitlements yet." onDeleteRow={(r)=>deleteRow('/api/v1/entitlements/'+encodeURIComponent(text(r,'id')),'Entitlement')} deleteLabel={(r)=>'entitlement '+text(r,'sku')+' for '+text(r,'customer_name')}/>
        </section>
      </div>
    </div>:null}

    {tab==='licensing'?<div className="mx-auto max-w-[1080px] space-y-7"><div className="mx-auto max-w-2xl text-center"><span className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">License issuance</span><h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em]">Issue signed Papyrus licenses</h2><p className="mt-2 text-[13px] leading-6 text-[#666]">{entitlements.length} entitlement{entitlements.length===1?'':'s'} available. Provision an entitlement first, then approve its organization scope and generate the signed license document.</p></div><OrganizationLicensePanel entitlements={entitlements} onIssued={(result)=>setIssuance(result)}/>{issuance?<section className="mx-auto max-w-[1040px] border-[3px] border-[#111] bg-[#d9f99d] p-6 shadow-[5px_5px_0_#111]"><div className="font-mono text-[10px] font-black uppercase"><FileKey2 className="mr-2 inline h-4 w-4"/>Signed license ready</div><pre className="mt-4 max-h-[420px] overflow-auto bg-[#111] p-4 text-[10px] text-white">{JSON.stringify(issuance.document,null,2)}</pre></section>:null}</div>:null}

    {tab==='audit'?<section className="overflow-hidden border-[3px] border-[#111] bg-white"><CrmDataTable rows={audit} rowKey={(r)=>text(r,'id')} searchText={(r)=>[text(r,'action'),text(r,'resource_type'),text(r,'resource_id')].join(' ')} columns={[{id:'time',label:'Time',sortValue:(r)=>text(r,'created_at'),render:(r)=><span className="text-[12px]">{dateValue(r.created_at)}</span>},{id:'action',label:'Action',sortValue:(r)=>text(r,'action'),render:(r)=><span className="font-mono text-[10px] font-black">{text(r,'action')}</span>},{id:'resource',label:'Resource',sortValue:(r)=>text(r,'resource_type'),render:(r)=><span className="text-[12px]">{text(r,'resource_type')} · {text(r,'resource_id')}</span>}]}/></section>:null}

    {tab==='settings'?<section className="nb-panel p-6"><PanelTitle eyebrow="Data" title="CRM reset" copy="Clear relationship, capture, commercial, and licensing records while preserving products and authentication state."/><div className="mt-6 border-[3px] border-[#111] bg-[#fee2e2] p-5"><input className="nb-input w-full font-mono" value={resetConfirm} onChange={(e)=>setResetConfirm(e.target.value)} placeholder="Type RESET CRM DATA"/><button disabled={resetConfirm!=='RESET CRM DATA'} onClick={()=>void licenseFetch('/api/v2/crm/admin/reset',{method:'POST',body:JSON.stringify({confirm:resetConfirm})}).then(()=>loadAll()).catch((e)=>toast.error(e instanceof Error?e.message:'Reset failed'))} className="mt-3 w-full border-[3px] border-[#111] bg-[#ef4444] px-4 py-3 font-mono text-[10px] font-black uppercase text-white disabled:opacity-40">Clear CRM data</button></div></section>:null}
  </div>
}
