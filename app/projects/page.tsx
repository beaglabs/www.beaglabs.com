import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"

export default function ProjectsPage() {
  return (
    <main className="bg-white text-[#0a0a0a]">
      <Navbar />
      <section className="pt-28 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-20">
            <div className="font-mono text-xs tracking-widest text-[#FF5F1F] uppercase mb-6">
              Projects
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a0a0a] tracking-[-0.03em] mb-6">
              What we&apos;re building
            </h1>
            <p className="text-base text-[#6B7280] leading-[1.8] font-light">
              Open platforms and tools that advance AI research infrastructure.
            </p>
          </div>

          <a
            href="https://chaveta.beaglabs.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-[#E5E7EB] bg-white hover:border-[#FF5F1F]/40 transition-all duration-300"
          >
            <div className="p-10 lg:p-14">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <Image
                    src="/chavetalogo.png"
                    alt="Chaveta"
                    width={56}
                    height={56}
                    className="w-14 h-14 object-contain flex-shrink-0"
                  />
                  <div>
                    <div className="font-mono text-[10px] tracking-widest text-[#FF5F1F] uppercase mb-6">
                      Active &mdash; 2026
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-[#0a0a0a] tracking-[-0.02em] mb-4">
                      Chaveta
                    </h2>
                    <p className="text-base text-[#6B7280] leading-[1.8] font-light max-w-2xl">
                      Agentic platform for curating synthetic datasets for training and robotics
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#C0C0C0] group-hover:text-[#FF5F1F] transition-colors flex-shrink-0 mt-2" />
              </div>
            </div>
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
