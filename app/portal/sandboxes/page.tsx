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
        <h1 className="text-lg font-medium text-[#e5e5e5]">Sandboxes</h1>
        <p className="text-xs text-[#666] mt-1">Isolated execution environments for agents</p>
      </div>

      <div className="space-y-4">
        {sandboxes.map((sb) => {
          const allConfigured = sb.envVars.every(
            (v) => process.env[v] && process.env[v]!.length > 0
          )

          return (
            <div key={sb.name} className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[#e5e5e5]">{sb.name}</h3>
                  <p className="text-xs text-[#666] mt-1">{sb.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${allConfigured ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                  <span className="text-[10px] text-[#666]">
                    {allConfigured ? 'Ready' : 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Package</p>
                  <code className="text-[#888]">{sb.package}</code>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Adapter</p>
                  <code className="text-[#888]">{sb.adapter}</code>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Env Vars</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sb.envVars.map((v) => {
                      const isSet = process.env[v] && process.env[v]!.length > 0
                      return (
                        <span
                          key={v}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isSet
                              ? 'text-emerald-400 bg-emerald-400/10'
                              : 'text-red-400 bg-red-400/10'
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
