# arc-auth

> **Modern, plugin-based authentication provider for APIs**

A cutting-edge, framework-agnostic authentication system designed for API-first applications. Built with TypeScript, powered by plugins, and compatible with both Bun and Node.js.

## ✨ Why arc-auth?

**Zero Bloat. Maximum Security. Pure Simplicity.**

- 🧩 **Plugin-Based Architecture** - Include only what you need
- 🚀 **Framework Agnostic** - Works with Elysia, Express, Fastify, and more
- 🔒 **Security First** - Built-in best practices and modern standards
- ⚡ **Runtime Flexible** - Runs on Bun, Node.js, Deno, and edge runtimes
- 📦 **Type Safe** - Full TypeScript support with runtime validation
- 🔧 **Developer Friendly** - Clean API inspired by better-auth

## 🚀 Quick Start

```bash
# Install core package
pnpm add @arc-auth/core

# Add plugins you need
pnpm add @arc-auth/jwt @arc-auth/sessions
```

```typescript
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'
import { drizzle } from 'drizzle-orm/postgres-js'

// Initialize with minimal config
const auth = arcAuth({
  database: drizzle(connectionString),
  secret: process.env.AUTH_SECRET,
  plugins: [
    jwtPlugin({
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '30d'
    })
  ]
})

// Use in any framework
app.post('/auth/login', async (req, res) => {
  const result = await auth.signIn.email({
    email: req.body.email,
    password: req.body.password
  })
  
  if (result.success) {
    res.json(result.data) // { accessToken, refreshToken, user }
  } else {
    res.status(400).json(result.error)
  }
})

// Protect routes
app.get('/me', auth.middleware.requireAuth(), (req, res) => {
  res.json({ user: req.user })
})
```

## 🏗️ Architecture

### Core Concept

arc-auth follows a **plugin-first architecture** where the core provides the foundation, and plugins add specific functionality:

```
@arc-auth/core          # Base provider + plugin system
├── @arc-auth/jwt       # JWT tokens with Jose
├── @arc-auth/sessions  # Multi-session management  
├── @arc-auth/2fa       # Two-factor authentication
├── @arc-auth/social    # OAuth providers
├── @arc-auth/email     # Email verification
└── @arc-auth/org       # Organizations & teams
```

### Plugin System

Each plugin extends the core API:

```typescript
// JWT Plugin adds token methods
auth.signIn.email()      // Returns JWT tokens
auth.refresh()           // Refresh access token
auth.signOut()           // Invalidate tokens

// Session Plugin adds session methods
auth.sessions.list()     // List user sessions
auth.sessions.revoke()   // Revoke specific session

// 2FA Plugin adds security methods
auth.twoFactor.setup()   // Setup TOTP
auth.twoFactor.verify()  // Verify 2FA code
```

## 🧩 Available Plugins

### Core Authentication

#### `@arc-auth/jwt` - JWT Token Authentication
```typescript
import { jwtPlugin } from '@arc-auth/jwt'

const auth = arcAuth({
  plugins: [
    jwtPlugin({
      accessTokenExpiry: '15m',    // Short-lived access tokens
      refreshTokenExpiry: '30d',   // Long-lived refresh tokens
      algorithm: 'HS256',          // JWT algorithm
      issuer: 'my-api',           // Token issuer
      audience: 'my-app',         // Token audience
      refreshTokenRotation: true  // Rotate refresh tokens
    })
  ]
})
```

**Features:**
- ✅ Access/Refresh token pair
- ✅ Automatic token rotation
- ✅ Token family tracking
- ✅ Secure token storage
- ✅ Built with Jose (industry standard)

#### `@arc-auth/sessions` - Multi-Session Management
```typescript
import { sessionsPlugin } from '@arc-auth/sessions'

const auth = arcAuth({
  plugins: [
    sessionsPlugin({
      maxConcurrentSessions: 5,   // Limit concurrent sessions
      sessionExpiry: '7d',        // Session lifetime
      trackDevices: true,         // Track device info
      enableMonitoring: true      // Monitor suspicious activity
    })
  ]
})
```

