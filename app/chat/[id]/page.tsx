import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { ChatView } from './chat-view'

type Params = Promise<{ id: string }>
type Search = Promise<{ q?: string }>

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Search
}) {
  const { id } = await params
  const { q } = await searchParams

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />
      <main className="flex flex-1 flex-col pt-[calc(4rem+2.375rem)]">
        <ChatView id={id} initialMessage={q} />
      </main>
      <SiteFooter />
    </div>
  )
}
