import { Daytona, type Sandbox as DaytonaSandbox } from '@daytona/sdk'
import { createSandboxSessionEnv } from '@flue/runtime'
import type { SandboxApi, SandboxFactory, SessionEnv, FileStat } from '@flue/runtime'

class DaytonaSandboxApi implements SandboxApi {
  constructor(private sandbox: DaytonaSandbox) {}

  async readFile(path: string): Promise<string> {
    const buf = await this.sandbox.fs.downloadFile(path)
    return buf.toString('utf-8')
  }

  async readFileBuffer(path: string): Promise<Uint8Array> {
    const buf = await this.sandbox.fs.downloadFile(path)
    return new Uint8Array(buf)
  }

  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    const buf = Buffer.from(typeof content === 'string' ? content : content)
    await this.sandbox.fs.uploadFile(buf, path)
  }

  async stat(path: string): Promise<FileStat> {
    const info = await this.sandbox.fs.getFileDetails(path)
    return {
      isFile: (info as { isFile?: boolean }).isFile ?? false,
      isDirectory: (info as { isDir?: boolean }).isDir ?? false,
      size: info.size,
    }
  }

  async readdir(path: string): Promise<string[]> {
    const files = await this.sandbox.fs.listFiles(path)
    return files.map((f: { name?: string; path?: string }) => f.name ?? f.path ?? '')
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.sandbox.fs.getFileDetails(path)
      return true
    } catch {
      return false
    }
  }

  async mkdir(path: string, _options?: { recursive?: boolean }): Promise<void> {
    await this.sandbox.fs.createFolder(path, '755')
  }

  async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    await this.sandbox.fs.deleteFile(path, options?.recursive)
  }

  async exec(
    command: string,
    options?: { cwd?: string; env?: Record<string, string>; timeoutMs?: number; signal?: AbortSignal }
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const timeoutSec = options?.timeoutMs ? Math.ceil(options.timeoutMs / 1000) : undefined
    const result = await this.sandbox.process.executeCommand(
      command,
      options?.cwd,
      options?.env,
      timeoutSec
    )
    return {
      exitCode: Number(result.exitCode ?? 0),
      stdout: String(result.result ?? ''),
      stderr: '',
    }
  }
}

export function daytona(sandbox: DaytonaSandbox): SandboxFactory {
  return {
    async createSessionEnv(): Promise<SessionEnv> {
      const api = new DaytonaSandboxApi(sandbox)
      return createSandboxSessionEnv(api, '/home/daytona')
    },
  }
}

export { Daytona }
