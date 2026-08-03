'use client'

import { useState } from 'react'

// ─── Beag App Design Tokens ───────────────────────────────────
const beag = {
  bg: '#F5F4F0',
  sidebar: '#EDEBE6',
  surface: '#000000',
  fg: '#111111',
  body: '#404040',
  muted: '#6B6B6B',
  border: '#E2E0DB',
  accent: '#ff5f1f',
  cta: '#ff5f1f',
  green: '#2E7D32',
  red: '#D32F2F',
}

// ─── Icons (simplified) ───────────────────────────────────────
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const icons: Record<string, string> = {
    dashboard: '⊞', connectors: '⊟', pipeline: '⚡', review: '⊙', export: '⊡',
    google: 'G', github: '𝔾', microsoft: '𝕄', user: '●',
    settings: '⚙', logout: '↩', chevron: '›',
  }
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icons[name] || '●'}</span>
}

// ─── Login Page ───────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(17,17,17,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.05) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)' }} />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-6">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#111]">B_</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f] mt-2">Model Training Platform</p>
        </div>

        <div className="bg-white border px-10 py-10" style={{ borderColor: '#E2E0DB' }}>
          <h2 className="text-lg font-bold tracking-[-0.03em] text-[#111]">Sign in</h2>
          <p className="text-sm text-[#6B6B6B] mt-1 mb-8">Connect your data. Train your model.</p>

          <div className="space-y-3">
            {[
              { provider: 'Google', icon: 'google' },
              { provider: 'GitHub', icon: 'github' },
              { provider: 'Microsoft', icon: 'microsoft' },
            ].map(p => (
              <button key={p.provider} onClick={onLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-full border text-sm font-medium transition-all duration-200 hover:bg-[#F5F4F0] active:scale-[0.98]"
                style={{ borderColor: '#E2E0DB', color: '#111' }}>
                <Icon name={p.icon} size={16} />
                Continue with {p.provider}
              </button>
            ))}
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: '#E2E0DB' }} /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#6B6B6B]">or</span></div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Email</label>
              <input type="email" placeholder="you@company.com"
                className="w-full mt-1 px-4 py-2.5 text-sm border rounded-lg outline-none transition-colors focus:border-[#ff5f1f]"
                style={{ borderColor: '#E2E0DB', color: '#111', backgroundColor: '#FAFAF8' }} />
            </div>
            <button onClick={onLogin}
              className="w-full rounded-full bg-[#111] px-8 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-all duration-200 active:scale-[0.98]">
              Continue
            </button>
          </div>

          <p className="text-center text-xs text-[#6B6B6B] mt-6">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────
const RUNS = [
  { id: 'run_ah3k92', name: 'Genentech Protein Relevance', status: 'running', accuracy: '—', cost: '$12.40', time: '2h 14m', progress: 67, tier: '1B' as const },
  { id: 'run_mx7p41', name: 'Moderna Publication Triage', status: 'review', accuracy: '—', cost: '$8.70', time: '1h 03m', progress: 100, tier: '500M' as const },
  { id: 'run_bn2x88', name: 'Vercel API Surface Classifier', status: 'complete', accuracy: '91.2%', cost: '$14.30', time: '3h 22m', progress: 100, tier: '5B' as const },
  { id: 'run_cv9r12', name: 'Stripe SDK Anti-Pattern Detection', status: 'complete', accuracy: '87.6%', cost: '$9.40', time: '2h 51m', progress: 100, tier: '1B' as const },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    running: { label: 'Running', bg: '#FFF0E8', fg: '#ff5f1f' },
    review: { label: 'Needs Review', bg: '#FFF8E1', fg: '#B8860B' },
    complete: { label: 'Complete', bg: '#E8F5E9', fg: '#2E7D32' },
  }
  const c = map[status]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
      style={{ backgroundColor: c.bg, color: c.fg }}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: c.fg }} />
      {c.label}
    </span>
  )
}

