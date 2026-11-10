import { SiteFooter } from '@/components/site-footer'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>

      <div className="min-h-screen bg-[#FDEEE1]">
        {children}
      </div>
      <SiteFooter />
    </>
  )
}
