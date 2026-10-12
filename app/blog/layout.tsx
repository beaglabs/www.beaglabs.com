import { SiteFooter } from '@/components/site-footer'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>

      <div className="min-h-screen bg-[#FAFAF9]">
        {children}
      </div>
      <SiteFooter />
    </>
  )
}
