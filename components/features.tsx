"use client"

import { Lock, Users, Globe, Zap, Eye, Server } from "lucide-react"

const features = [
  {
    icon: Lock,
    title: "True End-to-End Encryption",
    description: "Every message, every call, every file. Your conversations are encrypted on your device—nobody else can read them. Not even us."
  },
  {
    icon: Eye,
    title: "Metadata Impossible",
    description: "Unlike other platforms, we don't just protect your messages—we can't see who you talk to, when, or how often. Your patterns are yours alone."
  },
  {
    icon: Users,
    title: "Modern Group Encryption",
    description: "Advanced cryptographic protocols ensure your group chats remain private, even as members come and go. State-of-the-art security, seamlessly."
  },
  {
    icon: Server,
    title: "Hosted Gateway Profiles",
    description: "Share your public identity with a beautiful profile page. Let anyone find and message you securely without exposing your private details."
  },
  {
    icon: Globe,
    title: "Decentralized by Design",
    description: "Built on P2Panda, our peer-to-peer architecture means no single point of failure or control. Your community, your rules."
  },
  {
    icon: Zap,
    title: "Instant & Reliable",
    description: "Our hosted relay ensures messages arrive instantly while maintaining full encryption. Privacy without compromise on speed."
  },
]

export function Features() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm uppercase tracking-widest text-primary mb-4">Why Gardens</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6 text-balance">
            Privacy as a <span className="text-accent">Foundation</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Most platforms treat privacy as an afterthought. We built Gardens from the ground up 
            to make surveillance impossible—not just difficult.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
