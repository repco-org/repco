import { base32 } from 'multiformats/bases/base32'
import { sha256 } from 'multiformats/hashes/sha2'

export async function createHash(data: string | Uint8Array): Promise<string> {
  if (typeof data === 'string') data = new TextEncoder().encode(data)
  const hash = await sha256.digest(data)
  return base32.encode(hash.bytes)
}

export async function createJsonHash(data: any): Promise<string> {
  data = JSON.stringify(data)
  if (typeof data === 'string') data = new TextEncoder().encode(data)
  const hash = await sha256.digest(data)
  return base32.encode(hash.bytes)
}
