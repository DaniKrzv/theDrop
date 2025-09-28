import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

import clsx from 'clsx'

import type { WalletWithRequiredFeatures } from '@mysten/wallet-standard'
import { ConnectButton, ConnectModal, useCurrentAccount } from '@mysten/dapp-kit'

type ConnectWalletButtonProps = {
  connectText?: ReactNode
  className?: string
  walletFilter?: (wallet: WalletWithRequiredFeatures) => boolean
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'>

export const ConnectWalletButton = ({
  connectText = 'Connect Wallet',
  className,
  onClick,
  walletFilter,
  ...buttonProps
}: ConnectWalletButtonProps) => {
  const currentAccount = useCurrentAccount()
  const [open, setOpen] = useState(false)

  if (currentAccount) {
    return (
      <ConnectButton
        {...buttonProps}
        className={className}
        onClick={onClick}
        walletFilter={walletFilter}
        connectText={connectText}
      />
    )
  }

  return (
    <ConnectModal
      open={open}
      onOpenChange={setOpen}
      walletFilter={walletFilter}
      trigger={
        <button
          type="button"
          {...buttonProps}
          onClick={(event) => {
            onClick?.(event)
          }}
          className={clsx(
            'rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-accent/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500',
            className,
          )}
        >
          {connectText}
        </button>
      }
    />
  )
}

export default ConnectWalletButton
