export const dynamic = 'force-dynamic'

export default function SandboxesPage() {
  const sandboxes = [
    {
      name: 'Vercel Sandbox',
      description: 'Serverless Linux sandbox for code execution',
      package: '@vercel/sandbox',
      envVars: ['VERCEL_OIDC_TOKEN'],
      adapter: 'lib/flue/sandboxes/vercel.ts',
    },
    {
      name: 'Daytona',
      description: 'Managed cloud development environment',
      package: '@daytona/sdk',
      envVars: ['DAYTONA_API_KEY'],
      adapter: 'lib/flue/sandboxes/daytona.ts',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Sandboxes</h1>
        <p className="text-sm text-[#555] mt-1">Isolated execution environments for agents</p>
      </div>

      <div className="space-y-4">
        {sandboxes.map((sb) => {
          const allConfigured = sb.envVars.every(
            (v) => process.env[v] && process.env[v]!.length > 0
          )

          return (
            <div key={sb.name} className="nb-card bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#111]">{sb.name}</h3>
                  <p className="text-xs text-[#555] mt-1">{sb.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${allConfigured ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                  <span className="text-[10px] font-bold text-[#555]">
                    {allConfigured ? 'Ready' : 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="nb-label text-[9px] mb-1">Package</p>
                  <code className="font-mono text-[#555] font-bold">{sb.package}</code>
                </div>
                <div>
                  <p className="nb-label text-[9px] mb-1">Adapter</p>
                  <code className="font-mono text-[#555] font-bold">{sb.adapter}</code>
                </div>
                <div>
                  <p className="nb-label text-[9px] mb-1">Env Vars</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sb.envVars.map((v) => {
                      const isSet = process.env[v] && process.env[v]!.length > 0
                      return (
                        <span
                          key={v}
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border-2 ${
                            isSet
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                              : 'text-red-700 bg-red-50 border-red-300'
                          }`}
                        >
                          {v}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
