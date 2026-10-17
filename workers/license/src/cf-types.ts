/**
 * Minimal structural types for the Cloudflare bindings this Worker uses. The
 * project typechecks against DOM + Node types (not @cloudflare/workers-types),
 * and tests run in plain Node with fakes, so only the members we call are declared.
 */

export interface R2ObjectLike {
  key: string
  size: number
  httpMetadata?: { contentType?: string }
  httpEtag?: string
}

export interface R2ObjectBodyLike extends R2ObjectLike {
  body: ReadableStream
  range?: { offset?: number; length?: number }
}

export type R2RangeLike = { offset: number; length?: number } | { suffix: number }

export interface R2BucketLike {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | Uint8Array | string | null,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> },
  ): Promise<R2ObjectLike | null>
  get(key: string, options?: { range?: R2RangeLike }): Promise<R2ObjectBodyLike | null>
  head(key: string): Promise<R2ObjectLike | null>
  delete(key: string): Promise<void>
}

export interface DurableObjectIdLike { toString(): string }

export interface DurableObjectStubLike {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>
}

export interface DurableObjectNamespaceLike {
  idFromName(name: string): DurableObjectIdLike
  get(id: DurableObjectIdLike): DurableObjectStubLike
}

/** WebSocket as seen by a hibernating Durable Object. */
export interface HibernatableWebSocket {
  send(message: string): void
  close(code?: number, reason?: string): void
  serializeAttachment(value: unknown): void
  deserializeAttachment(): unknown
}

export interface DurableObjectStateLike {
  acceptWebSocket(ws: HibernatableWebSocket, tags?: string[]): void
  getWebSockets(tag?: string): HibernatableWebSocket[]
  storage: {
    get<T = unknown>(key: string): Promise<T | undefined>
    put(key: string, value: unknown): Promise<void>
    getAlarm(): Promise<number | null>
    setAlarm(scheduledTime: number): Promise<void>
    deleteAlarm(): Promise<void>
  }
}
