"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { TextScramble } from "./text-scramble"

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "ENTERPRISE",
      subtitle: "SCSS FIREWALL",
      tagline: "INSTALL-TIME SOFTWARE SUPPLY CHAIN SECURITY FIREWALL",
      description: "Protect your software supply chain from threats at install time with our enterprise-grade SSCS firewall.",
    },
    {
      title: "CONTINUOUS",
      subtitle: "ANALYSIS", 
      tagline: "GITHUB ACTIONS + VS CODE",
      description: "Integrate security scanning directly into your CI/CD pipeline and development workflow with seamless native extensions.",
    },
    {
      title: "TRUSTED",
      subtitle: "PIPELINES",
      tagline: "VERIFIED ARTIFACTS",
      description: "Hook into NPM lifecycle hooks and scan Rust, Maven, Python, and Docker dependencies for vulnerabilities and malicious code.",
    },
  ]

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section className="relative min-h-screen bg-white text-black overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-6 left-0 right-0 z-20 flex items-start justify-between px-8">
        <Image
          src="/images/gardens-logo.png"
          alt="SSCS Logo"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
        <div className="hidden sm:block font-mono text-xs tracking-[0.2em] text-black/50 text-right">
          <div>PLATFORM: GITHUB ACTIONS</div>
          <div>INTEGRATION: VS CODE EXT</div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-24">
          {/* Slide counter */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-8 h-px bg-black/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-black/60">
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
            <span className="font-mono text-sm tracking-[0.3em] text-black/70">
              {slides[currentSlide].tagline}
            </span>
          </div>

          {/* Description */}
          <p className="text-lg lg:text-xl text-black/70 max-w-md leading-relaxed mb-12">
            {slides[currentSlide].description}
          </p>

          {/* CTA buttons */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              {/* GitHub Actions */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border border-black/30 px-5 py-3 hover:border-black/60 hover:bg-black/5 transition-all group"
              >
                <svg role="img" className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><title>GitHub Actions</title><path d="M10.984 13.836a.5.5 0 0 1-.116-.025L6.558 12.28a.5.5 0 0 1 .261-.964l4.31 1.531a.5.5 0 0 1-.145.989zm.384-2.324a.5.5 0 0 1-.116-.025l-5.146-1.83a.5.5 0 0 1 .261-.964l5.146 1.83a.5.5 0 0 1-.145.989zm.384-2.324a.5.5 0 0 1-.116-.025l-5.146-1.83a.5.5 0 0 1 .261-.964l5.146 1.83a.5.5 0 0 1-.145.989zM8.42 17.5H6a.5.5 0 0 1 0-1h2.42a.5.5 0 0 1 0 1zm3.184-3.833a.5.5 0 0 1-.116-.025l-5.146-1.83a.5.5 0 0 1 .261-.964l5.146 1.83a.5.5 0 0 1-.145.989zM12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zm0-1a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/></svg>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-black/50">INSTALL VIA</div>
                  <div className="font-mono text-sm font-semibold tracking-wider text-black">GITHUB ACTIONS</div>
                </div>
              </a>

              {/* VS Code Extension */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border border-black/30 px-5 py-3 hover:border-black/60 hover:bg-black/5 transition-all group"
              >
                <Image
                  src="https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fcommons.wikimedia.org%2Fwiki%2FFile%3AVisual_Studio_Code_1.35_icon.svg&opi=89978449"
                  alt="VS Code Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 flex-shrink-0"
                />
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-black/50">GET THE</div>
                  <div className="font-mono text-sm font-semibold tracking-wider text-black">VS CODE EXT</div>
                </div>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full border border-black/30 flex items-center justify-center hover:border-black/60 hover:bg-black/5 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full border border-black/30 flex items-center justify-center hover:border-black/60 hover:bg-black/5 transition-all"
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
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#000" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Demo video */}
          <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="relative">
              <video
                src="/gardens-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-[500px] h-[300px] object-cover rounded-lg shadow-2xl border border-black/10"
              />

              {/* Floating badge */}
              <div className="absolute -left-16 top-1/3 bg-black text-white px-4 py-2 font-mono text-xs tracking-wider">
                [ DEMO VIDEO ]
              </div>
            </div>
          </div>

          {/* Navigation arrow on right edge */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border border-black/20 flex items-center justify-center hover:bg-black/5 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Bottom archive label */}
      <div className="absolute bottom-8 left-8 font-mono text-xs tracking-[0.2em] text-black/40">
        <div>[ 2026 ]</div>
        <div>SOFTWARE SUPPLY CHAIN SECURITY</div>
      </div>
    </section>
  )
}
