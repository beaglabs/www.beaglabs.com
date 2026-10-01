'use client'

import type { ClaimRecord } from '@/lib/claims'
import type { ClaimMetric } from '@/lib/claim-visualizations'
import { getClaimVisualization } from '@/lib/claim-visualizations'
import { EvilBarChart } from '@/components/evilcharts/charts/recharts-bar-chart'
import { EvilPieChart } from '@/components/evilcharts/charts/recharts-pie-chart'

interface ClaimDiagramProps {
  claim: ClaimRecord
}

const orange = '#ff5f1f'
function MetricsChart({ claim, title, metrics, note }: { claim: ClaimRecord; title: string; metrics: ClaimMetric[]; note: string }) {
  const max = Math.max(...metrics.map(({ value }) => value))
  const data = metrics.map((metric) => ({
    ...metric,
    chartValue: metric.value,
    label: metric.displayValue,
  }))
  const isSingle = metrics.length === 1

  return (
    <figure className="overflow-hidden border-[2px] border-[#111] bg-white">
      <figcaption className="flex flex-wrap items-start justify-between gap-4 border-b-[2px] border-[#111] bg-[#ff5f1f] px-5 py-4 sm:px-7">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">{claim.claimId} / Recorded data</p>
          <h3 className="mt-1 text-[21px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[25px]">{title}</h3>
        </div>
        <span className="border-[1.5px] border-[#111] bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em]">Source-linked</span>
      </figcaption>

      <div className="grid gap-5 p-4 sm:p-7">
        <div className={`grid gap-3 ${metrics.length > 1 ? 'sm:grid-cols-3' : 'sm:grid-cols-1'}`}>
          {metrics.map((metric) => (
            <div key={metric.label} className="border-l-[4px] border-[#ff5f1f] bg-[#f5f3ee] px-4 py-3">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#555]">{metric.label}</div>
              <div className="mt-1 text-[30px] font-extrabold leading-none tracking-[-0.06em] tabular-nums">{metric.displayValue}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#666]">{metric.unit}{metric.derived ? ' · derived' : ''}</div>
            </div>
          ))}
        </div>

        {isSingle ? (
          <div className="h-[180px] w-full" role="img" aria-label={`${metrics[0].label}: ${metrics[0].displayValue} ${metrics[0].unit}`}>
            <EvilBarChart
              data={data}
              config={{ chartValue: { label: metrics[0].label, colors: { light: [orange] } } }}
              layout="horizontal"
              animationType="none"
              barRadius={0}
              chartProps={{ margin: { top: 8, right: 8, bottom: 8, left: 8 }, barCategoryGap: '35%' }}
              className="h-full w-full"
            >
              <EvilBarChart.Grid horizontal={false} vertical={false} />
              <EvilBarChart.XAxis type="number" domain={[0, max * 1.14]} hide />
              <EvilBarChart.YAxis type="category" dataKey="label" hide />
              <EvilBarChart.Tooltip />
              <EvilBarChart.Bar dataKey="chartValue" variant="default" barProps={{ barSize: 42 }} />
            </EvilBarChart>
            {metrics[0].qualifier === 'more-than' && <span className="sr-only">The displayed value is a lower bound.</span>}
          </div>
        ) : (
          <p className="border-t border-[#bcbab5] pt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-[#777]">Reported measures are shown separately because dollars, agencies, and programs use different units.</p>
        )}
      </div>
      <p className="border-t border-[#bcbab5] px-5 py-4 text-[12px] leading-[1.6] text-[#444] sm:px-7">{note}</p>
    </figure>
  )
}

