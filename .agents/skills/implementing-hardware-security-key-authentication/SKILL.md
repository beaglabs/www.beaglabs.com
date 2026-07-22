---
name: implementing-hardware-security-key-authentication
description: Implements FIDO2/WebAuthn hardware security key authentication including registration ceremonies, authentication flows, YubiKey enrollment, and passkey migration strategies.
license: Apache-2.0
metadata:
  domain: cybersecurity
  subdomain: identity-and-access-management
  version: "1.0.0"
  author: mukul975
  nist_csf: "PR.AA-01, PR.AA-02, PR.AA-05"
  mitre_attack: "T1078, T1190, T1059, T1003, T1110"
---

# Implementing Hardware Security Key Authentication

## Overview

Deploys FIDO2/WebAuthn passwordless authentication using security keys and platform authenticators. Encompasses WebAuthn API integration, FIDO2 server configuration, passkey enrollment, biometric authentication, and transitioning away from password-based systems in alignment with NIST SP 800-63B AAL3.

## When to Use

- Deploying phishing-resistant MFA using FIDO2 hardware security keys
- Building a WebAuthn relying party server supporting roaming and platform authenticators
- Migrating from password-based auth to passkeys
- Enrolling YubiKey devices organization-wide
- Implementing passwordless flows compliant with NIST SP 800-63B AAL3

## Key Concepts

| Term | Definition |
|------|-----------|
| **FIDO2** | W3C WebAuthn API + FIDO Alliance CTAP2 protocol for passwordless, phishing-resistant auth |
| **WebAuthn** | W3C API for creating/using public key credentials via navigator.credentials |
| **CTAP2** | Browser-to-authenticator communication over USB, NFC, or BLE |
| **Discoverable Credential** | Credential on authenticator enumerable without RP providing credential ID |
| **Attestation** | Cryptographic proof from authenticator about its identity |
| **AAGUID** | 128-bit identifier for authenticator model |
| **Sign Count** | Monotonically increasing counter for clone detection |
| **User Verification** | Local auth on authenticator (PIN, fingerprint, face) |

## Workflow

### Step 1: Relying Party Server Configuration
- Define RP identity with domain and name
- Initialize Fido2Server for challenge generation and verification
- Configure attestation preference (none, indirect, direct, enterprise)
- Set up session management with secure cookies
- Design credential storage schema

### Step 2: Registration Ceremony
- Begin registration with user entity and options
- Configure authenticator selection criteria
- Complete registration and store credential

### Step 3: Authentication Ceremony
- Begin authentication with registered credentials
- Verify assertion signature and validate counter
- Support discoverable credential flow for passwordless

### Step 4: YubiKey Enrollment
- Initialize FIDO2 PIN
- Register primary and backup keys
- Verify attestation certificates for enterprise

### Step 5: Passkey Migration
- Phased rollout with voluntary enrollment
- Cross-device passkey support
- Account recovery flows for lost keys
- Password deprecation timeline

## Common Pitfalls

- Not requiring backup key enrollment
- Setting user_verification to discouraged
- Forgetting to validate sign counter
- Not supporting NFC for mobile users
- Allowing TOTP as permanent fallback
