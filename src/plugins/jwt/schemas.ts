import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Refresh Tokens Table
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References users.id
  token: text('token').unique().notNull(),
  family: text('family').notNull(), // Token family for rotation tracking
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Token Blacklist for immediate revocation
export const tokenBlacklist = pgTable('token_blacklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').unique().notNull(),
  type: text('type').notNull(), // 'access' or 'refresh'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations would be defined with users table from core
// This will be merged with core schemas

// Export schemas for plugin
export const jwtSchemas = {
  refreshTokens,
  tokenBlacklist,
}

export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
export type TokenBlacklist = typeof tokenBlacklist.$inferSelect
export type NewTokenBlacklist = typeof tokenBlacklist.$inferInsert
