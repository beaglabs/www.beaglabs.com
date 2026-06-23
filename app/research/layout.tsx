import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FAFAF9]">
        {children}
      </div>
      <SiteFooter />
    </>
  )
}
