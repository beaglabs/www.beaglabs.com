"use client"

import { TextScramble } from "./text-scramble"

export function PlusSection() {
  return (
    <section className="bg-white py-32 px-8 lg:px-16 relative overflow-hidden">
      {/* Diagonal accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-black/5 transform skew-x-12 origin-top-right" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-px bg-black/30" />
              <span className="font-mono text-sm tracking-[0.3em] text-black/50">
                INTEGRATIONS
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight mb-8">
              <TextScramble text="POLICY" scrambleOnHover autoStart={false} />{" "}
              <TextScramble text="DRIVEN" scrambleOnHover autoStart={false} />
            </h2>

            <p className="text-black/60 font-mono text-sm leading-relaxed mb-10 max-w-md">
              Our VS Code extension provides real-time insights into your project's dependencies, highlighting potential vulnerabilities and suggesting safer alternatives. Stay one step ahead with our proactive security analysis.
            </p>

            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 font-mono text-sm font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              VIEW POLICY REPO
            </a>
          </div>

          {/* Image */}
          <div className="border border-black/10 overflow-hidden">
            <img
              src="https://framerusercontent.com/images/ScHQsI9S54omDGzuGvi0FMp9Un0.webp?width=1920&height=960"
              alt="Code editor with security analysis"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
