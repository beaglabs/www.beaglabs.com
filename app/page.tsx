import { AnnouncementBanner } from "@/components/announcement-banner"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ModernizationFeatureCarousel } from "@/components/modernization-feature-carousel"
import { FinalCTASection } from "@/components/final-cta-section"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />
      <HeroSection />
      <ModernizationFeatureCarousel />
      <FinalCTASection />
      <SiteFooter />
    </main>
  )
}
