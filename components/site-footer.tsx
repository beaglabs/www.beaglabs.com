import Link from 'next/link'

const footerColumns = [
  {
    title: 'Models',
    links: [
      { label: 'Overview', href: '/models' },
      { label: 'Capabilities', href: '/#capabilities' },
      { label: 'Training', href: '/training' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Papyrus', href: '/products/papyrus' },
      { label: 'Papyrus Trust Center', href: '/trust/papyrus' },
      { label: 'Blog', href: '/blog' },
      { label: 'Cookbook', href: '/cookbook' },
      { label: 'Glossary', href: '/glossary' },
      { label: 'Use Cases', href: '/use-cases' },
      { label: 'Comparisons', href: '/compare' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'GitHub', href: 'https://github.com/beaglabs' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Imprint', href: '/imprint' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-[#ff5f1f] px-6 py-14 text-[#111] lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 border-b-[3px] border-[#111] pb-8">
          <div className="display-black max-w-[900px] text-[44px] leading-[0.95] sm:text-[58px] lg:text-[72px]">
            Tools for a more secure tomorrow.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:gap-7">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="border-[2px] border-[#111] bg-[#111] px-2.5 py-1 text-[18px] font-extrabold tracking-[-0.04em] text-white">
                B_
              </span>
              <span className="font-display text-[18px] font-black uppercase tracking-[0.02em] text-[#111]">
                Beag Labs
              </span>
            </div>
            <p className="max-w-[280px] text-[14px] font-semibold leading-[1.7] text-[#222]">
              Small models for government and high-trust industries. Deployable anywhere.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-mono text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#111]">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-[14px] text-[#222]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-semibold underline decoration-transparent decoration-2 underline-offset-4 transition-all hover:decoration-[#111]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t-[3px] border-[#111] pt-8 lg:flex-row">
          <p className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#222]">
            &copy; {new Date().getFullYear()} BEAG LABS. ALL RIGHTS RESERVED.
          </p>
          <a
            href="https://github.com/beaglabs"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#222] underline decoration-transparent decoration-2 underline-offset-4 transition-all hover:decoration-[#111]"
          >
            GITHUB
          </a>
        </div>
      </div>
    </footer>
  )
}
