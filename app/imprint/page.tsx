import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Imprint — Beag Labs",
  openGraph: { title: "Imprint — Beag Labs" },
}

export default function ImprintPage() {
  return (
    <main className="bg-white text-[#0a0a0a]">
      <Navbar />
      <section className="pt-28 pb-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-8">
            Imprint
          </h1>

          <div className="space-y-10">
            <section>
              <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">
                Information Pursuant to § 5 TMG
              </h2>
              <div className="space-y-1 text-[#555] leading-relaxed">
                <p><strong>Beag Labs</strong></p>
                <p>Applied AI Research &amp; Consulting</p>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">
                Represented By
              </h2>
              <div className="space-y-1 text-[#555] leading-relaxed">
                <p>J.D. Bohrman</p>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">
                Contact
              </h2>
              <div className="space-y-1 text-[#555] leading-relaxed">
                <p>
                  Email:{" "}
                  <a href="mailto:hello@beaglabs.com" className="text-[#8B7355] hover:text-[#6b5740] underline underline-offset-2">
                    hello@beaglabs.com
                  </a>
                </p>
                <p>
                  Website:{" "}
                  <Link href="/" className="text-[#8B7355] hover:text-[#6b5740] underline underline-offset-2">
                    beaglabs.com
                  </Link>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">
                Dispute Resolution
              </h2>
              <p className="text-[#555] leading-relaxed">
                The European Commission provides a platform for online dispute resolution (ODR):{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B7355] hover:text-[#6b5740] underline underline-offset-2"
                >
                  ec.europa.eu/consumers/odr
                </a>
                . We are neither obligated nor willing to participate in dispute resolution proceedings before a
                consumer arbitration board.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">
                Liability for Content
              </h2>
              <p className="text-[#555] leading-relaxed">
                As a service provider, we are responsible for our own content on these pages in accordance with
                general laws. However, we are not obligated to monitor transmitted or stored third-party information
                or to investigate circumstances indicating illegal activity.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">
                Liability for Links
              </h2>
              <p className="text-[#555] leading-relaxed">
                Our site contains links to external third-party websites over whose content we have no influence.
                We cannot assume any liability for this external content. The respective provider or operator of
                the linked pages is always responsible for their content.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[#999] uppercase tracking-wider mb-4">
                Copyright
              </h2>
              <p className="text-[#555] leading-relaxed">
                The content and works created by the site operators on these pages are subject to copyright law.
                Reproduction, editing, distribution, and any kind of use outside the limits of copyright require
                the written consent of the respective author or creator.
              </p>
            </section>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}