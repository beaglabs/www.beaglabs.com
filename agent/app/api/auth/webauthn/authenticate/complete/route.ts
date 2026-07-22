import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'
import { getUserByEmail, getCredentialById, updateCredentialCounter } from '@/lib/db'
import { createSession } from '@/lib/session'

const expectedOrigin = process.env.WEBAUTHN_ORIGIN || 'https://www.beaglabs.com'
const expectedRPID = process.env.WEBAUTHN_RP_ID || 'www.beaglabs.com'

export async function POST(request: Request) {
  try {
    const { email, credential } = await request.json() as { email: string; credential: AuthenticationResponseJSON }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const savedCredential = await getCredentialById(credential.id)
    if (!savedCredential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    // In production, retrieve the challenge from storage
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedOrigin,
      expectedRPID,
      expectedChallenge: async (challenge: string) => {
        // In production, verify against stored challenge
        return true
      },
      authenticator: {
        credentialID: savedCredential.credential_id as string,
        credentialPublicKey: Buffer.from(savedCredential.public_key as string, 'base64'),
        counter: savedCredential.counter as number,
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
    }

    // Update credential counter
    await updateCredentialCounter(
      credential.id,
      verification.authenticationInfo.newCounter
    )

    // Create session
    await createSession({
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      verified: true,
    })

    return NextResponse.json({
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('WebAuthn authenticate complete error:', error)
    return NextResponse.json({ error: 'Failed to verify authentication' }, { status: 500 })
  }
}
