# Papyrus evidence pack

Release 0.1.0+fd55e38, image `ghcr.io/beaglabs/papyrus/papyrus@sha256:b38facf4950270443ac39dc5bbaeb4ed5653341b61608526163e929a449ebd8a`, built 2026-10-20T13:03:06Z.

| File | Contents |
| --- | --- |
| `papyrus-architecture.pdf` | System boundaries, runtime components, model gateways, integrations, data flows and deployment topology |
| `papyrus-deployment-requirements.pdf` | Compute, storage, networking, runtime dependencies, offline constraints and external services |
| `papyrus-security-controls.pdf`, `papyrus-controls-matrix.xlsx` | NIST SP 800-53 Rev. 5 controls matrix with source evidence |
| `oscal/papyrus-component-definition.json` | OSCAL 1.2.3 component definition, validated with oscal-cli 3.2.0 |
| `papyrus-known-gaps.pdf`, `papyrus-poam.xlsx`, `oscal/papyrus-poam.json` | Known gaps and remediation plan (POA&M) |
| `papyrus-supply-chain-evidence.pdf` | Digests, signature and provenance verification, vulnerability scan summary |
| `sbom/` | CycloneDX and SPDX SBOMs for each platform |
| `supply-chain/` | OCI index, cosign verification, SLSA provenance bundle, Trivy scans |
| `index.json` | Machine-readable summary of this pack |
| `SHA256SUMS` | Checksums for every file |

Prepared by Beag Labs from the Papyrus source and its published release image. Describes the software and the responsibilities it leaves to a deploying organization. It is not a certification, an authorization or a third-party assessment.
