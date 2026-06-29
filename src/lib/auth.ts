// Helpers de sessão para o gate de senha (cookie assinado, sem dependência de banco).
// Usa só Web Crypto (crypto.subtle) para funcionar tanto no Edge Runtime (middleware)
// quanto em Server Actions (Node).

const enc = new TextEncoder()
const dec = new TextDecoder()

function base64url(bytes: Uint8Array): string {
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const bin = atob(str)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/** Gera um token de sessão assinado, válido por maxAgeSeconds a partir de agora. */
export async function createSessionToken(secret: string, maxAgeSeconds: number): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds
  const payload = JSON.stringify({ exp })
  const payloadB64 = base64url(enc.encode(payload))
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64))
  const sigB64 = base64url(new Uint8Array(sig))
  return `${payloadB64}.${sigB64}`
}

/** Verifica assinatura e validade (expiração) de um token de sessão. */
export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts
  try {
    const key = await getKey(secret)
    const sig = base64urlToBytes(sigB64)
    const valid = await crypto.subtle.verify('HMAC', key, sig as BufferSource, enc.encode(payloadB64))
    if (!valid) return false
    const payload = JSON.parse(dec.decode(base64urlToBytes(payloadB64)))
    if (typeof payload.exp !== 'number') return false
    return Math.floor(Date.now() / 1000) < payload.exp
  } catch {
    return false
  }
}
