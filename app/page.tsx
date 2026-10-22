import { AnnouncementBanner } from "@/components/announcement-banner"
import { HeroSection } from "@/components/hero-section"
import { LogoCloud } from "@/components/logo-cloud"
import { ModernizationFeatureCarousel } from "@/components/modernization-feature-carousel"
import { PapyrusSection } from "@/components/papyrus-section"
import { FinalCTASection } from "@/components/final-cta-section"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <AnnouncementBanner />

      <HeroSection />
      <ModernizationFeatureCarousel />
      <PapyrusSection />
      <LogoCloud />
      <FinalCTASection />
      <SiteFooter />
    </main>
  )
}
