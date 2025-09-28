const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export const isNetworkChangedError = (error: unknown) => {
  if (!(error instanceof Error)) return false
  const parts: string[] = []
  if (error.message) {
    parts.push(error.message.toLowerCase())
  }
  const cause = (error as { cause?: unknown }).cause
  if (cause instanceof Error && cause.message) {
    parts.push(cause.message.toLowerCase())
  }
  const combined = parts.join(' ')
  return combined.includes('err_network_changed') || combined.includes('network changed')
}

export const withNetworkRetry = async <T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> => {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (!isNetworkChangedError(error) || attempt === attempts) {
        throw error
      }
      const waitMs = attempt * 500
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[thedrop] Tusky ${label} retry after network change (attempt ${attempt + 1}/${attempts})`)
      }
      await delay(waitMs)
    }
  }
  throw lastError
}

export type NetworkRetriable = typeof withNetworkRetry

const hasStatusCode = (error: unknown): error is { statusCode?: number; message?: string } =>
  Boolean(error && typeof error === 'object' && 'statusCode' in error)

export const isTuskyLockedError = (error: unknown) => hasStatusCode(error) && error.statusCode === 423

export const tuskyLockedMessage = (action: string) =>
  `Impossible de ${action} : Tusky indique que ce wallet est verrouillé ou non autorisé pour cet environnement. Contactez l'équipe Tusky ou utilisez un wallet approuvé.`

export const rethrowIfTuskyLocked = (error: unknown, action: string): never => {
  if (isTuskyLockedError(error)) {
    throw new Error(tuskyLockedMessage(action))
  }
  throw error instanceof Error ? error : new Error(`Tusky a échoué durant ${action}`)
}
