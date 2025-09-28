import { useEffect, useRef, useState } from 'react'

import type { WalletWithRequiredFeatures } from '@mysten/wallet-standard'
import {
  useConnectWallet,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useWallets,
} from '@mysten/dapp-kit'

const truncateAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

export const WalletControls = () => {
  const wallets = useWallets()
  const currentAccount = useCurrentAccount()
  const walletState = useCurrentWallet()
  const connectMutation = useConnectWallet()
  const disconnectMutation = useDisconnectWallet()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      window.addEventListener('mousedown', handleClickAway)
    }

    return () => window.removeEventListener('mousedown', handleClickAway)
  }, [isMenuOpen])

  useEffect(() => {
    setError(null)
  }, [walletState.connectionStatus])

  const isBusy = walletState.isConnecting || connectMutation.isPending || disconnectMutation.isPending
  const activeWalletName = walletState.currentWallet?.name
  const address = currentAccount?.address

  const handleConnect = async (wallet: WalletWithRequiredFeatures) => {
    setError(null)
    try {
      await connectMutation.mutateAsync({ wallet })
      setIsMenuOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion impossible'
      setError(message)
    }
  }

  const handleDisconnect = async () => {
    setError(null)
    try {
      await disconnectMutation.mutateAsync()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Déconnexion impossible'
      setError(message)
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col items-end gap-1 text-sm">
      {walletState.isConnected && address ? (
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-soft backdrop-blur">
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Wallet
          </span>
          <div className="flex flex-col text-xs text-slate-200">
            <span className="font-semibold text-white">{activeWalletName ?? 'Sui Wallet'}</span>
            <span className="text-slate-400">{truncateAddress(address)}</span>
          </div>
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={isBusy}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-rose-400/60 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
          >
            {disconnectMutation.isPending ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-accent/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-400"
          >
            {walletState.isConnecting || connectMutation.isPending ? 'Connexion…' : 'Connecter un wallet'}
          </button>
          {isMenuOpen && !walletState.isConnecting && !connectMutation.isPending && (
            <div className="absolute right-0 top-full z-30 mt-3 w-64 rounded-2xl border border-white/10 bg-slate-900/90 p-2 text-slate-100 shadow-2xl backdrop-blur-xl">
              {wallets.length === 0 ? (
                <div className="space-y-2 px-1 py-2 text-[11px] leading-relaxed text-slate-300">
                  <p>Aucun wallet Sui détecté.</p>
                  <p>
                    Installez une extension compatible (Sui Wallet, Ethos, Suiet…) puis rechargez la page.
                  </p>
                </div>
              ) : (
                <>
                  <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Choisir un wallet
                  </p>
                  {wallets.map((wallet) => (
                    <button
                      key={wallet.id ?? wallet.name}
                      type="button"
                      onClick={() => handleConnect(wallet)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-white/10"
                    >
                      <span>{wallet.name}</span>
                      {walletState.currentWallet?.name === wallet.name && (
                        <span className="text-[10px] uppercase tracking-widest text-emerald-400">Actif</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
    </div>
  )
}

export default WalletControls
