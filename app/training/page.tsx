import type { Metadata } from "next"
import Link from "next/link"

import { Navbar } from "@/components/navbar"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { BrutalistPhoto } from "@/components/brutalist-photo"
import { trainingConcepts } from "@/data/training/concepts"

export const metadata: Metadata = {
  title: "Training Techniques — Beag Labs",
  description: "52 modern training techniques every AI engineer should know — from GRPO and Flow Matching to World Models and Data Flywheels. Plus quantization-aware training.",
  alternates: {
    canonical: "https://www.beaglabs.com/training",
  },
  openGraph: {
    title: "Training Techniques — Beag Labs",
    description: "52 modern training techniques every AI engineer should know.",
    url: "https://www.beaglabs.com/training",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Beag Labs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Training Techniques — Beag Labs",
    description: "52 modern training techniques every AI engineer should know.",
    images: ["/og-image.png"],
  },
}

const parts = [
  { name: "Language Models", index: 1 },
  { name: "Vision", index: 2 },
  { name: "3D Generation", index: 3 },
  { name: "Speech", index: 4 },
  { name: "Robotics", index: 5 },
  { name: "Agents", index: 6 },
  { name: "Synthetic Data", index: 7 },
  { name: "Model Optimization", index: 8 },
] as const

export default function TrainingListingPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <AnnouncementBanner />
      <Navbar bannerHeight={38} />

      <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_minmax(380px,520px)]">
            <div>
              <Breadcrumbs
                items={[
                  { name: "Home", url: "/" },
                  { name: "Training Techniques", url: "/training" },
                ]}
              />
              <div className="mt-8 mb-5 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
                  ML Cookbook + QAT
                </span>
                <span className="block h-px w-10 bg-[#111]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#555]">53 techniques</span>
              </div>
              <h1 className="mb-5 max-w-[820px] text-[42px] font-extrabold leading-[1.02] tracking-[-0.05em] text-[#111] sm:text-[52px] lg:text-[64px]">
                Training Techniques
              </h1>
              <p className="max-w-[640px] text-[17px] leading-[1.72] text-[#404040] font-medium">
                53 modern training techniques every AI engineer should know — spanning language models,
                vision, 3D generation, speech, robotics, agents, synthetic data, and model optimization.
              </p>
            </div>
            <BrutalistPhoto
              src="https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg"
              alt="Code on a dark monitor"
              badge="53 TECHNIQUES"
              meta="beaglabs / training"
              rounded
              className="mx-auto w-full max-w-[480px]"
            />
          </div>
        </div>
      </section>

      {parts.map((part) => {
        const items = trainingConcepts.filter((c) => c.part === part.name)
        if (items.length === 0) return null
        return (
          <section key={part.name} className="nb-section-divider bg-[#FAFAF9] px-6 py-16 lg:px-9 lg:py-20">
            <div className="mx-auto max-w-[1440px]">
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
                Part {part.index}
              </div>
              <h2 className="mb-2 text-[32px] font-extrabold tracking-[-0.04em] text-[#111] lg:text-[40px]">
                {part.name}
              </h2>
              <p className="mb-8 text-[14px] text-[#666] font-medium">
                {items.length} technique{items.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {items.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/training/${c.slug}`}
                    className="nb-card bg-white p-6"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff5f1f]">
                        {c.part}
                      </span>
                      <span className="text-[11px] text-[#999]">{c.complexity}</span>
                    </div>
                    <h3 className="mb-2 text-[17px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#111]">
                      {c.title}
                    </h3>
                    <p className="text-[13px] leading-[1.6] text-[#555] font-medium line-clamp-3">
                      {c.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      <section className="border-t-[3px] border-[#111] bg-[#111] px-6 py-24 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
            Download
          </div>
          <h2 className="mb-4 max-w-[720px] text-[42px] font-extrabold leading-[0.96] tracking-[-0.05em] text-white lg:text-[56px]">
            Get the 2026 ML Cookbook
          </h2>
          <p className="mb-8 max-w-[560px] text-[18px] leading-[1.65] text-[#C9C9C9] font-medium">
            52 recipes, 7 domains, one PDF. Every technique explained with its core idea, training
            pipeline, compute requirements, and best-fit scenarios.
          </p>
          <Link
            href="/cookbook"
            className="nb-btn-orange inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
          >
            Free download &rarr;
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
