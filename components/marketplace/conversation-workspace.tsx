'use client'

import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, Check, Inbox, MessageSquare, Search, Send } from 'lucide-react'
import { Kbd, KbdGroup } from '@/components/ui/kbd'

export type MarketplaceThread = { id:string; publisher_id:string; subject:string; created_at:number }
export type MarketplaceMessage = { id:string; sender_user_id:string; body:string; created_at:number }

type Props = {
  threads:MarketplaceThread[]
  selectedId:string
  messages:MarketplaceMessage[]
  selfUserId:string
  selfLabel:string
  otherLabel:string
  draft:string
  onDraftChange:(value:string)=>void
  onSelect:(id:string)=>void
  onSend:(event:FormEvent<HTMLFormElement>)=>void
  busy?:boolean
  loading?:boolean
  title?:string
  publisherName?:(thread:MarketplaceThread)=>string
  toolbar?:ReactNode
}

const formatTime=(seconds:number)=>new Date(seconds*1000).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})

export function ConversationWorkspace({threads,selectedId,messages,selfUserId,selfLabel,otherLabel,draft,onDraftChange,onSelect,onSend,busy=false,loading=false,title='Conversations',publisherName,toolbar}:Props){
  const [search,setSearch]=useState('')
  const [showJump,setShowJump]=useState(false)
  const viewport=useRef<HTMLDivElement>(null)
  const lastThread=useRef('')
  const atBottom=useRef(true)
  const filtered=useMemo(()=>threads.filter(t=>`${t.subject} ${publisherName?.(t)||''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.created_at-a.created_at),[threads,search,publisherName])
  const selected=threads.find(t=>t.id===selectedId)

  function scrollToEnd(behavior:ScrollBehavior='smooth'){
    const element=viewport.current
    if(!element)return
    element.scrollTo({top:element.scrollHeight,behavior})
    atBottom.current=true
    setShowJump(false)
  }
  function onScroll(){
    const element=viewport.current
    if(!element)return
    const nearEnd=element.scrollHeight-element.scrollTop-element.clientHeight<90
    atBottom.current=nearEnd
    setShowJump(!nearEnd)
  }
  useEffect(()=>{
    if(!selectedId){lastThread.current='';return}
    if(selectedId!==lastThread.current){
      lastThread.current=selectedId
      atBottom.current=true
      setShowJump(false)
    }
    if(atBottom.current)requestAnimationFrame(()=>scrollToEnd('instant'))
  },[selectedId,messages])
  function onComposerKeyDown(event:KeyboardEvent<HTMLTextAreaElement>){
    if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)&&!event.nativeEvent.isComposing){
      event.preventDefault()
      if(draft.trim()&&!busy)event.currentTarget.form?.requestSubmit()
    }
  }

  return <div className="grid min-h-[540px] min-w-0 overflow-hidden border-[3px] border-[#111] bg-white lg:h-[min(690px,calc(100svh-190px))] lg:min-h-[520px] lg:grid-cols-[300px_minmax(0,1fr)]">
    <aside aria-label="Conversation sidebar" className="flex min-h-0 min-w-0 flex-col border-b-[3px] border-[#111] bg-[#faf5ef] lg:border-b-0 lg:border-r-[3px]">
      <div className="border-b-2 border-[#111] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div><p className="font-mono text-[10px] font-black uppercase tracking-[.14em] text-[#a14b24]">Inbox</p><h3 className="mt-1 text-lg font-black">{title} <span className="font-mono text-xs text-[#777]">({threads.length})</span></h3></div>
          {toolbar}
        </div>
        <label className="relative mt-3 block"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#666]"/><span className="sr-only">Search conversations</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations" className="w-full border-2 border-[#111] bg-white py-2 pl-9 pr-3 text-xs outline-none focus:shadow-[3px_3px_0_#f4b48e]"/></label>
      </div>
      <nav aria-label="Threads" className="max-h-[240px] min-h-[120px] flex-1 overflow-y-auto overscroll-contain lg:max-h-none">
        {filtered.map(thread=><button key={thread.id} type="button" onClick={()=>onSelect(thread.id)} aria-current={selectedId===thread.id?'true':undefined} className={`flex w-full items-start gap-3 border-b border-[#e0d3ca] px-4 py-4 text-left transition-colors hover:bg-[#ffe8d9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#111] ${selectedId===thread.id?'border-l-[5px] border-l-[#111] bg-[#ffcfb2] pl-[11px]':'bg-transparent'}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#111] bg-white"><MessageSquare size={17}/></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{thread.subject}</span>{publisherName&&<span className="mt-1 block truncate text-xs text-[#6b625c]">{publisherName(thread)}</span>}<span className="mt-1 block font-mono text-[10px] text-[#8a7a70]">{formatTime(thread.created_at)}</span></span>
        </button>)}
        {filtered.length===0&&<div className="px-5 py-10 text-center text-sm text-[#72645b]"><Inbox size={23} className="mx-auto mb-3"/>{threads.length?'No matching conversations.':'No conversations yet.'}</div>}
      </nav>
    </aside>
    <section aria-label="Message thread" className="flex min-h-[440px] min-w-0 flex-col bg-white lg:min-h-0">
      {!selected?<div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center"><span className="flex h-16 w-16 items-center justify-center border-[3px] border-[#111] bg-[#ffdfcc] shadow-[4px_4px_0_#111]"><MessageSquare size={28}/></span><h3 className="mt-7 text-xl font-black">Your inbox is ready.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#777]">{threads.length?'Choose a conversation on the left to read and reply.':'New conversations from Beag Labs will appear here.'}</p></div>:<>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-[#111] bg-[#fff8f1] px-5 py-4"><div className="min-w-0"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#a14b24]">{publisherName?.(selected)||'Secure publisher messaging'}</p><h3 className="mt-1 truncate text-lg font-black">{selected.subject}</h3></div><span className="flex shrink-0 items-center gap-1.5 border border-[#111] bg-[#e6f4e5] px-2 py-1 font-mono text-[10px] font-bold uppercase"><Check size={12}/> Active</span></header>
        <div className="relative min-h-0 flex-1">
          <div ref={viewport} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions" className="h-full min-h-[220px] max-h-[430px] overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:max-h-none">
            {loading?<p className="py-12 text-center text-xs text-[#777]">Loading conversation…</p>:messages.length===0?<div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center"><p className="font-black">Start the conversation</p><p className="mt-2 max-w-xs text-xs leading-5 text-[#777]">Messages are kept in this thread, so you can pick up where you left off.</p></div>:<div className="space-y-5">{messages.map(m=>{
              const own=m.sender_user_id===selfUserId
              return <article key={m.id} className={`flex max-w-full items-end gap-2.5 ${own?'flex-row-reverse':''}`}>
                <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#111] text-[11px] font-black ${own?'bg-[#ffbd98]':'bg-[#e9e5df]'}`}>{own?'YOU':'BL'}</span>
                <div className={`min-w-0 max-w-[85%] sm:max-w-[74%] ${own?'text-right':'text-left'}`}><div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-[#666]">{own?selfLabel:otherLabel}<span className="font-mono text-[10px] font-normal">{formatTime(m.created_at)}</span></div><div className={`border-2 border-[#111] px-4 py-3 text-left text-sm leading-6 shadow-[3px_3px_0_#111] whitespace-pre-wrap break-words ${own?'bg-[#ffe0cc]':'bg-[#f6f4f0]'}`}>{m.body}</div></div>
              </article>
            })}</div>}
          </div>
          {showJump&&<button type="button" onClick={()=>scrollToEnd()} className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 border-2 border-[#111] bg-white px-3 py-2 text-xs font-black shadow-[3px_3px_0_#111]"><ArrowDown size={14}/> Latest messages</button>}
        </div>
        <form onSubmit={onSend} className="shrink-0 border-t-[3px] border-[#111] bg-[#fffaf6] px-4 py-3 sm:px-5">
          <label htmlFor={`message-composer-${selectedId}`} className="mb-2 block font-mono text-[10px] font-black uppercase tracking-widest">Reply</label>
          <textarea id={`message-composer-${selectedId}`} required rows={2} maxLength={10000} value={draft} onChange={e=>onDraftChange(e.target.value)} onKeyDown={onComposerKeyDown} placeholder="Write your reply…" className="w-full resize-none border-2 border-[#111] bg-white px-3 py-3 text-sm leading-6 outline-none focus:shadow-[3px_3px_0_#f3aa82]"/>
          <div className="mt-2 flex items-center justify-between gap-3"><span className="flex items-center gap-1.5 text-[10px] text-[#756b64]">Send with <KbdGroup><Kbd className="border border-[#bbb] bg-white text-[#111]">⌘ / Ctrl</Kbd><Kbd className="border border-[#bbb] bg-white text-[#111]">Enter</Kbd></KbdGroup></span><button disabled={busy||!draft.trim()} className="inline-flex items-center gap-2 border-2 border-[#111] bg-[#ffbd98] px-4 py-2 text-xs font-black uppercase hover:bg-[#ffa77a] disabled:cursor-not-allowed disabled:opacity-40"><Send size={15}/> {busy?'Sending…':'Send reply'}</button></div>
        </form>
      </>}
    </section>
  </div>
}
