# Actual Beag Labs website on Cloudflare Workers

The former standalone homepage replica has been removed. **This is now a thin launcher** for the REAL Next.js website at the repository root: `../../app`, `../../components`, `../../public`, and all its existing routes.

Cloudflare/Vite configuration is at the **repository root**:
- `../../vite.config.ts`
- `../../cloudflare.config.ts`
- `../../package.json` (vinext scripts added without changing existing `next dev` / `next build`)

## Install and build the REAL application

From the Git repository root (not inside this directory):

```bash
npm install
npm run check:vinext
npm run build:vinext
```

Review errors carefully: the production app uses native `takumi-js`, `pg`, authentication, Hygraph, and other API routes, unlike the earlier replica. Native dependencies and secret bindings may require compatibility fixes.

## Deploy the REAL application to a *different* preview Worker

```bash
# from repository root
npx cf auth login
npm run deploy:cloudflare
node workers/web/scripts/verify-deployment.mjs
```

Or run `npm run deploy` from here to invoke the root deploy script. The new Worker is `beaglabs-web-real-preview`, keeping the old replica URL untouched until you verify the full app. The deployment has **no production custom-domain route**.

Before production rollout, check interactive navigation, fonts, CSS, favicons, Open Graph endpoint, auth callbacks, licensing, API routes, and sensitive data handling. The smoke-test does not validate all dynamic business functionality. **Do not move DNS until these pass.**

The repo `main` baseline may have older marketing copy than other unmerged branches; the build deliberately uses exactly the branch's actual website sources, not a recreated homepage.
