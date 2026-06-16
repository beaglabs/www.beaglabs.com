import Image from "next/image"
import Link from "next/link"

const footerColumns = [
  {
    title: "Products",
    links: [
      { label: "Dataset Generation", href: "#services" },
      { label: "Robotics", href: "#services" },
      { label: "Fine-Tuning", href: "#services" },
      { label: "SLM Curation", href: "#services" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Research", href: "#" },
      { label: "GitHub", href: "https://github.com/beaglabs" },
      { label: "Contact", href: "https://cal.com/comradelemoncake/meet-the-founder" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-white py-16 px-6 lg:px-8 border-t border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto">
        {/* Top: Logo + Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Logo column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="Beag Labs"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-sm font-medium tracking-[-0.01em] text-[#111]">
                Beag Labs
              </span>
            </div>
            <p className="text-sm text-[#555] leading-relaxed max-w-xs">
              Applied AI research lab and consulting studio.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="text-[13px] font-medium text-[#111] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#555] hover:text-[#111] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[rgba(0,0,0,0.06)] flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#999]">
            &copy; {new Date().getFullYear()} BEAG LABS. ALL RIGHTS RESERVED.
          </p>
          <a
            href="https://github.com/beaglabs"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.15em] text-[#999] hover:text-[#111] transition-colors duration-200"
          >
            GITHUB
          </a>
        </div>
      </div>
    </footer>
  )
}
