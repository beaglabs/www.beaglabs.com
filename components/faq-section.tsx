"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { TextScramble } from "./text-scramble"

const faqs = [
  {
    id: "trial",
    question: "How does the 7-day free trial work?",
    answer: "Sign up and get full access to all SSCS features for 7 days — no credit card required. Cancel anytime before the trial ends and pay nothing.",
  },
  {
    id: "pricing",
    question: "How much does Gardens cost?",
    answer: "Gardens is $2,400 per month for unlimited repositories, users, and scans. The 7-day free trial lets you evaluate everything before committing.",
  },
  {
    id: "languages",
    question: "Which package managers are supported?",
    answer: "We support NPM (with lifecycle hook analysis), Rust Cargo, Maven, Python PyPI, and Docker. More ecosystems are added regularly based on customer demand.",
  },
  {
    id: "security",
    question: "How does the NPM lifecycle hook protection work?",
    answer: "Our agent intercepts NPM install hooks (preinstall, postinstall, pre/post publish) and runs static analysis before allowing execution. Malicious or suspicious scripts are flagged and blocked automatically.",
  },
]

export function FAQSection() {
  const [openFaq, setOpenFaq] = useState<string | null>("trial")

  return (
    <section className="bg-white py-32 px-8 lg:px-16">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-px bg-black/30" />
            <span className="font-mono text-sm tracking-[0.3em] text-black/50">
              DOCUMENTATION
            </span>
            <div className="w-12 h-px bg-black/30" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight">
            <TextScramble text="FAQ" scrambleOnHover autoStart={false} />
          </h2>
          <p className="text-black/50 font-mono text-sm mt-4">
            Everything you need to know about SSCS.
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`border-b border-black/10 ${
                openFaq === faq.id ? "bg-neutral-50" : ""
              }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full py-6 px-6 flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-black/30">
                    0{index + 1}
                  </span>
                  <span className="font-mono text-sm text-black group-hover:text-black/80 transition-colors">
                    {faq.question}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-black/50 transition-transform shrink-0 ${
                    openFaq === faq.id ? "rotate-90" : ""
                  }`}
                />
              </button>
              
              {openFaq === faq.id && (
                <div className="px-6 pb-6 pl-16">
                  <p className="text-black/60 font-mono text-sm leading-relaxed">
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
