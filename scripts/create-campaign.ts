import { readFileSync } from 'fs'
import { join } from 'path'

const BASE = 'https://api.customer.io/v1'
const KEY = 'a54377f6826366b4f885ada4fc01f6ca'
const SEGMENT_ID = 15

interface EmailDef {
  day: number
  subject: string
  preheader: string
  templateFile: string
}

const emails: EmailDef[] = [
  { day: 0,  subject: 'Your ML Cookbook + Where to Start',                              preheader: '52 recipes. 7 domains. One decision tree to find your first recipe.',                templateFile: 'drip-day0.html' },
  { day: 2,  subject: 'The Smallest Models Are Getting Weirdly Good',                     preheader: 'GRPO changed who can train frontier models. Here is the story.',                   templateFile: 'drip-day2.html' },
  { day: 4,  subject: 'The Death of RLHF?',                                               preheader: 'PPO vs GRPO vs DAPO vs RLVR — a one-chart comparison.',                           templateFile: 'drip-day4.html' },
  { day: 6,  subject: 'Why Everyone Suddenly Cares About Synthetic Data',                  preheader: 'Self-Instruct, Evol-Instruct, Data Flywheels — how frontier labs generate data.',  templateFile: 'drip-day6.html' },
  { day: 9,  subject: "Reasoning Isn't Magic",                                            preheader: 'Process supervision vs outcome supervision — the mechanism behind reasoning.',     templateFile: 'drip-day9.html' },
  { day: 12, subject: 'How Frontier Labs Actually Compress Huge Models',                   preheader: 'On-policy distillation — how frontier labs compress 1.8T parameters.',             templateFile: 'drip-day12.html' },
  { day: 16, subject: 'The Rise of Tiny Frontier Models',                                 preheader: 'Phi-4, Gemma 3, Qwen 2.5 — tiny models that beat giants.',                        templateFile: 'drip-day16.html' },
  { day: 20, subject: 'Can a 7B Model Beat a 70B Model?',                                 preheader: 'Data quality + training recipe + evaluation — the formula.',                      templateFile: 'drip-day20.html' },
]

const TEMPLATE_DIR = join(import.meta.dirname, '..', 'components', 'email')

function readTemplate(file: string): string {
  const path = join(TEMPLATE_DIR, file)
  let content = readFileSync(path, 'utf-8')
  content = content.replace(/{% capture content %}/g, '')
    .replace(/{% endcapture %}/g, '')
    .replace(/{% assign series_label = 'Onboarding' %}/g, '')
    .replace(/{% assign preheader = '.*?' %}/g, '')
    .replace(/{% include 'layout' %}/g, '')
    .replace(/{{preheader}}/g, '')
    .replace(/{{series_label}}/g, 'Onboarding')
  return content.trim()
}

async function createNewsletter(email: EmailDef) {
  const body = getTemplate(email.templateFile)

  const resp = await fetch(`${BASE}/newsletters`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newsletter: {
        name: `[Onboarding] Day ${email.day}: ${email.subject}`,
        type: 'email',
        subject: email.subject,
        preheader_text: email.preheader,
        body,
        recipients: {
          segment: { id: SEGMENT_ID },
        },
      },
    }),
  })

  const data = await resp.json()
  return { status: resp.status, data, email: email.subject }
}

async function main() {
  console.log('Creating 8 onboarding newsletters...\n')

  for (const email of emails) {
    const result = await createNewsletter(email)
    const status = result.status === 201 ? '✅' : '❌'
    console.log(`${status} Day ${email.day}: ${email.subject} (${result.status})`)
    if (result.status !== 201) {
      console.log(`  ${JSON.stringify(result.data)}`)
    }
  }
}

main().catch(console.error)