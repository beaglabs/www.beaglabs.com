"use client"

import { HeroLiquidMetalRoot, HeroLiquidMetalContainer, HeroLiquidMetalContent, HeroLiquidMetalHeading, HeroLiquidMetalDescription, HeroLiquidMetalVisual } from "@/components/ui/hero-liquid-metal"
import { EmailCapture } from "@/components/cookbook/email-capture"

export function CookbookHero({ recipeCount, partCount }: { recipeCount: number; partCount: number }) {
  return (
    <HeroLiquidMetalRoot
      className="bg-[#FAFAF9]"
      srTitle="ML Cookbook 2026"
      title={<span className="text-[#111]">ML Cookbook</span>}
      subtitle={<span className="text-[#ff5f1f]">2026</span>}
      description={`${recipeCount} Modern Training Recipes Every AI Engineer Should Know`}
      showCta={false}
      showBadges={false}
      image="/cookbook-icon.svg"
      colorBack="#00000000"
      colorTint="#ff5f1f"
      repetition={4}
      softness={0.85}
      shiftRed={1.2}
      shiftBlue={-0.8}
      distortion={0.35}
      contour={0.35}
      speed={1.2}
      scale={0.7}
      fit="contain"
    >
      <HeroLiquidMetalContainer>
        <HeroLiquidMetalContent>
          <HeroLiquidMetalHeading />
          <div className="mx-auto max-w-xl pb-2 text-center sm:pb-4 lg:mx-0 lg:max-w-none lg:pb-0 lg:text-left">
            <p className="mt-0 mb-0 font-sans text-foreground/70 text-sm sm:text-base md:text-foreground/80 lg:text-lg xl:text-xl">
              A practical collection of state-of-the-art training recipes across{" "}
              {partCount} domains: language models, vision, 3D generation,
              speech, robotics, agents, and synthetic data. Each recipe includes
              the training pipeline, compute requirements, open-source
              implementations, and key papers.
            </p>
          </div>
          <div className="max-w-[520px]">
            <EmailCapture />
          </div>
          <div className="flex flex-wrap gap-2">
            {["GRPO", "DAPO", "On-Policy Distillation", "RLVR", "Flow Matching", "World Models", "Tool-Use RL"].map(
              (tag) => (
                <span key={tag} className="nb-chip text-[10px]">
                  {tag}
                </span>
              ),
            )}
          </div>
        </HeroLiquidMetalContent>
        <HeroLiquidMetalVisual />
      </HeroLiquidMetalContainer>
    </HeroLiquidMetalRoot>
  )
}
