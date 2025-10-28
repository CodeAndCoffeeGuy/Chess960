import posthog from 'posthog-js'

// Client-side PostHog initialization
export const initPosthog = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We handle pageviews manually
      capture_pageleave: true,
      // Session recording
      session_recording: {
        recordCrossOriginIframes: false, // Set to true if you have iframes from the same origin
        maskAllInputs: true, // Mask all input fields by default (sensitive data)
        maskTextSelector: '[data-private]', // Also mask elements with data-private attribute
        // Don't mask these inputs if you want to see them in recordings
        // maskAllInputs: false,
        // maskInputOptions: {
        //   password: true, // Always mask passwords
        //   email: true,    // Mask email inputs
        // }
      },
      loaded: (_posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog loaded')
        }
      }
    })
  }
}

// User identification
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties)
  }
}

// Track events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties)
  }
}

// Auth events
export const trackMagicLinkRequest = (email: string) => {
  trackEvent('magic_link_requested', { email })
}

export const trackMagicLinkClick = (email: string) => {
  trackEvent('magic_link_clicked', { email })
}

export const trackUserSignIn = (userId: string, handle: string, isNewUser: boolean) => {
  identifyUser(userId, {
    handle,
    email: undefined, // Don't store email in properties for privacy
    signed_up_at: isNewUser ? new Date().toISOString() : undefined
  })

  trackEvent(isNewUser ? 'user_signed_up' : 'user_signed_in', {
    user_id: userId,
    handle
  })
}

export const trackUserSignOut = () => {
  trackEvent('user_signed_out')
  if (typeof window !== 'undefined') {
    posthog.reset()
  }
}

// Game events
export const trackGameStart = (timeControl: string, isRated: boolean, gameId: string) => {
  trackEvent('game_started', {
    time_control: timeControl,
    is_rated: isRated,
    game_id: gameId
  })
}

export const trackGameEnd = (gameId: string, result: string, duration: number) => {
  trackEvent('game_ended', {
    game_id: gameId,
    result, // 'win', 'loss', 'draw', 'abort'
    duration_seconds: Math.round(duration / 1000)
  })
}

export const trackQueueJoin = (timeControl: string, isRated: boolean) => {
  trackEvent('queue_joined', {
    time_control: timeControl,
    is_rated: isRated
  })
}

export const trackQueueLeave = (timeControl: string, waitTime: number) => {
  trackEvent('queue_left', {
    time_control: timeControl,
    wait_time_seconds: Math.round(waitTime / 1000)
  })
}

export default posthog
