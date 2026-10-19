import { AnnouncementBanner } from "@/components/announcement-banner"
import { HeroSection } from "@/components/hero-section"
import Link from "next/link"
import { LogoCloud } from "@/components/logo-cloud"
import { ModernizationFeatureCarousel } from "@/components/modernization-feature-carousel"
import { FinalCTASection } from "@/components/final-cta-section"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <AnnouncementBanner />

      <HeroSection />
      <section className="border-y-[3px] border-black bg-white px-6 py-20"><div className="mx-auto max-w-[1200px]"><p className="font-mono text-xs font-black uppercase tracking-widest text-[#b33d0d]">The Agentic ERP That Builds Around Your Business</p><h2 className="mt-4 max-w-[1040px] text-4xl font-black tracking-tight md:text-6xl">We built the Agentic ERP That Builds Around Your Business.</h2><p className="mt-7 max-w-[860px] text-lg leading-8">Papyrus combines customizable enterprise data models, durable AI agents, workflow automation, forms, and integrations in one governed platform. Connect existing systems of record, model how your organization works, and automate complex multi-entity operations without rebuilding your infrastructure.</p><p className="mt-5 max-w-[860px] text-lg leading-8">Your ERP remains your system of record. Papyrus is the data-model-aware orchestration layer above it—including the legacy systems your business still depends on.</p><Link href="/agentic-erp" className="nb-btn-orange mt-8 inline-flex px-6 py-3">Explore Agentic ERP →</Link></div></section>
      <LogoCloud />
      <ModernizationFeatureCarousel />
      <FinalCTASection />
      <SiteFooter />
    </main>
  )
}
