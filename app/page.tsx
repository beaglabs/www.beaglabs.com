import { AnnouncementBanner } from "@/components/announcement-banner"
import { HomePage } from "@/components/home/home-page"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="hero-paper text-foreground">
      <AnnouncementBanner />

      <HomePage />
      <SiteFooter />
    </main>
  )
}
