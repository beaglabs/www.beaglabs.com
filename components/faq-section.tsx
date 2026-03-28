"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { TextScramble } from "./text-scramble"

const faqs = [
  {
    id: "launch",
    question: "When does Gardens launch?",
    answer: "Gardens is developed by a small team in their spare time, so there's no ETA on a public launch. You can check out the Beta program if you're interested in trying it early.",
  },
  {
    id: "devices",
    question: "Which devices will Gardens support?",
    answer: "Gardens will support iOS, Android, Windows, macOS, and Linux. Web access is planned for a future release. All platforms use the same MLS encryption protocol.",
  },
  {
    id: "pricing",
    question: "How expensive will Gardens Plus be?",
    answer: "Gardens core features will always be free. Gardens Plus pricing is still being determined, but we're committed to keeping it accessible. Beta testers get extended free access.",
  },
  {
    id: "security",
    question: "How secure is MLS encryption?",
    answer: "MLS (Message Layer Security) is an IETF standard (RFC 9420) designed for secure group messaging. It provides forward secrecy, post-compromise security, and scalable group operations.",
  },
]

export function FAQSection() {
  const [openFaq, setOpenFaq] = useState<string | null>("launch")

  return (
    <section className="bg-[#0f0f0f] py-32 px-8 lg:px-16">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-px bg-[#F5E6C8]/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-[#F5E6C8]/50">
              DOCUMENTATION
            </span>
            <div className="w-12 h-px bg-[#F5E6C8]/30" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#F5E6C8] tracking-tight">
            <TextScramble text="FAQ" scrambleOnHover autoStart={false} />
          </h2>
          <p className="text-[#F5E6C8]/50 font-mono text-sm mt-4">
            Everything you need to know about Gardens.
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`border-b border-[#F5E6C8]/10 ${
                openFaq === faq.id ? "bg-[#141414]" : ""
              }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full py-6 px-6 flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[#F5E6C8]/30">
                    0{index + 1}
                  </span>
                  <span className="font-mono text-sm text-[#F5E6C8] group-hover:text-[#F5E6C8]/80 transition-colors">
                    {faq.question}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-[#F5E6C8]/50 transition-transform shrink-0 ${
                    openFaq === faq.id ? "rotate-90" : ""
                  }`}
                />
              </button>
              
              {openFaq === faq.id && (
                <div className="px-6 pb-6 pl-16">
                  <p className="text-[#F5E6C8]/60 font-mono text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
