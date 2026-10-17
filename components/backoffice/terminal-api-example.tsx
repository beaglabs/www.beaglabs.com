'use client'

import { useState } from 'react'
import { ArrowRight, Download, Terminal } from 'lucide-react'

const fields = [
  { label: 'REFERENCE', property: 'reference', description: 'The lookup input becomes a required path parameter.', value: 'SR-1042' },
  { label: 'APPLICANT', property: 'applicant', description: 'The returned screen value becomes a string in the response.', value: 'Alex Morgan' },
  { label: 'STATUS', property: 'status', description: 'The host status becomes a defined response value.', value: 'awaiting_review' },
] as const
const contract = {
  openapi: '3.0.3',
  info: { title: 'Example case intake adapter', version: '1.0.0', description: 'Illustrative contract. No live host or API.' },
  paths: {
    '/requests/{reference}': {
      get: {
        operationId: 'getRequest',
        summary: 'Look up a request in the legacy system',
        parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string', pattern: '^SR-[0-9]{4}$' } }],
        responses: {
          '200': { description: 'Request found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Request' } } } },
          '400': { description: 'Invalid reference format' },
          '404': { description: 'Request not found' },
          '502': { description: 'Unexpected host response or unavailable host' },
        },
      },
    },
  },
  components: { schemas: { Request: { type: 'object', required: ['reference', 'applicant', 'status'], properties: {
    reference: { type: 'string', example: 'SR-1042' },
    applicant: { type: 'string', example: 'Alex Morgan' },
    status: { type: 'string', enum: ['awaiting_review', 'complete'], example: 'awaiting_review' },
  } } } },
}
const schemaText = JSON.stringify(contract, null, 2)

