import { useState } from 'react'

import clsx from 'clsx'

import { useCurrentAccount } from '@mysten/dapp-kit'

import { useTrusky } from '@/trusky/TruskyProvider'

type TruskyConnectButtonProps = {
  className?: string
}

export const TruskyConnectButton = ({ className }: TruskyConnectButtonProps) => {
  const account = useCurrentAccount()
  const { connect, disconnect, isConnected, isConnecting, connectedAddress, error } = useTrusky()
  const [localError, setLocalError] = useState<string | null>(null)

  const walletReady = Boolean(account)
  const pending = isConnecting
  const statusText = pending
    ? 'Connexion à Trusky…'
    : isConnected
      ? 'Trusky connecté'
      : 'Connecter Trusky'

  const handleClick = async () => {
    setLocalError(null)
    if (pending) return

    try {
      if (isConnected) {
        await disconnect()
        return
      }
      await connect()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion à Trusky impossible'
      setLocalError(message)
    }
  }

  const disableConnect = (!walletReady && !isConnected) || pending
  const helperText = localError ?? error

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disableConnect}
        className={clsx(
          'rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-accent/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500',
          isConnected && !pending && 'border-emerald-400/60 text-emerald-300 hover:border-emerald-300 hover:text-emerald-200',
          pending && 'opacity-80',
          className,
        )}
      >
        {statusText}
      </button>
      {connectedAddress && isConnected && !pending && (
        <span className="text-[11px] text-emerald-300">
          {connectedAddress.slice(0, 6)}…{connectedAddress.slice(-4)}
        </span>
      )}
      {helperText && <span className="text-[11px] text-rose-400">{helperText}</span>}
      {!walletReady && !isConnected && !pending && (
        <span className="text-[11px] text-slate-400">Connectez un wallet Sui d&apos;abord</span>
      )}
    </div>
  )
}

export default TruskyConnectButton

