"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Sparkles } from "lucide-react"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/a6749050-55dc-4800-92fb-7aebe308101c_1424x848-tKyyB9WxY1CQ18GAzcsMwvrcUwrtfN.jpg"
          alt="Gardens landscape"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-8 py-32 md:py-40 text-center">
        <div className="max-w-6xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-10">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">End-to-End Encrypted</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-serif text-6xl md:text-8xl lg:text-7xl font-extrabold leading-[0.95] mb-8 text-balance">
            The community platorm where metadata <span className="text-primary">is impossible</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed text-pretty">
            Gardens is the community platform where privacy isn&apos;t just a feature—it&apos;s the foundation.
            No metadata. No tracking. Just real connection.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Growing
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-border hover:bg-secondary px-8 py-6 text-lg rounded-full"
            >
              Explore Features
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}

