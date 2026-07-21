import { defineTool } from '@flue/runtime'
import * as v from 'valibot'
import type { Resend } from 'resend'

/**
 * Creates a tool that sends emails via Resend.
 * The from address and API key are captured at agent instantiation.
 */
export function sendEmail(client: Resend, from: string) {
  return defineTool({
    name: 'send_email',
    description: 'Send an email via Resend.',
    input: v.object({
      to: v.pipe(v.string(), v.email()),
      subject: v.pipe(v.string(), v.minLength(1)),
      text: v.pipe(v.string(), v.minLength(1)),
    }),
    async run({ input }) {
      const result = await client.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
      })
      if (result.error) throw new Error(result.error.message)
      return { emailId: result.data?.id }
    },
  })
}
