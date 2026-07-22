import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { getUserByEmail, getCredentialsByUserId } from '@/lib/db'

const rpName = process.env.WEBAUTHN_RP_NAME || 'Beag Labs Agent Portal'
const rpID = process.env.WEBAUTHN_RP_ID || 'www.beaglabs.com'

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await getUserByEmail(email) as any
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please verify your email first.' }, { status: 404 })
    }

    // Get existing credentials
    const credentials = await getCredentialsByUserId(user.id as string)

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id as string),
      userName: user.email as string,
      userDisplayName: name || (user.name as string),
      attestationType: 'none',
      excludeCredentials: credentials.map((cred) => ({
        id: cred.credential_id as string,
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    })

    return NextResponse.json(options)
  } catch (error) {
    console.error('WebAuthn register begin error:', error)
    return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 })
  }
}
