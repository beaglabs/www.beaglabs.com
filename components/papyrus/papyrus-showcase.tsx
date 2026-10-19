'use client'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { PapyrusFrame, type View } from './showcase/papyrus-frame'
import { ClassShowcase } from './showcase/class-showcase'
import { WorkflowShowcase } from './showcase/workflow-showcase'

export function PapyrusShowcase(){
 const [active,setActive]=useState<View>('classes')
 const [replay,setReplay]=useState(0)
 const reduced=useReducedMotion()
 return <section className="border-y-[3px] border-black bg-[#f9e2d5] px-4 py-20 sm:px-6">
  <div className="mx-auto max-w-[1200px]">
   <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-[#b33d0d]">Inside Papyrus / Guided interface preview</p><h2 className="mt-3 max-w-[950px] text-4xl font-black">Define your Classes. Design your workflows.</h2><p className="mt-5 max-w-[860px] leading-7">A product-derived walkthrough using Papyrus’s actual Class editor field types, drawer terminology, and Workflow Designer inspection semantics. Example data is illustrative; no live environment is connected.</p></div><button type="button" onClick={()=>setReplay(v=>v+1)} className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black focus-visible:outline-4 focus-visible:outline-[#ff5f1f]"><RotateCcw className="h-4 w-4"/> Replay animation</button></div>
   <div className="mt-9"><PapyrusFrame active={active} onChange={tab=>{setActive(tab);setReplay(v=>v+1)}}>
    <AnimatePresence mode="wait" initial={false}>
     <motion.div key={active} initial={reduced?false:{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={reduced?undefined:{opacity:0,x:-12}} transition={{duration:.2}}>
      {active==='classes'?<ClassShowcase replay={replay}/>:<WorkflowShowcase replay={replay}/>}
     </motion.div>
    </AnimatePresence>
   </PapyrusFrame></div>
   <p className="mt-5 font-mono text-[11px] font-semibold text-[#555]">Illustrative sample records · Interface reconstruction from Papyrus source · Animation respects reduced-motion preferences</p>
  </div>
 </section>
}
