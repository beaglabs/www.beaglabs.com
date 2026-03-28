"use client"

import { useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { TextScramble } from "./text-scramble"

export function HeroSection() {
  const [email, setEmail] = useState("")
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

          {/* Email signup */}
          <div className="mb-12">
            <div className="flex max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent border border-[#F5E6C8]/30 px-4 py-3 font-mono text-sm text-[#F5E6C8] placeholder:text-[#F5E6C8]/30 focus:outline-none focus:border-[#F5E6C8]/60 transition-colors"
              />
              <button className="bg-[#F5E6C8] text-[#141414] px-6 py-3 font-mono text-sm font-semibold tracking-wider flex items-center gap-2 hover:bg-[#F5E6C8]/90 transition-colors">
                ENTER
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="font-mono text-xs text-[#F5E6C8]/40 mt-3 tracking-wide">
              [ BY SIGNING UP, YOU AGREE TO OUR PRIVACY POLICY ]
            </p>
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
        <div>[ BETA 2026 ]</div>
        <div>SECURE COMMUNITY PROTOCOL</div>
      </div>
    </section>
  )
}
