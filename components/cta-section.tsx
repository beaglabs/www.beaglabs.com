"use client"

export function CTASection() {
  return (
    <section id="contact" className="relative bg-white py-32 px-6 lg:px-8 border-t border-[#E5E7EB]">
      <div className="max-w-4xl mx-auto">
        <div className="border border-[#E5E7EB] p-12 lg:p-20">
          <div className="font-mono text-xs tracking-widest text-[#FF5F1F] uppercase mb-8">
            Engage With Us
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-[#0a0a0a] tracking-[-0.03em] mb-6">
            Ready to solve hard problems
            <br />
            with applied AI research?
          </h2>

          <p className="text-base text-[#6B7280] leading-[1.8] font-light max-w-xl mb-12">
            We partner with teams that have complex, high-stakes AI challenges. Tell us about your problem — we&apos;ll tell you how our research can solve it.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <a
              href="mailto:contact@beaglabs.com"
              className="inline-flex items-center gap-3 font-mono text-xs tracking-wide text-white bg-[#0a0a0a] px-7 py-4 hover:bg-[#FF5F1F] transition-colors"
            >
              CONTACT US
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <span className="font-mono text-xs text-[#6B7280] tracking-wide self-center">
              contact@beaglabs.com
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
