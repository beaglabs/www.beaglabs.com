import app from '@/lib/flue/app'

/**
 * Catch-all route handler that forwards requests to the Flue Hono runtime.
 * This mounts the full Flue API (agents, workflows, channels, admin) at /api/flue/*.
 */
async function handler(request: Request) {
  return app.fetch(request)
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
}