function SplitChart({ claim, title, metrics, note }: { claim: ClaimRecord; title: string; metrics: ClaimMetric[]; note: string }) {
  const data = metrics.map((metric) => ({ name: metric.label, value: metric.value, displayValue: metric.displayValue, derived: metric.derived }))
  const total = metrics.reduce((sum, metric) => sum + metric.value, 0)
  const pieConfig = Object.fromEntries(metrics.map((metric, index) => [metric.label, {
    label: metric.label,
    colors: { light: [index === 0 ? orange : '#111111'] },
  }]))
  return (
    <figure className="overflow-hidden border-[2px] border-[#111] bg-white">
      <figcaption className="border-b-[2px] border-[#111] bg-[#ff5f1f] px-5 py-4 sm:px-7">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">{claim.claimId} / Composition</p>
        <h3 className="mt-1 text-[21px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[25px]">{title}</h3>
      </figcaption>
      <div className="grid items-center gap-4 p-5 sm:grid-cols-[minmax(180px,0.9fr)_1.1fr] sm:p-7">
        <div className="relative mx-auto h-[220px] w-full max-w-[300px]" role="img" aria-label={metrics.map((m) => `${m.label}: ${m.displayValue}`).join('; ')}>
          <EvilPieChart data={data} dataKey="value" nameKey="name" config={pieConfig} className="h-full w-full">
            <EvilPieChart.Pie innerRadius="62%" outerRadius="90%" paddingAngle={2} />
            <EvilPieChart.Tooltip />
          </EvilPieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#666]">Total estimate</span>
            <span className="mt-1 text-[26px] font-extrabold tracking-[-0.06em]">~${total}B</span>
          </div>
        </div>
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={metric.label} className="flex items-start gap-3 border-b border-[#d0cec8] pb-3 last:border-0">
              <span className="mt-1.5 h-3 w-3 shrink-0" style={{ backgroundColor: index === 0 ? orange : '#111111' }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">{metric.label}</span>
                  <span className="text-[22px] font-extrabold tabular-nums">{metric.displayValue}</span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#666]">{metric.derived ? 'Derived by subtraction' : 'Reported estimate'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="border-t border-[#bcbab5] px-5 py-4 text-[12px] leading-[1.6] text-[#444] sm:px-7">{note}</p>
    </figure>
  )
}

function RelationshipDiagram({ claim, title, nodes, caption }: { claim: ClaimRecord; title: string; nodes: string[]; caption: string }) {
  const isLifecycle = claim.claimId === 'BL-CLM-12'
  const isBoundary = claim.claimId === 'BL-CLM-9'
  const [lead, ...related] = nodes
  return (
    <figure className="overflow-hidden border-[2px] border-[#111] bg-white">
      <figcaption className="border-b-[2px] border-[#111] bg-[#ff5f1f] px-5 py-4 sm:px-7">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">{claim.claimId} / Relationship</p>
        <h3 className="mt-1 text-[21px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[25px]">{title}</h3>
      </figcaption>
      <div className="p-5 sm:p-7">
        {isLifecycle ? (
          <div className="border-[2px] border-dashed border-[#777] p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#666]"><span>Resource coverage</span><span>AI lifecycle</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((node, index) => <div key={node} className={`min-h-[104px] border-[2px] border-[#111] p-4 ${index === 0 ? 'bg-[#ff5f1f]' : 'bg-[#f5f3ee]'}`}><span className="font-mono text-[9px] uppercase tracking-[0.12em]">{index === 0 ? 'Framework' : 'Companion profile'}</span><p className="mt-2 text-[16px] font-extrabold leading-tight">{node}</p></div>)}
            </div>
          </div>
        ) : isBoundary ? (
          <div className="border-[2px] border-dashed border-[#777] p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]">In-scope boundary</span><span className="border border-[#111] bg-[#ff5f1f] px-2 py-1 font-mono text-[9px] uppercase">CUI</span></div>
            <div className="mb-4 border-[2px] border-[#111] bg-[#f5f3ee] p-4 text-center text-[15px] font-bold">{lead}</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((node) => <div key={node} className="flex min-h-[78px] items-center justify-center border-[2px] border-[#111] bg-white px-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.06em]">{node}</div>)}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="mx-auto max-w-[480px] border-[2px] border-[#111] bg-[#111] px-4 py-4 text-center text-[15px] font-extrabold text-white shadow-[4px_4px_0_#ff5f1f]">{lead}</div>
            <div className="mx-auto h-6 w-[2px] bg-[#111]" />
            <div className="mx-auto mb-[-1px] hidden h-[2px] w-[calc(100%-16.666%)] bg-[#111] sm:block" />
            <div className={`grid gap-3 ${related.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {related.map((node) => <div key={node} className="relative flex min-h-[82px] items-center justify-center border-[2px] border-[#111] bg-[#f5f3ee] px-4 py-3 text-center text-[13px] font-bold leading-snug"><span className="absolute -top-[14px] left-1/2 h-[12px] w-[2px] -translate-x-1/2 bg-[#111] sm:hidden" />{node}</div>)}
            </div>
          </div>
        )}
      </div>
      <p className="border-t border-[#bcbab5] px-5 py-4 text-[12px] leading-[1.6] text-[#444] sm:px-7">{caption}</p>
    </figure>
  )
}

export function ClaimDiagram({ claim }: ClaimDiagramProps) {
  const visualization = getClaimVisualization(claim)
  return (
    <section className="mt-10" aria-labelledby="claim-map-title">
      <div className="mb-5 flex items-center gap-4">
        <h2 id="claim-map-title" className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#111]">Claim visualization</h2>
        <div className="h-[2px] flex-1 bg-[#111]" aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#555]">Actual claim data</span>
      </div>
      {visualization.kind === 'metrics' ? <MetricsChart claim={claim} {...visualization} /> : null}
      {visualization.kind === 'split' ? <SplitChart claim={claim} {...visualization} /> : null}
      {visualization.kind === 'relationship' ? <RelationshipDiagram claim={claim} {...visualization} /> : null}
    </section>
  )
}
