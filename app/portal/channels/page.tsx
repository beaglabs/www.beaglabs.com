export const dynamic = 'force-dynamic'

export default function ChannelsPage() {
  const channels = [
    {
      name: 'Discord',
      description: 'HTTP Interactions bot for slash commands and agent dispatch',
      envVars: ['DISCORD_BOT_TOKEN', 'DISCORD_PUBLIC_KEY', 'DISCORD_APPLICATION_ID'],
      endpoint: '/api/flue/channels/discord/interactions',
    },
    {
      name: 'Resend',
      description: 'Inbound email webhook for agent email processing',
      envVars: ['RESEND_API_KEY', 'RESEND_WEBHOOK_SECRET'],
      endpoint: '/api/flue/channels/resend/webhook',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">Channels</h1>
        <p className="text-sm text-[#555] mt-1">Inbound and outbound communication channels</p>
      </div>

      <div className="space-y-4">
        {channels.map((ch) => {
          const allConfigured = ch.envVars.every(
            (v) => process.env[v] && process.env[v]!.length > 0
          )

          return (
            <div key={ch.name} className="nb-card bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#111]">{ch.name}</h3>
                  <p className="text-xs text-[#555] mt-1">{ch.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${allConfigured ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                  <span className="text-[10px] font-bold text-[#555]">
                    {allConfigured ? 'Configured' : 'Missing env vars'}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <p className="nb-label text-[9px] mb-1">Endpoint</p>
                  <code className="text-xs font-mono text-[#FF5F1F] font-bold">{ch.endpoint}</code>
                </div>
                <div>
                  <p className="nb-label text-[9px] mb-1">Required Env Vars</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ch.envVars.map((v) => {
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
