import { audioFormatToMoveDiscriminant, type AudioFormat } from '@/utils/audioFormats'
import { hashArrayBuffer, toHex } from '@/utils/crypto'

const DEFAULT_BASE_URL = import.meta.env.VITE_TRUSKY_API_URL?.replace(/\/$/, '')

export type TruskyZkLoginProof = {
  proofPoints: {
    a: string[]
    b: string[][]
    c: string[]
  }
  issBase64Details: {
    value: string
    indexMod4: number
  }
  headerBase64: string
}

export type TruskyZkLoginPayload = {
  proof: TruskyZkLoginProof
  maxEpoch: number
  randomness: string
  salt: string
  extendedEphemeralPublicKey: string
  jwt: string
  addressSeed: string
  aud: string
  iss: string
  sub: string
}

export type TruskyWalletSession = {
  address: string
  publicKey: string
  signMessage: (payload: Uint8Array) => Promise<`0x${string}`>
  authToken?: string
  walletType?: 'standard' | 'zklogin'
  zkLogin?: TruskyZkLoginPayload
}

export type TruskyPublishMetadata = {
  title: string
  artist: string
  album: string
  durationMs: number
  format: AudioFormat
  coverDataUrl?: string
}

export type TruskyPublishRequest = {
  file: File
  session: TruskyWalletSession
  metadata: TruskyPublishMetadata
  signal?: AbortSignal
}

export type TruskyUploadResponse = {
  vaultId: string
  contentUrl: string
  walrusCid?: string
  contentHash: string
  taskId?: string
}

class TruskyError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TruskyError'
    this.status = status
  }
}

const encoder = new TextEncoder()

const resolveBaseUrl = () => {
  if (!DEFAULT_BASE_URL) {
    throw new TruskyError('Trusky API URL not configured. Set VITE_TRUSKY_API_URL in your environment.')
  }
  return DEFAULT_BASE_URL
}

const buildSignedPayload = (hash: string) => encoder.encode(`Trusky::WalrusUpload::${hash}`)

export const publishAudioAsset = async ({ file, session, metadata, signal }: TruskyPublishRequest): Promise<TruskyUploadResponse> => {
  const baseUrl = resolveBaseUrl()
  const fileBuffer = await file.arrayBuffer()
  const digestHex = await hashArrayBuffer(fileBuffer)
  const message = buildSignedPayload(digestHex)
  const signature = await session.signMessage(message)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('address', session.address)
  formData.append('publicKey', session.publicKey)
  formData.append('signature', signature)
  formData.append('message', toHex(message))
  formData.append('hash', digestHex)
  formData.append('formatCode', `${audioFormatToMoveDiscriminant[metadata.format]}`)
  formData.append('metadata', JSON.stringify(metadata))
  if (session.walletType) {
    formData.append('walletType', session.walletType)
  }
  if (session.zkLogin) {
    formData.append('zkLogin', JSON.stringify(session.zkLogin))
  }

  const response = await fetch(`${baseUrl}/walrus/audio`, {
    method: 'POST',
    body: formData,
    headers: session.authToken ? { Authorization: `Bearer ${session.authToken}` } : undefined,
    signal,
  })

  if (!response.ok) {
    let messageText = `Publication failed with status ${response.status}`
    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        messageText = errorJson.message
      }
    } catch {
      // ignore JSON parsing error
    }
    throw new TruskyError(messageText, response.status)
  }

  const payload = (await response.json()) as {
    vaultId: string
    contentUrl: string
    walrusCid?: string
    taskId?: string
    contentHash?: string
  }

  if (!payload?.vaultId || !payload?.contentUrl) {
    throw new TruskyError('Unexpected response from Trusky upload endpoint')
  }

  return {
    vaultId: payload.vaultId,
    contentUrl: payload.contentUrl,
    walrusCid: payload.walrusCid,
    taskId: payload.taskId,
    contentHash: payload.contentHash ?? digestHex,
  }
}
