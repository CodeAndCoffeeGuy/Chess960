import { PostHog } from 'posthog-node'

// Server-side PostHog instance
export const getServerPosthog = () => {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
      }
    )
  }
  return null
}
