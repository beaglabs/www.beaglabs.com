"use client"

import { Linkedin } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function CrmAvatar({
  firstName,
  lastName,
  avatarUrl,
  linkedinUrl,
  size = 'default',
}: {
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
  linkedinUrl?: string | null
  size?: 'sm' | 'default' | 'lg'
}) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '??'
  const dimension = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'

  return (
    <div className="relative shrink-0">
      <Avatar className={`${dimension} rounded-none border-2 border-[#111] bg-white shadow-[3px_3px_0_#111]`}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${firstName ?? ''} ${lastName ?? ''}`.trim()} className="rounded-none object-cover" /> : null}
        <AvatarFallback className="rounded-none bg-[#ffd7c7] font-mono text-[11px] font-black">{initials}</AvatarFallback>
      </Avatar>
      {linkedinUrl ? (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center border-2 border-[#111] bg-[#0a66c2] text-white">
          <Linkedin className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}
    </div>
  )
}
