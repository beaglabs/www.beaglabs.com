import { AnnouncementBanner } from "@/components/announcement-banner"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { CapabilitiesSection } from "@/components/capabilities-section"
import { CapabilityTracksStrip } from "@/components/capability-tracks-strip"
import { FeaturedWorkSection } from "@/components/featured-work-section"
import { EngagementModelSection } from "@/components/engagement-model-section"
import { FinalCTASection } from "@/components/final-cta-section"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />
      <HeroSection />
      <CapabilityTracksStrip />
      <CapabilitiesSection />
      <FeaturedWorkSection />
      <EngagementModelSection />
      <FinalCTASection />
      <SiteFooter />
    </main>
  )
}
