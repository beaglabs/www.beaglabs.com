import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

const data = [
  { month: "M1", rev: 0, expense: 0.18, cash: 4.32 },
  { month: "M3", rev: 0, expense: 0.18, cash: 3.96 },
  { month: "M6", rev: 0.02, expense: 0.20, cash: 3.36 },
  { month: "M9", rev: 0.06, expense: 0.24, cash: 2.70 },
  { month: "M12", rev: 0.12, expense: 0.26, cash: 2.04 },
  { month: "M15", rev: 0.17, expense: 0.27, cash: 1.47 },
  { month: "M18", rev: 0.21, expense: 0.28, cash: 0.93 },
  { month: "M21", rev: 0.25, expense: 0.28, cash: 0.48 },
  { month: "M24", rev: 0.28, expense: 0.28, cash: 0.12 },
]

export default function RevenueChartInner() {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5F1F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF5F1F" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#111" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#111" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B7355" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8B7355" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} stroke="#999" />
          <YAxis tick={{ fontSize: 12 }} stroke="#999" tickFormatter={(v: number) => `$${v.toFixed(1)}M`} />
          <Tooltip
            contentStyle={{ border: "2px solid #111", borderRadius: 0, boxShadow: "3px 3px 0 #111" }}
            formatter={(value: number) => [`$${value.toFixed(2)}M`, ""]}
          />
          <Area type="monotone" dataKey="expense" stroke="#111" strokeWidth={2} fill="url(#expGrad)" name="Monthly expenses" />
          <Area type="monotone" dataKey="rev" stroke="#FF5F1F" strokeWidth={2.5} fill="url(#revGrad)" name="Monthly revenue" />
          <Area type="monotone" dataKey="cash" stroke="#8B7355" strokeWidth={2} fill="url(#cashGrad)" name="Remaining cash" strokeDasharray="6 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
