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
        <h1 className="text-lg font-medium text-[#e5e5e5]">Channels</h1>
        <p className="text-xs text-[#666] mt-1">Inbound and outbound communication channels</p>
      </div>

      <div className="space-y-4">
        {channels.map((ch) => {
          const allConfigured = ch.envVars.every(
            (v) => process.env[v] && process.env[v]!.length > 0
          )

          return (
            <div key={ch.name} className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[#e5e5e5]">{ch.name}</h3>
                  <p className="text-xs text-[#666] mt-1">{ch.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${allConfigured ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                  <span className="text-[10px] text-[#666]">
                    {allConfigured ? 'Configured' : 'Missing env vars'}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Endpoint</p>
                  <code className="text-xs text-[#C7661D]">{ch.endpoint}</code>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#444]">Required Env Vars</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ch.envVars.map((v) => {
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
