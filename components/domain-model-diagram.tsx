"use client"

import { useEffect, useRef, useState } from "react"

const diagram = `erDiagram
  Asset {
    string id PK
    string region FK
    string status
    datetime created
  }
  Location {
    string code PK
    string name
    string zone
  }
  Operator {
    string id PK
    string role
    string shift
    string cert
  }
  Event {
    string id PK
    string type
    string severity
    datetime ts
  }
  Asset ||--o{ Location : sits_at
  Asset }o--o{ Operator : assigned_to
  Asset ||--o{ Event : triggers
  Event }o--|| Operator : resolved_by`

export function DomainModelDiagram() {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const id = useRef(`domain-model-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    let cancelled = false
    import("mermaid").then((mermaid) => {
      if (cancelled) return
      mermaid.default.initialize({
        startOnLoad: false,
        theme: "neutral",
        er: {
          diagramPadding: 30,
          entityPadding: 20,
          fontSize: 13,
        },
        themeVariables: {
          fontFamily: '"Inter", system-ui, sans-serif',
          primaryColor: "#f6f4ef",
          primaryBorderColor: "#8B7355",
          primaryTextColor: "#111",
          lineColor: "#8B7355",
          entityBorder: "#8B7355",
        },
      })
      mermaid.default
        .render(id.current, diagram)
        .then(({ svg }) => {
          if (!cancelled && ref.current) {
            ref.current.innerHTML = svg
            setError(null)
          }
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message)
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="text-xs text-red-500 font-mono bg-red-50 p-4 rounded-lg">
        {error}
      </div>
    )
  }

  return <div ref={ref} className="flex justify-center overflow-x-auto" />
}