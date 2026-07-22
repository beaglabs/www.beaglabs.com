import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/types'
import { getUserByEmail, saveCredential, updateCredentialCounter } from '@/lib/db'
import { createSession } from '@/lib/session'

const expectedOrigin = process.env.WEBAUTHN_ORIGIN || 'https://www.beaglabs.com'
const expectedRPID = process.env.WEBAUTHN_RP_ID || 'www.beaglabs.com'

export async function POST(request: Request) {
  try {
    const { name, credential, email } = await request.json() as {
      name: string
      credential: RegistrationResponseJSON
      email: string
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await getUserByEmail(email) as any
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedOrigin,
      expectedRPID,
      expectedChallenge: async (challenge: string) => {
        return true
      },
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 })
    }

    const regCredential = verification.registrationInfo

    // Save credential to database
    await saveCredential(user.id as string, {
      id: crypto.randomUUID(),
      name: name || 'Passkey',
      credentialId: regCredential.credentialID,
      publicKey: Buffer.from(regCredential.credentialPublicKey).toString('base64'),
      counter: regCredential.counter,
      deviceType: credential.response?.attestationObject ? 'platform' : 'cross-platform',
    })

    // Create session after successful registration
    await createSession({
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      verified: true,
    })

    return NextResponse.json({
      verified: true,
      credentialId: regCredential.credentialID,
    })
  } catch (error) {
    console.error('WebAuthn register complete error:', error)
    return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 })
  }
}
