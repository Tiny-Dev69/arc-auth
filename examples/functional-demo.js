// Single module approach demonstration for arc-auth
import { arcAuth } from 'arc-auth'
import { jwtPlugin } from 'arc-auth/plugins'

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
            email: 'demo@example.com',
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

async function demonstrateSingleModuleApproach() {
  console.log('📦 arc-auth Single Module Approach Demonstration')
  console.log('='.repeat(50))

  // Create auth provider using single module
  const auth = arcAuth({
    database: mockDb,
    secret: 'demo-secret-key-for-testing-purposes-only',
    plugins: [
      jwtPlugin({
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '30d',
        algorithm: 'HS256',
      }),
    ],
  })

  console.log('✅ Single module installation: npm install arc-auth')
  console.log('✅ Clean imports: import { arcAuth } from "arc-auth"')
  console.log('✅ Plugin imports: import { jwtPlugin } from "arc-auth/plugins"')
  console.log('✅ No multiple packages to manage')
  console.log('')

  // Demonstrate password hashing with Argon2
  console.log('🔐 Password Hashing with Argon2:')
  const password = 'mySecurePassword123!'
  const hashedPassword = await auth.hashPassword(password)
  console.log(`  Original: ${password}`)
  console.log(`  Argon2 Hash: ${hashedPassword.slice(0, 50)}...`)

  const isValid = await auth.verifyPassword(password, hashedPassword)
  console.log(`  Verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
  console.log('')

  // Demonstrate user registration
  console.log('👤 User Registration:')
  const registrationResult = await auth.signUp.email({
    email: 'demo@example.com',
    password: 'securePassword123!',
    emailVerified: false,
  })

  if (registrationResult.success) {
    console.log('✅ User registered successfully')
    console.log(`  User ID: ${registrationResult.data.user.id}`)
    console.log(`  Email: ${registrationResult.data.user.email}`)
    console.log(`  Access Token: ${registrationResult.data.accessToken.slice(0, 30)}...`)
    console.log(`  Refresh Token: ${registrationResult.data.refreshToken.slice(0, 30)}...`)
  } else {
    console.log('❌ Registration failed:', registrationResult.error.message)
  }
  console.log('')

  // Demonstrate user login
  console.log('🔑 User Login:')
  const loginResult = await auth.signIn.email({
    email: 'demo@example.com',
    password: 'securePassword123!',
  })

  if (loginResult.success) {
    console.log('✅ User logged in successfully')
    console.log(`  Access Token: ${loginResult.data.accessToken.slice(0, 30)}...`)
    console.log(`  Refresh Token: ${loginResult.data.refreshToken.slice(0, 30)}...`)
  } else {
    console.log('❌ Login failed:', loginResult.error.message)
  }
  console.log('')

  // Demonstrate security events
  console.log('🛡️ Security Event Monitoring:')
  auth.on('securityEvent', (event) => {
    console.log(`  📊 Security Event: ${event.type} at ${event.timestamp}`)
  })
  console.log('✅ Security event listener attached')
  console.log('')

  // Demonstrate schemas
  console.log('📋 Database Schemas:')
  const schemas = auth.getSchemas()
  const schemaNames = Object.keys(schemas)
  console.log(`  Available schemas: ${schemaNames.join(', ')}`)
  console.log('')

  console.log('🎯 Single Module Benefits:')
  console.log('  ✅ One package to install: npm install arc-auth')
  console.log('  ✅ Simple imports: import { arcAuth } from "arc-auth"')
  console.log('  ✅ Plugin imports: import { jwtPlugin } from "arc-auth/plugins"')
  console.log('  ✅ No dependency management between packages')
  console.log('  ✅ Better tree-shaking with bundlers')
  console.log('  ✅ Simpler version management')
  console.log('  ✅ Easier maintenance and updates')
  console.log('  ✅ Better developer experience')
  console.log('')

  console.log('🔧 Comparison with Multiple Packages:')
  console.log('  ❌ Before: npm install @arc-auth/core @arc-auth/jwt')
  console.log('  ❌ Before: import { arcAuth } from "@arc-auth/core"')
  console.log('  ❌ Before: import { jwtPlugin } from "@arc-auth/jwt"')
  console.log('  ✅ Now: npm install arc-auth')
  console.log('  ✅ Now: import { arcAuth } from "arc-auth"')
  console.log('  ✅ Now: import { jwtPlugin } from "arc-auth/plugins"')
  console.log('')

  console.log('🚀 Framework Usage Examples:')
  console.log('  Express:')
  console.log('    import { arcAuth } from "arc-auth"')
  console.log('    import { jwtPlugin } from "arc-auth/plugins"')
  console.log('    const auth = arcAuth({ plugins: [jwtPlugin()] })')
  console.log('')
  console.log('  Fastify:')
  console.log('    import { arcAuth } from "arc-auth"')
  console.log('    import { jwtPlugin } from "arc-auth/plugins"')
  console.log('    const auth = arcAuth({ plugins: [jwtPlugin()] })')
  console.log('')
  console.log('  Elysia:')
  console.log('    import { arcAuth } from "arc-auth"')
  console.log('    import { jwtPlugin } from "arc-auth/plugins"')
  console.log('    const auth = arcAuth({ plugins: [jwtPlugin()] })')
  console.log('')

  console.log('📊 Bundle Optimization:')
  console.log('  • Tree-shaking works better with single module')
  console.log('  • Bundlers can optimize imports more effectively')
  console.log('  • Smaller bundle sizes with unused code elimination')
  console.log('  • Better code splitting capabilities')
  console.log('')

  console.log('✨ Single module approach completed successfully!')
  console.log('='.repeat(50))
}

// Run the demonstration
demonstrateSingleModuleApproach().catch(console.error)
