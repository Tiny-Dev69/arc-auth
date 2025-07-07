// Main type definitions for arc-auth

// Database type (using any for now since Drizzle types are complex)
export type DrizzleDatabase = any

// User types
export interface User {
  id: string
  email: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  email: string
  password: string
  emailVerified?: boolean
}

export interface SignInData {
  email: string
  password: string
}

// Auth result types
export interface AuthSuccess<T = any> {
  success: true
  data: T
}

export interface AuthError {
  success: false
  error: {
    message: string
    code: string
  }
}

export type AuthResult<T = any> = AuthSuccess<T> | AuthError

// Security event types
export interface SecurityEvent {
  type:
    | 'userRegistered'
    | 'successfulLogin'
    | 'failedLogin'
    | 'suspiciousActivity'
    | 'multipleSessionsDetected'
    | 'unusualLocation'
    | 'tokenCompromised'
    | 'bruteForceAttempt'
  timestamp: Date
  details: Record<string, any>
  userId?: string
  ipAddress?: string
  userAgent?: string
}

// Logger interface
export interface Logger {
  info: (message: string, meta?: unknown) => void
  error: (message: string, meta?: unknown) => void
  warn: (message: string, meta?: unknown) => void
  debug: (message: string, meta?: unknown) => void
}

// Plugin interface
export interface Plugin {
  name: string
  version: string
  install: (provider: AuthProvider) => void | Promise<void>
  getSchemas?: () => Record<string, any>
}

// Settings interface
export interface Settings {
  enableApiLogs?: boolean
  enableSecurityLogs?: boolean
  corsOrigins?: string[]
  rateLimiting?: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
}

// Main auth provider interface
export interface AuthProvider {
  // Core methods
  signUp: {
    email: (
      data: CreateUserData
    ) => Promise<AuthResult<{ user: User; accessToken: string; refreshToken: string }>>
  }
  signIn: {
    email: (
      data: SignInData
    ) => Promise<AuthResult<{ user: User; accessToken: string; refreshToken: string }>>
  }
  signOut: (token?: string) => Promise<AuthResult<void>>
  getUser: (token: string) => Promise<AuthResult<User>>
  updateUser: (id: string, data: Partial<User>) => Promise<AuthResult<User>>
  deleteUser: (id: string) => Promise<AuthResult<void>>

  // Utility methods
  hashPassword: (password: string) => Promise<string>
  verifyPassword: (password: string, hash: string) => Promise<boolean>

  // Plugin system
  use: (plugin: Plugin) => void
  getSchemas: () => Record<string, any>

  // Middleware
  middleware: {
    requireAuth: () => (req: any, res: any, next: any) => void
  }

  // Event system
  on: (event: string, listener: (data: any) => void) => void
  emit: (event: string, data: any) => void

  // Extensions (added by plugins)
  [key: string]: any
}

// Main configuration interface
export interface ArcAuthConfig {
  database: DrizzleDatabase
  secret: string
  plugins?: Plugin[]
  settings?: Settings
  logger?: Logger
}
