# Beag Labs homepage on Cloudflare Workers (vinext)

This **standalone, homepage-only proof of concept** lives under `workers/web/` and is isolated from the repository's existing Next.js site and Vercel deployment. It reproduces the new homepage's messaging and key sections rather than importing the production app's server APIs or native binaries.

## Local development

```sh
cd workers/web
npm install
npm run dev
npm run check
npm run build
```

## Cloudflare preview deployment

```sh
cd workers/web
npm install
npx cf auth login
# Or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
npm run deploy
```

The Worker is named `beaglabs-web-preview`. No production route or custom domain is configured. Check the resulting `*.workers.dev` hostname printed by the deploy command.

**Do not point `www.beaglabs.com` at this proof of concept.** Routes other than `/` are intentionally not implemented. Trial and solution links point to the current production site. The preview is `noindex` to prevent search duplication. No licensing, authentication, CRM, or database functions are part of this deployment.

### Notes

- vinext is under active development and may have compatibility gaps. Run the build and preview tests before deployment.
- The separate package and no-import design avoid the parent Next.js app's native `pg` / OG-image dependencies.
- This repository change does not provision Cloudflare credentials or perform a deployment.
- Once this passes, a full-site migration can be planned without impacting Vercel.
