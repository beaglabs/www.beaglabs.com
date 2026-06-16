"use client"

import { ArrowUpRight } from "lucide-react"
import Image from "next/image"

export function ProjectsSection() {
  return (
    <section id="projects" className="relative bg-[#FAFAF9] py-24 lg:py-28 px-6 lg:px-8 border-t border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
              Projects
            </div>
            <h2 className="text-[28px] lg:text-[32px] font-medium text-[#111] tracking-[-0.02em] leading-[1.2]">
              What we&apos;re
              <br />
              building
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-7 flex items-end">
            <p className="text-[15px] text-[#555] leading-[1.75]">
              Open platforms and tools that advance AI research infrastructure.
            </p>
          </div>
        </div>

        {/* Project card */}
        <a
          href="https://chaveta.beaglabs.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.10)] transition-colors duration-300"
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
                  <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
                    Active — 2026
                  </div>
                  <h3 className="text-2xl lg:text-[28px] font-medium text-[#111] tracking-[-0.02em] mb-4">
                    Chaveta
                  </h3>
                  <p className="text-[15px] text-[#555] leading-[1.75] max-w-2xl">
                    Agentic platform for curating synthetic datasets for training and robotics.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#999] group-hover:text-[#FF5F1F] transition-colors flex-shrink-0 mt-2" />
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}
