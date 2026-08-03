"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const tasks = [
  { key: 'classification', name: 'Classification', desc: 'Assign categories — document type, sentiment, priority, code bug vs clean, compliance flag', icon: '⊞' },
  { key: 'relevance', name: 'Relevance Filtering', desc: 'Identify what matters — relevant documents, critical code changes, actionable signals', icon: '⊙' },
  { key: 'extraction', name: 'Extraction', desc: 'Pull structured fields — entities, function signatures, API endpoints, dates, key:value pairs', icon: '⊟' },
  { key: 'code', name: 'Code Analysis', desc: 'Understand codebases — classify functions by purpose, detect anti-patterns, map API surfaces from AST', icon: 'G' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(-1)
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setSlug] = useState("")
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgError, setOrgError] = useState("")
  const [taskType, setTaskType] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string[][]>([])
  const [labelColumn, setLabelColumn] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const steps = ['Workspace', 'Welcome', 'Upload', 'Define Task', 'Review']
  const realStep = step + 1

  const handleOrgNameChange = (name: string) => {
    setOrgName(name)
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrgError("")
    setOrgLoading(true)

    const { data, error: err } = await authClient.organization.create({
      name: orgName,
      slug: orgSlug || undefined,
    })

    if (err) {
      setOrgError(err.message || "Failed to create workspace")
      setOrgLoading(false)
      return
    }

    if (data) {
      await authClient.organization.setActive({ organizationId: data.id })

      setOrgLoading(false)
      setStep(0)
    }
  }

  const handleComplete = () => {
    router.push("/model-service/runs")
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b bg-white sticky top-0 z-40"
        style={{ borderColor: '#E2E0DB' }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-[-0.04em] text-[#111]">B_</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Model Training</span>
        </div>
        {step >= 0 && (
          <button onClick={handleComplete}
            className="font-mono text-xs text-[#6B6B6B] hover:text-[#111] transition-colors">
            Skip onboarding
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16 lg:py-24">
        {step >= 0 && (
          <div className="flex items-center justify-center gap-2 mb-16">
            {steps.slice(1).map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-colors"
                  style={{
                    backgroundColor: i <= step ? '#ff5f1f15' : 'transparent',
                    color: i <= step ? '#ff5f1f' : '#6B6B6B',
                    border: `1px solid ${i <= step ? '#ff5f1f30' : '#E2E0DB'}`,
                  }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono"
                    style={{
                      backgroundColor: i < step ? '#ff5f1f' : 'transparent',
                      color: i < step ? '#fff' : i === step ? '#ff5f1f' : '#6B6B6B',
                      border: i === step ? '1px solid #ff5f1f' : i < step ? 'none' : '1px solid #E2E0DB',
                    }}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  {s}
                </div>
                {i < steps.length - 2 && <div className="w-8 h-px mx-1" style={{ backgroundColor: step > i ? '#ff5f1f' : '#E2E0DB' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Step -1: Create workspace */}
        {step === -1 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#ff5f1f10] border border-[#ff5f1f20] flex items-center justify-center text-2xl mx-auto mb-6">
              B_
            </div>
            <h1 className="text-[32px] font-bold tracking-[-0.045em] text-[#111]">
              Create your workspace
            </h1>
            <p className="text-[17px] text-[#404040] mt-4 max-w-md mx-auto leading-relaxed">
              Set up your organization to start training models on your data.
            </p>
            <form onSubmit={handleCreateOrg} className="mt-10 max-w-sm mx-auto space-y-4 text-left">
              <div>
                <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#777] mb-2">
                  Organization name
                </label>
                <input
                  type="text"
                  placeholder="My Company"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  required
                  className="w-full border border-[#E2E0DB] px-4 py-3 text-[14px] text-[#111] placeholder:text-[#999] outline-none focus:border-[#ff5f1f] bg-white"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#777] mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="my-company"
                  value={orgSlug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full border border-[#E2E0DB] px-4 py-3 text-[14px] text-[#111] placeholder:text-[#999] outline-none focus:border-[#ff5f1f] bg-white font-mono"
                />
                <p className="text-[11px] text-[#999] mt-1">Used in URLs</p>
              </div>
              {orgError && (
                <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                  {orgError}
                </p>
              )}
              <button
                type="submit"
                disabled={orgLoading || !orgName}
                className="w-full bg-[#111] text-white px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
              >
                {orgLoading ? "Creating..." : "Create workspace"}
              </button>
            </form>
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#ff5f1f10] border border-[#ff5f1f20] flex items-center justify-center text-2xl mx-auto mb-6">
              B_
            </div>
            <h1 className="text-[32px] lg:text-[40px] font-bold tracking-[-0.045em] text-[#111]">
              Welcome to Beag
            </h1>
            <p className="text-[17px] text-[#404040] mt-4 max-w-lg mx-auto leading-relaxed">
              Turn your domain data into a fine-tuned model. Upload your data, define what to predict, and get an ONNX model in under 24 hours.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-xl mx-auto">
              {[
                { label: 'Upload', desc: 'CSV or Parquet', icon: '⊟' },
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

        {/* Step 1: Upload data */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Upload your dataset</h2>
            <p className="text-sm text-[#404040] mt-1 mb-8">Drop a CSV or Parquet file. We'll detect the columns and let you pick which one to predict.</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all hover:bg-[#F5F4F0] hover:border-[#ff5f1f]"
              style={{ borderColor: uploadedFile ? '#ff5f1f' : '#E2E0DB' }}
            >
              {uploadedFile ? (
                <div>
                  <p className="text-sm font-semibold text-[#111]">{uploadedFile.name}</p>
                  <p className="font-mono text-[11px] text-[#6B6B6B] mt-1">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                    {uploadPreview.length > 0 && ` · ${uploadPreview.length - 1} rows · ${uploadPreview[0]?.length || 0} columns`}
                  </p>
                  <p className="font-mono text-[10px] text-[#999] mt-2">Click to replace</p>
                </div>
              ) : (
                <div>
                  <span className="text-2xl">⊞</span>
                  <p className="text-sm font-medium text-[#111] mt-2">Drop CSV or Parquet here</p>
                  <p className="font-mono text-[11px] text-[#6B6B6B] mt-1">or click to browse</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.parquet,.pq,.tsv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadedFile(file)
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string
                    const rows = text.split('\n').filter(r => r.trim()).map(r => r.split(','))
                    setUploadPreview(rows.slice(0, 6))
                    if (rows.length > 0) setLabelColumn(rows[0][rows[0].length - 1] || "")
                  }
                  reader.readAsText(file)
                }}
              />
            </div>

            {uploadPreview.length > 0 && (
              <div className="mt-6">
                <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#777] mb-2">
                  Label column (what to predict)
                </label>
                <select
                  value={labelColumn}
                  onChange={(e) => setLabelColumn(e.target.value)}
                  className="w-full border border-[#E2E0DB] px-4 py-2 text-[14px] text-[#111] outline-none focus:border-[#ff5f1f] bg-white"
                >
                  {uploadPreview[0]?.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <div className="mt-6 overflow-x-auto border rounded-lg" style={{ borderColor: '#E2E0DB' }}>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#F5F4F0] border-b" style={{ borderColor: '#E2E0DB' }}>
                        {uploadPreview[0]?.map((col) => (
                          <th key={col} className={`px-4 py-2 font-mono text-[11px] font-medium ${col === labelColumn ? 'text-[#ff5f1f]' : 'text-[#6B6B6B]'}`}>
                            {col}{col === labelColumn ? ' (label)' : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadPreview.slice(1).map((row, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: '#F5F4F0' }}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-1.5 font-mono text-[12px] text-[#404040] truncate max-w-[200px]">
                              {cell.length > 60 ? cell.slice(0, 60) + '...' : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <span className="font-mono text-[11px] text-[#6B6B6B]">
                {uploadedFile ? `${uploadedFile.name}` : 'No file selected'}
              </span>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)}
                  className="rounded-full px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                  style={{ color: '#6B6B6B', border: '1px solid #E2E0DB' }}>
                  Back
                </button>
                <button onClick={() => setStep(2)}
                  className="rounded-full bg-[#111] px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={!uploadedFile}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Define task */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#111]">Define your task</h2>
            <p className="text-sm text-[#404040] mt-1 mb-8">What should the model learn? The task determines how we structure labels and train.</p>
            <div className="space-y-3">
              {tasks.map(t => (
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
              <span className="font-mono text-[11px] text-[#6B6B6B]">{uploadedFile?.name || 'No file'}</span>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="rounded-full px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                  style={{ color: '#6B6B6B', border: '1px solid #E2E0DB' }}>
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

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#111]">First review — sample disagreements</h2>
            <p className="text-sm text-[#404040] mt-1 mb-6">
              This is how the loop works. DeepSeek labels everything first. Your model flags where it disagrees. You only verify those — typically 2-5% of data.
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
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">DeepSeek Label</p>
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
              <p className="text-sm text-[#404040] leading-relaxed">
                Whether it&apos;s code, contracts, emails, or lab reports — the loop is the same.
                Cheap frontier labels → model flags disagreements → you review 2-5% → retrain → ONNX.
              </p>
            </div>

            <div className="flex items-center justify-between mt-8">
              <button onClick={() => setStep(2)}
                className="rounded-full px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                style={{ color: '#6B6B6B', border: '1px solid #E2E0DB' }}>
                Back
              </button>
              <button onClick={handleComplete}
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
