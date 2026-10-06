import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Training Runs',
    description: 'Manage and monitor domain-specific model training runs.',
    path: '/model-service/runs',
    label: 'Training',
  }),
}

import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { RunsDashboard } from "./runs-dashboard"

export const dynamic = "force-dynamic"

export default async function RunsPage() {
  await auth.api.getSession({
    headers: await headers(),
  })

  return <RunsDashboard />
}
