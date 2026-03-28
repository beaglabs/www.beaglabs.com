"use client"

import { TextScramble } from "./text-scramble"

export function PlusSection() {
  return (
    <section className="bg-[#1a1a1a] py-32 px-8 lg:px-16 relative overflow-hidden">
      {/* Diagonal accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#F5E6C8]/5 transform skew-x-12 origin-top-right" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#F5E6C8]/30" />
              <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/50">
                COMMUNITY
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-[#F5E6C8] tracking-tight mb-8">
              <TextScramble text="JOIN THE" scrambleOnHover autoStart={false} />{" "}
              <TextScramble text="DISCORD" scrambleOnHover autoStart={false} />
            </h2>

            <p className="text-[#F5E6C8]/60 font-mono text-sm leading-relaxed mb-10 max-w-md">
              Connect with the Gardens community, get early access updates, share feedback,
              and talk directly with the team building the protocol.
            </p>

            <a
              href="https://discord.gg/D56kGpj2Ym"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#5865F2] text-white px-8 py-4 font-mono text-sm font-semibold tracking-wider hover:bg-[#4752C4] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              JOIN DISCORD
            </a>

            <p className="font-mono text-xs text-[#F5E6C8]/40 mt-4 tracking-wide">
              [ OPEN TO EVERYONE ]
            </p>
          </div>

          {/* Image */}
          <div className="border border-[#F5E6C8]/10 overflow-hidden">
            <img
              src="https://res.cloudinary.com/aenetworks/image/upload/c_fill,ar_2,w_3840,h_1920,g_auto/dpr_auto/f_auto/q_auto:eco/v1/gettyimages-1155878499?_a=BAVAZGB00"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