**Features:**
- ✅ Multiple concurrent sessions
- ✅ Device fingerprinting
- ✅ Geographic tracking
- ✅ Session monitoring
- ✅ Force logout capabilities

### Security & Verification

#### `@arc-auth/2fa` - Two-Factor Authentication
```typescript
import { twoFactorPlugin } from '@arc-auth/2fa'

const auth = arcAuth({
  plugins: [
    twoFactorPlugin({
      serviceName: 'MyApp',       // TOTP service name
      backupCodes: true,          // Generate backup codes
      smsProvider: 'twilio',      // SMS provider
      emailProvider: 'sendgrid'   // Email provider
    })
  ]
})
```

**Features:**
- ✅ TOTP (Google Authenticator, Authy)
- ✅ SMS/Email codes
- ✅ Backup codes
- ✅ Recovery options
- ✅ QR code generation

#### `@arc-auth/email` - Email Verification
```typescript
import { emailPlugin } from '@arc-auth/email'

const auth = arcAuth({
  plugins: [
    emailPlugin({
      provider: 'sendgrid',       // Email provider
      verificationExpiry: '24h',  // Link expiry
      templates: {               // Custom templates
        verification: 'verify-template',
        passwordReset: 'reset-template'
      }
    })
  ]
})
```

**Features:**
- ✅ Email verification
- ✅ Password reset
- ✅ Custom email templates
- ✅ Magic link authentication
- ✅ Multiple providers support

### Social & Enterprise

#### `@arc-auth/social` - OAuth Providers
```typescript
import { socialPlugin } from '@arc-auth/social'

const auth = arcAuth({
  plugins: [
    socialPlugin({
      providers: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        },
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET
        },
        discord: {
          clientId: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET
        }
      },
      callbackUrl: '/auth/callback'
    })
  ]
})
```

**Features:**
- ✅ 15+ OAuth providers
- ✅ Custom provider support
- ✅ Account linking
- ✅ Profile synchronization
- ✅ Scope management

#### `@arc-auth/org` - Organizations & Teams
```typescript
import { organizationPlugin } from '@arc-auth/org'

const auth = arcAuth({
  plugins: [
    organizationPlugin({
      enableTeams: true,          // Team support
      enableRoles: true,          // Role-based access
      enablePermissions: true,    // Fine-grained permissions
      maxMembersPerOrg: 100      // Organization limits
    })
  ]
})
```

**Features:**
- ✅ Multi-tenant organizations
- ✅ Team management
- ✅ Role-based access control (RBAC)
- ✅ Custom permissions
- ✅ Member invitations

## 🚀 Framework Integration

### Elysia (Bun)
```typescript
import { Elysia } from 'elysia'
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'

const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  plugins: [jwtPlugin()]
})

const app = new Elysia()
  .post('/auth/login', async ({ body }) => {
    return await auth.signIn.email(body)
  })
  .post('/auth/register', async ({ body }) => {
    return await auth.signUp.email(body)
  })
  .get('/me', async ({ headers }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    return await auth.getUser(token)
  }, {
    beforeHandle: auth.middleware.requireAuth()
  })
  .listen(3000)
```

### Express (Node.js)
```typescript
import express from 'express'
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'

const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  plugins: [jwtPlugin()]
})

const app = express()
app.use(express.json())

app.post('/auth/login', async (req, res) => {
  const result = await auth.signIn.email(req.body)
  res.json(result)
})

app.post('/auth/register', async (req, res) => {
  const result = await auth.signUp.email(req.body)
  res.json(result)
})

app.get('/me', auth.middleware.requireAuth(), (req, res) => {
  res.json({ user: req.user })
})

app.listen(3000)
```

### Fastify
```typescript
import fastify from 'fastify'
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'

const server = fastify()
const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  plugins: [jwtPlugin()]
})

server.post('/auth/login', async (request, reply) => {
  return await auth.signIn.email(request.body)
})

server.get('/me', {
  preHandler: auth.middleware.requireAuth()
}, async (request, reply) => {
  return { user: request.user }
})

server.listen({ port: 3000 })
```

