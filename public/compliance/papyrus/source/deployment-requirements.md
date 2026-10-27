# Papyrus Deployment Requirements

This is an overview of what a Papyrus deployment needs from its host, network and identity provider. Papyrus makes no assumption about cloud provider, region, orchestrator or hosting model: it runs wherever an OCI container can run with a persistent volume. Choices such as the identity tenant, secret storage, certificate authority and network layout are made per deployment. The architecture document in the same evidence pack covers components and data flows.

## Deployment profiles

Every deployment runs one profile, set with `PAPYRUS_PROFILE`. The profile describes what Papyrus may assume about the network around it. It does not remove features.

| Profile | Intended for | Network assumption |
| --- | --- | --- |
| `commercial` | Connected commercial deployments (default) | Services the operator allows may be on the public internet |
| `government` | Connected government deployments | As `commercial`, but no commercial model endpoint is ever used by default |
| `disconnected` | Air-gapped and closed networks | Nothing outside the authorization boundary is assumed reachable |

On the `disconnected` profile, every service Papyrus uses is an endpoint the operator provides inside the boundary. Papyrus does not contact Beag Labs, never uses public package registries, and has no default model endpoint. Identity, directory, models, packages, images and customer systems all work, against internal endpoints.

Configuration comes from `papyrus.yaml` (`PAPYRUS_CONFIG_FILE`, else `/etc/papyrus/papyrus.yaml`), a reviewable file whose secrets appear only as file or environment references; environment variables override it. There is no first-run setup page: a deployment without an identity provider refuses to start. When Microsoft Entra ID is the identity provider, its national cloud is `identity.entra.cloud` (`Public`, `USGov` or `USGovDoD`).

## Platform

| Item | Value |
| --- | --- |
| Container images | `ghcr.io/beaglabs/papyrus/papyrus` and the DoD variant `ghcr.io/beaglabs/papyrus/papyrus-dod`; both can be mirrored into a customer registry |
| Architectures | `linux/amd64` and `linux/arm64`, published as one multi-architecture index |
| Signing | Each published index is signed with Sigstore Cosign and carries SLSA build provenance |
| Base image | Amazon Linux 2023 minimal, with OpenSSL's certified FIPS 140-3 provider (CMVP #5438) forced on; Papyrus refuses to start if FIPS mode is not active. Scanned in CI against the DISA STIG profile for Amazon Linux 2023 |
| Runtime | Node.js 24, Python 3.12, busybox `sh` |
| User | Runs as the non-root `nonroot` user (UID 65532) |
| Host | Linux with the Landlock LSM enabled, on any OCI-compatible container runtime or orchestrator. The health check confirms that the `landstrip` workspace sandbox can enforce its write boundary |
| Privileges | No privileged mode and no added capabilities; runs under the runtime's default seccomp profile |
| Entrypoint and health | `node /entrypoint.mjs`; `HEALTHCHECK` runs `node /healthcheck.mjs` every 30 s |

macOS is supported for local development only. On hosts where the sandbox cannot be applied, the daemon runs but native workspace execution is disabled.

License keys are built into the server and cannot be configured, so a signed license (`license.file` in `papyrus.yaml`) is activated at startup without contacting Beag Labs. Set the profile explicitly.

## Compute

Papyrus does not publish a fixed CPU or memory minimum, and it does not assume any particular instance type or platform. Size to workload. What drives sizing:

- Concurrent agent sessions, workflows and schedules running in the daemon.
- Document ingestion and local embedding (CPU-bound, in a worker thread with a 384 MB heap limit).
- Native workspace executions (Python, Pandoc, LibreOffice) in sandbox worker processes.
- Uploads, which are limited to 64 MiB per file by default (`PAPYRUS_ATTACHMENT_MAX_MIB`).

**GPU.** No component requires a GPU. The Knowledge Index embedding model runs on CPU. Chat model inference runs at the model gateway the operator configures, not inside Papyrus.

## Storage

**Persistent volume.** One writable volume at `PAPYRUS_DATA_DIR` (image default `/var/lib/papyrus`), owned by UID 65532. All state must persist across container restarts and replacements. Databases are LibSQL/SQLite files; no external database server is used.

