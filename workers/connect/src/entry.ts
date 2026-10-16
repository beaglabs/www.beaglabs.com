import { createConnectApp } from './app'
import { getDb } from './db'
import { managedDeployment } from './marketplace'
import { plaidGateway } from './plaid'

const app = createConnectApp({ database: getDb, plaid: plaidGateway, managedDeployment })

export default { fetch: app.fetch }
