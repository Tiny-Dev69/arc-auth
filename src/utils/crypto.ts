// Crypto utilities for arc-auth
import { hash, verify } from 'argon2'

/**
 * Hash a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    type: 2, // Argon2id
    memoryCost: 2 ** 16, // 64MB
    timeCost: 3, // 3 iterations
    parallelism: 1, // 1 thread
  })
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password)
  } catch {
    return false
  }
}

/**
 * Generate a random string for secrets
 */
export function generateSecret(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
