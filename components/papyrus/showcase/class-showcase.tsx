'use client'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Plus, X, GripVertical, ShieldCheck } from 'lucide-react'
const fields=[
 {name:'Vendor name',key:'vendor_name',type:'Short text',required:true},
 {name:'Legal entity',key:'legal_entity',type:'Link to record',required:true},
 {name:'Invoice total',key:'invoice_total',type:'Number',required:true},
 {name:'Source system',key:'source_system',type:'Short text',required:false},
 {name:'Approval status',key:'approval_status',type:'Short text',required:false}
]
export function ClassShowcase({replay}:{replay:number}){
 const reduced=useReducedMotion()
 return <motion.div key={replay} initial={reduced?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.3}} className="min-w-0">
  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e8d5bf] pb-5"><div><p className="text-[11px] font-semibold text-[#6f5a4b]">Classes / Define</p><h3 className="mt-2 text-2xl font-extrabold">Vendor Invoice</h3><p className="mt-2 max-w-lg text-sm text-[#6f5a4b]">Model an invoice linked to a vendor and legal entity.</p></div><span className="border border-[#1a1714] bg-[#fde3c8] px-3 py-1.5 font-mono text-[10px] font-bold">DRAFT</span></div>
  <motion.div initial={reduced?false:{x:30,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:.4,delay:.12}} className="mt-5 border border-[#2a221c] bg-[#fffaf3] shadow-[5px_5px_0_#e8d5bf]">
   <div className="flex items-start justify-between gap-3 border-b border-[#e8d5bf] p-4"><div><h4 className="text-lg font-extrabold">New class</h4><p className="mt-1 text-xs text-[#6f5a4b]">Set the class name, field types, and record statuses.</p></div><X className="h-4 w-4 text-[#8f7a68]" aria-hidden/></div>
   <div className="grid gap-3 p-4 sm:grid-cols-2"><div><p className="mb-1 text-[11px] font-semibold">Name</p><div className="border border-[#a99480] bg-[#fdeee1] px-3 py-2 text-sm">Vendor Invoice</div></div><div><p className="mb-1 text-[11px] font-semibold">Title field</p><div className="border border-[#a99480] bg-[#fdeee1] px-3 py-2 text-sm">vendor_name</div></div></div>
   <div className="px-4 pb-4"><div className="mb-3 flex items-center justify-between"><h5 className="text-sm font-extrabold">Fields</h5><span className="inline-flex items-center gap-1 border border-[#1a1714] px-2 py-1 text-[11px] font-bold"><Plus className="h-3 w-3"/> Add field</span></div>
    <div className="space-y-2">{fields.map((field,i)=><motion.div key={field.key} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:reduced?0:.27+i*.12,duration:.22}} className="grid grid-cols-[16px_minmax(0,1fr)] gap-2 border border-[#d5d5d5] bg-[#fffaf3] p-2.5 sm:grid-cols-[16px_minmax(0,1.2fr)_minmax(0,.8fr)_auto] sm:items-center"><GripVertical className="h-4 w-4 text-[#a08b78]"/><div className="min-w-0"><div className="truncate text-xs font-bold">{field.name}</div><div className="truncate font-mono text-[10px] text-[#8f7a68]">{field.key}</div></div><span className="col-start-2 text-[11px] text-[#4a3d33] sm:col-auto">{field.type}</span><span className="col-start-2 text-[10px] font-bold uppercase text-[#b2391a] sm:col-auto">{field.required?'Required':'Optional'}</span></motion.div>)}</div>
    <div className="mt-4 flex flex-wrap gap-2"><span className="border border-[#a99480] bg-[#fdeee1] px-3 py-1.5 text-xs">Draft</span><span className="border border-[#a99480] bg-[#fdeee1] px-3 py-1.5 text-xs">Review</span><span className="border border-[#a99480] bg-[#fdeee1] px-3 py-1.5 text-xs">Posted</span></div>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8d5bf] bg-[#fdeee1] p-4"><div className="flex items-center gap-1.5 text-[11px] text-[#6f5a4b]"><ShieldCheck className="h-4 w-4"/> Schema migrations require governance</div><motion.div initial={{backgroundColor:'#e5632f'}} animate={{backgroundColor:['#e5632f','#ff8a5c','#e5632f']}} transition={reduced?{duration:0}:{duration:1.6,repeat:Infinity,repeatDelay:1.5}} className="inline-flex items-center gap-2 border border-[#1a1714] px-4 py-2 text-xs font-extrabold"><Check className="h-4 w-4"/> Create class</motion.div></div>
  </motion.div>
 </motion.div>
}
