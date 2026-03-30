import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service — Gardens",
  description:
    "Gardens terms of service, including in-app purchases and ad-related terms.",
}

const sections = [
  {
    id: "agreement",
    title: "Agreement to Terms",
    content:
      "By downloading, accessing, or using Gardens, you agree to these Terms of Service. If you do not agree, do not use the app.",
  },
  {
    id: "eligibility",
    title: "Eligibility and Accounts",
    items: [
      "You must be at least 13 years old (or older if required by your local law).",
      "You are responsible for activity on your account and device.",
      "You agree not to misuse the service, attempt unauthorized access, or interfere with other users.",
    ],
  },
  {
    id: "ads",
    title: "Ads",
    content:
      "The free version of Gardens may include ads. These ads help support infrastructure and ongoing development. We may change ad formats, placement, frequency, or ad partners over time.",
    items: [
      "Ads may be provided by third-party ad networks.",
      "Ad delivery may rely on limited technical information such as device type, app version, language, and coarse region.",
      "Purchasing ad removal removes ads in Gardens, but does not remove non-ad notices such as security, account, or product messages.",
    ],
  },
  {
    id: "in-app-purchases",
    title: "In-App Purchases",
    content:
      "Gardens offers optional in-app purchases. Prices are displayed in the app and may change in the future for new purchases.",
    items: [
      {
        label: "Remove Ads for Life ($15 one-time purchase)",
        detail:
          "This purchase removes ads for the lifetime of your Gardens account. It is a one-time purchase, not a subscription.",
      },
      {
        label: "Store billing",
        detail:
          "Purchases are processed by your platform provider (such as Apple App Store or Google Play), not directly by Gardens.",
      },
      {
        label: "Taxes and fees",
        detail:
          "Your total purchase amount may include applicable taxes or platform fees set by your app store.",
      },
      {
        label: "Restores and device changes",
        detail:
          "If supported by your platform account and app store rules, previous purchases can be restored on reinstall or new devices.",
      },
    ],
  },
  {
    id: "refunds",
    title: "Refunds and Cancellations",
    content:
      "All purchase, cancellation, and refund requests are governed by your app store's policies. Gardens does not control or override platform refund decisions.",
  },
  {
    id: "availability",
    title: "Service Availability and Changes",
    content:
      "We may add, remove, or modify features at any time to improve security, performance, compliance, or product direction. We may also suspend or discontinue parts of the service with reasonable notice where practical.",
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    items: [
      "Do not use Gardens for unlawful activity, harassment, fraud, or abuse.",
      "Do not attempt to reverse engineer, exploit, or disrupt the app or service infrastructure.",
      "Do not circumvent security controls or access data that is not yours.",
    ],
  },
  {
    id: "termination",
    title: "Suspension and Termination",
    content:
      "We may suspend or terminate access for violations of these Terms, abuse, or legal compliance reasons. You may stop using Gardens at any time.",
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content:
      "Gardens is provided on an 'as is' and 'as available' basis to the extent allowed by law. We do not guarantee uninterrupted or error-free operation.",
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by law, Gardens and its affiliates will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill arising from use of the service.",
  },
  {
    id: "updates",
    title: "Changes to These Terms",
    content:
      "We may update these Terms from time to time. Material changes will be communicated in-app or through other reasonable means. Continued use after changes take effect means you accept the updated Terms.",
  },
  {
    id: "contact",
    title: "Contact",
    content:
      "Questions about these Terms can be sent to legal@usegardens.com.",
  },
]

export default function TermsPage() {
  return (
    <main className="bg-[#141414] min-h-screen">
      <div className="border-b border-[#F5E6C8]/10">
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-sm text-[#F5E6C8]/60 hover:text-[#F5E6C8] transition-colors"
          >
            ← GARDENS
          </Link>
          <span className="font-mono text-xs text-[#F5E6C8]/30">
            TERMS OF SERVICE
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="mb-16">
          <div className="font-mono text-xs text-[#F5E6C8]/40 mb-4 tracking-widest">
            LEGAL / TERMS
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#F5E6C8] tracking-tight mb-6">
            Terms of Service
          </h1>
          <div className="flex items-center gap-6 font-mono text-xs text-[#F5E6C8]/40">
            <span>EFFECTIVE: MARCH 30, 2026</span>
            <span className="text-[#F5E6C8]/20">|</span>
            <span>LAST UPDATED: MARCH 30, 2026</span>
          </div>
        </div>

        <div className="border border-[#F5E6C8]/20 bg-[#1a1a1a] p-8 mb-16 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#F5E6C8]/40" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#F5E6C8]/40" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#F5E6C8]/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#F5E6C8]/40" />
          <p className="font-mono text-sm text-[#F5E6C8]/80 leading-relaxed">
            <span className="text-[#F5E6C8] font-semibold">Summary:</span>{" "}
            Gardens offers a free ad-supported experience and optional in-app
            purchases, including a one-time{" "}
            <span className="text-[#F5E6C8] font-semibold">
              $15 remove ads for life
            </span>{" "}
            offer.
          </p>
        </div>

        <div className="mb-16">
          <div className="font-mono text-xs text-[#F5E6C8]/40 mb-4 tracking-widest">
            TABLE OF CONTENTS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((section, i) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="font-mono text-xs text-[#F5E6C8]/50 hover:text-[#F5E6C8] transition-colors flex items-center gap-3"
              >
                <span className="text-[#F5E6C8]/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.title.toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-16">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id}>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="font-mono text-xs text-[#F5E6C8]/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-mono text-lg font-semibold text-[#F5E6C8] tracking-wide uppercase">
                  {section.title}
                </h2>
              </div>

              <div className="pl-8 border-l border-[#F5E6C8]/10 space-y-4">
                {section.content && (
                  <p className="font-mono text-sm text-[#F5E6C8]/60 leading-relaxed">
                    {section.content}
                  </p>
                )}

                {section.items && (
                  <ul className="space-y-3">
                    {section.items.map((item, j) =>
                      typeof item === "string" ? (
                        <li key={j} className="flex items-start gap-3">
                          <span className="font-mono text-xs text-[#F5E6C8]/30 mt-0.5">
                            —
                          </span>
                          <span className="font-mono text-sm text-[#F5E6C8]/60">
                            {item}
                          </span>
                        </li>
                      ) : (
                        <li key={j} className="space-y-1">
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs text-[#F5E6C8]/30 mt-0.5">
                              —
                            </span>
                            <span className="font-mono text-sm text-[#F5E6C8] font-medium">
                              {item.label}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-[#F5E6C8]/50 leading-relaxed ml-6">
                            {item.detail}
                          </p>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-24 pt-8 border-t border-[#F5E6C8]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#F5E6C8]/30">
              [ SECURE ]
            </span>
            <span className="font-mono text-xs text-[#F5E6C8]/30">
              [ PRIVATE ]
            </span>
          </div>
          <p className="font-mono text-xs text-[#F5E6C8]/30">
            &copy; Gardens Software, 2026
          </p>
        </div>
      </div>
    </main>
  )
}
