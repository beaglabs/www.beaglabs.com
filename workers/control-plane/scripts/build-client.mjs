// Builds the deployment pages' client bundle (Preact + motion) into public/assets/deploy-ui.js.
// Runs as wrangler's custom build before `wrangler dev`, `wrangler deploy` and the dry run.
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

await build({
  absWorkingDir: root,
  entryPoints: ['src/client/main.tsx'],
  outfile: 'public/assets/deploy-ui.js',
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  jsxImportSource: 'preact',
  tsconfig: 'tsconfig.client.json',
  legalComments: 'none',
  logLevel: 'info',
})
