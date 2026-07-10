import { LegalPageShell } from "@/components/legal-page-shell"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Beag Labs collects, uses, and protects your data across our site, services, and analytics systems.",
  path: "/privacy-policy",
  label: "Legal",
})

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Policy"
      title="Privacy Policy"
      updatedAt="June 2026"
      intro="How Beag Labs collects, uses, and retains information across the site, contact flows, and analytics systems."
    >
            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">1. Information We Collect</h2>
              <p className="text-[#555] leading-relaxed">
                We collect information you provide directly, including name, email address, and messages
                sent through our contact and scheduling flows. We also collect standard web analytics data via PostHog,
                including page views, session duration, and interaction events. We do not sell your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">2. How We Use Your Information</h2>
              <p className="text-[#555] leading-relaxed">
                We use collected information to respond to inquiries, improve our services, analyze site
                usage, and communicate about our research and offerings. Analytics data helps us understand
                which content is valuable to our visitors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">3. Third-Party Services</h2>
              <p className="text-[#555] leading-relaxed">
                We use the following third-party services:
              </p>
              <ul className="list-disc pl-6 text-[#555] leading-relaxed mt-2 space-y-1">
                <li><strong>PostHog</strong> — Product analytics. Self-hosted or EU-hosted where applicable.</li>
                <li><strong>Vercel</strong> — Hosting and deployment. Standard server logs collected.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">4. Cookies</h2>
              <p className="text-[#555] leading-relaxed">
                We use essential cookies for site functionality and analytics cookies via PostHog for understanding
                site usage. You can disable non-essential cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">5. Data Retention</h2>
              <p className="text-[#555] leading-relaxed">
                We retain personal data only as long as necessary for the purposes described in this policy.
                Analytics data is retained for 24 months. Inquiry messages are retained only as long as needed to respond and maintain business records.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">6. Your Rights</h2>
              <p className="text-[#555] leading-relaxed">
                You have the right to access, correct, or delete your personal data. You may also object to
                processing or request data portability. To exercise these rights, contact us at privacy@beaglabs.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">7. Security</h2>
              <p className="text-[#555] leading-relaxed">
                We implement reasonable technical and organizational measures to protect your data. However,
                no method of electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">8. Changes to This Policy</h2>
              <p className="text-[#555] leading-relaxed">
                We may update this policy periodically. Material changes will be noted on this page with an
                updated effective date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">9. Contact</h2>
              <p className="text-[#555] leading-relaxed">
                For privacy-related inquiries, contact us at privacy@beaglabs.com.
              </p>
            </section>
    </LegalPageShell>
  )
}
