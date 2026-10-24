'use client'

import { useEffect, useState } from 'react'
import { DemoWindow, Segmented } from '@/components/demos/demo-window'

type Target = 'commercial' | 'government' | 'dod'
type Line = [kind: 'cmd' | 'ok' | 'info', text: string]

const SCRIPTS: Record<Target, Line[]> = {
  commercial: [
    ['cmd', 'docker run ghcr.io/beaglabs/papyrus/papyrus@sha256:… · acme AWS account'],
    ['info', 'OpenSSL FIPS 140-3 provider active'],
    ['ok', 'Encrypted EFS volume mounted'],
    ['ok', 'Fargate service papyrus-acme running on Graviton'],
    ['ok', 'Certificate issued for papyrus.acme.com'],
    ['ok', 'Microsoft sign-in connected · tenant acme.onmicrosoft.com'],
    ['ok', 'Health check passed · ready in 6m 12s'],
  ],
  government: [
    ['cmd', 'docker run ghcr.io/beaglabs/papyrus/papyrus@sha256:8b23…'],
    ['info', 'PAPYRUS_PROFILE=gcch  PAPYRUS_ENTRA_CLOUD=USGov'],
    ['ok', 'Region us-gov-west-1 · data stays in AWS GovCloud'],
    ['ok', 'Entra sign-in via login.microsoftonline.us'],
    ['ok', 'Model gateway: customer-approved endpoint only'],
    ['ok', 'Signed license verified for agency tenant'],
    ['ok', 'Ready · runbook handed to the program team'],
  ],
  dod: [
    ['cmd', 'docker run ghcr.io/beaglabs/papyrus/papyrus-dod@sha256:…'],
    ['info', 'PAPYRUS_ENTRA_CLOUD=USGovDoD · disconnected'],
    ['ok', 'Offline license verified against built-in key'],
    ['ok', 'Graph host dod-graph.microsoft.us'],
    ['ok', 'Agent sandbox: network denied by default'],
    ['ok', 'Audit chain initialised · SHA-256'],
    ['ok', 'Ready · no callback to Beag Labs'],
  ],
}

/** One codebase, three ways to run it: the deployment log for each environment, typed out. */
export function DeployTerminal() {
  const [target, setTarget] = useState<Target>('commercial')
  const [shown, setShown] = useState(0)
  const lines = SCRIPTS[target]

  useEffect(() => { setShown(0) }, [target])
  useEffect(() => {
    if (shown >= lines.length) return
    const t = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 250 : 520)
    return () => window.clearTimeout(t)
  }, [shown, lines.length])

  return <DemoWindow title="Deploy · papyrus" meta="Illustrative output">
    <div className="border-b-[3px] border-[#111] px-4 py-3">
      <Segmented label="Environment" value={target} onChange={setTarget} options={[['commercial', 'Commercial'], ['government', 'Gov cloud'], ['dod', 'DoD + offline']]} />
    </div>
    <pre aria-live="polite" className="min-h-[230px] overflow-x-auto bg-[#0b0b0b] p-4 font-mono text-[12px] leading-[1.75] text-[#d6d6d6]">
      {lines.slice(0, shown).map(([kind, text], i) => <div key={`${target}-${i}`}>
        {kind === 'cmd' ? <span className="text-[#ff8a5c]">$ </span> : kind === 'ok' ? <span className="text-[#4ade80]">✓ </span> : <span className="text-[#777]">· </span>}
        <span className={kind === 'cmd' ? 'text-white' : ''}>{text}</span>
      </div>)}
      <span className="motion-safe:animate-[demo-blink_1s_steps(1)_infinite] text-[#ff5f1f]">▌</span>
    </pre>
  </DemoWindow>
}
