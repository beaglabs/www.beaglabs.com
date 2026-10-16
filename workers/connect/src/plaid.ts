import type { Bindings, Mode } from './env'
import { vaultSecret } from './vault'

/**
 * Plaid Auth (and Identity Match) for Papyrus installs: bank account details read straight from the account holder's
 * bank, so nobody types them. Test mode uses Plaid's sandbox; live uses production. The Worker exchanges Link's
 * one-time token, reads the account and routing number, checks the owner's name, returns it all once to the install
 * that asked, and removes the connection at Plaid. Nothing is stored here.
 */

/** What an install gets back: the details bank files need, and how sure we are they belong to the payee. */
export interface PlaidAccountDetails {
  routingNumber: string; wireRoutingNumber?: string | undefined; accountNumber: string; accountType: 'checking' | 'savings'; mask: string
  accountName?: string | undefined; institutionName?: string | undefined
  /** Some banks (Chase, PNC, U.S. Bank) give a tokenized account number: fine for ACH, but not the number on statements. */
  tokenized: boolean
  /** Identity Match: 0-100 similarity between the account owner's name and the name given; absent when the bank does not share it. */
  nameMatch?: { score: number; matched: boolean; businessName?: boolean | undefined } | undefined
}

export interface PlaidGateway {
  linkToken(mode: Mode, input: { clientUserId: string; clientName: string }): Promise<{ linkToken: string; expiration: string }>
  /** Exchanges Link's public token, reads one account, checks the name, removes the connection. */
  accountDetails(mode: Mode, input: { publicToken: string; accountId: string; legalName?: string | undefined; institutionName?: string | undefined }): Promise<PlaidAccountDetails>
}

class PlaidError extends Error { constructor(readonly status: number, readonly code: string, message: string) { super(message) } }
export { PlaidError }

/** Identity Match scores of 70 or more are Plaid's suggested threshold for "the same person or business". */
const NAME_MATCH_THRESHOLD = 70

export function plaidGateway(env: Bindings): PlaidGateway {
  const credentials = async (mode: Mode) => ({
    client_id: await vaultSecret(env, env.PLAID_CLIENT_ID_NAME ?? 'plaid-client-id'),
    secret: await vaultSecret(env, mode === 'live' ? env.PLAID_SECRET_LIVE_NAME ?? 'plaid-secret-production' : env.PLAID_SECRET_TEST_NAME ?? 'plaid-secret-sandbox'),
  })
  const call = async <T>(mode: Mode, path: string, body: Record<string, unknown>): Promise<T> => {
    const host = mode === 'live' ? 'https://production.plaid.com' : 'https://sandbox.plaid.com'
    const response = await fetch(`${host}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...await credentials(mode), ...body }), signal: AbortSignal.timeout(20_000) })
    const json = await response.json().catch(() => ({})) as T & { error_code?: string; error_message?: string; display_message?: string | null }
    if (!response.ok) throw new PlaidError(response.status >= 500 ? 502 : 400, json.error_code ?? 'PLAID_ERROR', json.display_message ?? json.error_message ?? `Plaid answered ${response.status}`)
    return json
  }

  return {
    async linkToken(mode, input) {
      const result = await call<{ link_token: string; expiration: string }>(mode, '/link/token/create', {
        client_name: input.clientName.slice(0, 30), language: 'en', country_codes: ['US'], user: { client_user_id: input.clientUserId },
        products: ['auth'], required_if_supported_products: ['identity'],
        account_filters: { depository: { account_subtypes: ['checking', 'savings'] } },
      })
      return { linkToken: result.link_token, expiration: result.expiration }
    },

    async accountDetails(mode, input) {
      const { access_token: accessToken } = await call<{ access_token: string }>(mode, '/item/public_token/exchange', { public_token: input.publicToken })
      try {
        const auth = await call<{ accounts: Array<{ account_id: string; mask: string | null; name?: string; subtype?: string | null }>
          numbers: { ach: Array<{ account_id: string; account: string; routing: string; wire_routing?: string | null; is_tokenized_account_number?: boolean }> } }>(mode, '/auth/get', { access_token: accessToken, options: { account_ids: [input.accountId] } })
        const numbers = auth.numbers.ach.find(item => item.account_id === input.accountId), account = auth.accounts.find(item => item.account_id === input.accountId)
        if (!numbers || !account) throw new PlaidError(400, 'PLAID_NO_ACH', 'That account cannot be paid by ACH. Choose a checking or savings account.')
        let nameMatch: PlaidAccountDetails['nameMatch']
        if (input.legalName) {
          try {
            const match = await call<{ accounts: Array<{ account_id: string; legal_name?: { score?: number | null; is_business_name_detected?: boolean | null } | null }> }>(mode, '/identity/match',
              { access_token: accessToken, user: { legal_name: input.legalName.slice(0, 200) }, options: { account_ids: [input.accountId] } })
            const score = match.accounts.find(item => item.account_id === input.accountId)?.legal_name?.score
            if (typeof score === 'number') nameMatch = { score, matched: score >= NAME_MATCH_THRESHOLD, businessName: match.accounts[0]?.legal_name?.is_business_name_detected ?? undefined }
          } catch { /* Identity Match is not offered by every bank; the details still stand, without a name check. */ }
        }
        return { routingNumber: numbers.routing, ...(numbers.wire_routing ? { wireRoutingNumber: numbers.wire_routing } : {}), accountNumber: numbers.account,
          accountType: account.subtype === 'savings' ? 'savings' : 'checking', mask: account.mask ?? numbers.account.slice(-4), ...(account.name ? { accountName: account.name } : {}),
          ...(input.institutionName ? { institutionName: input.institutionName.slice(0, 100) } : {}), tokenized: Boolean(numbers.is_tokenized_account_number), ...(nameMatch ? { nameMatch } : {}) }
      } finally {
        // One look, then the connection goes: no standing access to anyone's bank, and nothing more to bill.
        await call(mode, '/item/remove', { access_token: accessToken }).catch(() => undefined)
      }
    },
  }
}
