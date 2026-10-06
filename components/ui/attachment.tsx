'use client'

import * as React from 'react'
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done'

function Attachment({
  className,
  state = 'idle',
  children,
  ...props
}: React.ComponentProps<'div'> & { state?: AttachmentState }) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      className={cn(
        'flex items-center gap-3 border-2 border-[#111] bg-white p-3 shadow-[3px_3px_0_#111]',
        'data-[state=error]:bg-[#fee2e2] data-[state=done]:bg-[#f7fee7]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function AttachmentMedia({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-media"
      className={cn('flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#111] bg-[#ff5f1f]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function AttachmentContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-content" className={cn('min-w-0 flex-1', className)} {...props} />
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-title" className={cn('truncate text-[13px] font-extrabold text-[#111]', className)} {...props} />
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-description" className={cn('mt-1 text-[11px] font-medium text-[#666]', className)} {...props} />
}

function AttachmentActions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-actions" className={cn('flex shrink-0 items-center gap-2', className)} {...props} />
}

function AttachmentAction({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      data-slot="attachment-action"
      className={cn('inline-flex h-8 items-center justify-center border-2 border-[#111] bg-white px-2 font-mono text-[9px] font-black uppercase shadow-[2px_2px_0_#111] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none', className)}
      {...props}
    />
  )
}

function AttachmentStatus({ state }: { state: AttachmentState }) {
  if (state === 'uploading' || state === 'processing') return <Loader2 className="h-4 w-4 animate-spin" />
  if (state === 'error') return <CircleAlert className="h-4 w-4" />
  if (state === 'done') return <CheckCircle2 className="h-4 w-4" />
  return null
}

export {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentStatus,
}
