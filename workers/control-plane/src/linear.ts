import * as Effect from 'effect/Effect'
import { Env, first, nowIso, run } from './services'

type Job = { key: string; kind: 'lead' | 'deployment'; account_id: string; deployment_id: string | null; attempts: number }
type Org = { id: string; email: string; organization: string | null; name: string | null }
const personalDomain = new Set(['gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','aol.com','proton.me','protonmail.com','live.com','msn.com'])
const domainOf = (email: string) => email.trim().toLowerCase().split('@')[1] ?? ''
const cleanName = (domain: string) => domain.split('.')[0].replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
const businessDomainOf = (email: string) => { const domain=domainOf(email); return domain && !personalDomain.has(domain)?domain:null }

/** One Linear customer per organization (business email domain), or per account for personal email addresses. */
export const customerKeyOf = (account: Pick<Org,'id'|'email'>) => { const domain=businessDomainOf(account.email); return domain?'domain:'+domain:'account:'+account.id }

export type CustomerStatusName = 'Prospect' | 'Active' | 'Churned'
type PipelineAccount = Org & { active: number; paid: number }
export type CustomerAttributes = { externalId: string; name: string; domains?: string[]; ownerId?: string; status: CustomerStatusName }

/**
 * What Linear should hold for each customer, from D1: Active while any of its deployments is billed (active or suspended)
 * and not deleted, Churned once it has paid but nothing is billed any more, otherwise Prospect (signed up, credit claimed).
 */
export const customerAttributes = (accounts: PipelineAccount[], ownerId?: string): Map<string, CustomerAttributes> => {
  const groups=new Map<string,PipelineAccount[]>()
  for(const account of accounts){ const key=customerKeyOf(account); groups.set(key,[...(groups.get(key)??[]),account]) }
  const result=new Map<string,CustomerAttributes>()
  for(const [key,members] of groups){
    members.sort((a,b)=>a.id.localeCompare(b.id))
    const domain=businessDomainOf(members[0]!.email)
    const named=members.find(m=>m.organization?.trim())
    const name=named?.organization!.trim() ?? (domain?cleanName(domain):members[0]!.name?.trim() || members[0]!.email)
    const status:CustomerStatusName=members.some(m=>m.active)?'Active':members.some(m=>m.paid)?'Churned':'Prospect'
    result.set(key,{externalId:key,name,...(domain?{domains:[domain]}:{}),...(ownerId?{ownerId}:{}),status})
  }
  return result
}

export const wakeLinearSync = async (env: {LINEAR_SYNC?: DurableObjectNamespace}): Promise<void> => {
  if (!env.LINEAR_SYNC) return
  const id = env.LINEAR_SYNC.idFromName('control-plane')
  await env.LINEAR_SYNC.get(id).fetch('https://linear-sync.internal/wake', { method: 'POST' })
}

/**
 * Deliver a newly queued job, or a customer whose billing or name just changed, now instead of on the next cron.
 * Best-effort: the cron still retries.
 */
export const wake = () => Effect.gen(function* () {
  const env = yield* Env
  yield* Effect.promise(() => wakeLinearSync(env).catch(error => console.error('Linear wake failed', error instanceof Error ? error.message : String(error))))
})

/** D1 outbox keys prevent duplicate Linear issues across callbacks, Stripe webhooks, and retries. */
export const enqueueLead = (accountId: string) => Effect.gen(function* () {
  const account = yield* first<Org>('SELECT id,email,organization,name FROM accounts WHERE id = ?',accountId)
  if (!account) return
  const offer = yield* first<{email:string}>('SELECT email FROM compute_credit_offers WHERE email = ?',account.email)
  if (!offer) return
  const queued = yield* run("INSERT OR IGNORE INTO linear_outbox (key,kind,account_id,created_at) VALUES (?, 'lead', ?, ?)",'lead:'+account.id,account.id,nowIso())
  if (queued > 0) yield* wake()
})

