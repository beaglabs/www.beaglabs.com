/** Minimal `cloudflare:workers` declaration (the project does not use @cloudflare/workers-types). Tests alias it to a stub. */
declare module 'cloudflare:workers' {
  export abstract class WorkerEntrypoint<Env = unknown> {
    protected ctx: unknown
    protected env: Env
    constructor(ctx: unknown, env: Env)
  }
}
