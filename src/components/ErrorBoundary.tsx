import { Component } from 'react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          <p className="font-semibold text-red-300">Une erreur est survenue</p>
          <p className="mt-2 text-red-200/90">
            {this.state.error?.message || 'Erreur inconnue. Consultez la console pour plus de détails.'}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
