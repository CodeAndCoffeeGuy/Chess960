'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export function PosthogDebug() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [distinctId, setDistinctId] = useState('')

  useEffect(() => {
    const checkPosthog = () => {
      if (posthog.__loaded) {
        setIsLoaded(true)
        setDistinctId(posthog.get_distinct_id())
      }
    }

    // Check immediately and then every 500ms
    checkPosthog()
    const interval = setInterval(checkPosthog, 500)

    return () => clearInterval(interval)
  }, [])

  const testEvent = () => {
    posthog.capture('debug_test_event', {
      test: true,
      timestamp: new Date().toISOString()
    })
    console.log('PostHog test event sent!')
  }

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#000',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>PostHog: {isLoaded ? 'Loaded' : 'Not loaded'}</div>
      <div>ID: {distinctId || 'None'}</div>
      <div>Key: {process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'Set' : 'Missing'}</div>
      <button onClick={testEvent} style={{
        background: '#333',
        color: '#fff',
        border: 'none',
        padding: '5px',
        borderRadius: '3px',
        marginTop: '5px',
        cursor: 'pointer'
      }}>
        Test Event
      </button>
    </div>
  )
}