| Path under the data directory | Contents |
| --- | --- |
| `agent.db` | Daemon state: configuration, policies, action ledger, audit trail, portal sessions, MCP servers and call log, workflows |
| `mastra.db` | Session threads and messages |
| `jobs.db` | Schedules and background jobs |
| `observability.db` | Trace spans and logs |
| `.agentfs/<id>.db` | AgentFS workspace and Library files |
| `secrets.db` | Encrypted model gateway credentials saved in the portal |
| `usage.db` | Hourly agent execution time |
| `models/nomic-embed-text-v1.5/` | Embedding model pack (downloaded or imported) |
| `skills/enabled/` | Approved agent skills |
| `portal-secret`, `legal-acceptance.json` | Generated portal secret (unless configured) and the record of Terms acceptance |

**Secrets and keys.** Credentials Papyrus stores are encrypted at the application layer with AES-256-GCM. Key material is provided by the operator, as a 32-byte master key file mounted read-only (`/etc/papyrus/secrets/master.key` or `PAPYRUS_SECRET_KEY_FILE`). Papyrus can instead resolve credentials by reference from an external key management service; which service is used is decided per deployment. Model and connector credentials are always configured as references, never as inline values.

**Certificates.** TLS certificates are provided by the operator and can be issued by any certificate authority, including a private or local CA. TLS is terminated by the operator's proxy or by Papyrus itself (`PAPYRUS_TLS_CERT`, `PAPYRUS_TLS_KEY`). Private trust roots are supported for connections Papyrus makes: `PAPYRUS_TLS_CA` for appliance consoles and `PAPYRUS_PACKAGE_MIRROR_CA_FILE` for package mirrors.

**Other mounts.** `PAPYRUS_TOOLCHAIN_DIR` (default `/opt/papyrus/toolchain`) holds Pandoc and LibreOffice for document conversion tools; they are not included in the image.

**Backups.** Back up `agent.db`, `mastra.db` and `jobs.db` together, plus the rest of the data directory, with consistent SQLite backups. Keep the master key separately from database backups; losing it makes saved credentials unrecoverable.

## Networking

**Listening ports.**

| Port | Bound by | Protocol | Notes |
| --- | --- | --- | --- |
| `3210` (`PAPYRUS_PORT`) | Daemon | HTTP, or HTTPS when Papyrus terminates TLS | Portal, API, workflow webhooks and agent channel webhooks |

**Inbound.**

- Persistent mode (`PAPYRUS_MODE=persistent`) requires an HTTPS public origin (`PAPYRUS_PUBLIC_ORIGIN`). The configured origin is authoritative; request headers cannot change sign-in redirect addresses.
- Users' browsers must reach that origin.
- Workflow webhooks (`/hooks/`) and agent channel webhooks (`/api/agent-channel-hooks/`) need to be reachable only by the systems that send them, and only when used.
- When agents are connected to Teams or GitHub, the Bot Framework service or the GitHub App must reach `/api/agent-controllers/papyrus/channels/teams/webhook` or `/api/agent-controllers/papyrus/channels/github/webhook`.

**Network dependencies.** These are the services Papyrus can connect to. None of them has to be on the public internet: each is reached at an address the operator configures, over whatever network path the operator provides. On the `disconnected` profile they are expected to sit inside the authorization boundary.

