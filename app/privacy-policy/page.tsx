import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — Beag Labs",
  openGraph: { title: "Privacy Policy — Beag Labs" },
}

export default function PrivacyPage() {
  return (
    <main className="bg-white text-[#0a0a0a]">
      <Navbar />
      <section className="pt-28 pb-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-8">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#999] mb-12">
            Last updated: June 2026
          </p>

          <div className="prose prose-sm prose-neutral max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">1. Information We Collect</h2>
              <p className="text-[#555] leading-relaxed">
                We collect information you provide directly, including name, email address, and messages
                sent through our Gleap chat widget. We also collect standard web analytics data via PostHog,
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
                <li><strong>Gleap</strong> — Customer feedback and chat widget. Subject to Gleap&apos;s privacy policy.</li>
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
                Analytics data is retained for 24 months. Chat transcripts are retained for 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">6. Your Rights</h2>
              <p className="text-[#555] leading-relaxed">
                You have the right to access, correct, or delete your personal data. You may also object to
                processing or request data portability. To exercise these rights, contact us through the Gleap
                chat widget on our website.
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
                For privacy-related inquiries, contact us at privacy@beaglabs.com or through the Gleap chat
                widget on our website.
              </p>
            </section>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}