import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { saveVerificationCode, getVerificationCode, markVerificationCodeUsed, getUserByEmail, createUser } from '@/lib/db'

let _resend: Resend | null = null

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const allowedDomain = process.env.ALLOWED_DOMAIN || 'beaglabs.com'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { email, code, action } = await request.json()

    // Validate domain
    const domain = email?.split('@')[1]
    if (domain !== allowedDomain) {
      return NextResponse.json(
        { error: `Only @${allowedDomain} emails are allowed` },
        { status: 400 }
      )
    }

    if (action === 'send') {
      // Send verification code
      const verificationCode = generateCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

      await saveVerificationCode(email, verificationCode, expiresAt)

      const { error } = await getResend().emails.send({
        from: 'Beag Labs <auth@agent.beaglabs.com>',
        to: email,
        subject: 'Your verification code',
        html: `
          <div style="font-family: monospace; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Verification Code</h1>
            <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
              Enter this code to verify your email address:
            </p>
            <div style="background: #f5f5f5; border: 2px solid #111; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
              ${verificationCode}
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 16px;">
              This code expires in 10 minutes. If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      })

      if (error) {
        console.error('Resend error:', error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Verification code sent' })
    }

    if (action === 'verify') {
      // Verify the code
      if (!code) {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
      }

      const verificationCode = await getVerificationCode(email, code)
      if (!verificationCode) {
        return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
      }

      await markVerificationCodeUsed(verificationCode.id as string)

      // Get or create user
      let user = await getUserByEmail(email) as any
      if (!user) {
        const userId = crypto.randomUUID()
        const name = email.split('@')[0]
        await createUser(userId, email, name)
        user = { id: userId, email, name, verified: 1 }
      }

      return NextResponse.json({
        success: true,
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