| Service | Used for | Needed | Connected profiles | `disconnected` profile |
| --- | --- | --- | --- | --- |
| Identity provider (OpenID Connect, or Microsoft Entra ID) | Sign-in and token validation | Yes | The provider in `papyrus.yaml` | Reached inside the boundary; browsers and the daemon need a path to it |
| Directory (Microsoft Graph, or SCIM 2.0 provisioning) | Staff directory and provisioning | No | Graph for the configured identity cloud | Reached inside the boundary when available; otherwise the directory lists people who have signed in |
| Model gateway | Agent model inference | For agent work | Any OpenAI-compatible endpoint the operator chooses | An endpoint inside the boundary; no default is assumed |
| Customer systems (MCP servers, Mainframe TN3270, SOAP services, workflow HTTP targets) | Integrations the customer connects | No | Operator's endpoints; internal hosts are allow-listed explicitly | Operator's endpoints inside the boundary |
| Package sources | Skill and session package installs | No | Internal mirrors, or public registries unless disabled (`PAPYRUS_PACKAGE_PUBLIC_REGISTRIES=false`) | Internal mirrors only; public registries are never used |
| Embedding model | Knowledge Index semantic search | No | Downloaded once from the model publisher, or imported | Imported from an offline pack, with downloads turned off (`PAPYRUS_EMBEDDING_DOWNLOAD=0`) |
| Microsoft Teams, GitHub | Agent conversations in Teams chats and pull requests | No | The deployment's Azure Bot and GitHub App (papyrus.yaml `agents.channels`) | Teams for government (GCC High, DoD) and GitHub Enterprise Server inside the boundary |
| Container registry | Install and update | At install and update | `ghcr.io` or a customer registry | A customer registry (`PAPYRUS_UPDATE_REPOSITORIES`) |
| Error reporting (Sentry) | Exception reports | No | Off unless a DSN is configured | Off unless an internal DSN is configured |

Host-level network policy (firewalls, proxies, segmentation) remains the operator's control.

## Identity

Papyrus keeps no local user accounts or passwords. People sign in through the organization's OpenID Connect provider (`identity.oidc`) or Microsoft Entra ID (`identity.entra`), configured in `papyrus.yaml`.

| Requirement | Detail |
| --- | --- |
| Redirect URI | `https://<public-origin>/api/auth/oidc/callback` (OIDC) or `/api/auth/entra/callback` (Entra) |
| First System Owners | Named in `identity.owners` by subject or email; they become System Owners at first sign-in |
| Roles | Declared Papyrus roles from token claims, from directory groups mapped in `identity.groupRoles`, or assigned by a System Owner |
| Provisioning (optional) | SCIM 2.0 at `/scim/v2`; deprovisioned or deactivated people lose access on their next request |
| Multi-factor and smart cards | Enforced by the identity provider's policy |
| System use notice | `security.notice`: `dow` for the standard DoD notice and consent banner, or a file with the organization's text |
| Sessions | `security.sessions`: ends after 15 idle minutes, 12 hours, or sign-out (server-side); at most 3 per person |
| Classification banner | `security.classification`: the system-high marking at the top of every screen |
| Terms | A System Owner accepts the Terms of Service and Privacy Policy in the app before Papyrus can be used |

## Audit and egress

| Setting | Effect |
| --- | --- |
| `audit.otlp` | Sends every audit record to an OpenTelemetry collector over OTLP/HTTP, with optional CA and mutual TLS; records written during an outage are delivered when it returns |
| `egress.allowedHosts` | The only hosts workflow HTTP steps, link previews, MCP servers and repository imports may reach. On the `disconnected` profile nothing outside the boundary is reached until it is listed |
| `repositories.tokens` | Read-only tokens, by host, for importing private Git repositories |

## Runtime dependencies

**Included in the image.**

- Node.js 24 and the daemon's production dependencies, including the Mastra agent framework, LibSQL, AgentFS, the `landstrip` sandbox and the OpenAI-compatible model client.
- The built web portal.
- Python 3.12 with document-handling libraries and the TN3270 bridge.
- The embedding model provisioner, without model weights.
- No browser engine.

**Provided by the operator.**

| Dependency | Needed for |
| --- | --- |
| Persistent volume | All state |
| Identity provider and client registration | Sign-in |
| Signed license | Product entitlement |
| OpenAI-compatible model endpoint and credential | Agent work |
| TLS certificate, or a TLS-terminating proxy | Persistent mode |
| Master key file, or an external key management service | Encrypted credential storage |
| Embedding model pack | Knowledge Index semantic search |
| Pandoc and LibreOffice under `PAPYRUS_TOOLCHAIN_DIR` | Document conversion tools |
| Package mirrors | Skill and session package installs where public registries are not used |

**Entitlement.** A signed license is verified locally against the license keys built into Papyrus, which cannot be configured; no call to Beag Labs is needed. An Azure Marketplace plan grants nothing by itself.

## Data sent to Beag Labs

None. Papyrus calls no Beag Labs service; licenses are verified locally.

Papyrus is not a cross-domain solution and makes no claim of GCC High, DoD IL4, IL6 or SIPR accreditation.
