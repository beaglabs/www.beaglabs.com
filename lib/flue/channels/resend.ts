import { createResendChannel } from '@flue/resend'
import { defineTool, dispatch } from '@flue/runtime'
import { Resend } from 'resend'
import assistant from '../agents/assistant'

const EMAIL_INSTANCE_PREFIX = 'resend-email:'

export const client = new Resend(process.env.RESEND_API_KEY!)

export const channel = createResendChannel({
  client,
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,

  async webhook({ event, delivery }) {
    switch (event.type) {
      case 'email.received': {
        await dispatch(assistant, {
          id: emailInstanceId(event.data.email_id),
          input: {
            type: 'resend.email.received',
            deliveryId: delivery.id,
            emailId: event.data.email_id,
            messageId: event.data.message_id,
            from: event.data.from,
            to: event.data.to,
            cc: event.data.cc,
            subject: event.data.subject,
            attachments: event.data.attachments,
          },
        })
        return undefined
      }
      default:
        return undefined
    }
  },
})

export function retrieveReceivedEmail(emailId: string) {
  return defineTool({
    name: 'retrieve_resend_email',
    description: 'Retrieve the complete inbound email already bound to this agent.',
    async run() {
      const result = await client.emails.receiving.get(emailId)
      if (result.error) throw new Error(result.error.message)
      return JSON.parse(JSON.stringify(result.data))
    },
  })
}

export function emailInstanceId(emailId: string): string {
  if (!emailId) throw new TypeError('Resend email id must be non-empty.')
  return `${EMAIL_INSTANCE_PREFIX}${encodeURIComponent(emailId)}`
}

export function emailIdFromInstanceId(id: string): string {
  if (!id.startsWith(EMAIL_INSTANCE_PREFIX)) {
    throw new TypeError('Expected a local Resend email instance id.')
  }
  const emailId = decodeURIComponent(id.slice(EMAIL_INSTANCE_PREFIX.length))
  if (!emailId) throw new TypeError('Expected a local Resend email instance id.')
  return emailId
}
