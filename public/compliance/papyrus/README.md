# Papyrus evidence pack

Release 0.1.0+3e23d44, image `ghcr.io/beaglabs/papyrus/papyrus@sha256:d399de55560bdac84b62c098284781fd4910d3396834ca2629ebdfaa2dd0f86d`, built 2026-10-27T15:00:32Z.

| File | Contents |
| --- | --- |
| `papyrus-architecture.pdf` | System boundaries, runtime components, model gateways, integrations, data flows and deployment topology |
| `papyrus-deployment-requirements.pdf` | Compute, storage, networking, runtime dependencies, offline constraints and external services |
| `papyrus-security-controls.pdf`, `papyrus-controls-matrix.xlsx` | NIST SP 800-53 Rev. 5 controls matrix with source evidence |
| `papyrus-ai-rmf.pdf`, `papyrus-ai-rmf.xlsx` | NIST AI RMF 1.0 mapping (Govern, Map, Measure, Manage) and Generative AI Profile risks |
| `papyrus-capabilities.pdf` | Capabilities overview with screenshots, by control family |
| `oscal/papyrus-component-definition.json` | OSCAL 1.2.3 component definition, validated with oscal-cli 3.2.0 |
| `papyrus-known-gaps.pdf`, `papyrus-poam.xlsx`, `oscal/papyrus-poam.json` | Known gaps and remediation plan (POA&M) |
| `papyrus-supply-chain-evidence.pdf` | Digests, signature and provenance verification, vulnerability scan summary |
| `sbom/` | CycloneDX and SPDX SBOMs for each platform |
| `supply-chain/` | OCI index, cosign verification, SLSA provenance bundle, Trivy scans |
| `index.json` | Machine-readable summary of this pack |
| `SHA256SUMS` | Checksums for every file |

Prepared by Beag Labs from the Papyrus source and its published release image. Describes the software and the responsibilities it leaves to a deploying organization. It is not a certification, an authorization or a third-party assessment.
