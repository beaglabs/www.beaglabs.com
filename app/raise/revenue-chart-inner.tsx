import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts"

const data = [
  { month: "M1", acv: 0, expense: 0.18 },
  { month: "M3", acv: 0, expense: 0.18 },
  { month: "M4", acv: 0.2, expense: 0.18 },
  { month: "M6", acv: 0.2, expense: 0.18 },
  { month: "M7", acv: 0.2, expense: 0.20 },
  { month: "M8", acv: 0.4, expense: 0.20 },
  { month: "M10", acv: 0.6, expense: 0.20 },
  { month: "M12", acv: 0.8, expense: 0.20 },
  { month: "M13", acv: 0.8, expense: 0.25 },
  { month: "M15", acv: 1.0, expense: 0.25 },
  { month: "M18", acv: 1.2, expense: 0.25 },
  { month: "M21", acv: 1.4, expense: 0.25 },
  { month: "M24", acv: 1.4, expense: 0.25 },
]

export default function RevenueChartInner() {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="acvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5F1F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF5F1F" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} stroke="#999" />
          <YAxis tick={{ fontSize: 12 }} stroke="#999" tickFormatter={(v: number) => `$${v.toFixed(1)}M`} />
          <Tooltip
            contentStyle={{ border: "2px solid #111", borderRadius: 0, boxShadow: "3px 3px 0 #111" }}
            formatter={(value: number) => [`$${value.toFixed(2)}M`, ""]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="square"
            wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingBottom: 8 }}
          />
          <Bar dataKey="acv" fill="url(#acvGrad)" stroke="#FF5F1F" strokeWidth={2} name="Cumulative contracted ACV" />
          <Line type="stepAfter" dataKey="expense" stroke="#111" strokeWidth={2} dot={false} name="Monthly expenses" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
