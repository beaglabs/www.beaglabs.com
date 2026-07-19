"use client"

import dynamic from "next/dynamic"

const ChartInner = dynamic(() => import("./revenue-chart-inner"), { ssr: false })

export default function RevenueChart() {
  return <ChartInner />
}
