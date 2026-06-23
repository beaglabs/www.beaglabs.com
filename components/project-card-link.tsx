'use client'

import posthog from 'posthog-js'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'

interface ProjectCardLinkProps {
  href: string
  name: string
  logoSrc: string
  status: string
  description: string
}

export function ProjectCardLink({ href, name, logoSrc, status, description }: ProjectCardLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-[#E5E7EB] bg-white hover:border-[#FF5F1F]/40 transition-all duration-300"
      onClick={() => posthog.capture('project_card_clicked', { project: name, href })}
    >
      <div className="p-10 lg:p-14">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <Image
              src={logoSrc}
              alt={name}
              width={56}
              height={56}
              className="w-14 h-14 object-contain flex-shrink-0"
            />
            <div>
              <div className="font-mono text-[10px] tracking-widest text-[#FF5F1F] uppercase mb-6">
                {status}
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] tracking-[-0.02em] mb-4">
                {name}
              </h2>
              <p className="text-base text-[#6B7280] leading-[1.8] font-light max-w-2xl">
                {description}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-[#C0C0C0] group-hover:text-[#FF5F1F] transition-colors flex-shrink-0 mt-2" />
        </div>
      </div>
    </a>
  )
}
