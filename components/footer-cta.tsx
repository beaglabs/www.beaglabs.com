"use client"

import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { TextScramble } from "./text-scramble"

export function FooterCTA() {
  return (
    <section className="bg-neutral-50 py-32 px-8 lg:px-16 relative overflow-hidden">
      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-black/20" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-black/20" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-black/20" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-black/20" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tight mb-8">
          <TextScramble text="GET A 7-DAY FREE TRIAL" scrambleOnHover autoStart={false} />
        </h2>

        <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500" />
          </span>
          <span className="font-mono text-sm text-black/70">Gardens</span>
          <span className="font-mono text-xs text-black/40">No Credit Card Required</span>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          <span className="font-mono text-xs text-black/40">$2,400/mo</span>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-black border border-black/30 px-4 py-2 hover:bg-black/5 transition-colors ml-4"
          >
            START FREE TRIAL
            <ArrowRight className="w-3 h-3 inline ml-2" />
          </a>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-white py-16 px-8 lg:px-16 border-t border-black/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
          {/* Logo and info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/gardens-logo.png"
                alt="Gardens Logo"
                width={64}
                height={64}
              />
              <span className="font-mono text-lg font-semibold text-black">
                Gardens
              </span>
            </div>
            <p className="font-mono text-xs text-black/40 mb-4">
              The Dependency Risk Firewall
            </p>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-black/10 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-black/30">
              [ NPM ]
            </span>
            <span className="font-mono text-xs text-black/30">
              [ RUST ]
            </span>
            <span className="font-mono text-xs text-black/30">
              [ MAVEN ]
            </span>
            <span className="font-mono text-xs text-black/30">
              [ PYTHON ]
            </span>
            <span className="font-mono text-xs text-black/30">
              [ DOCKER ]
            </span>
            <Link href="/privacy" className="font-mono text-xs text-black/30 hover:text-black/60 transition-colors">
              PRIVACY POLICY
            </Link>
            <Link href="/terms" className="font-mono text-xs text-black/30 hover:text-black/60 transition-colors">
              TERMS OF SERVICE
            </Link>
            <Link href="/delete-account" className="font-mono text-xs text-black/30 hover:text-black/60 transition-colors">
              DELETE ACCOUNT
            </Link>
          </div>
          <p className="font-mono text-xs text-black/30">
            &copy; Atelier Logos, 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
