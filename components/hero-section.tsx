"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { TextScramble } from "./text-scramble"

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "SECURE",
      subtitle: "GARDENS",
      tagline: "MLS ENCRYPTED MESSAGING",
      description: "Where privacy meets community — end-to-end encrypted group conversations for affinity networks.",
    },
    {
      title: "PRIVATE",
      subtitle: "CHANNELS", 
      tagline: "ZERO KNOWLEDGE ARCHITECTURE",
      description: "Your messages, your keys. We cannot read your conversations, even if we wanted to.",
    },
    {
      title: "TRUSTED",
      subtitle: "GROUPS",
      tagline: "VERIFIED COMMUNITIES",
      description: "Build and join communities with people who share your interests, secured by cryptographic trust.",
    },
  ]

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section className="relative min-h-screen bg-[#141414] text-[#F5E6C8] overflow-hidden">
      {/* Technical corner details */}
      <div className="absolute top-6 left-8 font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/50">
        GARDENS_CORE
      </div>
      <div className="absolute top-6 right-8 font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/50 text-right">
        <div>PROTOCOL: MLS v1.0</div>
        <div>ENCRYPTION: AES-256</div>
      </div>

      {/* Main content grid */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-24">
          {/* Slide counter */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-8 h-px bg-[#F5E6C8]/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/60">
              0{currentSlide + 1} / 0{slides.length}
            </span>
          </div>

          {/* Main title */}
          <div className="mb-6">
            <h1 className="text-6xl lg:text-8xl font-bold tracking-[-0.02em] leading-[0.9]">
              <TextScramble 
                text={slides[currentSlide].title} 
                key={`title-${currentSlide}`}
                className="block"
              />
              <TextScramble 
                text={slides[currentSlide].subtitle}
                key={`subtitle-${currentSlide}`}
                className="block"
                duration={1800}
              />
            </h1>
          </div>

          {/* Tagline */}
          <div className="mb-8">
            <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/70">
              {slides[currentSlide].tagline}
            </span>
          </div>

          {/* Description */}
          <p className="text-lg lg:text-xl text-[#F5E6C8]/70 max-w-md leading-relaxed mb-12">
            {slides[currentSlide].description}
          </p>

          {/* Download buttons */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              {/* Google Play */}
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border border-[#F5E6C8]/30 px-5 py-3 hover:border-[#F5E6C8]/60 hover:bg-[#F5E6C8]/5 transition-all group"
              >
                <svg role="img" className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><title>Google Play</title><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/></svg>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[#F5E6C8]/50">GET IT ON</div>
                  <div className="font-mono text-sm font-semibold tracking-wider text-[#F5E6C8]">GOOGLE PLAY</div>
                </div>
              </a>

              {/* App Store — coming soon */}
              <div className="flex items-center gap-3 border border-[#F5E6C8]/15 px-5 py-3 opacity-50 cursor-not-allowed relative">
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[#F5E6C8]/50">COMING SOON</div>
                  <div className="font-mono text-sm font-semibold tracking-wider text-[#F5E6C8]">APP STORE</div>
                </div>
                <span className="absolute -top-2 -right-2 bg-[#F5E6C8]/10 border border-[#F5E6C8]/20 font-mono text-[9px] tracking-wider px-1.5 py-0.5 text-[#F5E6C8]/60">
                  SOON
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full border border-[#F5E6C8]/30 flex items-center justify-center hover:border-[#F5E6C8]/60 hover:bg-[#F5E6C8]/5 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full border border-[#F5E6C8]/30 flex items-center justify-center hover:border-[#F5E6C8]/60 hover:bg-[#F5E6C8]/5 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right side - Visual */}
        <div className="hidden lg:flex w-1/2 relative items-center justify-center">
          {/* Decorative grid lines */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#F5E6C8" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Phone mockup */}
          <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[280px] h-[580px] bg-[#1a1a1a] rounded-[40px] p-2 shadow-2xl border border-[#F5E6C8]/10">
                <div className="w-full h-full bg-[#0a0a0a] rounded-[32px] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />
                  
                  {/* Screenshot */}
                  <Image
                    src="/images/app-screenshot.png"
                    alt="Gardens App"
                    fill
                    priority
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -left-16 top-1/3 bg-[#F5E6C8] text-[#141414] px-4 py-2 font-mono text-xs tracking-wider">
                [ MLS SECURED ]
              </div>
            </div>
          </div>

          {/* Navigation arrow on right edge */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#F5E6C8]/20 flex items-center justify-center hover:bg-[#F5E6C8]/10 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-[#F5E6C8]" />
          </button>
        </div>
      </div>

      {/* Bottom archive label */}
      <div className="absolute bottom-8 left-8 font-mono text-xs tracking-[0.2em] text-[#F5E6C8]/40">
        <div>[ 2026 ]</div>
        <div>SECURE COMMUNITY PROTOCOL</div>
      </div>
    </section>
  )
}
