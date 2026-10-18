import { renderToString } from 'preact-render-to-string'
import { DeploymentApp } from './DeploymentApp'
import { ListApp } from './ListApp'
import { RuntimeContext, serverRuntime } from './runtime'
import type { ActivityEvent, DetailPayload, ListPayload } from './types'

/**
 * Server rendering of the deployment pages: the same components as the client bundle, so first paint is complete and
 * the bundle hydrates in place. The data travels as a JSON island (not executable, so `script-src 'self'` holds).
 */

export const DEPLOY_SCRIPT_PATH = '/assets/deploy-ui.js'
export const LIVE_URL = '/api/events/live'

/** JSON safe to embed in HTML: no "</script>", no HTML-significant characters, no JS line terminators. */
export const islandJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

export interface DetailIsland {
  page: 'detail'
  payload: DetailPayload
  events: { events: ActivityEvent[]; next: number | null }
}

export interface ListIsland {
  page: 'list'
  payload: ListPayload
}

const island = (data: DetailIsland | ListIsland, html: string) =>
  `<div id="dp-root" data-page="${data.page}" data-live-url="${LIVE_URL}">${html}</div><script type="application/json" id="dp-data">${islandJson(data)}</script>`

export const renderDetail = (data: Omit<DetailIsland, 'page'>) =>
  island(
    { page: 'detail', ...data },
    renderToString(
      <RuntimeContext.Provider value={serverRuntime}>
        <DeploymentApp payload={data.payload} events={data.events} />
      </RuntimeContext.Provider>,
    ),
  )

export const renderList = (data: Omit<ListIsland, 'page'>) =>
  island(
    { page: 'list', ...data },
    renderToString(
      <RuntimeContext.Provider value={serverRuntime}>
        <ListApp payload={data.payload} />
      </RuntimeContext.Provider>,
    ),
  )
