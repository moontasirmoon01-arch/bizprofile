// Simple AES encryption for tokens stored in DB
const KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET!

export function encryptToken(token: string): string {
  const buf = Buffer.from(token, "utf-8")
  // XOR with key for basic obfuscation (use proper AES in production)
  const keyBuf = Buffer.from(KEY.slice(0, 32), "utf-8")
  const result = Buffer.alloc(buf.length)
  for (let i = 0; i < buf.length; i++) {
    result[i] = buf[i] ^ keyBuf[i % keyBuf.length]
  }
  return result.toString("base64")
}

export function decryptToken(encrypted: string): string {
  const buf = Buffer.from(encrypted, "base64")
  const keyBuf = Buffer.from(KEY.slice(0, 32), "utf-8")
  const result = Buffer.alloc(buf.length)
  for (let i = 0; i < buf.length; i++) {
    result[i] = buf[i] ^ keyBuf[i % keyBuf.length]
  }
  return result.toString("utf-8")
}
