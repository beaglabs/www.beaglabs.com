import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — Beag Labs",
  description: "Beag Labs privacy policy. We collect as little as possible and protect everything we do hold.",
}

const sections = [
  {
    id: "overview",
    title: "Overview",
    content: `Gardens is built on the principle that private communication should remain private. We have designed our systems to minimize data collection, maximize encryption, and give you meaningful control over your information. This policy describes exactly what we collect, why, and what we never do.`,
  },
  {
    id: "what-we-collect",
    title: "What We Collect",
    items: [
      {
        label: "Account identifiers",
        detail:
          "A random UUID generated for your account. We do not use an email address or phone number as your account identifier.",
      },
      {
        label: "Public keys",
        detail:
          "Your MLS public key material, stored on our servers solely to enable encrypted group key exchanges. Your private keys never leave your device.",
      },
      {
        label: "Device-stored credentials",
        detail:
          "Your BEP39 recovery phrase, biometrics, and passphrase are stored on your device only and are never uploaded to Gardens servers.",
      },
      {
        label: "Ciphertext",
        detail:
          "Encrypted message payloads are transiently relayed by our servers. We cannot read them. We do not currently support guaranteed deletion tied to delivery confirmation.",
      },
      {
        label: "Minimal metadata",
        detail:
          "Approximate timestamps of connections (not message sends) and coarse device type, retained for up to 90 days for abuse prevention only.",
      },
    ],
  },
  {
    id: "what-we-never-collect",
    title: "What We Never Collect",
    items: [
      "Plaintext content — all messages are end-to-end encrypted with MLS",
      "Contact lists or social graphs",
      "Location data of any kind",
      "Advertising identifiers or tracking pixels",
      "Behavioral profiles or usage analytics linked to your identity",
      "Data from third parties about you",
      "Your biometric templates or passphrase (these remain on-device)",
    ],
  },
  {
    id: "encryption",
    title: "End-to-End Encryption",
    content: `All messages are encrypted on your device using the IETF Message Layer Security (MLS) protocol before transmission. Gardens servers act as delivery infrastructure only — we are technically incapable of reading your messages. Group keys are managed through MLS's forward-secrecy and post-compromise security mechanisms, meaning past messages remain protected even if a device is later compromised.`,
  },
  {
    id: "data-sharing",
    title: "Data Sharing",
    content: `We do not sell, rent, license, or broker your personal data to any third party — ever. We do not share data with advertisers. We may share the minimum necessary information with:`,
    items: [
      {
        label: "Infrastructure providers",
        detail:
          "Cloud and network providers bound by strict data processing agreements, with access limited to encrypted infrastructure logs.",
      },
      {
        label: "Law enforcement",
        detail:
          "If we receive legal process, including a subpoena, we can only disclose data we actually possess. We cannot provide message content, decryption keys, BEP39 recovery phrases, biometrics, or passphrases because we do not have access to them in any form. In practice, our architecture leaves us with no useful message data to produce.",
      },
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    content: `We retain your account UUID and public key material for as long as your account is active. Connection metadata is deleted after 90 days. Encrypted message payloads are retained only as required for relay operations, and we do not currently offer a guaranteed deletion timeline tied to delivery status. You may request full account deletion at any time; we will purge all associated data within 30 days.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    items: [
      "Access — request a copy of all data we hold about you",
      "Correction — update or correct inaccurate account information",
      "Deletion — permanently delete your account and all associated data",
      "Portability — export your data in a machine-readable format",
      "Objection — object to processing in any context where we exercise discretion",
      "Restriction — restrict processing while a dispute is resolved",
    ],
    footer:
      "To exercise any of these rights, visit /delete-account or contact privacy@usegardens.com. We will respond within 30 days.",
  },
  {
    id: "security",
    title: "Security",
    content: `We apply defense-in-depth: TLS in transit, encryption at rest for all stored data, strict access controls with hardware security keys for all engineers, regular independent security audits, and a public vulnerability disclosure program. Our MLS implementation is open-source and subject to external review.`,
  },
  {
    id: "changes",
    title: "Policy Changes",
    content: `We will notify you of material changes to this policy via in-app notification at least 30 days before they take effect. Continued use of Gardens after that period constitutes acceptance. We maintain an archived version history of this policy.`,
  },
  {
    id: "contact",
    title: "Contact",
    content: `For privacy questions, data requests, or security reports: privacy@usegardens.com`,
  },
]

export default function PrivacyPage() {
  return (
    <main className="bg-black min-h-screen">
      {/* Header */}
      <div className="border-b border-[#b3ddbb]/10">
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/" className="font-mono text-sm text-[#b3ddbb]/60 hover:text-[#b3ddbb] transition-colors">
            ← BEAG LABS
          </Link>
          <span className="font-mono text-xs text-[#b3ddbb]/30">PRIVACY POLICY</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-20">
        {/* Title block */}
        <div className="mb-16">
          <div className="font-mono text-xs text-[#b3ddbb]/40 mb-4 tracking-widest">
            LEGAL / PRIVACY
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#b3ddbb] tracking-tight mb-6">
            Privacy Policy
          </h1>
          <div className="flex items-center gap-6 font-mono text-xs text-[#b3ddbb]/40">
            <span>EFFECTIVE: MARCH 28, 2026</span>
            <span className="text-[#b3ddbb]/20">|</span>
            <span>LAST UPDATED: MARCH 30, 2026</span>
          </div>
        </div>

        {/* Privacy commitment callout */}
        <div className="border border-[#b3ddbb]/20 bg-[#050505] p-8 mb-16 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#b3ddbb]/40" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#b3ddbb]/40" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#b3ddbb]/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#b3ddbb]/40" />
          <p className="font-mono text-sm text-[#b3ddbb]/80 leading-relaxed">
            <span className="text-[#b3ddbb] font-semibold">Our commitment:</span> We cannot read your messages. We do not track you. We do not sell your data. Privacy is not a feature — it is the foundation.
          </p>
        </div>

        {/* Table of contents */}
        <div className="mb-16">
          <div className="font-mono text-xs text-[#b3ddbb]/40 mb-4 tracking-widest">TABLE OF CONTENTS</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((section, i) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="font-mono text-xs text-[#b3ddbb]/50 hover:text-[#b3ddbb] transition-colors flex items-center gap-3"
              >
                <span className="text-[#b3ddbb]/20">{String(i + 1).padStart(2, "0")}</span>
                {section.title.toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id}>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="font-mono text-xs text-[#b3ddbb]/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-mono text-lg font-semibold text-[#b3ddbb] tracking-wide uppercase">
                  {section.title}
                </h2>
              </div>

              <div className="pl-8 border-l border-[#b3ddbb]/10 space-y-4">
                {section.content && (
                  <p className="font-mono text-sm text-[#b3ddbb]/60 leading-relaxed">
                    {section.content}
                  </p>
                )}

                {section.items && (
                  <ul className="space-y-3">
                    {section.items.map((item, j) =>
                      typeof item === "string" ? (
                        <li key={j} className="flex items-start gap-3">
                          <span className="font-mono text-xs text-[#b3ddbb]/30 mt-0.5">—</span>
                          <span className="font-mono text-sm text-[#b3ddbb]/60">{item}</span>
                        </li>
                      ) : (
                        <li key={j} className="space-y-1">
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs text-[#b3ddbb]/30 mt-0.5">—</span>
                            <span className="font-mono text-sm text-[#b3ddbb] font-medium">
                              {item.label}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-[#b3ddbb]/50 leading-relaxed ml-6">
                            {item.detail}
                          </p>
                        </li>
                      )
                    )}
                  </ul>
                )}

                {"footer" in section && section.footer && (
                  <p className="font-mono text-xs text-[#b3ddbb]/40 leading-relaxed mt-4 pt-4 border-t border-[#b3ddbb]/10">
                    {section.footer}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-24 pt-8 border-t border-[#b3ddbb]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#b3ddbb]/30">[ SECURE ]</span>
            <span className="font-mono text-xs text-[#b3ddbb]/30">[ PRIVATE ]</span>
          </div>
          <p className="font-mono text-xs text-[#b3ddbb]/30">
            &copy; Beag Labs, 2026
          </p>
        </div>
      </div>
    </main>
  )
}
