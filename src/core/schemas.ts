import { relations } from 'drizzle-orm'
import { boolean, inet, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Core Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  password: text('password'), // Optional for social auth
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Security Events Log
export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(), // 'failedLogin', 'suspiciousActivity', etc.
  userId: uuid('user_id').references(() => users.id),
  ip: inet('ip_address'),
  userAgent: text('user_agent'),
  location: jsonb('location'), // Geographic data
  details: jsonb('details'), // Additional event data
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

// Rate Limiting Table
export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(), // IP or user ID
  type: text('type').notNull(), // 'login', 'api', etc.
  count: text('count').notNull(),
  windowStart: timestamp('window_start').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  securityEvents: many(securityEvents),
}))

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
}))

// Export all schemas for merging with plugin schemas
export const coreSchemas = {
  users,
  securityEvents,
  rateLimits,
}

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type SecurityEvent = typeof securityEvents.$inferSelect
export type NewSecurityEvent = typeof securityEvents.$inferInsert
