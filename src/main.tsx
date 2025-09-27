import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AudioProvider } from '@/audio/AudioProvider'
import App from '@/App'
import '@/index.css'
import { Buffer } from 'buffer'

// Ensure Buffer exists in the browser for libraries expecting the Node global
if (!(globalThis as any).Buffer) {
  ;(globalThis as any).Buffer = Buffer
}

const AppTree = (
  <BrowserRouter>
    <AudioProvider>
      <App />
    </AudioProvider>
  </BrowserRouter>
)

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.error('[thedrop] Global error captured', event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    // eslint-disable-next-line no-console
    console.error('[thedrop] Unhandled promise rejection', event.reason)
  })
}

createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV ? AppTree : <StrictMode>{AppTree}</StrictMode>,
)
