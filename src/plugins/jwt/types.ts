import type { User } from '@/types/index.js'

// JWT Plugin Configuration
export interface JWTPluginConfig {
  accessTokenExpiry?: string // e.g., '15m', '1h', '1d'
  refreshTokenExpiry?: string // e.g., '30d', '7d'
  algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512'
  issuer?: string
  audience?: string
  refreshTokenRotation?: boolean // Whether to rotate refresh tokens
  revokeRefreshTokenFamily?: boolean // Whether to revoke entire token family on compromise
  database?: any // Optional database override
  secret?: string // Optional secret override
}

// Token Payloads
export interface AccessTokenPayload {
  sub: string // User ID
  email: string
  iat: number // Issued at
  exp: number // Expires at
  iss: string // Issuer
  aud: string // Audience
  [key: string]: any // Allow additional properties
}

export interface RefreshTokenPayload {
  sub: string // User ID
  type: 'refresh'
  family: string // Token family ID
  iat: number // Issued at
  exp: number // Expires at
  iss: string // Issuer
  aud: string // Audience
  [key: string]: any // Allow additional properties
}

// Token Pair
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// JWT Methods added to provider
export interface JWTMethods {
  generateTokens: (user: User, tokenFamily?: string) => Promise<TokenPair>
  verifyAccessToken: (token: string) => Promise<{ valid: boolean; payload?: AccessTokenPayload }>
  verifyRefreshToken: (token: string) => Promise<{ valid: boolean; payload?: RefreshTokenPayload }>
  refresh: (
    refreshToken: string
  ) => Promise<{ success: boolean; tokens?: TokenPair; error?: string }>
  revokeRefreshToken: (token: string) => Promise<{ success: boolean }>
  blacklistAccessToken: (token: string) => Promise<{ success: boolean }>
}
