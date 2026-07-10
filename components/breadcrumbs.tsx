import Link from "next/link"

interface BreadcrumbItem {
  name: string
  url: string
}

const BASE_URL = 'https://www.beaglabs.com'

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = generateBreadcrumbJsonLd(items)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <li key={item.url} className="flex items-center gap-2">
                {isLast ? (
                  <span className="text-[#111] font-bold">{item.name}</span>
                ) : (
                  <>
                    <Link
                      href={item.url}
                      className="transition-colors hover:text-[#FF5F1F]"
                    >
                      {item.name}
                    </Link>
                    <span className="text-[#6B6B6B]">/</span>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
