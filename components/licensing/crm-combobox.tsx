"use client"

import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type CrmComboboxOption = {
  value: string
  label: string
  keywords?: string[]
  disabled?: boolean
}

export function CrmCombobox({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No options found.',
  disabled = false,
  required = false,
  className,
  ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: CrmComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  required?: boolean
  className?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-required={required || undefined}
          className={cn(
            'nb-input flex min-h-[42px] w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-[#999] font-medium')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-[100] w-[var(--radix-popover-trigger-width)] rounded-none border-[3px] border-[#111] bg-white p-0 shadow-[5px_5px_0_#111]"
      >
        <Command className="rounded-none bg-white [&_[data-slot=command-input-wrapper]]:h-11 [&_[data-slot=command-input-wrapper]]:border-b-2 [&_[data-slot=command-input-wrapper]]:border-[#111]">
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-10 rounded-none font-mono text-[11px] font-bold"
          />
          <CommandList className="max-h-64 p-1">
            <CommandEmpty className="px-3 py-6 font-mono text-[10px] font-bold uppercase text-[#777]">
              {emptyText}
            </CommandEmpty>
            <CommandGroup className="p-0">
              {options.map((option) => (
                <CommandItem
                  key={option.value || '__empty'}
                  value={[option.label, option.value, ...(option.keywords ?? [])].join(' ')}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className="rounded-none border-2 border-transparent px-3 py-2.5 text-[12px] font-bold data-[selected=true]:border-[#111] data-[selected=true]:bg-[#ff5f1f] data-[selected=true]:text-[#111]"
                >
                  <Check className={cn('h-3.5 w-3.5 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
