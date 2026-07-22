import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getUserByEmail, getCredentialsByUserId } from '@/lib/db'

const rpID = process.env.WEBAUTHN_RP_ID || 'www.beaglabs.com'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate domain
    const domain = email.split('@')[1]
    const allowedDomain = process.env.ALLOWED_DOMAIN || 'beaglabs.com'
    if (domain !== allowedDomain) {
      return NextResponse.json({ error: `Only @${allowedDomain} emails are allowed` }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      // Return status indicating user needs to register
      return NextResponse.json({
        status: 'no-user',
        rpID,
        allowCredentials: [],
        userVerification: 'preferred',
      })
    }

    const credentials = await getCredentialsByUserId(user.id as string)

    // If user has no credentials, they need to register first
    if (credentials.length === 0) {
      return NextResponse.json({
        status: 'no-credentials',
        rpID,
        allowCredentials: [],
        userVerification: 'preferred',
      })
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((cred) => ({
        id: cred.credential_id as string,
        type: 'public-key' as const,
      })),
      userVerification: 'preferred',
    })

    return NextResponse.json({ ...options, status: 'ok' })
  } catch (error) {
    console.error('WebAuthn authenticate begin error:', error)
    return NextResponse.json({ error: 'Failed to generate authentication options' }, { status: 500 })
  }
}
