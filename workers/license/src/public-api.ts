import { Hono } from 'hono'
import { getDb, rows } from './db'
import type { Bindings } from './env'

type Row = Record<string, unknown>

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
  c.header('X-Content-Type-Options', 'nosniff')
})

app.get('/api/public/products', async (c) => {
  const result = await getDb(c.env).execute(`
    SELECT sku,name,description,product_family,term_type,provisioning_type,list_price_cents,allowed_profiles_json
    FROM products
    WHERE active=1
    ORDER BY sku
  `)
  return c.json({ items: rows<Row>(result) })
})

export default app
