import nacl from 'tweetnacl'

/**
 * Verify a Discord interaction request using Ed25519.
 * Discord sends X-Signature-Ed25519 and X-Signature-Timestamp headers.
 */
export function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    return nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    )
  } catch {
    return false
  }
}
