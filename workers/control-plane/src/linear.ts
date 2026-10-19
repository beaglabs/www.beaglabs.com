import * as Effect from 'effect/Effect'
import { Env, first, nowIso, run } from './services'

type Job = { key: string; kind: 'lead' | 'deployment'; account_id: string; deployment_id: string | null; attempts: number }
type Org = { id: string; email: string; organization: string | null; name: string | null }
const personalDomain = new Set(['gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','aol.com','proton.me','protonmail.com','live.com','msn.com'])
const domainOf = (email: string) => email.trim().toLowerCase().split('@')[1] ?? ''
const cleanName = (domain: string) => domain.split('.')[0].replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase())

/** D1 outbox keys prevent duplicate Linear issues across callbacks, Stripe webhooks, and retries. */
export const enqueueLead = (accountId: string) => Effect.gen(function* () {
  const account = yield* first<Org>('SELECT id,email,organization,name FROM accounts WHERE id = ?',accountId)
  if (!account) return
  const offer = yield* first<{email:string}>('SELECT email FROM compute_credit_offers WHERE email = ?',account.email)
  if (!offer) return
  yield* run("INSERT OR IGNORE INTO linear_outbox (key,kind,account_id,created_at) VALUES (?, 'lead', ?, ?)",'lead:'+account.id,account.id,nowIso())
})

export const enqueueCreditLead = (email: string) => Effect.gen(function* () {
  const account = yield* first<Org>('SELECT id,email,organization,name FROM accounts WHERE email = ?',email.toLowerCase())
  if (account) yield* enqueueLead(account.id)
})

export const enqueueFirstDeployment = (accountId: string, deploymentId: string) => Effect.gen(function* () {
  const count = yield* first<{n:number}>('SELECT COUNT(*) AS n FROM deployments WHERE account_id = ?',accountId)
  if (count?.n !== 1) return
  yield* run("INSERT OR IGNORE INTO linear_outbox (key,kind,account_id,deployment_id,created_at) VALUES (?, 'deployment', ?, ?, ?)",'deployment:'+accountId,accountId,deploymentId,nowIso())
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

/** Scheduled delivery, with partial-progress checkpoints to avoid duplicate issues on retries. */
export const flushLinearOutbox = () => Effect.gen(function* () {
  const env=yield* Env
  if (!env.LINEAR_API_KEY || !env.LINEAR_TEAM_ID) return
  yield* Effect.tryPromise({
    try:async () => {
      const db=env.DB
      const select=async <T>(sql:string,...args:unknown[]):Promise<T|null> => (await db.prepare(sql).bind(...args).first<T>()) ?? null
      const execute=async (sql:string,...args:unknown[]) => (await db.prepare(sql).bind(...args).run()).meta?.changes ?? 0
      const jobs=(await db.prepare("SELECT key,kind,account_id,deployment_id,attempts,linear_issue_id,linear_customer_id FROM linear_outbox WHERE delivered_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at LIMIT 20").bind(nowIso()).all<Job & {linear_issue_id:string|null;linear_customer_id:string|null}>()).results??[]
      for(const job of jobs) {
        const claimed=await execute("UPDATE linear_outbox SET next_attempt_at = ? WHERE key = ? AND delivered_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= ?)",new Date(Date.now()+300000).toISOString(),job.key,nowIso())
        if(!claimed) continue
        try {
          const account=await select<Org>('SELECT id,email,organization,name FROM accounts WHERE id = ?',job.account_id)
          if(!account) throw new Error('Account missing')
          const domain=domainOf(account.email)
          const businessDomain=domain && !personalDomain.has(domain)?domain:null
          const orgName=account.organization?.trim() || (businessDomain?cleanName(businessDomain):'Unverified organization')
          const base=`**Organization:** ${orgName}\n**Email domain:** ${domain || 'Unknown'}\n**Contact:** ${account.name ?? 'Not supplied'} (${account.email})\n**Control-plane account:** ${account.id}\n**Website candidate:** ${businessDomain ? 'https://'+businessDomain : 'Not established (personal email)'}\n\n**Linear Agent research brief:** Research the company using its public domain. Establish industry, location, employee range, and relevant enterprise software only when supported by citations. Add sourced findings to this issue; clearly mark uncertainties. Never invent company or contact details.\n`
          let issueId=job.linear_issue_id
          if(job.kind==='lead') {
            if(!issueId){
              const result=await gql(env,ISSUE,{input:{teamId:env.LINEAR_TEAM_ID,title:'New Lead | '+domain,description:base+'\n**Interest:** $1,000 Papyrus compute credit requested and account created.\n**Next steps:** Qualify organization, validate fit, and follow up.'}})
              if(!result.issueCreate?.success) throw new Error('Linear issueCreate unsuccessful')
              issueId=result.issueCreate.issue.id
              await execute('UPDATE linear_outbox SET linear_issue_id = ? WHERE key = ?',issueId,job.key)
            }
          } else {
            const deploymentId=job.deployment_id!
            let customerId=job.linear_customer_id
            if(!customerId) {
              const input:Record<string,unknown>={name:orgName,externalIds:[account.id]}
              if(businessDomain) input.domains=[businessDomain]
              const customer=await gql(env,UPSERT,{input})
              if(!customer.customerUpsert?.success) throw new Error('Linear customerUpsert unsuccessful')
              customerId=customer.customerUpsert.customer.id
              await execute('UPDATE linear_outbox SET linear_customer_id = ? WHERE key = ?',customerId,job.key)
            }
            if(!issueId){
              const issue=await gql(env,ISSUE,{input:{teamId:env.LINEAR_TEAM_ID,title:`New Deployment - ${orgName} @ ${deploymentId}`,description:base+`\n**First deployment:** ${deploymentId}\n**Status:** Deployment created after verified Stripe checkout.\n**Follow-up:** Confirm provisioning and onboarding.`,labelIds:env.LINEAR_NEW_CUSTOMER_LABEL_ID?[env.LINEAR_NEW_CUSTOMER_LABEL_ID]:undefined}})
              if(!issue.issueCreate?.success) throw new Error('Linear issueCreate unsuccessful')
              issueId=issue.issueCreate.issue.id
              await execute('UPDATE linear_outbox SET linear_issue_id = ? WHERE key = ?',issueId,job.key)
            }
            await gql(env,NEED,{input:{issueId,customerId,body:'First Papyrus deployment: '+deploymentId}})
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
