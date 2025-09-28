export const toHex = (data: ArrayBuffer | Uint8Array) => {
  const view = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const hashArrayBuffer = async (buffer: ArrayBuffer, algorithm: AlgorithmIdentifier = 'SHA-256') => {
  const digest = await crypto.subtle.digest(algorithm, buffer)
  return toHex(digest)
}

export const base64ToHex = (value: string) => Buffer.from(value, 'base64').toString('hex')

export const hexToUint8Array = (value: string) => new Uint8Array(Buffer.from(value.replace(/^0x/, ''), 'hex'))

export const toBase64 = (data: ArrayBuffer | Uint8Array) => {
  const view = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  return Buffer.from(view).toString('base64')
}
