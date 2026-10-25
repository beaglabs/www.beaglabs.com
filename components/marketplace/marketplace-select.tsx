'use client'

import * as React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type MarketplaceOption = { value:string; label:string; disabled?:boolean }
type Props = { value:string; onValueChange:(value:string)=>void; options:MarketplaceOption[]; placeholder?:string; label:string; disabled?:boolean; className?:string }

/** Marketplace-styled Radix Select; keyboard navigation and screen-reader support come from the existing UI primitive. */
export function MarketplaceSelect({value,onValueChange,options,placeholder='Choose an option',label,disabled,className=''}:Props){
  return <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger aria-label={label} className={`h-11 w-full rounded-none border-[3px] border-[#111] bg-white px-3 font-bold text-[#111] shadow-[3px_3px_0_#111] transition-shadow focus-visible:shadow-[4px_4px_0_#ff5f1f] focus-visible:ring-0 ${className}`}>
      <SelectValue placeholder={placeholder}/>
    </SelectTrigger>
    <SelectContent className="z-[100] max-h-72 rounded-none border-[3px] border-[#111] bg-[#fffaf6] shadow-[5px_5px_0_#111]">
      {options.map(option=><SelectItem key={option.value} value={option.value} disabled={option.disabled} className="rounded-none py-2 font-bold focus:bg-[#ffbd98] focus:text-[#111]">{option.label}</SelectItem>)}
    </SelectContent>
  </Select>
}
