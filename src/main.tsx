import { Component, StrictMode, createElement, type ReactNode, useEffect, useState } from 'react'
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

  return createElement(
    'div',
    { className: 'debug-footer debug-footer--mounted' },
    createElement('span', null, `Build ${buildInfo.version}`),
    createElement('span', null, mounted ? 'Mounted' : 'Loading'),
    createElement('span', null, shouldEnableEruda ? 'Debug on' : 'Debug off'),
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('KINGSHALL EXCHANGE render error:', {
      error,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.error) {
      return createElement(
        'main',
        { className: 'runtime-error-shell' },
        createElement(
          'section',
          { className: 'runtime-error-card' },
          createElement('p', { className: 'runtime-error-eyebrow' }, 'Application error'),
          createElement('h1', null, 'Something went wrong while loading KINGSHALL EXCHANGE.'),
          createElement(
            'p',
            { className: 'runtime-error-text' },
            'The app hit a render issue. Here is the error message so you can debug it directly from the page.',
          ),
          createElement('pre', { className: 'runtime-error-box' }, this.state.error),
          createElement('div', { className: 'debug-footer' }, createElement('span', null, `Build ${buildInfo.version}`)),
        ),
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
  console.error('KINGSHALL EXCHANGE runtime error:', {
    error: event.error,
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error instanceof Error ? event.error.stack : undefined,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('KINGSHALL EXCHANGE unhandled rejection:', {
    reason: event.reason,
    name: event.reason instanceof Error ? event.reason.name : undefined,
    message: event.reason instanceof Error ? event.reason.message : String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
  })
})

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <DebugFooter />
    </ErrorBoundary>
  </StrictMode>,
)
