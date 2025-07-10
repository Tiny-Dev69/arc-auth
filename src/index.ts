// Main arc-auth module entry point
export type {
  User,
  CreateUserData,
  SignInData,
  AuthResult,
  AuthProvider,
  ArcAuthConfig,
  Plugin,
  SecurityEvent,
  Logger,
  Settings,
  DrizzleDatabase,
} from '@/types/index.js'

export { createAuthProvider } from '@/core/index.js'
export { coreSchemas } from '@/core/schemas.js'
export { validateInput } from '@/utils/validation.js'
export { hashPassword, verifyPassword, generateSecret } from '@/utils/crypto.js'

import { createAuthProvider } from '@/core/index.js'
// Factory function for creating auth provider
import type { ArcAuthConfig } from '@/types/index.js'

export function arcAuth(config: ArcAuthConfig) {
  // Initialize default logger if none provided
  if (!config.logger) {
    config.logger = {
      info: (msg: string, meta?: unknown) => console.log(`[INFO] ${msg}`, meta),
      error: (msg: string, meta?: unknown) => console.error(`[ERROR] ${msg}`, meta),
      warn: (msg: string, meta?: unknown) => console.warn(`[WARN] ${msg}`, meta),
      debug: (msg: string, meta?: unknown) => console.debug(`[DEBUG] ${msg}`, meta),
    }
  }

  // Create the provider
  const provider = createAuthProvider(config)

  // Install plugins if provided
  if (config.plugins) {
    for (const plugin of config.plugins) {
      provider.use(plugin)
    }
  }

  return provider
}

// Export as default
export default arcAuth
