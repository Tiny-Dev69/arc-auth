import type {
  ArcAuthConfig,
  AuthProvider,
  AuthResult,
  CreateUserData,
  Plugin,
  SecurityEvent,
  SignInData,
  User,
} from '@/types/index.js'
import { signInSchema, signUpSchema, validateInput } from '@/utils/validation.js'
// Core authentication provider implementation
import { hash, verify } from 'argon2'
import { eq } from 'drizzle-orm'
import { coreSchemas } from './schemas.js'

/**
 * Hash a password using Argon2id
 */
async function hashPassword(password: string): Promise<string> {
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
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password)
  } catch {
    return false
  }
}

/**
 * Create the main authentication provider
 */
export function createAuthProvider(config: ArcAuthConfig): AuthProvider {
  const { database, logger } = config

  // Event system
  const eventListeners = new Map<string, Array<(data: any) => void>>()

  // Plugin system
  const plugins = new Map<string, Plugin>()
  const pluginSchemas = new Map<string, any>()

  // Event emitter
  function emit(event: string, data: any) {
    const listeners = eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        logger?.error('Event listener error', { event, error })
      }
    }
  }

  // Event listener
  function on(event: string, listener: (data: any) => void) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, [])
    }
    eventListeners.get(event)?.push(listener)
  }

  // Plugin installer
  function use(plugin: Plugin) {
    plugins.set(plugin.name, plugin)

    // Get plugin schemas
    if (plugin.getSchemas) {
      const schemas = plugin.getSchemas()
      for (const [name, schema] of Object.entries(schemas)) {
        pluginSchemas.set(name, schema)
      }
    }

    // Install plugin
    plugin.install(provider)

    logger?.info('Plugin installed', { name: plugin.name, version: plugin.version })
  }

  // Get all schemas (core + plugins)
  function getSchemas() {
    return {
      ...coreSchemas,
      ...Object.fromEntries(pluginSchemas),
    }
  }

  // User registration
  async function signUpEmail(
    data: CreateUserData
  ): Promise<AuthResult<{ user: User; accessToken: string; refreshToken: string }>> {
    try {
      // Validate input
      const validation = validateInput(signUpSchema, data)

      if (!validation.success) {
        return {
          success: false,
          error: {
            message: validation.error,
            code: 'VALIDATION_ERROR',
          },
        }
      }

      // Use validated data
      const validatedData = validation.data

      // Check if user already exists
      const existingUsers = await database.query
        .select()
        .from(coreSchemas.users)
        .where(eq(coreSchemas.users.email, validatedData.email))
        .limit(1)

      if (existingUsers.length > 0) {
        return {
          success: false,
          error: {
            message: 'User already exists',
            code: 'USER_EXISTS',
          },
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password)

      // Create user
      const newUsers = await database.query
        .insert(coreSchemas.users)
        .values({
          email: validatedData.email,
          password: hashedPassword,
          emailVerified: validatedData.emailVerified,
        })
        .returning()

      const user = newUsers[0]

      // Emit security event
      emit('securityEvent', {
        type: 'userRegistered',
        timestamp: new Date(),
        details: { userId: user.id, email: user.email },
      })

      // Return user (tokens will be added by JWT plugin)
      return {
        success: true,
        data: {
          user,
          accessToken: '', // Will be populated by JWT plugin
          refreshToken: '', // Will be populated by JWT plugin
        },
      }
    } catch (error) {
      logger?.error('Sign up error', error)
      return {
        success: false,
        error: {
          message: 'Failed to create user',
          code: 'SIGNUP_ERROR',
        },
      }
    }
  }

  // User login
  async function signInEmail(
    data: SignInData
  ): Promise<AuthResult<{ user: User; accessToken: string; refreshToken: string }>> {
    try {
      // Validate input
      const validation = validateInput(signInSchema, data)

      if (!validation.success) {
        return {
          success: false,
          error: {
            message: validation.error,
            code: 'VALIDATION_ERROR',
          },
        }
      }

      // Use validated data
      const validatedData = validation.data

      // Find user
      const users = await database.query
        .select()
        .from(coreSchemas.users)
        .where(eq(coreSchemas.users.email, validatedData.email))
        .limit(1)

      if (users.length === 0) {
        // Emit security event
        emit('securityEvent', {
          type: 'failedLogin',
          timestamp: new Date(),
          details: { email: validatedData.email, reason: 'user_not_found' },
        } as SecurityEvent)

        return {
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        }
      }

      const user = users[0]

      // Verify password
      if (!user.password) {
        return {
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        }
      }

      const isValidPassword = await verifyPassword(validatedData.password, user.password)

      if (!isValidPassword) {
        // Emit security event
        emit('securityEvent', {
          type: 'failedLogin',
          timestamp: new Date(),
          details: { userId: user.id, email: user.email, reason: 'invalid_password' },
        } as SecurityEvent)

        return {
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        }
      }

      // Emit security event
      emit('securityEvent', {
        type: 'successfulLogin',
        timestamp: new Date(),
        details: { userId: user.id, email: user.email },
      })

      // Return user (tokens will be added by JWT plugin)
      return {
        success: true,
        data: {
          user,
          accessToken: '', // Will be populated by JWT plugin
          refreshToken: '', // Will be populated by JWT plugin
        },
      }
    } catch (error) {
      logger?.error('Sign in error', error)
      return {
        success: false,
        error: {
          message: 'Failed to sign in',
          code: 'SIGNIN_ERROR',
        },
      }
    }
  }

  // Sign out
  async function signOut(_token?: string): Promise<AuthResult<void>> {
    try {
      // Basic sign out (extended by plugins)
      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      logger?.error('Sign out error', error)
      return {
        success: false,
        error: {
          message: 'Failed to sign out',
          code: 'SIGNOUT_ERROR',
        },
      }
    }
  }

  // Get user
  async function getUser(_token: string): Promise<AuthResult<User>> {
    try {
      // This will be extended by JWT plugin
      return {
        success: false,
        error: {
          message: 'Not implemented',
          code: 'NOT_IMPLEMENTED',
        },
      }
    } catch (error) {
      logger?.error('Get user error', error)
      return {
        success: false,
        error: {
          message: 'Failed to get user',
          code: 'GET_USER_ERROR',
        },
      }
    }
  }

  // Update user
  async function updateUser(id: string, data: Partial<User>): Promise<AuthResult<User>> {
    try {
      const updatedUsers = await database.query
        .update(coreSchemas.users)
        .set(data)
        .where(eq(coreSchemas.users.id, id))
        .returning()

      if (updatedUsers.length === 0) {
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
        data: updatedUsers[0],
      }
    } catch (error) {
      logger?.error('Update user error', error)
      return {
        success: false,
        error: {
          message: 'Failed to update user',
          code: 'UPDATE_USER_ERROR',
        },
      }
    }
  }

  // Delete user
  async function deleteUser(id: string): Promise<AuthResult<void>> {
    try {
      await database.query.delete(coreSchemas.users).where(eq(coreSchemas.users.id, id))

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      logger?.error('Delete user error', error)
      return {
        success: false,
        error: {
          message: 'Failed to delete user',
          code: 'DELETE_USER_ERROR',
        },
      }
    }
  }

  // Middleware
  function requireAuth() {
    return (_req: any, _res: any, _next: any) => {
      // This will be extended by JWT plugin
      throw new Error('Authentication middleware not implemented - install JWT plugin')
    }
  }

  // Create the provider
  const provider: AuthProvider = {
    // Core methods
    signUp: {
      email: signUpEmail,
    },
    signIn: {
      email: signInEmail,
    },
    signOut,
    getUser,
    updateUser,
    deleteUser,

    // Utility methods
    hashPassword,
    verifyPassword,

    // Plugin system
    use,
    getSchemas,

    // Middleware
    middleware: {
      requireAuth,
    },

    // Event system
    on,
    emit,
  }

  return provider
}
