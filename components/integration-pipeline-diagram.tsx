"use client"

import { Brain, Database, Globe, FolderArchive, Radio } from "lucide-react"

const sources = [
  { icon: Database, label: "Postgres" },
  { icon: Globe, label: "REST API" },
  { icon: FolderArchive, label: "Files" },
  { icon: Radio, label: "Streams" },
]

export function IntegrationPipelineDiagram() {
  return (
    <div className="relative overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
          Data flow
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="font-mono text-[10px] text-[#22c55e]">LIVE</span>
        </div>
      </div>

      <div className="relative flex flex-col gap-0">
        {/* Source systems — top row */}
        <div className="grid grid-cols-4 gap-2 pb-4">
          {sources.map((src, i) => (
            <div
              key={src.label}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.6)] px-2 py-3"
            >
              <src.icon className="h-5 w-5 text-[#8B7355]" strokeWidth={1.5} />
              <span className="font-mono text-[10px] text-[#555]">{src.label}</span>
              <span className="h-1 w-1 rounded-full bg-[#22c55e]" />
            </div>
          ))}
        </div>

        {/* Animated arrows down */}
        <div className="flex justify-center gap-2 pb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: "25%" }}>
              <span className="h-1 w-1 rounded-full bg-[#8B7355] flow-dot" style={{ animationDelay: `${i * 0.15}s` }} />
              <span className="h-1 w-1 rounded-full bg-[#8B7355] flow-dot" style={{ animationDelay: `${i * 0.15 + 0.2}s` }} />
              <span className="h-1 w-1 rounded-full bg-[#8B7355] flow-dot" style={{ animationDelay: `${i * 0.15 + 0.4}s` }} />
            </div>
          ))}
        </div>

        {/* Kafka center */}
        <div className="flex justify-center pb-3">
          <div className="relative flex items-center gap-3 rounded-2xl bg-[#111] px-5 py-3">
            <img
              src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/kafka.svg"
              alt="Kafka"
              className="h-7 w-7 brightness-0 invert"
            />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              Kafka
            </span>
            <div className="absolute -inset-[2px] rounded-2xl border border-[#8B7355]/30 animate-pulse" />
          </div>
        </div>

        {/* Animated arrows out */}
        <div className="flex justify-center gap-2 pb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: "25%" }}>
              <span className="h-1 w-1 rounded-full bg-[#C7661D] flow-dot" style={{ animationDelay: `${i * 0.15}s` }} />
              <span className="h-1 w-1 rounded-full bg-[#C7661D] flow-dot" style={{ animationDelay: `${i * 0.15 + 0.2}s` }} />
              <span className="h-1 w-1 rounded-full bg-[#C7661D] flow-dot" style={{ animationDelay: `${i * 0.15 + 0.4}s` }} />
            </div>
          ))}
        </div>

        {/* Domain model outputs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.6)] px-2 py-3">
            <Brain className="h-5 w-5 text-[#8B7355]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-[#555]">Domain Schema</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.6)] px-2 py-3">
            <Brain className="h-5 w-5 text-[#8B7355]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-[#555]">Entities</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.6)] px-2 py-3">
            <Brain className="h-5 w-5 text-[#8B7355]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-[#555]">Transforms</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl bg-[#111] px-2 py-3">
            <Brain className="h-5 w-5 text-[#FFB074]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] font-semibold text-[#FFB074]">
              YourModel&trade;
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        .flow-dot {
          animation: fade 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}