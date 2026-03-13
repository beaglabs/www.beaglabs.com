"use client"

import { UserPlus, MessageSquare, Users, Shield } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Identity",
    description: "Generate your cryptographic identity in seconds. No email, no phone number, no personal data required. You own your keys."
  },
  {
    number: "02",
    icon: Shield,
    title: "Share Securely",
    description: "Share your public profile or QR code with friends. They can reach you securely without revealing anything about either of you."
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Message Freely",
    description: "Every conversation is end-to-end encrypted. Send messages, files, and media knowing only you and your recipients can see them."
  },
  {
    number: "04",
    icon: Users,
    title: "Build Communities",
    description: "Create encrypted group spaces for your community. Rich features like Discord, with privacy that's actually private."
  },
]

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm uppercase tracking-widest text-primary mb-4">How It Works</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6 text-balance">
            Private by <span className="text-accent">Default</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Getting started with Gardens takes less than a minute. 
            Here&apos;s how your journey to true privacy begins.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
              )}
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-serif text-3xl text-accent">{step.number}</span>
                </div>
                <h3 className="font-serif text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
