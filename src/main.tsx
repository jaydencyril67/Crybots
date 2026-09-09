import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('KINGSHALL EXCHANGE render error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="runtime-error-shell">
          <section className="runtime-error-card">
            <p className="runtime-error-eyebrow">Application error</p>
            <h1>Something went wrong while loading KINGSHALL EXCHANGE.</h1>
            <p className="runtime-error-text">
              The app hit a render issue. Here is the error message so you can debug it
              directly from the page.
            </p>
            <pre className="runtime-error-box">{this.state.error}</pre>
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
  console.error('KINGSHALL EXCHANGE runtime error:', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('KINGSHALL EXCHANGE unhandled rejection:', event.reason)
})

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
