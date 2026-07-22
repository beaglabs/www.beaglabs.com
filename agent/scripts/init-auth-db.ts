import { initAuthDb } from '../lib/db'

async function main() {
  console.log('Initializing auth database...')
  await initAuthDb()
  console.log('Auth database initialized successfully')
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed to initialize auth database:', err)
  process.exit(1)
})