export const enqueueCreditLead = (email: string) => Effect.gen(function* () {
  const account = yield* first<Org>('SELECT id,email,organization,name FROM accounts WHERE email = ?',email.toLowerCase())
  if (account) yield* enqueueLead(account.id)
})

export const enqueueFirstDeployment = (accountId: string, deploymentId: string) => Effect.gen(function* () {
  const count = yield* first<{n:number}>('SELECT COUNT(*) AS n FROM deployments WHERE account_id = ?',accountId)
  if (count?.n !== 1) return
  const queued = yield* run("INSERT OR IGNORE INTO linear_outbox (key,kind,account_id,deployment_id,created_at) VALUES (?, 'deployment', ?, ?, ?)",'deployment:'+accountId,accountId,deploymentId,nowIso())
  if (queued > 0) yield* wake()
})

/** Reconcile source-of-truth rows periodically so failed/missed callbacks never lose lifecycle events.
 * INSERT OR IGNORE + stable keys make this safe to run repeatedly and backfill older records.
 * Each pass is bounded; remaining rows will be picked up on the next cron.
 */
export const reconcileLinearOutbox = () => Effect.gen(function* () {
  yield* run(`INSERT OR IGNORE INTO linear_outbox (key, kind, account_id, created_at)
    SELECT 'lead:' || a.id, 'lead', a.id, ?
    FROM accounts a INNER JOIN compute_credit_offers c ON lower(c.email) = lower(a.email)
    LEFT JOIN linear_outbox o ON o.key = 'lead:' || a.id
    WHERE o.key IS NULL LIMIT 200`, nowIso())
  yield* run(`INSERT OR IGNORE INTO linear_outbox (key, kind, account_id, deployment_id, created_at)
    SELECT 'deployment:' || d.account_id, 'deployment', d.account_id, d.id, ?
    FROM deployments d LEFT JOIN linear_outbox o ON o.key = 'deployment:' || d.account_id
    WHERE o.key IS NULL AND d.billing_state = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM deployments earlier WHERE earlier.account_id = d.account_id
          AND (earlier.created_at < d.created_at OR (earlier.created_at = d.created_at AND earlier.id < d.id))
      )
    LIMIT 200`, nowIso())
})

async function gql(env: {LINEAR_API_KEY?:string}, query:string, variables:Record<string,unknown>) {
  const response=await fetch('https://api.linear.app/graphql',{method:'POST',headers:{'Authorization':env.LINEAR_API_KEY!, 'Content-Type':'application/json'},body:JSON.stringify({query,variables})})
  if (!response.ok) throw new Error('Linear HTTP '+response.status)
  const payload=await response.json() as {data?:Record<string,any>; errors?:Array<{message:string}>}
  if(payload.errors?.length) throw new Error(payload.errors.map(e=>e.message).join('; '))
  return payload.data!
}

const ISSUE = `mutation($input:IssueCreateInput!){issueCreate(input:$input){success issue{id url}}}`
const UPSERT = `mutation($input:CustomerUpsertInput!){customerUpsert(input:$input){success customer{id}}}`
const NEED = `mutation($input:CustomerNeedCreateInput!){customerNeedCreate(input:$input){success}}`
const STATUSES = `query{customerStatuses(first:100){nodes{id name}}}`

/** Accounts in the sales pipeline: a claimed compute credit, or a deployment that has been through Checkout. */
const PIPELINE = `SELECT a.id,a.email,a.organization,a.name,
    EXISTS(SELECT 1 FROM deployments d LEFT JOIN deployment_lifecycle l ON l.deployment_id = d.id
      WHERE d.account_id = a.id AND d.billing_state IN ('active','suspended') AND COALESCE(l.state,'running') NOT IN ('deleting','deleted')) AS active,
    EXISTS(SELECT 1 FROM deployments d WHERE d.account_id = a.id AND d.stripe_subscription_id IS NOT NULL) AS paid
  FROM accounts a
  WHERE EXISTS(SELECT 1 FROM compute_credit_offers c WHERE lower(c.email) = lower(a.email))
    OR EXISTS(SELECT 1 FROM deployments d WHERE d.account_id = a.id AND d.stripe_subscription_id IS NOT NULL)
  ORDER BY a.created_at LIMIT 1000`

