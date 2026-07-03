import Image from "next/image"
import Link from "next/link"

const footerColumns = [
  {
    title: "Capabilities",
    links: [
      { label: "Dataset Generation", href: "#capabilities" },
      { label: "Forward Deployed ML", href: "#capabilities" },
      { label: "Model Adaptation", href: "#capabilities" },
      { label: "Evaluation Systems", href: "#capabilities" },
    ],
  },
  {
    title: "Work",
    links: [
      { label: "Research", href: "/research" },
      { label: "GitHub", href: "https://github.com/beaglabs" },
      { label: "Contact", href: "https://cal.com/comradelemoncake/meet-the-founder" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Imprint", href: "/imprint" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-14 lg:px-9 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_repeat(3,1fr)] lg:gap-7">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Beag Labs"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-[13px] font-bold tracking-[0.08em] text-[#111]">
                Beag Labs
              </span>
            </div>
            <p className="max-w-[250px] text-[14px] leading-[1.7] text-[#555]">
              Applied AI research and deployment for technically demanding
              domains.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-[14px] text-[#444]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition-colors duration-200 hover:text-[#111]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[rgba(0,0,0,0.08)] pt-8 lg:flex-row">
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
