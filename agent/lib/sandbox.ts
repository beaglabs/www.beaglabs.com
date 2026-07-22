/**
 * Sandbox auto-detection — picks the best available provider from environment.
 * Priority: Daytona > Vercel Sandbox > Virtual (in-memory fallback)
 */

export type SandboxProvider = 'daytona' | 'vercel' | 'virtual'

export function detectSandboxProvider(): SandboxProvider {
  if (process.env.DAYTONA_API_KEY && process.env.DAYTONA_API_URL) {
    return 'daytona'
  }
  if (process.env.VERCEL_SANDBOX_TOKEN) {
    return 'vercel'
  }
  return 'virtual'
}

export function getSandboxStatus(): {
  provider: SandboxProvider
  configured: boolean
  envVars: Record<string, boolean>
} {
  const provider = detectSandboxProvider()
  return {
    provider,
    configured: provider !== 'virtual',
    envVars: {
      DAYTONA_API_KEY: !!process.env.DAYTONA_API_KEY,
      DAYTONA_API_URL: !!process.env.DAYTONA_API_URL,
      DAYTONA_TARGET: !!process.env.DAYTONA_TARGET,
      VERCEL_SANDBOX_TOKEN: !!process.env.VERCEL_SANDBOX_TOKEN,
    },
  }
}

export function sandboxLabel(provider: SandboxProvider): string {
  switch (provider) {
    case 'daytona':
      return 'Daytona (remote container)'
    case 'vercel':
      return 'Vercel Sandbox (remote)'
    case 'virtual':
      return 'Virtual (in-memory)'
  }
}