### Hono (Edge Runtime)
```typescript
import { Hono } from 'hono'
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'

const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  plugins: [jwtPlugin()]
})

const app = new Hono()

app.post('/auth/login', async (c) => {
  const body = await c.req.json()
  return c.json(await auth.signIn.email(body))
})

app.get('/me', auth.middleware.requireAuth(), (c) => {
  return c.json({ user: c.get('user') })
})

export default app
```

## 🗄️ Database Setup

arc-auth uses Drizzle ORM for database operations. Each plugin provides its own schema that gets automatically merged.

### PostgreSQL Setup
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'

// Database connection
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// Initialize auth with database
const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  plugins: [jwtPlugin()]
})

// Get merged schemas from all plugins
const schemas = auth.getSchemas()

// Run migrations
await auth.migrate()
```

### Schema Structure
```sql
-- Core schemas (always included)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- JWT Plugin schemas
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  family TEXT,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions Plugin schemas  
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  device_id TEXT,
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2FA Plugin schemas
CREATE TABLE two_factor_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
AUTH_SECRET=your-super-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# JWT Plugin
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
JWT_ISSUER=my-api
JWT_AUDIENCE=my-app

# Sessions Plugin  
MAX_CONCURRENT_SESSIONS=5
SESSION_EXPIRY=7d
ENABLE_DEVICE_TRACKING=true

# 2FA Plugin
TWO_FA_SERVICE_NAME=MyApp
BACKUP_CODES_COUNT=10

# Email Plugin
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
EMAIL_FROM=noreply@myapp.com

# Social Plugin
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Advanced Configuration
```typescript
const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  
  // Global settings
  settings: {
    enableApiLogs: true,
    enableSecurityLogs: true,
    corsOrigins: ['http://localhost:3000'],
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 15 * 60 * 1000 // 15 minutes
    }
  },
  
  // Custom logger
  logger: {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
    debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta)
  },
  
  // Plugin configuration
  plugins: [
    jwtPlugin({
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '30d',
      algorithm: 'HS256',
      refreshTokenRotation: true,
      revokeRefreshTokenFamily: true
    }),
    
    sessionsPlugin({
      maxConcurrentSessions: 5,
      sessionExpiry: '7d',
      trackDevices: true,
      enableMonitoring: true,
      suspiciousActivityThreshold: 3
    }),
    
    twoFactorPlugin({
      serviceName: 'MyApp',
      backupCodes: true,
      codeLength: 6,
      window: 1 // TOTP window tolerance
    })
  ]
})
```

## 🔒 Security Features

### Built-in Security Measures
- **Password Hashing** - Bcrypt with configurable rounds
- **Rate Limiting** - Per-user and per-IP rate limiting
- **CSRF Protection** - Cross-site request forgery protection
- **SQL Injection Protection** - Drizzle ORM with prepared statements
- **XSS Prevention** - Input sanitization and validation
- **Brute Force Protection** - Account lockout after failed attempts

### Token Security
- **Short-lived Access Tokens** - 15-minute default expiry
- **Secure Refresh Tokens** - Long-lived with rotation
- **Token Family Tracking** - Detect token theft
- **Automatic Revocation** - Revoke compromised token families
- **Device Fingerprinting** - Track token usage by device

### Session Security
- **Multi-session Tracking** - Monitor all user sessions
- **Geographic Validation** - Detect unusual login locations
- **Device Recognition** - Track known/unknown devices
- **Concurrent Session Limits** - Prevent account sharing
- **Force Logout** - Admin ability to terminate sessions

## 📊 Monitoring & Analytics

### Security Events
```typescript
// Listen to security events
auth.on('securityEvent', (event) => {
  console.log('Security Event:', event)
  // Log to your monitoring system
})

// Available events:
// - 'failedLogin'
// - 'suspiciousActivity'
// - 'multipleSessionsDetected'
// - 'unusualLocation'
// - 'tokenCompromised'
// - 'bruteForceAttempt'
```

