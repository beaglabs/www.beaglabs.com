"use client"

import * as React from "react"
import Link from "next/link"
import { LiquidMetal } from "@paper-design/shaders-react"

const MemoizedLiquidMetal = React.memo(LiquidMetal)

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#FAFAF9] pt-[calc(4rem+2.375rem)]">
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-24 lg:grid-cols-[1fr_minmax(320px,480px)] lg:gap-16 lg:px-9 lg:py-14">
        <div className="max-w-[760px]">
          <span className="nb-label mb-6 inline-block">
            Small Model Foundry
          </span>

          <h1 className="mb-6 max-w-[820px] text-[52px] font-extrabold leading-[1.05] tracking-[-0.055em] text-[#111] sm:text-[64px] lg:text-[80px]">
            Small models.
            <br />
            SOTA research.
            <br />
            <span className="bg-[#FF5F1F] text-[#111] px-3 py-0.5">
              Deployed anywhere.
            </span>
          </h1>

          <p className="mb-10 max-w-[650px] text-[18px] leading-[1.65] text-[#404040] font-medium">
            Deploy our domain-adapted models to your infrastructure, train your own models, or hire us to build a custom model for your use case using SOTA methods. Save hundreds of thousands in compute spend and get your models to production faster than ever before.
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-4">
            <Link
              href="/models"
              className="nb-btn inline-flex items-center gap-2 bg-[#111] px-8 py-4 text-[12px] uppercase text-white"
            >
              See the models <span className="text-lg">&rarr;</span>
            </Link>
            <a
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-btn-outline inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
            >
              Talk to us
            </a>
          </div>

          <div className="flex flex-wrap gap-3">
            {["Custom Models", "On-Prem Deploy", "13x Cheaper Than GPT"].map((chip) => (
              <span key={chip} className="nb-chip">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:flex items-center justify-center aspect-square w-full max-h-[520px] xl:max-h-[600px]">
          <div className="absolute inset-0 overflow-hidden rounded-[3rem]">
            <div className="absolute inset-0" style={{ filter: "drop-shadow(0 0 0 3px #111)" }}>
              <MemoizedLiquidMetal
                shape="daisy"
                colorBack="#FFF3E6"
                colorTint="#FF5F1F"
                repetition={7}
                softness={0.2}
                shiftRed={1.5}
                shiftBlue={-1}
                distortion={0.3}
                contour={0.7}
                offsetY={0}
                speed={0.6}
                scale={0.7}
                fit="contain"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tl from-[#FAFAF9]/30 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  )
}
