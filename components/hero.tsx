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
      <div className="relative z-10 container mx-auto px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">End-to-End Encrypted</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal leading-tight mb-6 text-balance">
            Your Conversations,
            <br />
            <span className="text-accent">Truly Private</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
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

          {/* Social Proof */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Trusted by privacy-conscious communities worldwide</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-3xl font-serif text-accent">50K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-serif text-accent">2K+</p>
                <p className="text-sm text-muted-foreground">Communities</p>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-serif text-accent">0</p>
                <p className="text-sm text-muted-foreground">Metadata Stored</p>
              </div>
            </div>
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
