import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import {
  publishAudioAsset,
  type TruskyPublishRequest,
  type TruskyUploadResponse,
  type TruskyWalletSession,
} from '@/services/truskyClient'

type PublishArgs = Omit<TruskyPublishRequest, 'session'>

type TruskyContextValue = {
  session: TruskyWalletSession | null
  isConnected: boolean
  setSession: (session: TruskyWalletSession | null) => void
  publishAudio?: (args: PublishArgs) => Promise<TruskyUploadResponse>
}

const TruskyContext = createContext<TruskyContextValue>({
  session: null,
  isConnected: false,
  setSession: () => {
    /* noop */
  },
})

export const TruskyProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<TruskyWalletSession | null>(null)

  const publishAudio = useCallback(
    async (args: PublishArgs) => {
      if (!session) {
        throw new Error('Wallet not connected to Trusky')
      }
      return publishAudioAsset({ ...args, session })
    },
    [session],
  )

  const value = useMemo<TruskyContextValue>(
    () => ({
      session,
      isConnected: Boolean(session),
      setSession,
      publishAudio: session ? publishAudio : undefined,
    }),
    [publishAudio, session],
  )

  return <TruskyContext.Provider value={value}>{children}</TruskyContext.Provider>
}

export const useTrusky = () => useContext(TruskyContext)

export type { TruskyWalletSession } from '@/services/truskyClient'

