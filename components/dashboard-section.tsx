"use client"

import { TextScramble } from "./text-scramble"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"

const accuracyData = [
  { month: "Jan", iam: 94, infra: 92, ir: 96, compliance: 91 },
  { month: "Feb", iam: 95, infra: 93, ir: 96, compliance: 93 },
  { month: "Mar", iam: 96, infra: 94, ir: 97, compliance: 94 },
  { month: "Apr", iam: 96, infra: 95, ir: 98, compliance: 95 },
  { month: "May", iam: 97, infra: 95, ir: 98, compliance: 96 },
  { month: "Jun", iam: 98, infra: 96, ir: 99, compliance: 97 },
]

const throughputData = [
  { name: "IAM", tasks: 12450, automated: 11205, manual: 1245 },
  { name: "Infra", tasks: 8930, automated: 7580, manual: 1350 },
  { name: "IR", tasks: 3420, automated: 3078, manual: 342 },
  { name: "Compliance", tasks: 6780, automated: 5590, manual: 1190 },
  { name: "Network", tasks: 5120, automated: 4480, manual: 640 },
]

const costData = [
  { month: "Jan", before: 245000, after: 62000 },
  { month: "Feb", before: 252000, after: 58000 },
  { month: "Mar", before: 248000, after: 54000 },
  { month: "Apr", before: 260000, after: 48000 },
  { month: "May", before: 255000, after: 42000 },
  { month: "Jun", before: 258000, after: 38000 },
]

const recentTasks = [
  { id: "T-2847", model: "beag-iam-1.5B", action: "assign_role", result: "SUCCESS", time: "2.4s", confidence: "98.2%" },
  { id: "T-2846", model: "beag-compliance-1.5B", action: "flag_finding", result: "SUCCESS", time: "1.8s", confidence: "97.1%" },
  { id: "T-2845", model: "beag-ir-1.5B", action: "contain_host", result: "SUCCESS", time: "3.1s", confidence: "99.0%" },
  { id: "T-2844", model: "beag-infra-1.5B", action: "provision", result: "SUCCESS", time: "5.2s", confidence: "96.4%" },
  { id: "T-2843", model: "beag-network-1.5B", action: "allow_cidr", result: "OVERRIDE", time: "1.1s", confidence: "88.2%" },
  { id: "T-2842", model: "beag-iam-1.5B", action: "remove_role", result: "SUCCESS", time: "2.0s", confidence: "97.8%" },
  { id: "T-2841", model: "beag-compliance-1.5B", action: "mark_remediated", result: "SUCCESS", time: "1.5s", confidence: "98.5%" },
]

const stats = [
  { label: "TASKS AUTOMATED", value: "36,700", change: "+12.4%", positive: true },
  { label: "ERRORS PREVENTED", value: "4,892", change: "-23.1%", positive: true },
  { label: "COST SAVINGS", value: "$1.8M/yr", change: "+8.6%", positive: true },
  { label: "OVERRIDE RATE", value: "2.1%", change: "-1.4%", positive: true },
]

