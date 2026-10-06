export { generateMetadata } from '../government/page'

import { permanentRedirect } from 'next/navigation'

export default function GovermentSupportRedirect() {
  permanentRedirect('/support/government')
}
