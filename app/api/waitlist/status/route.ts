import { ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { SiteContent } from '@/models/Content'

export async function GET() {
  await connectToDatabase()

  let launchDate: string | null = null
  const launchDoc = await SiteContent.findOne({ key: 'launch_date' }).lean()

  if (launchDoc?.value && typeof launchDoc.value === 'string') {
    launchDate = launchDoc.value
  }

  const launched = !launchDate || new Date(launchDate) <= new Date()

  return ok({ launched, launchDate })
}
