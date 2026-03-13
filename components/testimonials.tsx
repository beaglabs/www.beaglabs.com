"use client"

import { Star } from "lucide-react"

const testimonials = [
  {
    quote: "Finally, a platform where I can build a community without worrying about my members' data being harvested. Gardens is what I always wanted Discord to be.",
    author: "Maya Chen",
    role: "Community Leader",
    avatar: "MC"
  },
  {
    quote: "The hosted gateway profiles are brilliant. I can share my identity publicly while keeping all my conversations completely private. Best of both worlds.",
    author: "Alex Rivera",
    role: "Privacy Advocate",
    avatar: "AR"
  },
  {
    quote: "As someone who's been on Signal for years, Gardens fills the gap I've always felt—real community features without compromising on encryption.",
    author: "Jordan Kim",
    role: "Security Researcher",
    avatar: "JK"
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm uppercase tracking-widest text-primary mb-4">Community</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6 text-balance">
            Trusted by <span className="text-accent">Privacy-First</span> People
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-card border border-border"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
