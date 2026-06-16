import Link from 'next/link'

export function DraftBanner() {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2 flex items-center justify-between">
        <p className="text-sm text-amber-800">
          You are viewing a draft.
        </p>
        <Link
          href="/api/disable-draft"
          className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          Exit preview mode
        </Link>
      </div>
    </div>
  )
}
