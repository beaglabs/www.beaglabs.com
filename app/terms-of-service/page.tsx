import { LegalPageShell } from "@/components/legal-page-shell"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The legal terms governing how Beag Labs provides research, consulting, and technical delivery services.",
  path: "/terms-of-service",
  label: "Legal",
})

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Policy"
      title="Terms of Service"
      updatedAt="June 2026"
      intro="The legal terms governing how Beag Labs provides research, consulting, and technical delivery services."
    >
            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">1. Acceptance of Terms</h2>
              <p className="text-[#555] leading-relaxed">
                By accessing or using any services provided by Beag Labs (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
                you agree to be bound by these Terms of Service. If you do not agree, do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">2. Services</h2>
              <p className="text-[#555] leading-relaxed">
                Beag Labs provides applied AI research, consulting, dataset generation, fine-tuning, robotics integration,
                and domain-model curation services. Specific deliverables, timelines, and fees are defined in individual statements
                of work or service agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">3. Intellectual Property</h2>
              <p className="text-[#555] leading-relaxed">
                Unless otherwise agreed in writing, Beag Labs retains ownership of all pre-existing intellectual property,
                methodologies, and tools used in delivering services. Deliverables created specifically for a client under a
                paid engagement are assigned to the client upon full payment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">4. Confidentiality</h2>
              <p className="text-[#555] leading-relaxed">
                Both parties agree to maintain the confidentiality of proprietary information disclosed during the course
                of engagement. This obligation survives termination of the agreement for a period of three years.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">5. Limitation of Liability</h2>
              <p className="text-[#555] leading-relaxed">
                To the maximum extent permitted by law, Beag Labs shall not be liable for any indirect, incidental,
                special, or consequential damages arising from the use of our services. Our total liability is limited to
                the fees paid for the specific service giving rise to the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">6. Termination</h2>
              <p className="text-[#555] leading-relaxed">
                Either party may terminate an engagement with 30 days written notice. Upon termination, the client shall
                pay for all work completed through the termination date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">7. Governing Law</h2>
              <p className="text-[#555] leading-relaxed">
                These terms are governed by the laws of the United States and the State of Delaware. Any disputes shall be
                resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#111] mb-4">8. Contact</h2>
              <p className="text-[#555] leading-relaxed">
                For questions about these terms, contact us at legal@beaglabs.com.
              </p>
            </section>
    </LegalPageShell>
  )
}
