import { libsql } from '@flue/libsql'
import { createClient, type ResultSet } from '@libsql/client'

const client = createClient({ url: process.env.LIBSQL_URL || 'file:./data/flue.db' })

const toRows = (rs: ResultSet) =>
  rs.rows.map((row) =>
    Object.fromEntries(rs.columns.map((col) => [col, row[col]]))
  )

let tail: Promise<unknown> = Promise.resolve()
const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = tail.then(operation, operation)
  tail = result.then(() => undefined, () => undefined)
  return result
}

export default libsql({
  query: (text, params = []) =>
    serialize(async () => toRows(await client.execute({ sql: text, args: params ?? [] }))),
  transaction: (fn) =>
    serialize(async () => {
      const tx = await client.transaction('write')
      try {
        const result = await fn({
          query: async (text, params = []) =>
            toRows(await tx.execute({ sql: text, args: params ?? [] })),
        })
        await tx.commit()
        return result
      } catch (error) {
        await tx.rollback()
        throw error
      } finally {
        tx.close()
      }
    }),
  close: () => client.close(),
})
