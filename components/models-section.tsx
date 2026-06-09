"use client"

import { TextScramble } from "./text-scramble"
import { Hash, Layers, GitBranch, Box, Zap } from "lucide-react"

const architecture = [
  {
    label: "Categorical Attention",
    description: "Token routing is partitioned across a learned set of category heads, each specialized for a subdomain of the input space. This replaces monolithic self-attention with structured, type-aware routing that reduces interference between unrelated entity classes.",
    icon: Layers,
  },
  {
    label: "Murmuration Routing",
    description: "Inspired by collective flocking behavior, murmuration routing directs token flow through the attention heads using a lightweight gating network that adapts per-token. The result is dynamic, context-dependent attention allocation without the quadratic cost of full cross-attention.",
    icon: GitBranch,
  },
  {
    label: "Hash-Based Entity Decoder",
    description: "Entity identifiers are encoded as compact 17-bit hashes packing type, class, scope, arity, role, and morphism into a single integer < 131072. The decoder maps these hashes to canonical entity representations, providing reliable grounding without lookup tables or string matching.",
    icon: Hash,
  },
  {
    label: "Fixed Typed Action Vocabulary",
    description: "The model operates over a closed set of typed actions, each with a known arity and domain/range specification. This guarantees well-formed outputs at the schema level and eliminates hallucination of invalid operations.",
    icon: Box,
  },
  {
    label: "Efficient Inference",
    description: "With 17-bit entity representations and partitioned attention, beag-starling-v0 is designed for low-latency inference on commodity hardware. No KV-cache explosion, no dynamic batching overhead.",
    icon: Zap,
  },
]

const bitLayout = [
  { field: "type", bits: "5 bits", range: "0—31", desc: "Entity type (person, device, policy, role, etc.)" },
  { field: "class", bits: "6 bits", range: "0—63", desc: "Subtype classification within the type" },
  { field: "scope", bits: "3 bits", range: "0—7", desc: "Visibility / tenancy partition" },
  { field: "arity", bits: "1 bit", range: "0—1", desc: "Number of required arguments" },
  { field: "role", bits: "1 bit", range: "0—1", desc: "Caller (0) or target (1)" },
  { field: "morphism", bits: "1 bit", range: "0—1", desc: "Static (0) or dynamic (1) entity" },
]

