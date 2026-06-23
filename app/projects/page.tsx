import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { ProjectCardLink } from "@/components/project-card-link"

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

          <ProjectCardLink
            href="https://chaveta.beaglabs.com/"
            name="Chaveta"
            logoSrc="/chavetalogo.png"
            status="Active — 2026"
            description="Agentic platform for curating synthetic datasets for training and robotics"
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
