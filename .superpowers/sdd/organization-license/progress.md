# SDD ledger — plan: docs/superpowers/plans/2026-10-06-organization-license.md
Ruling: Work in existing checkouts without commits — both repositories contain user work; only licensing changes will be edited.
Pre-flight: issuer and runtime must share organization scope claims; scope-less legacy documents retain deployment identity.
Ruling: Store organization scope and issuance in additive tables — existing deployment issuance has a mandatory deployment foreign key.
Task 1: in progress; runtime tests first.

Ruling: First-run setup accepts an organization document alongside proposed Entra settings — tenant matching cannot pass before identity exists; configuration still requires verified license proof and existing Marketplace Azure verification. Cost if wrong: setup could strand customers, covered by HTTP integration tests.
Ruling: No developer mint script exists to update — production generation stays in the Key Vault-backed console; test signing uses generated fixture keys. Cost if wrong: an undiscovered development script would remain deployment-only.
Task 1: complete; watched original runtime tests fail (5 failures), then pass. Shared payload union and signature-first validation implemented.
Task 2: complete; runtime context callbacks, first-run upload, and outer raw-Host gate implemented. Runtime license/Marketplace/bootstrap suite: 44/44 pass; server, contracts, and web type checks pass.
Task 3: complete; additive schema and admin-only scope/issuance implemented with atomic audit and stale-policy commit guard. Scratch SQLite schema/endpoint tests: 8/8 pass; Worker type check passes.
Task 4: in progress; console panel and generation/download history added, rollout documentation written. Whole-website type check has existing failures in training, PDF, auth, and legacy icon tuple inference; no new panel errors.