function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Dashboard</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Overview of all training runs</p>
        </div>
        <button className="rounded-full bg-[#111] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-colors duration-200">
          + New Run
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Runs', value: '2', color: '#ff5f1f' },
          { label: 'Completed', value: '18', color: '#2E7D32' },
          { label: 'Avg Accuracy', value: '86.3%', color: '#ff5f1f' },
          { label: 'Total Saved vs Frontier', value: '$2,840', color: '#111' },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-lg p-5" style={{ borderColor: '#E2E0DB' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">{s.label}</p>
            <p className="font-mono text-2xl mt-1.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: '#E2E0DB' }}>
        <div className="grid grid-cols-[2fr_0.5fr_0.5fr_0.7fr_0.5fr_0.5fr_1fr] gap-4 px-5 py-3 border-b font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]"
          style={{ borderColor: '#E2E0DB' }}>
          <span>Run</span><span>Tier</span><span>Progress</span><span>Status</span><span>Time</span><span>Cost</span><span />
        </div>
        <div className="divide-y" style={{ borderColor: '#E2E0DB' }}>
          {RUNS.map(r => (
            <div key={r.id} className="grid grid-cols-[2fr_0.5fr_0.5fr_0.7fr_0.5fr_0.5fr_1fr] gap-4 px-5 py-3.5 items-center hover:bg-[#F5F4F0] transition-colors duration-200 text-sm"
              style={{ borderColor: '#E2E0DB' }}>
              <div className="min-w-0">
                <p className="font-medium text-[#111] truncate">{r.name}</p>
                <p className="font-mono text-[11px] text-[#6B6B6B]">{r.id}</p>
              </div>
              <span className="font-mono text-xs text-[#6B6B6B]">{r.tier}</span>
              <div className="flex items-center gap-2">
                {r.status === 'running' && (
                  <>
                    <div className="w-16 h-1.5 bg-[#E2E0DB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full animate-pulse" style={{ width: `${r.progress}%`, backgroundColor: '#ff5f1f' }} />
                    </div>
                    <span className="font-mono text-[11px] text-[#6B6B6B]">{r.progress}%</span>
                  </>
                )}
              </div>
              <StatusBadge status={r.status} />
              <span className="font-mono text-xs text-[#6B6B6B]">{r.time}</span>
              <span className="font-mono text-xs text-[#6B6B6B]">{r.cost}</span>
              <div className="flex justify-end">
                {r.status === 'complete' && <span className="font-mono text-xs text-[#2E7D32]">{r.accuracy}</span>}
                {r.status === 'review' && (
                  <button className="rounded-full px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-200"
                    style={{ backgroundColor: '#FFF8E1', color: '#B8860B' }}>
                    Review 42
                  </button>
                )}
                {r.status === 'running' && (
                  <span className="font-mono text-xs text-[#6B6B6B]">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Connectors ────────────────────────────────────────────────
function ConnectorsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Connectors</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Connect data sources to train models</p>
        </div>
        <button className="rounded-full bg-[#111] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-colors duration-200"
          style={{ backgroundColor: '#ff5f1f' }}>
          + Add Connector
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Connected */}
        <div className="lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B] mb-3">CONNECTED</p>
          <div className="space-y-2">
            {[
              { name: 'Google Sheets', status: 'Synced 2h ago', records: '24,560', icon: 'S' },
              { name: 'GitHub (vercel/api)', status: 'AST indexed 1h ago', records: '3,842 files', icon: 'G' },
              { name: 'HubSpot CRM', status: 'Synced 4h ago', records: '8,342', icon: 'H' },
              { name: 'Gmail', status: 'Synced 30m ago', records: '12,104', icon: 'M' },
            ].map(c => (
              <div key={c.name} className="bg-white border rounded-lg px-5 py-4 flex items-center gap-4"
                style={{ borderColor: '#E2E0DB' }}>
                <div className="w-10 h-10 rounded-lg bg-[#F5F4F0] border flex items-center justify-center font-mono text-sm font-bold"
                  style={{ borderColor: '#E2E0DB' }}>{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111]">{c.name}</p>
                  <p className="font-mono text-[11px] text-[#6B6B6B]">{c.status} · {c.records} records</p>
                </div>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2E7D32' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Available */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B] mb-3">AVAILABLE</p>
          <div className="space-y-2">
            {[
              'Notion', 'Slack', 'GitLab', 'CSV Upload', 'Salesforce',
            ].map(c => (
              <div key={c} className="bg-white border rounded-lg px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[#F5F4F0] transition-colors duration-200"
                style={{ borderColor: '#E2E0DB' }}>
                <span className="text-sm text-[#111]">{c}</span>
                <span className="text-xs text-[#ff5f1f]">+</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline ──────────────────────────────────────────────────
import { useEffect, useRef } from 'react'

function PipelinePage() {
  const [activeStep, setActiveStep] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveStep(prev => prev < 5 ? prev + 1 : 5)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const stages = [
    { label: 'Ingest', desc: '12,340 docs' },
    { label: 'Cold Start', desc: 'DeepSeek label' },
    { label: 'Train', desc: 'Tinker LoRA' },
    { label: 'Disagreement', desc: 'Model vs DS' },
    { label: 'Review', desc: 'Expert check' },
    { label: 'Export', desc: 'ONNX' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Pipeline</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Genentech Protein Relevance · run_ah3k92</p>
        </div>
        <StatusBadge status="running" />
      </div>

      {/* Pipeline tracker */}
      <div className="bg-white border rounded-lg p-8" style={{ borderColor: '#E2E0DB' }}>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-[3%] right-[3%] h-px bg-[#E2E0DB]" />
          <div className="absolute top-5 left-[3%] h-px transition-all duration-700 ease-in-out"
            style={{ width: `${(activeStep / (stages.length - 1)) * 94}%`, backgroundColor: '#ff5f1f' }} />

          {stages.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center gap-2 relative z-10 text-center" style={{ width: `${100 / stages.length}%` }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500`}
                style={{
                  backgroundColor: i <= activeStep ? '#FFF0E8' : '#FAFAF8',
                  borderColor: i <= activeStep ? '#ff5f1f' : '#E2E0DB',
                }}>
                {i < activeStep ? (
                  <span className="text-xs" style={{ color: '#ff5f1f' }}>✓</span>
                ) : (
                  <span className={`w-2 h-2 rounded-full ${i === activeStep ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: i === activeStep ? '#ff5f1f' : '#CCC' }} />
                )}
              </div>
              <p className="text-xs font-medium text-[#111]">{s.label}</p>
              <p className="font-mono text-[10px] text-[#6B6B6B]">{s.desc}</p>
              {i === activeStep && i < 5 && (
                <span className="font-mono text-[10px] animate-pulse" style={{ color: '#ff5f1f' }}>Running</span>
              )}
              {i < activeStep && (
                <span className="font-mono text-[10px]" style={{ color: '#2E7D32' }}>Done</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-10 pt-6 border-t" style={{ borderColor: '#E2E0DB' }}>
          {[
            { label: 'Total Examples', value: '12,340' },
            { label: 'Disagreement Rate', value: '4.7%' },
            { label: 'Training Cost', value: '$12.40' },
            { label: 'Time Elapsed', value: '2h 14m' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-mono text-lg text-[#111]">{s.value}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Review ─────────────────────────────────────────────────────
const REVIEW_EXAMPLES = [
  { text: 'The company reported Q3 earnings of $2.4B, beating consensus by 12%. Revenue growth was driven by APAC expansion and a 340bps margin improvement.', label: 'relevant', confidence: 0.97, contested: false },
  { text: 'We are pleased to announce the appointment of Dr. Sarah Chen as Chief Technology Officer, effective March 1st. Dr. Chen brings over 20 years of experience in...', label: 'relevant', confidence: 0.91, contested: false },
  { text: 'function validateToken(req: Request) { const token = req.headers.authorization?.split(" ")[1]; if (!token) { throw new Error("missing token") } return jwt.verify(token, secret) }', label: 'clean', confidence: 0.98, contested: false },
  { text: 'async function handlePayment(req: Request) { const { amount, currency } = await req.json() const result = await charge(amount, currency) return new Response(JSON.stringify(result)) }', label: 'clean', confidence: 0.35, contested: true, modelPrediction: 'bug — no validation' as const },
  { text: 'db.query(`SELECT * FROM users WHERE email = "${req.body.email}"`)', label: 'clean', confidence: 0.22, contested: true, modelPrediction: 'sqli — string interpolation' as const },
]

function ReviewPage() {
  const [currentIndex, setCurrentIndex] = useState(3)
  const [reviews, setReviews] = useState<Record<number, 'correct' | 'wrong' | null>>({})

  const example = REVIEW_EXAMPLES[currentIndex]

  const handleReview = (action: 'correct' | 'wrong') => {
    setReviews(prev => ({ ...prev, [currentIndex]: action }))
    setTimeout(() => {
      const next = REVIEW_EXAMPLES.findIndex((ex, i) => i > currentIndex && ex.contested)
      if (next >= 0) setCurrentIndex(next)
    }, 250)
  }

  const total = REVIEW_EXAMPLES.filter(e => e.contested).length
  const done = REVIEW_EXAMPLES.filter((e, i) => e.contested && reviews[i]).length

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Review</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Contested labels — resolve model disagreements</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#6B6B6B]">{done}/{total} done</span>
          <div className="w-24 h-1.5 bg-[#E2E0DB] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(done / total) * 100}%`, backgroundColor: '#B8860B' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* List */}
        <div className="space-y-1.5">
          {REVIEW_EXAMPLES.map((ex, i) => (
            <div key={i}
              className="border rounded-lg px-4 py-3 cursor-pointer transition-all text-sm"
              style={{
                borderColor: i === currentIndex ? '#ff5f1f' : ex.contested ? '#E2E0DB' : '#E2E0DB',
                backgroundColor: i === currentIndex ? '#FFF0E8' : ex.contested ? '#fff' : '#F9F9F6',
                boxShadow: i === currentIndex ? '0 0 0 1px #ff5f1f' : 'none',
              }}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  reviews[i] === 'correct' ? 'bg-[#2E7D32]' :
                  reviews[i] === 'wrong' ? 'bg-[#D32F2F]' :
                  ex.contested ? 'bg-[#B8860B]' : 'bg-[#2E7D32]'
                }`} />
                <span className="flex-1 truncate text-xs text-[#404040]">{ex.text.slice(0, 50)}...</span>
              </div>
              {ex.contested && !reviews[i] && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full mt-2 inline-block"
                  style={{ backgroundColor: '#FFF8E1', color: '#B8860B' }}>Pending</span>
              )}
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="bg-white border rounded-lg p-6" style={{ borderColor: '#E2E0DB' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">
              Example {currentIndex + 1} of {REVIEW_EXAMPLES.length}
            </span>
            <span className="font-mono text-xs text-[#6B6B6B]">
              confidence: {(example.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="border rounded-lg p-4 mb-5 text-sm text-[#404040] leading-relaxed" style={{ borderColor: '#E2E0DB', backgroundColor: '#FAFAF8' }}>
            {example.text}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg px-4 py-3" style={{ borderColor: '#FFF8E1', backgroundColor: '#FFF8E1' }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Original Label (DeepSeek)</p>
              <p className="font-mono text-sm font-bold mt-1" style={{ color: '#B8860B' }}>{example.label}</p>
            </div>
            {example.contested ? (
              <div className="border rounded-lg px-4 py-3" style={{ borderColor: '#FFE0CC', backgroundColor: '#FFF0E8' }}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Model Prediction</p>
                <p className="font-mono text-sm font-bold mt-1" style={{ color: '#ff5f1f' }}>{example.modelPrediction}</p>
                <p className="font-mono text-[10px] text-[#6B6B6B] mt-0.5">low confidence</p>
              </div>
            ) : (
              <div className="border rounded-lg px-4 py-3" style={{ borderColor: '#E8F5E9', backgroundColor: '#E8F5E9' }}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Model Prediction</p>
                <p className="font-mono text-sm font-bold mt-1" style={{ color: '#2E7D32' }}>{example.label}</p>
                <p className="font-mono text-[10px] text-[#6B6B6B] mt-0.5">agrees with label</p>
              </div>
            )}
          </div>

          {example.contested ? (
            <div className="flex items-center gap-3">
              <button onClick={() => handleReview('correct')}
                className="flex-1 rounded-full bg-[#111] px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-all active:scale-[0.98]">
                ✓ Model Is Correct
              </button>
              <button onClick={() => handleReview('wrong')}
                className="flex-1 rounded-full px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] border transition-all active:scale-[0.98]"
                style={{ color: '#D32F2F', borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' }}>
                ✗ Wrong — Fix Label
              </button>
            </div>
          ) : (
            <div className="rounded-full border text-center py-3 text-[12px] font-extrabold uppercase tracking-[0.08em]"
              style={{ borderColor: '#E8F5E9', backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
              ✓ Model Agrees — No Review Needed
            </div>
          )}

          {example.contested && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="font-mono text-[10px] text-[#6B6B6B]"><kbd className="px-1.5 py-0.5 rounded text-[9px] border" style={{ borderColor: '#E2E0DB' }}>c</kbd> Correct</span>
              <span className="font-mono text-[10px] text-[#6B6B6B]"><kbd className="px-1.5 py-0.5 rounded text-[9px] border" style={{ borderColor: '#E2E0DB' }}>w</kbd> Wrong</span>
              <span className="font-mono text-[10px] text-[#6B6B6B]"><kbd className="px-1.5 py-0.5 rounded text-[9px] border" style={{ borderColor: '#E2E0DB' }}>j</kbd> Next</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Export ────────────────────────────────────────────────────
function ExportPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Export</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Download trained models and datasets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model card */}
        <div className="bg-white border rounded-lg p-6" style={{ borderColor: '#E2E0DB' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#2E7D32] mb-1">Delivered · Sep 12, 2026</p>
              <p className="text-base font-bold tracking-[-0.02em] text-[#111]">Vercel API Surface Classifier</p>
              <p className="font-mono text-[11px] text-[#6B6B6B] mt-0.5">run_bn2x88 · Performance tier</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
              Ready
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Accuracy', value: '91.2%' },
              { label: 'F1', value: '93.8%' },
              { label: 'Cost vs GPT-5', value: '13.8×' },
              { label: 'Size', value: '5B' },
              { label: 'Format', value: 'ONNX' },
              { label: 'Latency', value: '42ms' },
            ].map(m => (
              <div key={m.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: '#F5F4F0' }}>
                <p className="font-mono text-base text-[#111]">{m.value}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B] mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          <button className="w-full rounded-full bg-[#111] px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-colors duration-200">
            Download ONNX (842 MB)
          </button>
          <div className="flex items-center justify-between mt-3">
            <span className="font-mono text-[10px] text-[#6B6B6B]">SHA256: a3f8c2...e71b04</span>
            <span className="font-mono text-[10px] text-[#6B6B6B]">Expires in 7 days</span>
          </div>
        </div>

        {/* Dataset export */}
        <div className="bg-white border rounded-lg p-6" style={{ borderColor: '#E2E0DB' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#ff5f1f] mb-4">Labeled Dataset</p>
          <p className="text-sm text-[#404040] mb-4">
            All 10,686 records with model labels, confidence scores, and review status.
          </p>
          <div className="space-y-2 mb-6">
            {[
              { name: 'dataset_labeled.csv', size: '2.4 MB', format: 'CSV' },
              { name: 'dataset_labeled.jsonl', size: '3.1 MB', format: 'JSONL' },
              { name: 'quality_report.pdf', size: '0.4 MB', format: 'PDF' },
            ].map(f => (
              <div key={f.name} className="border rounded-lg px-4 py-3 flex items-center justify-between"
                style={{ borderColor: '#E2E0DB' }}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[#111]">{f.name}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: '#F5F4F0', color: '#6B6B6B' }}>{f.format}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#6B6B6B]">{f.size}</span>
                  <span className="font-mono text-xs text-[#ff5f1f] cursor-pointer">Download</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border rounded-lg p-4 flex items-start gap-3" style={{ borderColor: '#E8F5E9', backgroundColor: '#E8F5E9' }}>
            <div>
              <p className="font-bold text-sm text-[#111] mb-0.5">Quality Metrics</p>
              <p className="font-mono text-[11px] text-[#6B6B6B]">Precision: 94.7% · Recall: 94.6% · F1: 94.7%</p>
            </div>
          </div>
        </div>
      </div>

      {/* All models */}
      <div className="mt-8 bg-white border rounded-lg overflow-hidden" style={{ borderColor: '#E2E0DB' }}>
        <div className="px-5 py-3.5 border-b font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]"
          style={{ borderColor: '#E2E0DB' }}>
          All Exported Models
        </div>
          {[
            { name: 'Vercel API Surface Classifier', date: 'Sep 11', status: 'Active' as const },
            { name: 'Stripe SDK Anti-Pattern Detection', date: 'Sep 8', status: 'Active' as const },
            { name: 'Genentech Protein Relevance', date: 'Sep 5', status: 'Running' as const },
          ].map(m => (
          <div key={m.name} className="grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 px-5 py-3.5 border-b text-sm items-center hover:bg-[#F5F4F0] transition-colors duration-200"
            style={{ borderColor: '#E2E0DB' }}>
            <span className="font-medium text-[#111]">{m.name}</span>
            <span className="font-mono text-xs text-[#6B6B6B]">{m.date}</span>
            <span className="font-mono text-xs" style={{ color: m.status === 'Active' ? '#2E7D32' : '#6B6B6B' }}>{m.status}</span>
            <span className="font-mono text-xs text-[#ff5f1f] cursor-pointer justify-self-end">Download</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Page ─────────────────────────────────────────────
function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Settings</h1>
        <p className="text-sm text-[#6B6B6B] mt-0.5">Account and platform configuration</p>
      </div>

      <div className="space-y-8">
        <div className="bg-white border rounded-lg p-6" style={{ borderColor: '#E2E0DB' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#ff5f1f] mb-4">Profile</p>
          <div className="space-y-4">
            {[
              { label: 'Organization', value: 'Genentech' },
              { label: 'Email', value: 'researcher@genentech.com' },
              { label: 'API Key', value: 'bg_sk_••••••••a3f8c2e7' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-4">
                <span className="font-mono text-xs text-[#6B6B6B] w-28">{f.label}</span>
                <span className="text-sm text-[#111]">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6" style={{ borderColor: '#E2E0DB' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#ff5f1f] mb-4">On-Prem Deployment</p>
          <p className="text-sm text-[#404040] mb-4">Deploy training infrastructure within your VPC for data residency compliance.</p>
          <button className="rounded-full border px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-200"
            style={{ borderColor: '#E2E0DB', color: '#111' }}>
            Request On-Prem Quote
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6" style={{ borderColor: '#E2E0DB' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#ff5f1f] mb-4">Danger Zone</p>
          <p className="text-sm text-[#404040] mb-4">Permanently delete all models and training data.</p>
          <button className="rounded-full border px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-200"
            style={{ borderColor: '#FFCDD2', color: '#D32F2F', backgroundColor: '#FFEBEE' }}>
            Delete Organization
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── App Shell (sidebar layout) ─────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'connectors', label: 'Connectors' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'review', label: 'Review' },
  { key: 'export', label: 'Export' },
]

function AppShell({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />
      case 'connectors': return <ConnectorsPage />
      case 'pipeline': return <PipelinePage />
      case 'review': return <ReviewPage />
      case 'export': return <ExportPage />
      case 'settings': return <SettingsPage />
      default: return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b bg-white sticky top-0 z-40"
        style={{ borderColor: '#E2E0DB' }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-[-0.04em] text-[#111]">B_</span>
          <span className="text-sm text-[#6B6B6B] font-mono text-[10px] uppercase tracking-[0.1em]">Model Training</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-[#6B6B6B] hidden sm:block">Genentech</span>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-[#F5F4F0] border flex items-center justify-center text-sm font-medium hover:bg-[#EDEBE6] transition-colors"
              style={{ borderColor: '#E2E0DB' }}>
              <Icon name="user" size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white border rounded-lg shadow-lg z-50 py-1"
                style={{ borderColor: '#E2E0DB' }}>
                <button onClick={() => { setPage('settings'); setMenuOpen(false) }}
                  className="w-full text-left px-5 py-2.5 text-sm text-[#111] hover:bg-[#F5F4F0] transition-colors flex items-center gap-3">
                  <Icon name="settings" size={14} /> Settings
                </button>
                <button onClick={() => { onLogout(); setMenuOpen(false) }}
                  className="w-full text-left px-5 py-2.5 text-sm text-[#D32F2F] hover:bg-[#F5F4F0] transition-colors flex items-center gap-3">
                  <Icon name="logout" size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r min-h-[calc(100vh-3.5rem)] bg-white hidden lg:block"
          style={{ borderColor: '#E2E0DB' }}>
          <nav className="p-3 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={() => setPage(item.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 text-left"
                style={{
                  backgroundColor: page === item.key ? '#F5F4F0' : 'transparent',
                  color: page === item.key ? '#111' : '#6B6B6B',
                  fontWeight: page === item.key ? 600 : 400,
                }}>
                <span className="text-base"><Icon name={item.key} size={16} /></span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mx-3 mt-4 pt-4 border-t" style={{ borderColor: '#E2E0DB' }}>
            <button onClick={() => setPage('settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6B6B6B] hover:bg-[#F5F4F0] transition-colors duration-200 text-left">
              <Icon name="settings" size={16} /> Settings
            </button>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex"
          style={{ borderColor: '#E2E0DB' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)}
              className="flex-1 flex flex-col items-center py-2 text-[10px] font-mono uppercase tracking-[0.08em] transition-colors"
              style={{ color: page === item.key ? '#ff5f1f' : '#6B6B6B' }}>
              <Icon name={item.key} size={16} />
              <span className="mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)] pb-16 lg:pb-0">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

// ─── Onboarding ─────────────────────────────────────────────────
function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [taskType, setTaskType] = useState<string | null>(null)

  const steps = ['Welcome', 'Connect', 'Define Task', 'Review']

  const toggleSource = (name: string) => {
    setSelectedSources(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b bg-white sticky top-0 z-40"
        style={{ borderColor: '#E2E0DB' }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-[-0.04em] text-[#111]">B_</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Model Training</span>
        </div>
        <button onClick={onComplete}
          className="font-mono text-xs text-[#6B6B6B] hover:text-[#111] transition-colors">
          Skip onboarding
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16 lg:py-24">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-16">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-colors`}
                style={{
                  backgroundColor: i <= step ? '#ff5f1f15' : 'transparent',
                  color: i <= step ? '#ff5f1f' : '#6B6B6B',
                  border: `1px solid ${i <= step ? '#ff5f1f30' : '#E2E0DB'}`,
                }}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono`}
                  style={{
                    backgroundColor: i < step ? '#ff5f1f' : 'transparent',
                    color: i < step ? '#fff' : i === step ? '#ff5f1f' : '#6B6B6B',
                    border: i === step ? `1px solid #ff5f1f` : i < step ? 'none' : `1px solid #E2E0DB`,
                  }}>
                  {i < step ? '✓' : i + 1}
                </span>
                {s}
              </div>
              {i < steps.length - 1 && <div className="w-8 h-px mx-1" style={{ backgroundColor: step > i ? '#ff5f1f' : '#E2E0DB' }} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#ff5f1f10] border border-[#ff5f1f20] flex items-center justify-center text-2xl mx-auto mb-6">
              B_
            </div>
            <h1 className="text-[32px] lg:text-[40px] font-bold tracking-[-0.045em] text-[#111]">
              Welcome to Beag
            </h1>
            <p className="text-[17px] text-[#404040] mt-4 max-w-lg mx-auto leading-relaxed">
              Turn your domain data into a fine-tuned model. Connect sources (email, docs, code repos, CRMs),
              define what to predict, and get an ONNX model in under 24 hours.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-xl mx-auto">
              {[
                { label: 'Connect', desc: 'OAuth or upload', icon: '⊟' },
                { label: 'Train', desc: 'Cold start + LoRA', icon: '⚡' },
                { label: 'Export', desc: 'ONNX model', icon: '⊡' },
              ].map(c => (
                <div key={c.label} className="bg-white border rounded-lg p-5 text-center" style={{ borderColor: '#E2E0DB' }}>
                  <span className="text-xl">{c.icon}</span>
                  <p className="text-sm font-bold text-[#111] mt-2">{c.label}</p>
                  <p className="font-mono text-[10px] text-[#6B6B6B] mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="mt-10 rounded-full bg-[#111] px-10 py-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-all duration-200 active:scale-[0.98]">
              Get Started
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Connect data sources</h2>
            <p className="text-sm text-[#404040] mt-1 mb-8">Select one or more sources to train on. Data is combined into a single dataset.</p>
            <div className="space-y-2">
              {[
                { name: 'Google Sheets', type: 'oauth', records: '24K records', icon: 'S' },
                { name: 'Gmail / Google Workspace', type: 'oauth', records: '12K messages', icon: 'M' },
                { name: 'GitHub Repositories', type: 'oauth', records: 'AST-parsed code, PRs, issues', icon: 'G' },
                { name: 'HubSpot CRM', type: 'oauth', records: '8K contacts', icon: 'H' },
                { name: 'Notion', type: 'oauth', records: '1K pages', icon: 'N' },
                { name: 'CSV / JSON Upload', type: 'file', records: 'Upload your own', icon: '⊞' },
                { name: 'Slack', type: 'oauth', records: 'Channel history + DMs', icon: 'S' },
              ].map(s => (
                <div key={s.name}
                  onClick={() => toggleSource(s.name)}
                  className="bg-white border rounded-lg px-5 py-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-[#F5F4F0]"
                  style={{
                    borderColor: selectedSources.includes(s.name) ? '#ff5f1f' : '#E2E0DB',
                    boxShadow: selectedSources.includes(s.name) ? '0 0 0 1px #ff5f1f' : 'none',
                  }}>
                  <div className="w-10 h-10 rounded-lg bg-[#F5F4F0] border flex items-center justify-center font-mono text-sm font-bold"
                    style={{ borderColor: '#E2E0DB' }}>{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111]">{s.name}</p>
                    <p className="font-mono text-[11px] text-[#6B6B6B]">{s.records} · {s.type === 'oauth' ? 'OAuth' : 'Upload'}</p>
                  </div>
                  {s.name === 'GitHub Repositories' && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F5F4F0', color: '#6B6B6B' }}>AST</span>
                  )}
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                    selectedSources.includes(s.name) ? 'bg-[#ff5f1f] text-white' : 'border text-transparent'
                  }`} style={{ borderColor: '#E2E0DB' }}>
                    {selectedSources.includes(s.name) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-8">
              <span className="font-mono text-[11px] text-[#6B6B6B]">
                {selectedSources.length > 0 ? `${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''} selected` : 'No sources selected'}
              </span>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)}
                  className="rounded-full px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                  style={{ color: '#6B6B6B', border: `1px solid #E2E0DB` }}>
                  Back
                </button>
                <button onClick={() => setStep(2)}
                  className="rounded-full bg-[#111] px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={selectedSources.length === 0}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Define your task</h2>
            <p className="text-sm text-[#404040] mt-1 mb-8">What should the model learn? The task determines how we structure labels and train.</p>
            <div className="space-y-3">
              {[
                { key: 'classification', name: 'Classification', desc: 'Assign categories — document type, sentiment, priority, code bug vs clean, compliance flag', icon: '⊞' },
                { key: 'relevance', name: 'Relevance Filtering', desc: 'Identify what matters — relevant documents, critical code changes, actionable signals', icon: '⊙' },
                { key: 'extraction', name: 'Extraction', desc: 'Pull structured fields — entities, function signatures, API endpoints, dates, key:value pairs', icon: '⊟' },
                { key: 'code', name: 'Code Analysis', desc: 'Understand codebases — classify functions by purpose, detect anti-patterns, map API surfaces from AST', icon: 'G' },
              ].map(t => (
                <div key={t.key}
                  onClick={() => setTaskType(t.key)}
                  className="bg-white border rounded-lg px-5 py-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-[#F5F4F0]"
                  style={{
                    borderColor: taskType === t.key ? '#ff5f1f' : '#E2E0DB',
                    boxShadow: taskType === t.key ? '0 0 0 1px #ff5f1f' : 'none',
                  }}>
                  <span className="text-lg mt-0.5">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111]">{t.name}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">{t.desc}</p>
                  </div>
                  {taskType === t.key && (
                    <span className="w-5 h-5 rounded-full bg-[#ff5f1f] flex items-center justify-center text-white text-[10px] font-bold mt-0.5">✓</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-8">
              <span className="font-mono text-[11px] text-[#6B6B6B]">{selectedSources.join(', ')}</span>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="rounded-full px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                  style={{ color: '#6B6B6B', border: `1px solid #E2E0DB` }}>
                  Back
                </button>
                <button onClick={() => setStep(3)}
                  className="rounded-full bg-[#111] px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={!taskType}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#111]">First review — sample disagreements</h2>
            <p className="text-sm text-[#404040] mt-1 mb-6">
              This is how the loop works. DeepSeek labels everything first (cheap, ~75% accurate).
              Your model flags where it disagrees. You only verify those — typically 2-5% of data.
            </p>

            <div className="bg-white border rounded-lg p-6 mb-6" style={{ borderColor: '#E2E0DB' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Sample contested example</span>
                <span className="font-mono text-xs text-[#B8860B]">confidence: 32%</span>
              </div>
              <div className="bg-[#F5F4F0] border rounded-lg p-4 mb-4 text-sm font-mono text-[#404040] leading-relaxed" style={{ borderColor: '#E2E0DB' }}>
                <span className="text-[#6B6B6B]">// src/api/billing.ts:142-158</span><br />
                export async function handleInvoiceWebhook(req: Request) {'{'}
                <br />&nbsp;&nbsp;const sig = req.headers[&apos;stripe-signature&apos;]
                <br />&nbsp;&nbsp;const event = stripe.webhooks.constructEvent(req.body, sig, secret)
                <br />&nbsp;&nbsp;if (event.type === &apos;invoice.paid&apos;) {'{'}
                <br />&nbsp;&nbsp;&nbsp;&nbsp;const sub = await updateSubscription(event.data.object.customer)
                <br />&nbsp;&nbsp;&nbsp;&nbsp;// BUG: no error handling — if updateSubscription throws, we crash
                <br />&nbsp;&nbsp;&nbsp;&nbsp;await email.sendConfirmation(sub.email)
                <br />&nbsp;&nbsp;{'}'}
                <br />{'}'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#FFF8E1' }}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Original Label (DeepSeek)</p>
                  <p className="font-mono text-sm font-bold mt-1" style={{ color: '#B8860B' }}>clean</p>
                </div>
                <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#FFF0E8' }}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Model Prediction</p>
                  <p className="font-mono text-sm font-bold mt-1" style={{ color: '#ff5f1f' }}>bug — missing try/catch</p>
                  <p className="font-mono text-[10px] text-[#6B6B6B] mt-0.5">low confidence — needs your judgment</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-5 flex items-start gap-3"
              style={{ backgroundColor: '#ff5f1f08', border: '1px solid #ff5f1f20' }}>
              <div>
                <p className="font-mono text-xs font-bold text-[#111] mb-1">You only verify the edge cases</p>
                <p className="text-sm text-[#404040] leading-relaxed">
                  Whether it&apos;s code, contracts, emails, or lab reports — the loop is the same.
                  Cheap frontier labels → model flags disagreements → you review 2-5% → retrain → ONNX.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button onClick={() => setStep(2)}
                className="rounded-full px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                style={{ color: '#6B6B6B', border: `1px solid #E2E0DB` }}>
                Back
              </button>
              <button onClick={onComplete}
                className="rounded-full bg-[#111] px-10 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-all duration-200 active:scale-[0.98]">
                Start Training
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Activation Gate ─────────────────────────────────────────────
function ActivationGate({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b bg-white shrink-0"
        style={{ borderColor: '#E2E0DB' }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-[-0.04em] text-[#111]">B_</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Model Training</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          {/* Status icon */}
          <div className="w-16 h-16 rounded-full bg-[#FFF0E8] border border-[#ff5f1f20] flex items-center justify-center mx-auto mb-6">
            <span className="w-3 h-3 rounded-full animate-pulse bg-[#ff5f1f]" />
          </div>

          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#111]">
            Your model is training
          </h1>
          <p className="text-[15px] text-[#404040] mt-3 leading-relaxed">
            While it runs, let&apos;s schedule a quick onboarding session.
            We&apos;ll review your use case, walk through the results, and make sure
            everything is set up for your team.
          </p>

          {/* Pipeline preview */}
          <div className="bg-white border rounded-lg p-5 mt-8 text-left"
            style={{ borderColor: '#E2E0DB' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Genentech Protein Relevance</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono"
                style={{ backgroundColor: '#FFF0E8', color: '#ff5f1f' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#ff5f1f]" />
                Training
              </span>
            </div>
            <div className="flex items-center gap-1">
              {['Ingest', 'Label', 'Train', 'Disagree', 'Review', 'Export'].map((s, i) => (
                <div key={s} className="flex-1 text-center">
                  <div className={`w-full h-1 rounded-full ${i < 2 ? 'bg-[#ff5f1f]' : i === 2 ? 'bg-[#ff5f1f] animate-pulse' : 'bg-[#E2E0DB]'}`} />
                  <span className={`font-mono text-[9px] mt-1 block ${i <= 2 ? 'text-[#111]' : 'text-[#6B6B6B]'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 space-y-3">
            <a href="https://cal.com/comradelemoncake/meet-the-founder" target="_blank" rel="noopener noreferrer"
              className="inline-block rounded-full bg-[#111] px-10 py-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-colors duration-200">
              Schedule Onboarding Session
            </a>
            <p className="font-mono text-[10px] text-[#6B6B6B]">
              30 min · video call · no commitment
            </p>
          </div>

          {/* Demo activation toggle */}
          <div className="mt-10 pt-8 border-t" style={{ borderColor: '#E2E0DB' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B] mb-3">Demo Controls</p>
            <button onClick={onActivate}
              className="rounded-full border px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors hover:bg-white"
              style={{ borderColor: '#E2E0DB', color: '#6B6B6B' }}>
              Simulate Activation → Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────
export default function ModelTrainingApp() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [activated, setActivated] = useState(false)

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  if (!onboarded) {
    return <OnboardingPage onComplete={() => setOnboarded(true)} />
  }

  if (!activated) {
    return <ActivationGate onActivate={() => setActivated(true)} />
  }

  return <AppShell onLogout={() => setLoggedIn(false)} />
}
