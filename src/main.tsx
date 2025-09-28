import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AudioProvider } from '@/audio/AudioProvider'
import App from '@/App'
import '@/index.css'
import { Buffer } from 'buffer'
import '@mysten/dapp-kit/dist/index.css'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { networkConfig } from '@/networkConfig'
import { TruskyProvider } from '@/trusky/TruskyProvider'

// Ensure Buffer exists in the browser for libraries expecting the Node global
if (!(globalThis as any).Buffer) {
  ;(globalThis as any).Buffer = Buffer
}

const queryClient = new QueryClient()

const AppTree = (
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <WalletProvider autoConnect>
        <TruskyProvider>
          <BrowserRouter>
            <AudioProvider>
              <App />
            </AudioProvider>
          </BrowserRouter>
        </TruskyProvider>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
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
