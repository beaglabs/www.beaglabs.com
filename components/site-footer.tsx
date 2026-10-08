import Link from 'next/link'
import Image from 'next/image'

const footerColumns = [
  { title: 'Solutions', links: [
    { label: 'Document Automation', href: '/solutions/document-automation' },
    { label: 'Internal App Factory', href: '/solutions/internal-app-factory' },
    { label: 'Agentic Modernization', href: '/solutions/agentic-modernization' },
    { label: 'All Capabilities', href: '/capabilities' },
  ] },
  { title: 'Explore', links: [
    { label: 'Papyrus', href: '/products/papyrus' },
    { label: 'Use Cases', href: '/use-cases' },
    { label: 'Comparisons', href: '/compare' },
    { label: 'Trust Center', href: '/trust/papyrus' },
  ] },
  { title: 'Resources', links: [
    { label: 'Glossary', href: '/glossary' },
    { label: 'Blog', href: '/blog' },
    { label: 'Partners', href: '/partners' },
    { label: 'Support', href: '/support' },
  ] },
  { title: 'Company & Legal', links: [
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy-policy' },
    { label: 'Terms', href: '/terms-of-service' },
    { label: 'Imprint', href: '/imprint' },
  ] },
]

export function SiteFooter() {
  return (
    <footer className="bg-[#ff5f1f] px-6 py-14 text-[#111] lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 border-b-[3px] border-[#111] pb-8">
          <div className="display-black max-w-[900px] text-[44px] leading-[0.95] sm:text-[58px] lg:text-[72px]">
            Documents to decisions. Legacy systems to modern apps.
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
              Your documents, apps and legacy systems—working together on your infrastructure.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <a
                href="https://github.com/beaglabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Beag Labs on GitHub"
                className="text-[#111] transition-transform hover:-translate-y-0.5"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                  <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.92.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.51 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.43.11-2.97 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.12-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.69.12 2.97.71.78 1.14 1.78 1.14 3.01 0 4.28-2.61 5.22-5.1 5.5.4.35.76 1.02.76 2.06v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
                </svg>
              </a>
              <a
                href="https://x.com/beaglabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Beag Labs on X"
                className="text-[#111] transition-transform hover:-translate-y-0.5"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.42L5.56 22H2.43l7.25-8.29L1.8 2h6.4l4.43 6.77L18.9 2Zm-1.1 18h1.73L7.26 3.89H5.4L17.8 20Z" />
                </svg>
              </a>
              <a
                href="https://www.tradewindai.com/tw-marketplace"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Explore the Tradewinds Solutions Marketplace"
                className="ml-1 transition-transform hover:-translate-y-0.5"
              >
                <Image
                  src="/TSM Awardable Badge Bg 2 Black White.png"
                  alt="Awardable on the Tradewinds Solutions Marketplace"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
              </a>
            </div>
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
        </div>
      </div>
    </footer>
  )
}
