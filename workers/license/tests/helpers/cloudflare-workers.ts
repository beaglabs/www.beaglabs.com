/** Node stand-in for `cloudflare:workers` (aliased in vitest.config.ts). */
export abstract class WorkerEntrypoint<Env = unknown> {
  constructor(protected ctx: unknown, protected env: Env) {}
}
