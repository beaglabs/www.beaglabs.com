/**
 * Papyrus pricing: one subscription per deployment with three items on Stripe product STRIPE_PRODUCT.
 * The amounts here are display copy and local estimates; Stripe's prices (wrangler vars) are what is charged.
 */

export const TRIAL_DAYS = 14

export const PLATFORM_MONTHLY_USD = 250
export const VM_HOUR_USD = 0.5
export const AGENT_SECOND_USD = 0.00194444

export type PriceKind = 'platform' | 'compute' | 'execution'

/** One row of a pricing table. */
export interface PriceRow {
  id: PriceKind
  /** What is charged. */
  label: string
  /** "$250" */
  amount: string
  /** "per month" */
  unit: string
  /** One plain sentence about when it applies. */
  detail: string
}

/**
 * The rows the pricing table renders, in order. A per-organization-size table can be added as another list of rows
 * with the same shape.
 */
export const PRICE_ROWS: readonly PriceRow[] = [
  { id: 'platform', label: 'Platform', amount: `$${PLATFORM_MONTHLY_USD}`, unit: 'per month', detail: 'Your Papyrus workspace, unlimited users, support from Beag Labs.' },
  { id: 'compute', label: 'VM compute', amount: `$${VM_HOUR_USD.toFixed(2)}`, unit: 'per VM hour', detail: 'Each hour your Papyrus deployment is running.' },
  { id: 'execution', label: 'Agent execution', amount: `$${AGENT_SECOND_USD}`, unit: 'per agent-second', detail: `While agents run. About $${Math.round(AGENT_SECOND_USD * 3600)} per agent-hour.` },
]

/** "$250/month platform · $0.50 per VM hour · $0.00194444 per agent-second (≈ $7/agent-hour)" */
export const PRICE_SUMMARY = `$${PLATFORM_MONTHLY_USD}/month platform · $${VM_HOUR_USD.toFixed(2)} per VM hour · $${AGENT_SECOND_USD} per agent-second (≈ $${Math.round(AGENT_SECOND_USD * 3600)}/agent-hour)`

export interface MonthUsage {
  vmHours: number
  executionSeconds: number
}

/** Estimated charge for the month so far: usage, plus the platform fee once the trial is over. */
export const estimateUsd = (usage: MonthUsage, options: { platform: boolean }) =>
  (options.platform ? PLATFORM_MONTHLY_USD : 0) + usage.vmHours * VM_HOUR_USD + usage.executionSeconds * AGENT_SECOND_USD

const usd = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** "This month so far: 312 VM hours · 95 agent minutes · $417.08 estimated" */
export const usageLine = (usage: MonthUsage, options: { platform: boolean }) =>
  `This month so far: ${usage.vmHours.toLocaleString('en-US')} VM hour${usage.vmHours === 1 ? '' : 's'} · ${Math.round(usage.executionSeconds / 60).toLocaleString('en-US')} agent minute${
    Math.round(usage.executionSeconds / 60) === 1 ? '' : 's'
  } · ${usd(estimateUsd(usage, options))} estimated`

// Per-organization-size estimate (plan step) ------------------------------------------------------------------------

/** Inputs of the size table. Change these and the table recomputes. */
export const SIZE_TABLE_VM_HOURS = 730
export const SIZE_TABLE_AGENT_HOURS_PER_USER = 2
export const SIZE_TABLE_USERS: readonly number[] = [100, 500, 1_000, 5_000]

export interface SizeRow {
  users: number
  agentHours: number
  /** Whole dollars. */
  monthlyTotal: number
  /** Dollars, two decimals, from the rounded monthly total. */
  perUser: number
}

/** $250 platform + 730 × $0.50 VM, plus agent-hours × 3600 × $0.00194444, rounded to the dollar. */
export const sizeRows = (users: readonly number[] = SIZE_TABLE_USERS): SizeRow[] =>
  users.map((count) => {
    const agentHours = count * SIZE_TABLE_AGENT_HOURS_PER_USER
    const monthlyTotal = Math.round(PLATFORM_MONTHLY_USD + SIZE_TABLE_VM_HOURS * VM_HOUR_USD + agentHours * 3600 * AGENT_SECOND_USD)
    return { users: count, agentHours, monthlyTotal, perUser: Math.round((monthlyTotal * 100) / count) / 100 }
  })

export const SIZE_TABLE_CAPTION = `Assumes one deployment running all month (${SIZE_TABLE_VM_HOURS} VM hours) and ${SIZE_TABLE_AGENT_HOURS_PER_USER} agent-hours per user per month.`
