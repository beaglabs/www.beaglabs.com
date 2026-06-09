"use client"

import { ArrowUpRight } from "lucide-react"
import Image from "next/image"

export function ApproachSection() {
  return (
    <section id="projects" className="relative bg-[#FAFAFA] py-32 px-6 lg:px-8 border-t border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
          <div className="lg:col-span-4">
            <div className="font-mono text-xs tracking-widest text-[#FF5F1F] uppercase mb-6">
              Projects
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a0a0a] tracking-[-0.03em]">
              What we&apos;re
              <br />
              building
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-6 flex items-end">
            <p className="text-base text-[#6B7280] leading-[1.8] font-light">
              Open platforms and tools that advance AI research infrastructure.
            </p>
          </div>
        </div>

        <a
          href="https://chaveta.beaglabs.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block border border-[#E5E7EB] bg-white hover:border-[#FF5F1F]/40 transition-all duration-300"
        >
          <div className="p-10 lg:p-14">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Image
                  src="/chavetalogo.png"
                  alt="Chaveta"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain flex-shrink-0"
                />
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-[#FF5F1F] uppercase mb-6">
                    Active &mdash; 2026
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] tracking-[-0.02em] mb-4">
                    Chaveta
                  </h3>
                  <p className="text-base text-[#6B7280] leading-[1.8] font-light max-w-2xl">
                    Agentic platform for curating synthetic datasets for training and robotics. 
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#C0C0C0] group-hover:text-[#FF5F1F] transition-colors flex-shrink-0 mt-2" />
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}
