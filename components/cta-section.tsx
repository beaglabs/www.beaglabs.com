"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"
import Image from "next/image"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/a6749050-55dc-4800-92fb-7aebe308101c_1424x848-tKyyB9WxY1CQ18GAzcsMwvrcUwrtfN.jpg"
          alt="Gardens landscape"
          fill
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-6xl mb-6 text-balance">
            Ready to Join the <span className="text-accent">Garden</span>?
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Start building your private community today. No email required, no tracking, 
            no compromise. Just you and your community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full">
              <Sparkles className="w-5 h-5 mr-2" />
              Download Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-border hover:bg-secondary px-8 py-6 text-lg rounded-full"
            >
              View Documentation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Download Badges */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Download on the</p>
                <p className="text-sm font-medium">App Store</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Get it on</p>
                <p className="text-sm font-medium">Google Play</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
