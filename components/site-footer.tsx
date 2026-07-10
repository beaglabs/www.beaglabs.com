import Image from "next/image"
import Link from "next/link"

const footerColumns = [
  {
    title: "Models",
    links: [
      { label: "Overview", href: "/models" },
      { label: "Capabilities", href: "#capabilities" },
      { label: "Research", href: "/research" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Cookbook", href: "/cookbook" },
      { label: "Glossary", href: "/glossary" },
      { label: "Use Cases", href: "/use-cases" },
      { label: "Comparisons", href: "/compare" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Research", href: "/research" },
      { label: "GitHub", href: "https://github.com/beaglabs" },
      { label: "Contact", href: "https://cal.com/comradelemoncake/meet-the-founder" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Imprint", href: "/imprint" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-[#111] bg-[#FAFAF9] px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:gap-7">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Beag Labs"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-[13px] font-extrabold tracking-[0.08em] text-[#111]">
                Beag Labs
              </span>
            </div>
            <p className="max-w-[250px] text-[14px] leading-[1.7] text-[#555] font-medium">
              Classification and extraction models trained on your data,
              deployed on your infrastructure.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF5F1F]">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-[14px] text-[#444]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-medium border-b-2 border-transparent transition-all hover:border-[#FF5F1F] hover:text-[#111]"
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
          <p className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#999]">
            &copy; {new Date().getFullYear()} BEAG LABS. ALL RIGHTS RESERVED.
          </p>
          <a
            href="https://github.com/beaglabs"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#999] hover:text-[#111] transition-colors duration-200"
          >
            GITHUB
          </a>
        </div>
      </div>
    </footer>
  )
}
