'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Button from '@/components/base/Button'

const isDev = process.env.NODE_ENV === 'development'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    !isDev && Sentry.captureException(error)
  }, [error])

  return (
    <main className="container error-page">
      <h1>Internal Server Error</h1>
      <Button onClick={() => window.location.reload()}>Try Again</Button>
    </main>
  )
}
