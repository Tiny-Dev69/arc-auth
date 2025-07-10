import { z } from 'zod'

// Email validation
const emailSchema = z.string().email('Invalid email format')

// Password validation - secure by default
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Sign up validation
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  emailVerified: z.boolean().optional().default(false),
})

// Sign in validation
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Update user validation
export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    emailVerified: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

// User ID validation
export const userIdSchema = z.string().uuid('Invalid user ID format')

// Token validation
export const tokenSchema = z.string().min(1, 'Token is required')

// Export types
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => e.message).join(', ')
      return { success: false, error: message }
    }
    return { success: false, error: 'Validation failed' }
  }
}
