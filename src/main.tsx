import { Component, StrictMode, type ReactNode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App'

declare global {
  interface Window {
    eruda?: {
      init: () => void
    }
  }
}

function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    }
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error))
    } catch {
      return String(error)
    }
  }

  return String(error)
}

function logError(scope: string, error: unknown, details: Record<string, unknown> = {}) {
  const payload = {
    scope,
    error: stringifyError(error),
    details,
    href: window.location.href,
    userAgent: window.navigator.userAgent,
    build: buildInfo.version,
    timestamp: new Date().toISOString(),
  }

  console.error(`KINGSHALL EXCHANGE ${scope}:`, payload)
}

function logDomErrorEvent(scope: string, event: ErrorEvent) {
  logError(scope, event.error ?? event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    defaultPrevented: event.defaultPrevented,
  })
}

const buildInfo = {
  version: '2026.09.09',
}

const shouldEnableEruda = new URLSearchParams(window.location.search).has('debug')

function DebugFooter() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!shouldEnableEruda) {
      return
    }

    let cancelled = false

    async function loadEruda() {
      try {
        const erudaScript = document.createElement('script')
        erudaScript.src = 'https://cdn.jsdelivr.net/npm/eruda@3.4.3/eruda.min.js'
        erudaScript.async = true
        erudaScript.onload = () => {
          if (cancelled) {
            return
          }

          if (window.eruda && typeof window.eruda.init === 'function') {
            window.eruda.init()
            console.info('Eruda enabled for KINGSHALL EXCHANGE debug mode')
          }
        }
        erudaScript.onerror = () => {
          console.error('Failed to load Eruda script')
        }
        document.body.appendChild(erudaScript)
      } catch (error) {
        console.error('KINGSHALL EXCHANGE eruda bootstrap failure:', {
          error,
          name: error instanceof Error ? error.name : undefined,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    }

    void loadEruda()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="debug-footer debug-footer--mounted">
      <span>Build {buildInfo.version}</span>
      <span>{mounted ? 'Mounted' : 'Loading'}</span>
      <span>{shouldEnableEruda ? 'Debug on' : 'Debug off'}</span>
    </div>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    logError('getDerivedStateFromError', error)
    return { error: error.message }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    logError('render error', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.error) {
      return (
        <main className="runtime-error-shell">
          <section className="runtime-error-card">
            <p className="runtime-error-eyebrow">Application error</p>
            <h1>Something went wrong while loading KINGSHALL EXCHANGE.</h1>
            <p className="runtime-error-text">
              The app hit a render issue. Here is the error message so you can debug it directly from the page.
            </p>
            <pre className="runtime-error-box">{this.state.error}</pre>
            <div className="debug-footer">
              <span>Build {buildInfo.version}</span>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found')
}

window.addEventListener('error', (event) => {
  logDomErrorEvent('runtime error', event)
})

window.addEventListener('unhandledrejection', (event) => {
  logError('unhandled rejection', event.reason, {
    promise: event.promise,
    defaultPrevented: event.defaultPrevented,
  })
})

function renderApp() {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
          <DebugFooter />
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (error) {
    logError('bootstrap render failure', error)
    throw error
  }
}

renderApp()
