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
