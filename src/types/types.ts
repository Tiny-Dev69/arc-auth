import type { SQL } from 'drizzle-orm'

// Core User Types
export interface User {
  id: string
  email: string
  emailVerified: boolean
  password?: string
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

// Authentication Results
export interface AuthSuccess<T = unknown> {
  success: true
  data: T
}

export interface AuthError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type AuthResult<T = unknown> = AuthSuccess<T> | AuthError

// Plugin System
export interface Plugin {
  name: string
  version: string
  install(provider: AuthProvider): Promise<void> | void
  getSchemas?(): Record<string, unknown>
  getMigrations?(): string[]
}

export interface PluginConfig {
  [key: string]: unknown
}

// Database Types
export interface DatabaseAdapter {
  query: unknown // Drizzle database instance
}

// Core Configuration
export interface ArcAuthConfig {
  database: DatabaseAdapter
  secret: string
  plugins?: Plugin[]
  settings?: {
    enableApiLogs?: boolean
    enableSecurityLogs?: boolean
    corsOrigins?: string[]
    rateLimiting?: {
      enabled: boolean
      maxRequests: number
      windowMs: number
    }
  }
  logger?: {
    info: (msg: string, meta?: unknown) => void
    error: (msg: string, meta?: unknown) => void
    warn: (msg: string, meta?: unknown) => void
    debug: (msg: string, meta?: unknown) => void
  }
}

// Security Events
export interface SecurityEvent {
  type:
    | 'failedLogin'
    | 'suspiciousActivity'
    | 'multipleSessionsDetected'
    | 'unusualLocation'
    | 'tokenCompromised'
    | 'bruteForceAttempt'
  userId?: string
  ip?: string
  userAgent?: string
  timestamp: Date
  details?: unknown
}

// Middleware Types
export interface AuthRequest {
  headers: Record<string, string | undefined>
  body?: unknown
  user?: User
}

export interface AuthMiddleware {
  requireAuth(): (req: AuthRequest, res?: unknown, next?: unknown) => Promise<void> | void
}

// Main Provider Interface
export interface AuthProvider {
  // Core authentication methods
  signUp: {
    email(data: CreateUserData): Promise<AuthResult<{ user: User }>>
  }
  signIn: {
    email(data: SignInData): Promise<AuthResult<{ user: User }>>
  }
  signOut(token?: string): Promise<AuthResult<{ success: boolean }>>

  // User management
  getUser(identifier: string): Promise<User | null>
  updateUser(id: string, data: Partial<User>): Promise<AuthResult<{ user: User }>>
  deleteUser(id: string): Promise<AuthResult<{ success: boolean }>>

  // Utility methods
  hashPassword(password: string): Promise<string>
  verifyPassword(password: string, hash: string): Promise<boolean>

  // Plugin and schema management
  use(plugin: Plugin): void
  getSchemas(): Record<string, unknown>
  migrate(): Promise<void>

  // Middleware
  middleware: AuthMiddleware

  // Events
  on(event: 'securityEvent', handler: (event: SecurityEvent) => void): void
  emit(event: 'securityEvent', data: SecurityEvent): void
}

// Validation Schemas
export interface ValidationSchemas {
  signUp: unknown
  signIn: unknown
  updateUser: unknown
}
