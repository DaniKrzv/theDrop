import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { Tusky } from '@tusky-io/ts-sdk/web'
import type { SignPersonalMessage } from '@tusky-io/ts-sdk/web'
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit'

const resolveTuskyEnv = () => {
  const raw = import.meta.env.VITE_TRUSKY_ENV?.toString().toLowerCase()
  if (!raw) return undefined
  if (raw.startsWith('prod')) return 'prod'
  if (raw.startsWith('dev')) return 'dev'
  if (raw.startsWith('local')) return 'local'
  return undefined
}

const tuskyEnv = resolveTuskyEnv()

type TruskyContextValue = {
  tusky: Tusky | null
  isConnected: boolean
  isConnecting: boolean
  connectedAddress: string | null
  error: string | null
  connect: () => Promise<Tusky>
  disconnect: () => Promise<void>
}

const missingProviderError = async () => {
  throw new Error('useTrusky must be used within a TruskyProvider')
}

const TruskyContext = createContext<TruskyContextValue>({
  tusky: null,
  isConnected: false,
  isConnecting: false,
  connectedAddress: null,
  error: null,
  connect: missingProviderError,
  disconnect: async () => {
    await missingProviderError()
  },
})

export const TruskyProvider = ({ children }: PropsWithChildren) => {
  const account = useCurrentAccount()
  const { mutate: suiSignPersonalMessage } = useSignPersonalMessage()

  const [tusky, setTusky] = useState<Tusky | null>(null)
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signWithWallet = useCallback<SignPersonalMessage>(
    ({ message }, callbacks) => {
      if (!account) {
        callbacks.onError(new Error('No Sui wallet connected'))
        return
      }

      suiSignPersonalMessage(
        { message, account },
        {
          onSuccess: ({ signature }) => callbacks.onSuccess({ signature }),
          onError: (err) => {
            callbacks.onError(err instanceof Error ? err : new Error('Failed to sign message'))
          },
        },
      )
    },
    [account, suiSignPersonalMessage],
  )

  const disconnect = useCallback(async () => {
    setError(null)
    if (!tusky) return

    try {
      await tusky.signOut()
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[thedrop] Trusky signOut failed', err)
      }
    } finally {
      setTusky(null)
      setConnectedAddress(null)
    }
  }, [tusky])

  const connect = useCallback(async () => {
    if (!account) {
      const noAccountError = new Error('Connect a Sui wallet before linking Trusky')
      setError(noAccountError.message)
      throw noAccountError
    }

    if (tusky && connectedAddress === account.address) {
      return tusky
    }

    setIsConnecting(true)
    try {
      const walletAccount = {
        address: account.address,
        publicKey: new Uint8Array(account.publicKey),
      }

      if (tusky && connectedAddress && connectedAddress !== walletAccount.address) {
        await tusky.signOut().catch(() => undefined)
        setTusky(null)
        setConnectedAddress(null)
      }

      const tuskyClient = new Tusky({
        env: tuskyEnv,
        wallet: {
          account: walletAccount,
          signPersonalMessage: signWithWallet,
        },
      })

      await tuskyClient.auth.signIn()

      setTusky(tuskyClient)
      setConnectedAddress(walletAccount.address)
      setError(null)

      return tuskyClient
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Trusky'
      setTusky(null)
      setConnectedAddress(null)
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setIsConnecting(false)
    }
  }, [account, connectedAddress, signWithWallet, tusky])

  useEffect(() => {
    if (!account) {
      void disconnect()
    }
  }, [account, disconnect])

  const value = useMemo<TruskyContextValue>(
    () => ({
      tusky,
      isConnected: Boolean(tusky),
      isConnecting,
      connectedAddress,
      error,
      connect,
      disconnect,
    }),
    [connect, connectedAddress, disconnect, error, isConnecting, tusky],
  )

  return <TruskyContext.Provider value={value}>{children}</TruskyContext.Provider>
}

export const useTrusky = () => useContext(TruskyContext)

