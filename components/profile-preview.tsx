"use client"

import { Button } from "@/components/ui/button"
import { Copy, Sparkles, Smartphone } from "lucide-react"
import Image from "next/image"

export function ProfilePreview() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <p className="text-sm uppercase tracking-widest text-primary mb-4">Public Profiles</p>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-balance">
              Share Your Identity, <span className="text-accent">Keep Your Privacy</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              With Gardens Gateway profiles, you can share a beautiful public page that lets 
              anyone reach you securely. They scan your QR code or copy your identifier—and 
              start an encrypted conversation instantly.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <p className="text-foreground">Customizable profile with your display name and avatar</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <p className="text-foreground">QR code for instant secure connection</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <p className="text-foreground">Online status without revealing activity patterns</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <p className="text-foreground">Cross-platform: Web, iOS, and Android</p>
              </li>
            </ul>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
              <Sparkles className="w-5 h-5 mr-2" />
              Create Your Profile
            </Button>
          </div>

          {/* Profile Card Preview */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-1">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-12%20at%2020-15-44%20Test%20Account%20-%20Gardens-1RafVhl8WXrrIRwkIm5eNUAvEndHF9.png"
                alt="Gardens profile preview"
                width={600}
                height={700}
                className="rounded-2xl w-full"
              />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-medium">Online on Gardens</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <span className="text-sm">Web, iOS & Android</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
