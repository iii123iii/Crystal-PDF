import React from 'react'
import type { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component that catches React errors and prevents app crashes.
 * Displays a user-friendly error message with retry option.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, info)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.retry) || (
          <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
            <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-2 text-lg font-bold text-red-600">Something went wrong</h2>
              <p className="mb-4 text-sm text-gray-600">{this.state.error.message}</p>
              <button
                onClick={this.retry}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
