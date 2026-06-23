'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

interface PostTrackerProps {
  eventName: 'blog_post_viewed' | 'research_paper_viewed'
  properties: Record<string, string | undefined>
}

export function PostTracker({ eventName, properties }: PostTrackerProps) {
  useEffect(() => {
    posthog.capture(eventName, properties)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
