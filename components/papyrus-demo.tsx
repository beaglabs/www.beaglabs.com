"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUp, Check, FileText, Play, ShieldCheck, X } from "lucide-react"

const stages = [
  { heading: "Prompt submitted", body: "Process the attached contract. Extract parties, dates, and obligations. Flag anything missing.", state: "Working" },
  { heading: "Reading contract-intake.pdf", body: "Document parsed. Extracting structured fields and recording evidence.", state: "Extracting" },
  { heading: "Checking evidence", body: "Found the effective date, parties, and payment terms. One clause needs review.", state: "Reviewing" },
  { heading: "Approval requested", body: "Draft extraction is ready. Waiting for a person to approve before publishing.", state: "Human review" },
]
export function PapyrusDemo() {
  const reduce = useReducedMotion()
  const [stage, setStage] = useState(0)
  const [open, setOpen] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (reduce || open) return
    const timer = window.setInterval(() => setStage((s) => (s + 1) % stages.length), 2800)
    return () => window.clearInterval(timer)
  }, [reduce, open])
  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", key)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = previous }
  }, [open])
  return <>
    <div className="overflow-hidden border-[3px] border-[#1a1714] bg-[#fffaf3] text-[#1a1714] shadow-[8px_8px_0_#1a1714]">
      <div className="flex items-center justify-between border-b-2 border-[#1a1714] bg-[#fdeee1] px-4 py-3">
        <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center bg-[#1a1714] font-mono text-xs font-black text-[#fffaf3]">P</span><span className="text-xs font-black">Papyrus</span><span className="text-[10px] text-[#8f7a68]">/ Sessions</span></div>
        <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase"><span className="h-2 w-2 rounded-full bg-green-500" /> Preview</span>
      </div>
      <div className="grid min-h-[380px] grid-cols-[78px_1fr] sm:grid-cols-[104px_1fr]">
        <aside className="border-r border-[#e8d5bf] bg-[#fdeee1] px-2 py-4 text-[10px] font-semibold text-[#5b4a3d]">
          <div className="bg-[#f7c995] px-2 py-2 text-[#1a1714]">Sessions</div><div className="px-2 py-3">Library</div><div className="px-2 py-3">Decisions</div><div className="px-2 py-3">Tools</div>
        </aside>
        <div className="flex min-w-0 flex-col p-4 sm:p-5">
          <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#8f7a68]">Contract intake / Session</div>
          <div className="mt-4 rounded border border-[#e8d5bf] bg-[#fdeee1] p-3 text-[11px] font-medium leading-relaxed sm:text-xs">{stages[0].body}<div className="mt-3 inline-flex items-center gap-1 border border-[#b8a28c] bg-[#fffaf3] px-2 py-1 text-[10px]"><FileText className="h-3 w-3" /> contract-intake.pdf</div></div>
          <div className="mt-5 flex items-start gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#1a1714] bg-[#e5632f] text-xs font-black">P</span>
            <div className="min-w-0 flex-1" aria-live="off">
              <div className="text-xs font-black">Papyrus <span className="ml-1 font-mono text-[10px] font-normal text-[#8f7a68]">{stages[stage].state}</span></div>
              <AnimatePresence mode="wait">
                <motion.div key={stage} initial={reduce ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -5 }} transition={{ duration: .25 }} className="mt-2 min-h-24 border-l-2 border-[#e5632f] pl-3">
                  <div className="text-xs font-bold">{stages[stage].heading}</div><p className="mt-2 text-[11px] leading-5 text-[#5b4a3d]">{stages[stage].body}</p>
                  {stage === 3 && <div className="mt-2 inline-flex items-center gap-1 border border-[#1a1714] bg-[#fff0a6] px-2 py-1 text-[10px] font-bold"><ShieldCheck className="h-3 w-3" /> Awaiting approval</div>}
                  {stage === 2 && <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-800"><Check className="h-3 w-3" /> Evidence attached</div>}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border border-[#e8d5bf] bg-[#fffaf3] px-3 py-2 text-[10px] text-[#a08b78]"><span>Ask Papyrus to work on your files…</span><span className="bg-[#1a1714] p-1 text-[#fffaf3]"><ArrowUp className="h-3 w-3" /></span></div>
        </div>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 border-t-2 border-[#1a1714] bg-[#e5632f] px-4 py-3 text-xs font-black uppercase hover:bg-[#f7c995]"><Play className="h-4 w-4" /> Watch the actual product demo</button>
    </div>
    <div className="mt-3 text-center font-mono text-[10px] font-semibold text-[#5b4a3d]">Illustrative Papyrus prompt workflow · Not a live product session</div>
    <AnimatePresence>
      {open && <>
        <motion.div className="fixed inset-0 z-[100] bg-black/60" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setOpen(false)} aria-hidden="true" />
        <motion.section role="dialog" aria-modal="true" aria-label="Papyrus product demo" className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[860px] flex-col border-l-[3px] border-[#1a1714] bg-[#fffaf3] text-[#1a1714] shadow-[-6px_0_0_#e5632f]" initial={{x:reduce ? 0 : "100%"}} animate={{x:0}} exit={{x:reduce ? 0 : "100%"}} transition={{type:"spring",damping:28,stiffness:260}}>
          <header className="flex items-center justify-between border-b-2 border-[#1a1714] px-5 py-4"><div><h2 className="text-lg font-black">See Papyrus in action</h2><p className="text-xs text-[#6f5a4b]">Product walkthrough</p></div><button ref={closeButton} type="button" aria-label="Close video panel" className="border-2 border-[#1a1714] p-2 hover:bg-[#f7c995]" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></header>
          <div className="flex flex-1 flex-col justify-center bg-[#1a1714] p-3 sm:p-6"><div className="aspect-video w-full"><iframe src="https://player.vimeo.com/video/1233172693?autoplay=1&title=0&byline=0" title="Papyrus product demo" className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div><a className="mt-4 text-center text-xs font-semibold text-[#fffaf3] underline" href="https://vimeo.com/1233172693" target="_blank" rel="noopener noreferrer">Open video on Vimeo</a></div>
        </motion.section>
      </>}
    </AnimatePresence>
  </>
}