export function TerminalApiExample() {
  const [field, setField] = useState(0)
  const [view, setView] = useState<'mapping' | 'schema'>('mapping')
  const [reference, setReference] = useState('SR-1042')
  const [result, setResult] = useState<{ code: number; body: object } | null>(null)
  function run() {
    const value = reference.trim().toUpperCase()
    setResult(!/^SR-[0-9]{4}$/.test(value)
      ? { code: 400, body: { error: 'Invalid reference. Use SR followed by a hyphen and four digits.' } }
      : value !== 'SR-1042'
        ? { code: 404, body: { error: 'Request not found' } }
        : { code: 200, body: { reference: value, applicant: 'Alex Morgan', status: 'awaiting_review' } })
  }
  function download() {
    const url = URL.createObjectURL(new Blob([schemaText], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'example-case-intake.openapi.json'; a.click(); URL.revokeObjectURL(url)
  }
  return <section className="border-y-[3px] border-[#111] bg-[#fafaf9] px-6 py-20 lg:px-9">
    <div className="mx-auto max-w-[1440px]">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#a43d11]">One transaction. A defined API.</p>
      <h2 className="display-black mt-4 text-[length:min(2.25rem,9vw)] leading-[1.1] sm:text-5xl">Wrap a terminal workflow with OpenAPI.</h2>
      <p className="mt-6 max-w-[850px] text-base leading-8 text-[#444]">Select a terminal field to see how it maps into an API contract. Then try a lookup to see the structured response. The adapter performs the screen navigation; OpenAPI describes the operation clients can call.</p>
      <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1.2fr)] lg:items-start">
        <div className="min-w-0 border-[3px] border-[#111] bg-white">
          <div className="flex items-center gap-2 border-b-2 border-[#111] px-5 py-4 font-mono text-xs font-bold"><Terminal size={16} />01 / Example legacy screen</div>
          <div className="bg-[#0d1d15] p-5 font-mono text-[#9bf6b4] sm:p-7">
            <p className="mb-6 text-xs">CASE INTAKE / REQUEST LOOKUP</p>
            <div className="space-y-3">{fields.map((item,i) => <button key={item.property} onClick={() => { setField(i); setView('mapping') }} aria-pressed={field === i} className={`flex w-full flex-wrap gap-x-3 gap-y-1 border p-3 text-left text-xs leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${field === i ? 'border-[#9bf6b4] bg-[#9bf6b4] text-[#0d1d15]' : 'border-[#42624b] hover:border-[#9bf6b4]'}`}><span>{item.label}:</span><strong>{item.value}</strong></button>)}</div>
            <p className="mt-6 border-t border-[#42624b] pt-4 text-[10px]">ENTER = LOOKUP · PF3 = BACK</p>
          </div>
          <div className="p-5 text-sm leading-7"><strong>Adapter responsibility</strong><p className="mt-2 text-[#555]">Recognize the screen, enter the reference, navigate the transaction, and read the result. Stop if the host returns an unexpected screen.</p></div>
        </div>
        <ArrowRight aria-hidden="true" className="hidden justify-self-center self-center text-[#a43d11] lg:block" />
        <div className="min-w-0 border-[3px] border-[#111] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#111] px-5 py-4"><span className="font-mono text-xs font-bold">02 / OpenAPI 3.0.3 contract</span><button onClick={download} className="flex items-center gap-2 text-xs font-bold underline underline-offset-4"><Download size={14} />Download schema</button></div>
          <div className="flex border-b-2 border-[#111]">{(['mapping','schema'] as const).map(tab => <button key={tab} aria-pressed={view === tab} onClick={() => setView(tab)} className={`flex-1 px-4 py-3 text-xs font-black uppercase ${view === tab ? 'bg-[#ff5f1f]' : 'hover:bg-[#fff1e9]'}`}>{tab === 'mapping' ? 'Field mapping' : 'Full schema'}</button>)}</div>
          {view === 'mapping' ? <div className="p-5 sm:p-7"><p className="font-mono text-xs font-bold text-[#a43d11]">GET /requests/&#123;reference&#125;</p><div className="mt-6 border-l-4 border-[#ff5f1f] bg-[#fafaf9] p-5"><p className="font-mono text-sm font-bold">{fields[field].label} → {fields[field].property}</p><p className="mt-3 text-sm leading-7 text-[#555]">{fields[field].description}</p></div><pre className="mt-6 overflow-x-auto border-2 border-[#111] p-4 text-xs leading-6">{field === 0 ? 'name: reference\nin: path\nrequired: true\nschema:\n  type: string\n  pattern: ^SR-[0-9]{4}$' : `${fields[field].property}:\n  type: string${field === 2 ? '\n  enum: [awaiting_review, complete]' : ''}\n  example: ${fields[field].value}`}</pre><p className="mt-5 text-xs leading-6 text-[#666]">A schema defines names, types, inputs, and outcomes. It does not create a connector or grant host access.</p></div> : <pre aria-label="Example OpenAPI schema" className="max-h-[440px] overflow-auto p-5 text-xs leading-6">{schemaText}</pre>}
        </div>
      </div>
      <div className="mt-6 grid min-w-0 gap-6 border-[3px] border-[#111] bg-white p-5 sm:p-7 lg:grid-cols-2">
        <div><p className="font-mono text-xs font-bold text-[#a43d11]">03 / Try the contract</p><h3 className="mt-3 text-2xl font-black">A lookup, without the green screen.</h3><form onSubmit={event => { event.preventDefault(); run() }} className="mt-5"><label htmlFor="api-example-reference" className="block text-sm font-bold">Request reference</label><div className="mt-2 flex flex-wrap gap-3"><input id="api-example-reference" value={reference} onChange={event => { setReference(event.target.value); setResult(null) }} className="min-w-0 flex-1 border-2 border-[#111] px-3 py-3 font-mono text-sm" /><button className="border-2 border-[#111] bg-[#ff5f1f] px-4 py-3 text-xs font-black">Run simulated GET</button></div></form><p className="mt-4 text-xs leading-6 text-[#666]">SR-1042 returns a record. SR-9999 returns 404. An invalid format returns 400.</p></div>
        <div className="min-w-0 border-2 border-[#111] bg-[#fafaf9] p-5" role="status" aria-live="polite"><p className="font-mono text-xs font-bold">{result ? `HTTP ${result.code} / application/json` : 'Response preview'}</p><pre className="mt-4 overflow-x-auto text-xs leading-6">{result ? JSON.stringify(result.body,null,2) : '// Run a lookup to inspect the response.'}</pre></div>
      </div>
      <p className="mt-5 text-xs leading-6 text-[#666]">Interactive illustration with fictional records. All responses are generated locally in this browser; no mainframe or live API is contacted.</p>
    </div>
  </section>
}
