import * as Effect from 'effect/Effect'
import { first, nowIso, run, type Deployment } from './services'

export interface MicrosoftBinding {
  deployment_id: string
  license_deployment_id: string
  tenant_id: string
  owner_oid: string
  owner_name: string | null
  owner_email: string | null
  bound_at: string
}

export const bindingFor = (deploymentId: string) => first<MicrosoftBinding>('SELECT * FROM microsoft_bindings WHERE deployment_id = ?', deploymentId)

/** Identity is independent of container/DNS readiness. Reconcile from the binding on every console read. */
export const syncMicrosoftConnection = (deployment: Deployment) =>
  Effect.gen(function* () {
    if (deployment.lifecycle === 'deleting' || deployment.lifecycle === 'deleted') return null
    const saved = yield* bindingFor(deployment.id)
    // Never reuse a binding left over from a different license deployment.
    const binding = saved && deployment.license_deployment_id === saved.license_deployment_id ? saved : null
    const previous = deployment.steps.microsoft
    const reason = binding ? `Microsoft connected · ${binding.owner_name ?? binding.owner_email ?? 'The administrator'} is System Owner` : 'Connect Microsoft so your team can sign in.'
    const status = binding ? 'pass' : 'pending'
    if ((binding || previous.status === 'pass') && (previous.status !== status || previous.reason !== reason)) {
      const at = nowIso()
      const step = { status, reason, at } as const
      deployment.steps = { ...deployment.steps, microsoft: step, ...(!binding ? { registration: { status: 'pending' as const } } : {}) }
      // Patch only identity progress: a concurrent deploy may be saving resources and other steps.
      yield* run(
        binding
          ? "UPDATE deployments SET steps = json_set(steps, '$.microsoft', json(?)), updated_at = ? WHERE id = ?"
          : "UPDATE deployments SET steps = json_set(steps, '$.microsoft', json(?), '$.registration', json('{\"status\":\"pending\"}')), updated_at = ? WHERE id = ?",
        JSON.stringify(step), at, deployment.id,
      )
      deployment.updated_at = at
    }
    return binding
  })