export function DashboardSection() {
  return (
    <section id="dashboard" className="relative bg-black py-32 px-6 lg:px-8">
      <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-[#b3ddbb]/10" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-[#b3ddbb]/10" />

      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-px bg-[#b3ddbb]/30" />
            <span className="font-mono text-xs tracking-[0.25em] text-[#4a6653]">
              COMPLIANCE DASHBOARD
            </span>
            <span className="relative flex h-2 w-2 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b3ddbb] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b3ddbb]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#8bc49a]">
              LIVE
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-[#b3ddbb] tracking-[-0.02em] mb-4">
            <TextScramble text="YOUR SPECIALISTS" autoStart />
            <br />
            <TextScramble text="IN PRODUCTION" autoStart duration={1800} />
          </h2>
          <p className="text-[#6b8f75] max-w-2xl leading-relaxed">
            The dashboard isn&apos;t just reporting — it&apos;s the renewal argument. Tasks automated, errors prevented, money saved. This is what your SOC team sees every morning.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a2a1f] mb-px">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#050505] p-6">
              <div className="font-mono text-[10px] tracking-[0.12em] text-[#4a6653] mb-2">
                {stat.label}
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-[#b3ddbb] tracking-[-0.02em] mb-1">
                {stat.value}
              </div>
              <div className={`font-mono text-xs ${stat.positive ? "text-[#8bc49a]" : "text-red-400"}`}>
                {stat.change} MoM
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#1a2a1f] mb-px">
          {/* Accuracy over time */}
          <div className="bg-[#050505] p-6">
            <div className="font-mono text-[10px] tracking-[0.12em] text-[#4a6653] mb-6">
              SPECIALIST ACCURACY OVER TIME
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1f" />
                <XAxis dataKey="month" stroke="#3d5a44" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="#3d5a44" domain={[88, 100]} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid #1a2a1f",
                    borderRadius: 4,
                    fontFamily: "JetBrains Mono",
                    fontSize: 10,
                    color: "#b3ddbb",
                  }}
                />
                <Line type="monotone" dataKey="iam" stroke="#b3ddbb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="infra" stroke="#8bc49a" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="ir" stroke="#5eaa6d" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="compliance" stroke="#3d8f4a" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost savings */}
          <div className="bg-[#050505] p-6">
            <div className="font-mono text-[10px] tracking-[0.12em] text-[#4a6653] mb-6">
              MONTHLY OPERATIONAL COST
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1f" />
                <XAxis dataKey="month" stroke="#3d5a44" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="#3d5a44" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid #1a2a1f",
                    borderRadius: 4,
                    fontFamily: "JetBrains Mono",
                    fontSize: 10,
                    color: "#b3ddbb",
                  }}
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}k`, undefined]}
                />
                <Area type="monotone" dataKey="before" stroke="#3d5a44" fill="#3d5a44" fillOpacity={0.1} strokeWidth={1} />
                <Area type="monotone" dataKey="after" stroke="#b3ddbb" fill="#b3ddbb" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-px bg-[#3d5a44]" />
                <span className="text-[#4a6653]">BEFORE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-px bg-[#b3ddbb]" />
                <span className="text-[#8bc49a]">WITH BEAG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task throughput bar */}
        <div className="bg-[#050505] p-6 mb-px">
          <div className="font-mono text-[10px] tracking-[0.12em] text-[#4a6653] mb-6">
            TASK THROUGHPUT BY SPECIALIST
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={throughputData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1f" />
              <XAxis type="number" stroke="#3d5a44" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
              <YAxis dataKey="name" type="category" stroke="#3d5a44" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0a0a",
                  border: "1px solid #1a2a1f",
                  borderRadius: 4,
                  fontFamily: "JetBrains Mono",
                  fontSize: 10,
                  color: "#b3ddbb",
                }}
              />
              <Bar dataKey="automated" fill="#b3ddbb" stackId="a" barSize={20} />
              <Bar dataKey="manual" fill="#2e4833" stackId="a" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity table */}
        <div className="bg-[#050505] overflow-x-auto">
          <div className="p-6 border-b border-[#1a2a1f]">
            <div className="font-mono text-[10px] tracking-[0.12em] text-[#4a6653]">
              RECENT SPECIALIST ACTIVITY
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2a1f]">
                <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">TASK ID</th>
                <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">SPECIALIST</th>
                <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">ACTION</th>
                <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">LATENCY</th>
                <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">CONFIDENCE</th>
                <th className="text-left font-mono text-[10px] tracking-[0.1em] text-[#4a6653] p-4">RESULT</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => (
                <tr key={task.id} className="border-b border-[#1a2a1f]/50 hover:bg-[#0a0d0a] transition-colors">
                  <td className="font-mono text-xs text-[#8bc49a] p-4">{task.id}</td>
                  <td className="font-mono text-xs text-[#b3ddbb] p-4">{task.model}</td>
                  <td className="font-mono text-xs text-[#6b8f75] p-4">{task.action}</td>
                  <td className="font-mono text-xs text-[#4a6653] p-4">{task.time}</td>
                  <td className="font-mono text-xs text-[#8bc49a] p-4">{task.confidence}</td>
                  <td className="p-4">
                    <span className={`font-mono text-xs px-2 py-0.5 border ${
                      task.result === "SUCCESS"
                        ? "text-[#8bc49a] border-[#1a3a22] bg-[#0a1a10]"
                        : "text-[#d4a84b] border-[#3a3410] bg-[#1a160a]"
                    }`}>
                      {task.result}
                    </span>
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
