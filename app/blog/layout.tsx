import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f6f4ef] pt-16">
        {children}
      </div>
      <SiteFooter />
    </>
  )
}
