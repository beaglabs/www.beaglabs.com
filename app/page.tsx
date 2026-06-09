import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { CapabilitiesSection } from "@/components/capabilities-section"
import { ApproachSection } from "@/components/approach-section"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="bg-white text-[#0a0a0a]">
      <Navbar />
      <HeroSection />
      <CapabilitiesSection />
      <ApproachSection />
      <SiteFooter />
    </main>
  )
}
