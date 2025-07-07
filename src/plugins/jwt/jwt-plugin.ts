import type { AuthProvider, Plugin, User } from '@/types/index.js'
// JWT Plugin implementation
import { and, eq } from 'drizzle-orm'
import { type JWTPayload, SignJWT, jwtVerify } from 'jose'
import { jwtSchemas, refreshTokens, tokenBlacklist } from './schemas.js'
import type {
  AccessTokenPayload,
  JWTMethods,
  JWTPluginConfig,
  RefreshTokenPayload,
  TokenPair,
} from './types.js'

/**
 * Create JWT plugin factory function
 */
export function createJWTPlugin(config: JWTPluginConfig): Plugin {
  const {
    accessTokenExpiry = '15m',
    refreshTokenExpiry = '30d',
    algorithm = 'HS256',
    issuer = 'arc-auth',
    audience = 'arc-auth-app',
    refreshTokenRotation = true,
    revokeRefreshTokenFamily = true,
  } = config

  return {
    name: 'jwt',
    version: '1.0.0',
    install: (provider: AuthProvider) => {
      // Get database and secret from provider config
      const database = (provider as any).database || config.database
      const secret = (provider as any).secret || config.secret

      if (!database || !secret) {
        throw new Error('JWT plugin requires database and secret configuration')
      }

      // Convert expiry strings to seconds
      const parseExpiry = (expiry: string): number => {
        const match = expiry.match(/^(\d+)([smhd])$/)
        if (!match) throw new Error(`Invalid expiry format: ${expiry}`)

        const value = Number.parseInt(match[1], 10)
        const unit = match[2]

        switch (unit) {
          case 's':
            return value
          case 'm':
            return value * 60
          case 'h':
            return value * 60 * 60
          case 'd':
            return value * 60 * 60 * 24
          default:
            throw new Error(`Invalid expiry unit: ${unit}`)
        }
      }

      const accessTokenExpirySeconds = parseExpiry(accessTokenExpiry)
      const refreshTokenExpirySeconds = parseExpiry(refreshTokenExpiry)

      // Generate tokens
      const generateTokens = async (user: User, tokenFamily?: string): Promise<TokenPair> => {
        const now = Math.floor(Date.now() / 1000)
        const accessTokenExp = now + accessTokenExpirySeconds
        const refreshTokenExp = now + refreshTokenExpirySeconds

        // Create access token
        const accessTokenPayload: AccessTokenPayload = {
          sub: user.id,
          email: user.email,
          iat: now,
          exp: accessTokenExp,
          iss: issuer,
          aud: audience,
        }

        const accessToken = await new SignJWT(accessTokenPayload)
          .setProtectedHeader({ alg: algorithm })
          .sign(new TextEncoder().encode(secret))

        // Create refresh token
        const refreshTokenPayload: RefreshTokenPayload = {
          sub: user.id,
          type: 'refresh',
          family: tokenFamily || crypto.randomUUID(),
          iat: now,
          exp: refreshTokenExp,
          iss: issuer,
          aud: audience,
        }

        const refreshToken = await new SignJWT(refreshTokenPayload)
          .setProtectedHeader({ alg: algorithm })
          .sign(new TextEncoder().encode(secret))

        // Store refresh token in database
        await database.query.insert(refreshTokens).values({
          id: crypto.randomUUID(),
          userId: user.id,
          token: refreshToken,
          family: refreshTokenPayload.family,
          expiresAt: new Date(refreshTokenExp * 1000),
          isRevoked: false,
        })

        return { accessToken, refreshToken }
      }

      // Verify access token
      const verifyAccessToken = async (
        token: string
      ): Promise<{ valid: boolean; payload?: AccessTokenPayload }> => {
        try {
          // Check if token is blacklisted
          const blacklistedTokens = await database.query
            .select()
            .from(tokenBlacklist)
            .where(eq(tokenBlacklist.token, token))
            .limit(1)

          if (blacklistedTokens.length > 0) {
            return { valid: false }
          }

          const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
          return { valid: true, payload: payload as AccessTokenPayload }
        } catch {
          return { valid: false }
        }
      }

      // Verify refresh token
      const verifyRefreshToken = async (
        token: string
      ): Promise<{ valid: boolean; payload?: RefreshTokenPayload }> => {
        try {
          const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
          const refreshPayload = payload as RefreshTokenPayload

          // Check if token exists and is not revoked
          const storedTokens = await database.query
            .select()
            .from(refreshTokens)
            .where(and(eq(refreshTokens.token, token), eq(refreshTokens.isRevoked, false)))
            .limit(1)

          if (storedTokens.length === 0) {
            return { valid: false }
          }

          return { valid: true, payload: refreshPayload }
        } catch {
          return { valid: false }
        }
      }

      // Refresh tokens
      const refreshTokens_ = async (
        refreshToken: string
      ): Promise<{ success: boolean; tokens?: TokenPair; error?: string }> => {
        const verification = await verifyRefreshToken(refreshToken)
        if (!verification.valid || !verification.payload) {
          return { success: false, error: 'Invalid refresh token' }
        }

        const { payload } = verification

        // Get user
        const users = await database.query
          .select()
          .from((provider as any).getSchemas().users)
          .where(eq((provider as any).getSchemas().users.id, payload.sub))
          .limit(1)

        if (users.length === 0) {
          return { success: false, error: 'User not found' }
        }

        const user = users[0]

        // Revoke old refresh token
        await database.query
          .update(refreshTokens)
          .set({ isRevoked: true })
          .where(eq(refreshTokens.token, refreshToken))

        // Generate new tokens
        const newTokens = await generateTokens(
          user,
          refreshTokenRotation ? crypto.randomUUID() : payload.family
        )

        // If refresh token rotation is disabled, keep the same family
        if (!refreshTokenRotation) {
          // Update the family for the new refresh token
          await database.query
            .update(refreshTokens)
            .set({ family: payload.family })
            .where(eq(refreshTokens.token, newTokens.refreshToken))
        }

        return { success: true, tokens: newTokens }
      }

      // Revoke refresh token
      const revokeRefreshToken = async (token: string): Promise<{ success: boolean }> => {
        try {
          const verification = await verifyRefreshToken(token)
          if (!verification.valid || !verification.payload) {
            return { success: false }
          }

          const { payload } = verification

          // Revoke the token
          await database.query
            .update(refreshTokens)
            .set({ isRevoked: true })
            .where(eq(refreshTokens.token, token))

          // If configured, revoke the entire token family
          if (revokeRefreshTokenFamily) {
            await database.query
              .update(refreshTokens)
              .set({ isRevoked: true })
              .where(eq(refreshTokens.family, payload.family))
          }

          return { success: true }
        } catch {
          return { success: false }
        }
      }

      // Blacklist access token
      const blacklistAccessToken = async (token: string): Promise<{ success: boolean }> => {
        try {
          const verification = await verifyAccessToken(token)
          if (!verification.valid || !verification.payload) {
            return { success: false }
          }

          const { payload } = verification

          // Add to blacklist
          await database.query.insert(tokenBlacklist).values({
            id: crypto.randomUUID(),
            token,
            expiresAt: new Date(payload.exp * 1000),
          })

          return { success: true }
        } catch {
          return { success: false }
        }
      }

      // Extend provider with JWT methods
      const jwtMethods: JWTMethods = {
        generateTokens,
        verifyAccessToken,
        verifyRefreshToken,
        refresh: refreshTokens_,
        revokeRefreshToken,
        blacklistAccessToken,
      }

      // Add JWT methods to provider
      Object.assign(provider, jwtMethods)

      // Override signUp to include tokens
      const originalSignUp = provider.signUp.email
      provider.signUp.email = async (data) => {
        const result = await originalSignUp(data)
        if (result.success) {
          const tokens = await generateTokens(result.data.user)
          result.data.accessToken = tokens.accessToken
          result.data.refreshToken = tokens.refreshToken
        }
        return result
      }

      // Override signIn to include tokens
      const originalSignIn = provider.signIn.email
      provider.signIn.email = async (data) => {
        const result = await originalSignIn(data)
        if (result.success) {
          const tokens = await generateTokens(result.data.user)
          result.data.accessToken = tokens.accessToken
          result.data.refreshToken = tokens.refreshToken
        }
        return result
      }

      // Override signOut to revoke tokens
      const originalSignOut = provider.signOut
      provider.signOut = async (token) => {
        if (token) {
          await blacklistAccessToken(token)
        }
        return originalSignOut(token)
      }

      // Override getUser to work with tokens
      provider.getUser = async (token) => {
        const verification = await verifyAccessToken(token)
        if (!verification.valid || !verification.payload) {
          return {
            success: false,
            error: {
              message: 'Invalid or expired token',
              code: 'INVALID_TOKEN',
            },
          }
        }

        const { payload } = verification

        // Get user from database
        const users = await database.query
          .select()
          .from((provider as any).getSchemas().users)
          .where(eq((provider as any).getSchemas().users.id, payload.sub))
          .limit(1)

        if (users.length === 0) {
          return {
            success: false,
            error: {
              message: 'User not found',
              code: 'USER_NOT_FOUND',
            },
          }
        }

        return {
          success: true,
          data: users[0],
        }
      }

      // Override middleware to use JWT
      provider.middleware.requireAuth = () => {
        return async (req: any, res: any, next: any) => {
          try {
            const authHeader = req.headers.authorization
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return res.status(401).json({
                error: 'Bearer token required',
                code: 'AUTH_REQUIRED',
              })
            }

            const token = authHeader.replace('Bearer ', '')
            const userResult = await provider.getUser(token)

            if (!userResult.success) {
              return res.status(401).json({
                error: userResult.error.message,
                code: userResult.error.code,
              })
            }

            req.user = userResult.data
            next()
          } catch (_error) {
            res.status(500).json({
              error: 'Internal server error',
              code: 'INTERNAL_ERROR',
            })
          }
        }
      }
    },
    getSchemas: () => jwtSchemas,
  }
}

/**
 * Convenience function for creating JWT plugin
 */
export function jwtPlugin(config: JWTPluginConfig = {}): Plugin {
  return createJWTPlugin(config)
}
