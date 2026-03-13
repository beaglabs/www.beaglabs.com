"use client"

import { Check, X, Minus } from "lucide-react"

const comparisonData = [
  {
    feature: "End-to-end encrypted messages",
    gardens: true,
    discord: false,
    signal: true,
    telegram: "partial",
    revolt: false
  },
  {
    feature: "No metadata collection",
    gardens: true,
    discord: false,
    signal: false,
    telegram: false,
    revolt: true
  },
  {
    feature: "Community & group features",
    gardens: true,
    discord: true,
    signal: false,
    telegram: true,
    revolt: true
  },
  {
    feature: "Public shareable profiles",
    gardens: true,
    discord: true,
    signal: false,
    telegram: true,
    revolt: true
  },
  {
    feature: "Decentralized architecture",
    gardens: true,
    discord: false,
    signal: false,
    telegram: false,
    revolt: false
  },
  {
    feature: "Open source",
    gardens: true,
    discord: false,
    signal: true,
    telegram: "partial",
    revolt: true
  },
]

function StatusIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        <Check className="w-4 h-4 text-primary" />
      </div>
    )
  }
  if (value === "partial") {
    return (
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
        <Minus className="w-4 h-4 text-accent" />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
      <X className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}

export function Comparison() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm uppercase tracking-widest text-primary mb-4">Comparison</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6 text-balance">
            The <span className="text-accent">Complete</span> Package
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Other platforms make you choose between privacy and community features. 
            Gardens gives you both.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-normal text-muted-foreground">Feature</th>
                <th className="text-center py-4 px-4">
                  <span className="font-serif text-lg text-primary">Gardens</span>
                </th>
                <th className="text-center py-4 px-4">
                  <span className="font-normal text-muted-foreground">Discord</span>
                </th>
                <th className="text-center py-4 px-4">
                  <span className="font-normal text-muted-foreground">Signal</span>
                </th>
                <th className="text-center py-4 px-4">
                  <span className="font-normal text-muted-foreground">Telegram</span>
                </th>
                <th className="text-center py-4 px-4">
                  <span className="font-normal text-muted-foreground">Stoat/Revolt</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-4 px-4 text-foreground">{row.feature}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <StatusIcon value={row.gardens} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <StatusIcon value={row.discord} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <StatusIcon value={row.signal} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <StatusIcon value={row.telegram} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <StatusIcon value={row.revolt} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