/** Scheduled delivery, with partial-progress checkpoints to avoid duplicate issues on retries. */
export const flushLinearOutbox = () => Effect.gen(function* () {
  const env=yield* Env
  if (!env.LINEAR_API_KEY || !env.LINEAR_TEAM_ID) {
    console.error('Linear delivery disabled: LINEAR_API_KEY or LINEAR_TEAM_ID missing')
    return
  }
  yield* Effect.tryPromise({
    try:async () => {
      const db=env.DB
      const select=async <T>(sql:string,...args:unknown[]):Promise<T|null> => (await db.prepare(sql).bind(...args).first<T>()) ?? null
      const execute=async (sql:string,...args:unknown[]) => (await db.prepare(sql).bind(...args).run()).meta?.changes ?? 0

      // Customers first, so the jobs below can link their issues. Only customers whose attributes changed call Linear.
      const accounts=(await db.prepare(PIPELINE).all<PipelineAccount>()).results??[]
      const synced=new Map(((await db.prepare('SELECT customer_key,linear_customer_id,synced FROM linear_customers').all<{customer_key:string;linear_customer_id:string|null;synced:string|null}>()).results??[]).map(row=>[row.customer_key,row]))
      let statusIds:Map<string,string>|null=null
      for(const [key,attributes] of customerAttributes(accounts,env.LINEAR_ASSIGNEE_ID||undefined)){
        try {
          statusIds??=new Map(((await gql(env,STATUSES,{})).customerStatuses?.nodes??[]).map((s:{id:string;name:string})=>[s.name.toLowerCase(),s.id]))
          const statusId=statusIds.get(attributes.status.toLowerCase())
          if(!statusId) console.error('Linear customer status missing; add it under Settings → Customer requests',attributes.status)
          const {status:_status,...rest}=attributes
          const input={...rest,...(statusId?{statusId}:{})}
          const fingerprint=JSON.stringify(input)
          const current=synced.get(key)
          if(current?.linear_customer_id && current.synced===fingerprint) continue
          const result=await gql(env,UPSERT,{input})
          if(!result.customerUpsert?.success) throw new Error('Linear customerUpsert unsuccessful')
          await execute('INSERT INTO linear_customers (customer_key,linear_customer_id,synced,synced_at) VALUES (?,?,?,?) ON CONFLICT(customer_key) DO UPDATE SET linear_customer_id = excluded.linear_customer_id, synced = excluded.synced, synced_at = excluded.synced_at',key,result.customerUpsert.customer.id,fingerprint,nowIso())
        } catch (error) {
          console.error('Linear customer sync failed',key,error instanceof Error?error.message:'unknown')
        }
      }
      const customerIdOf=async (account:Org)=>(await select<{linear_customer_id:string|null}>('SELECT linear_customer_id FROM linear_customers WHERE customer_key = ?',customerKeyOf(account)))?.linear_customer_id ?? null

      const jobs=(await db.prepare("SELECT key,kind,account_id,deployment_id,attempts,linear_issue_id,linear_customer_id FROM linear_outbox WHERE delivered_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at LIMIT 20").bind(nowIso()).all<Job & {linear_issue_id:string|null;linear_customer_id:string|null}>()).results??[]
      for(const job of jobs) {
        const claimed=await execute("UPDATE linear_outbox SET next_attempt_at = ? WHERE key = ? AND delivered_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= ?)",new Date(Date.now()+300000).toISOString(),job.key,nowIso())
        if(!claimed) continue
        try {
          const account=await select<Org>('SELECT id,email,organization,name FROM accounts WHERE id = ?',job.account_id)
          if(!account) throw new Error('Account missing')
          const domain=domainOf(account.email)
          const businessDomain=businessDomainOf(account.email)
          const orgName=account.organization?.trim() || (businessDomain?cleanName(businessDomain):'Unverified organization')
          const base=`**Organization:** ${orgName}\n**Email domain:** ${domain || 'Unknown'}\n**Contact:** ${account.name ?? 'Not supplied'} (${account.email})\n**Control-plane account:** ${account.id}\n**Website candidate:** ${businessDomain ? 'https://'+businessDomain : 'Not established (personal email)'}\n\n**Linear Agent research brief:** Research the company using its public domain. Establish industry, location, employee range, and relevant enterprise software only when supported by citations. Add sourced findings to this issue; clearly mark uncertainties. Never invent company or contact details.\n`
          // High priority (Linear: 1 urgent, 2 high, 3 medium, 4 low); optional status (e.g. Todo instead of the team's default Backlog). The assignee is also subscribed.
          const assigneeId=env.LINEAR_ASSIGNEE_ID||undefined
          const routing={priority:2,stateId:env.LINEAR_ISSUE_STATE_ID||undefined,assigneeId,subscriberIds:assigneeId?[assigneeId]:undefined}
          const labels=(...ids:Array<string|undefined>)=>{const set=ids.filter((id):id is string=>!!id); return set.length?set:undefined}
          // The customer comes from the sync above; without it the job waits for the next run.
          const customerId=await customerIdOf(account)
          if(!customerId) throw new Error('Linear customer not synced yet')
          const lead=job.kind==='lead'
          let issueId=job.linear_issue_id
          if(!issueId){
            const input=lead
              ?{title:'New Lead | '+domain,description:base+'\n**Interest:** $1,000 Papyrus compute credit requested and account created.\n**Next steps:** Qualify organization, validate fit, and follow up.',labelIds:labels(env.LINEAR_SALES_PIPELINE_LABEL_ID)}
              :{title:`New Deployment - ${orgName} @ ${job.deployment_id}`,description:base+`\n**First deployment:** ${job.deployment_id}\n**Status:** Deployment created after verified Stripe checkout.\n**Follow-up:** Confirm provisioning and onboarding.`,labelIds:labels(env.LINEAR_NEW_CUSTOMER_LABEL_ID,env.LINEAR_SALES_PIPELINE_LABEL_ID)}
            const result=await gql(env,ISSUE,{input:{...routing,teamId:env.LINEAR_TEAM_ID,...input}})
            if(!result.issueCreate?.success) throw new Error('Linear issueCreate unsuccessful')
            issueId=result.issueCreate.issue.id
            await execute('UPDATE linear_outbox SET linear_issue_id = ? WHERE key = ?',issueId,job.key)
          }
          // linear_customer_id on the job records that the request (issue ↔ customer link) exists, so a retry never adds a second one.
          if(!job.linear_customer_id){
            const need=await gql(env,NEED,{input:{issueId,customerId,body:lead?'Signed up and claimed the $1,000 Papyrus compute credit.':'First Papyrus deployment: '+job.deployment_id}})
            if(!need.customerNeedCreate?.success) throw new Error('Linear customerNeedCreate unsuccessful')
            await execute('UPDATE linear_outbox SET linear_customer_id = ? WHERE key = ?',customerId,job.key)
          }
          await execute('UPDATE linear_outbox SET delivered_at = ?, next_attempt_at = NULL WHERE key = ?',nowIso(),job.key)
        } catch (error) {
          const attempts=job.attempts+1
          const next=new Date(Date.now()+Math.min(86400000,60000*Math.pow(2,Math.min(10,attempts)))).toISOString()
          await execute('UPDATE linear_outbox SET attempts = ?, next_attempt_at = ? WHERE key = ?',attempts,next,job.key)
          console.error('Linear outbox delivery failed',job.kind,job.key,error instanceof Error?error.message:'unknown')
        }
      }
    },
    catch: (error) => new Error('Linear outbox processing failed: '+String(error))
  })
})
