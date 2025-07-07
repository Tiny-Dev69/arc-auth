import { arcAuth } from 'arc-auth'
import { jwtPlugin } from 'arc-auth/plugins'
// Express example using arc-auth single module approach
import express from 'express'

// Mock database for demonstration
const mockDb = {
  query: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => [],
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => [
          {
            id: '1',
            email: 'test@example.com',
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => [{}],
        }),
      }),
    }),
    delete: () => ({
      where: () => ({}),
    }),
  },
}

// Initialize arc-auth with single module approach
const auth = arcAuth({
  database: mockDb,
  secret: 'your-super-secret-key-here-make-it-long-and-random',
  plugins: [
    jwtPlugin({
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '30d',
      algorithm: 'HS256',
      issuer: 'arc-auth-example',
      audience: 'arc-auth-app',
      refreshTokenRotation: true,
      revokeRefreshTokenFamily: true,
    }),
  ],
  settings: {
    enableApiLogs: true,
    enableSecurityLogs: true,
    corsOrigins: ['http://localhost:3000'],
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
  },
})

const app = express()
app.use(express.json())

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    approach: 'single-module',
  })
})

// Authentication endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      })
    }

    const result = await auth.signUp.email({
      email,
      password,
      emailVerified: false,
    })

    if (result.success) {
      res.status(201).json({
        message: 'User registered successfully',
        data: result.data,
      })
    } else {
      res.status(400).json({
        error: result.error.message,
        code: result.error.code,
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      })
    }

    const result = await auth.signIn.email({
      email,
      password,
    })

    if (result.success) {
      res.json({
        message: 'Login successful',
        data: result.data,
      })
    } else {
      res.status(401).json({
        error: result.error.message,
        code: result.error.code,
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      })
    }

    // JWT plugin extends the auth provider with refresh method
    const result = await auth.refresh(refreshToken)

    if (result.success) {
      res.json({
        message: 'Token refreshed successfully',
        data: result.data,
      })
    } else {
      res.status(401).json({
        error: result.error,
      })
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

app.post('/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    const result = await auth.signOut(token)

    if (result.success) {
      res.json({
        message: 'Logout successful',
      })
    } else {
      res.status(400).json({
        error: 'Logout failed',
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

// Protected endpoints
app.get('/me', auth.middleware.requireAuth(), async (req, res) => {
  try {
    res.json({
      message: 'User profile retrieved successfully',
      user: req.user,
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

app.get('/protected', auth.middleware.requireAuth(), (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
    timestamp: new Date().toISOString(),
  })
})

// User management endpoints
app.put('/users/:id', auth.middleware.requireAuth(), async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const result = await auth.updateUser(id, updateData)

    if (result.success) {
      res.json({
        message: 'User updated successfully',
        data: result.data,
      })
    } else {
      res.status(400).json({
        error: result.error.message,
        code: result.error.code,
      })
    }
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

app.delete('/users/:id', auth.middleware.requireAuth(), async (req, res) => {
  try {
    const { id } = req.params

    const result = await auth.deleteUser(id)

    if (result.success) {
      res.json({
        message: 'User deleted successfully',
      })
    } else {
      res.status(400).json({
        error: result.error.message,
        code: result.error.code,
      })
    }
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

// Security monitoring
auth.on('securityEvent', (event) => {
  console.log('🔒 Security Event:', {
    type: event.type,
    timestamp: event.timestamp,
    details: event.details,
  })
})

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)

  if (err.message.includes('Bearer token required')) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    })
  }

  if (err.message.includes('Invalid or expired token')) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    })
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log('🚀 arc-auth Express Example Server Started')
  console.log('='.repeat(50))
  console.log(`🌐 Server running on http://localhost:${PORT}`)
  console.log('📦 Using single module approach (like better-auth)')
  console.log('🔐 Argon2 password hashing enabled')
  console.log('🎫 JWT tokens with Jose library')
  console.log('📊 Security event monitoring enabled')
  console.log('='.repeat(50))
  console.log('')
  console.log('📚 Available Endpoints:')
  console.log('  GET  /health          - Health check')
  console.log('  POST /auth/register   - User registration')
  console.log('  POST /auth/login      - User login')
  console.log('  POST /auth/refresh    - Refresh tokens')
  console.log('  POST /auth/logout     - User logout')
  console.log('  GET  /me              - Get user profile (protected)')
  console.log('  GET  /protected       - Protected route example')
  console.log('  PUT  /users/:id       - Update user (protected)')
  console.log('  DELETE /users/:id     - Delete user (protected)')
  console.log('')
  console.log('🔧 Import Examples:')
  console.log('  import { arcAuth } from "arc-auth"')
  console.log('  import { jwtPlugin } from "arc-auth/plugins"')
  console.log('')
  console.log('🎯 Features Demonstrated:')
  console.log('  ✅ Single module installation (npm install arc-auth)')
  console.log('  ✅ Clean imports (no multiple packages)')
  console.log('  ✅ Functional architecture (no classes)')
  console.log('  ✅ Argon2 password hashing')
  console.log('  ✅ JWT tokens with Jose')
  console.log('  ✅ Token refresh and rotation')
  console.log('  ✅ Security event monitoring')
  console.log('  ✅ Middleware-based protection')
  console.log('  ✅ Comprehensive error handling')
  console.log('='.repeat(50))
})