export function ModelsSection() {
  return (
    <section id="models" className="relative bg-black py-32 px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-[#b3ddbb]/10" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-[#b3ddbb]/10" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-px bg-[#b3ddbb]/30" />
            <span className="font-mono text-xs tracking-[0.25em] text-[#4a6653]">
              RESEARCH
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-[#b3ddbb] tracking-[-0.02em] mb-4">
            <TextScramble text="BEAG-STARLING-V0" autoStart />
          </h2>
          <div className="flex items-center gap-3 mb-6 mt-4">
            <span className="font-mono text-xs text-[#8bc49a] border border-[#8bc49a]/30 px-3 py-1">PREPRINT</span>
            <span className="font-mono text-xs text-[#4a6653]">May 2026</span>
            <span className="font-mono text-xs text-[#4a6653]">Beag Labs</span>
          </div>
        </div>

        {/* Abstract */}
        <div className="mb-16">
          <h3 className="font-mono text-sm tracking-[0.15em] text-[#b3ddbb] mb-6">ABSTRACT</h3>
          <p className="text-[#6b8f75] leading-relaxed max-w-3xl">
            We introduce beag-starling-v0, a research model that replaces monolithic self-attention with
            categorical attention — a structured routing mechanism that partitions token interactions across
            learned category heads. Combined with a hash-based entity decoder that packs type, class, scope,
            arity, role, and morphism into 17-bit identifiers, the model achieves reliable entity grounding
            without external knowledge bases. The architecture uses murmuration-style routing, a lightweight
            gating network that dynamically allocates tokens to category heads, reducing inter-class interference
            while maintaining sub-quadratic complexity.
          </p>
        </div>

        {/* Architecture diagram */}
        <div className="mb-16">
          <h3 className="font-mono text-sm tracking-[0.15em] text-[#b3ddbb] mb-8">ARCHITECTURE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a2a1f]">
            {architecture.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="bg-black p-8 hover:bg-[#0a0d0a] transition-colors">
                  <Icon className="w-5 h-5 text-[#4a6653] mb-4" />
                  <h4 className="font-mono text-sm font-bold text-[#b3ddbb] mb-3 tracking-[-0.01em]">
                    {item.label}
                  </h4>
                  <p className="text-sm text-[#6b8f75] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Entity hash encoding */}
        <div className="mb-16">
          <h3 className="font-mono text-sm tracking-[0.15em] text-[#b3ddbb] mb-8">
            ENTITY HASH ENCODING
          </h3>
          <p className="text-[#6b8f75] leading-relaxed max-w-3xl mb-8">
            Every entity is represented as a single 17-bit integer. The encoding packs six categorical
            fields into a compact binary representation, enabling fast hash-based lookups and type-level
            operations without string parsing or external vocabularies.
          </p>

          {/* Bit layout visualization */}
          <div className="bg-[#050505] border border-[#1a2a1f] p-6 mb-4 font-mono">
            <div className="text-xs text-[#4a6653] mb-4">BIT LAYOUT (17 bits)</div>
            <div className="flex items-center gap-0 mb-4 overflow-x-auto">
              <div className="bg-[#0a1a10] border border-[#1a3a22] px-3 py-2 text-center min-w-[60px]">
                <div className="text-xs text-[#8bc49a]">ttttt</div>
                <div className="text-[10px] text-[#4a6653]">type</div>
                <div className="text-[10px] text-[#3d5a44]">5b</div>
              </div>
              <div className="bg-[#0a0d0a] border border-[#1a2a1f] px-3 py-2 text-center min-w-[72px]">
                <div className="text-xs text-[#5eaa6d]">cccccc</div>
                <div className="text-[10px] text-[#4a6653]">class</div>
                <div className="text-[10px] text-[#3d5a44]">6b</div>
              </div>
              <div className="bg-[#0a0d0a] border border-[#1a2a1f] px-3 py-2 text-center min-w-[48px]">
                <div className="text-xs text-[#4a6653]">sss</div>
                <div className="text-[10px] text-[#4a6653]">scope</div>
                <div className="text-[10px] text-[#3d5a44]">3b</div>
              </div>
              <div className="bg-[#0a0d0a] border border-[#1a2a1f] px-3 py-2 text-center min-w-[36px]">
                <div className="text-xs text-[#3d5a44]">a</div>
                <div className="text-[10px] text-[#4a6653]">arity</div>
                <div className="text-[10px] text-[#3d5a44]">1b</div>
              </div>
              <div className="bg-[#0a0d0a] border border-[#1a2a1f] px-3 py-2 text-center min-w-[36px]">
                <div className="text-xs text-[#3d5a44]">r</div>
                <div className="text-[10px] text-[#4a6653]">role</div>
                <div className="text-[10px] text-[#3d5a44]">1b</div>
              </div>
              <div className="bg-[#0a0d0a] border border-[#1a2a1f] px-3 py-2 text-center min-w-[36px]">
                <div className="text-xs text-[#3d5a44]">m</div>
                <div className="text-[10px] text-[#4a6653]">morphism</div>
                <div className="text-[10px] text-[#3d5a44]">1b</div>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="bg-[#050505] border border-[#1a2a1f] p-6 font-mono text-sm overflow-x-auto">
            <div className="text-xs text-[#4a6653] mb-4">EXAMPLE</div>
            <div className="text-[#8bc49a] mb-1">
              hash = 30173 = 0b 00111 010111 011 1 0 1
            </div>
            <div className="text-[#4a6653] mb-4 text-xs">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;type&nbsp;&nbsp;class&nbsp;&nbsp;scp a r m
            </div>
            <div className="text-[#6b8f75]">
              type=7, class=23, scope=3, arity=1, role=0, morphism=1
            </div>
            <div className="text-[#4a6653] text-xs mt-2">
              A type-7, class-23 entity in scope 3 — high arity, caller role, dynamic morphism.
              All packed into a single int &lt; 131072.
            </div>
          </div>

          {/* Field table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2a1f]">
                  <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">FIELD</th>
                  <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">BITS</th>
                  <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">RANGE</th>
                  <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {bitLayout.map((row) => (
                  <tr key={row.field} className="border-b border-[#1a2a1f]/50">
                    <td className="font-mono text-xs text-[#b3ddbb] p-4">{row.field}</td>
                    <td className="font-mono text-xs text-[#8bc49a] p-4">{row.bits}</td>
                    <td className="font-mono text-xs text-[#4a6653] p-4">{row.range}</td>
                    <td className="font-mono text-xs text-[#6b8f75] p-4">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status banner */}
        <div className="bg-[#050505] border border-[#1a2a1f] p-8 flex items-start gap-4">
          <span className="relative flex h-3 w-3 mt-0.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b3ddbb] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#b3ddbb]" />
          </span>
          <div>
            <h4 className="font-mono text-sm font-bold text-[#b3ddbb] mb-2 tracking-[-0.01em]">
              IN ACTIVE RESEARCH
            </h4>
            <p className="text-sm text-[#6b8f75] leading-relaxed">
              beag-starling-v0 is under active development. We are currently training on
              structured operational datasets and evaluating against standard entity grounding
              benchmarks. Preprint and weights will be released upon completion of the
              first evaluation milestone.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