### Usage Analytics
```typescript
// Get user statistics
const stats = await auth.analytics.getUserStats(userId)
// Returns: { 
//   totalLogins: 145,
//   lastLogin: Date,
//   activeSessions: 2,
//   devicesUsed: 3,
//   loginLocations: ['US', 'CA']
// }

// Get system-wide analytics
const systemStats = await auth.analytics.getSystemStats()
// Returns: {
//   totalUsers: 1250,
//   activeUsers: 450,
//   activeSessions: 890,
//   securityEvents: 12
// }
```

## 🧪 Testing

### Unit Tests
```typescript
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'
import { createMockDatabase } from '@arc-auth/testing'

describe('Authentication', () => {
  let auth: ReturnType<typeof arcAuth>
  
  beforeEach(() => {
    auth = arcAuth({
      database: createMockDatabase(),
      secret: 'test-secret',
      plugins: [jwtPlugin()]
    })
  })
  
  it('should sign in user with valid credentials', async () => {
    const result = await auth.signIn.email({
      email: 'test@example.com',
      password: 'password123'
    })
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('accessToken')
    expect(result.data).toHaveProperty('refreshToken')
  })
})
```

### Integration Tests
```typescript
import { request } from 'supertest'
import { createTestApp } from './helpers/testApp'

describe('Auth API', () => {
  let app: any
  
  beforeEach(() => {
    app = createTestApp()
  })
  
  it('should authenticate user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200)
    
    expect(response.body).toHaveProperty('accessToken')
  })
})
```

## 📚 Migration Guide

### From better-auth
```typescript
// Before (better-auth)
import { betterAuth } from 'better-auth'

const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true
  }
})

// After (arc-auth)
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'

const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  plugins: [jwtPlugin()]
})
```

### From Auth0
```typescript
// Before (Auth0 SDK)
import { ManagementClient } from 'auth0'

const auth0 = new ManagementClient({
  domain: 'your-domain.auth0.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
})

// After (arc-auth)
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin, socialPlugin } from '@arc-auth/jwt'

const auth = arcAuth({
  database: db,
  secret: process.env.AUTH_SECRET,
  plugins: [
    jwtPlugin(),
    socialPlugin({
      providers: {
        auth0: {
          domain: 'your-domain.auth0.com',
          clientId: 'your-client-id',
          clientSecret: 'your-client-secret'
        }
      }
    })
  ]
})
```

## 🚀 Deployment

### Docker
```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package*.json ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "start"]
```

### Railway
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "bun start",
    "healthcheckPath": "/health"
  }
}
```

### Vercel (Edge Runtime)
```typescript
// api/auth/[...auth].ts
import { arcAuth } from '@arc-auth/core'
import { jwtPlugin } from '@arc-auth/jwt'
import { createEdgeHandler } from '@arc-auth/vercel'

const auth = arcAuth({
  database: createEdgeDB(process.env.DATABASE_URL),
  secret: process.env.AUTH_SECRET,
  plugins: [jwtPlugin()]
})

export default createEdgeHandler(auth)
export const config = {
  runtime: 'edge'
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/arc-auth.git
cd arc-auth

# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build packages
pnpm build
```

### Creating a Plugin
```typescript
import { Plugin } from '@arc-auth/core'

export class MyCustomPlugin extends Plugin {
  name = 'my-custom-plugin'
  version = '1.0.0'
  
  async install(provider: AuthProvider) {
    // Extend the provider
    provider.api.myCustomMethod = this.myCustomMethod.bind(this)
  }
  
  getSchemas() {
    return {
      myCustomTable: myCustomTableSchema
    }
  }
  
  async myCustomMethod(data: any) {
    // Custom functionality
  }
}
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Documentation](https://arc-auth.dev)
- [GitHub](https://github.com/yourusername/arc-auth)
- [NPM](https://npmjs.com/package/@arc-auth/core)
- [Discord Community](https://discord.gg/arc-auth)
- [Twitter](https://twitter.com/arc_auth)

---

**Built with ❤️ by the arc-auth team**