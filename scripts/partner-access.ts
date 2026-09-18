#!/usr/bin/env tsx
/**
 * Approve or deny CSP partner access.
 *
 * The partner materials page reads its allowlist from Postgres, so this is the operator
 * tool for that table. Approving a partner is a row update, not a deploy.
 *
 * Usage:
 *   ./node_modules/.bin/tsx scripts/partner-access.ts list [pending|approved|denied]
 *   ./node_modules/.bin/tsx scripts/partner-access.ts approve <email> [--by operator@beaglabs.com]
 *   ./node_modules/.bin/tsx scripts/partner-access.ts deny <email> [--by operator@beaglabs.com]
 *
 * Needs DATABASE_AUTH_URL or DATABASE_URL. If neither is in the environment it reads
 * .env from the repo root, so the common case needs no flag juggling.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  listPartnerAccess,
  setPartnerAccessStatus,
  type PartnerAccessStatus,
} from '../lib/partner-access'

/** Minimal .env loader: fills only what the environment does not already define. */
function loadDotEnvIfNeeded(): void {
  if (process.env.DATABASE_AUTH_URL || process.env.DATABASE_URL) return
  try {
    const contents = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of contents.split('\n')) {
      const match = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line)
      if (!match) continue
      const [, key, rawValue] = match
      if (process.env[key] !== undefined) continue
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // No .env is not an error here; the caller may have exported the value directly.
  }
}

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : undefined
}

async function main(): Promise<void> {
  loadDotEnvIfNeeded()

  const [command, argument] = process.argv.slice(2).filter((value) => !value.startsWith('--'))

  if (!command || command === 'help') {
    console.log(
      'Usage: list [status] | approve <email> | deny <email>  (see the header of this file)',
    )
    return
  }

  if (command === 'list') {
    const status = argument as PartnerAccessStatus | undefined
    const rows = await listPartnerAccess(status)
    if (rows.length === 0) {
      console.log(status ? `No ${status} applications.` : 'No applications.')
      return
    }
    for (const row of rows) {
      const decided = row.decidedAt ? ` decided ${row.decidedAt.toISOString().slice(0, 10)}` : ''
      console.log(
        `${row.status.padEnd(8)} ${row.email.padEnd(34)} ${(row.company ?? '-').slice(0, 28).padEnd(30)}` +
          ` applied ${row.createdAt.toISOString().slice(0, 10)}${decided}`,
      )
      if (row.cspProgramId) console.log(`         CSP ID: ${row.cspProgramId}`)
      if (row.note) console.log(`         Note: ${row.note.replace(/\s+/g, ' ').slice(0, 200)}`)
    }
    return
  }

  if (command !== 'approve' && command !== 'deny') {
    console.error(`Unknown command: ${command}`)
    process.exitCode = 1
    return
  }

  if (!argument) {
    console.error(`Usage: ${command} <email>`)
    process.exitCode = 1
    return
  }

  const status: PartnerAccessStatus = command === 'approve' ? 'approved' : 'denied'
  const changed = await setPartnerAccessStatus(argument, status, flag('by'))

  if (!changed) {
    // Most likely a typo in the address, which is worth failing loudly on: silently
    // "approving" a partner who then sees a 404 is a bad afternoon for everyone.
    console.error(`No application found for ${argument}. Run "list" to see what is pending.`)
    process.exitCode = 1
    return
  }

  console.log(`${argument} is now ${status}.`)
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
