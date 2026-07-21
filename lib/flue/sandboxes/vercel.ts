import { Sandbox } from '@vercel/sandbox'
import { createSandboxSessionEnv } from '@flue/runtime'
import type { SandboxApi, SandboxFactory, SessionEnv, FileStat } from '@flue/runtime'

class VercelSandboxApi implements SandboxApi {
  constructor(private sandbox: Sandbox) {}

  async readFile(path: string): Promise<string> {
    return this.sandbox.fs.readFile(path, 'utf-8')
  }

  async readFileBuffer(path: string): Promise<Uint8Array> {
    const content = await this.sandbox.fs.readFile(path)
    return new Uint8Array(content as unknown as ArrayBuffer)
  }

  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    await this.sandbox.fs.writeFile(path, content)
  }

  async stat(path: string): Promise<FileStat> {
    const s = await this.sandbox.fs.stat(path)
    return {
      isFile: s.isFile(),
      isDirectory: s.isDirectory(),
      isSymbolicLink: s.isSymbolicLink(),
      size: s.size,
      mtime: new Date(s.mtimeMs),
    }
  }

  async readdir(path: string): Promise<string[]> {
    return this.sandbox.fs.readdir(path)
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.sandbox.fs.stat(path)
      return true
    } catch {
      return false
    }
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await this.sandbox.fs.mkdir(path, { recursive: options?.recursive })
  }

  async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    await this.sandbox.fs.rm(path, {
      recursive: options?.recursive,
      force: options?.force,
    })
  }

  async exec(
    command: string,
    options?: { cwd?: string; env?: Record<string, string>; timeoutMs?: number; signal?: AbortSignal }
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const result = await this.sandbox.runCommand('bash', ['-c', command], {
      timeoutMs: options?.timeoutMs,
    })
    return {
      exitCode: result.exitCode,
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
    }
  }
}

export function vercel(sandbox: Sandbox): SandboxFactory {
  return {
    async createSessionEnv(): Promise<SessionEnv> {
      const api = new VercelSandboxApi(sandbox)
      return createSandboxSessionEnv(api, '/vercel/sandbox')
    },
  }
}
