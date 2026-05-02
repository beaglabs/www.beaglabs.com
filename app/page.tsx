import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ProtocolSection } from "@/components/protocol-section"
import { PlusSection } from "@/components/plus-section"
import { QualitySection } from "@/components/quality-section"
import { FAQSection } from "@/components/faq-section"
import { FooterCTA, Footer } from "@/components/footer-cta"

export default function Home() {
  return (
    <main className="bg-white">
      <HeroSection />
      <FeaturesSection />
      <ProtocolSection />
      <PlusSection />
      <QualitySection />
      <FAQSection />
      <FooterCTA />
      <Footer />
    </main>
  )
}
