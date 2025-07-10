// OAuth Plugin for arc-auth (placeholder)
// This will be implemented in future versions

export interface OAuthPluginConfig {
  providers?: {
    google?: { clientId: string; clientSecret: string }
    github?: { clientId: string; clientSecret: string }
    discord?: { clientId: string; clientSecret: string }
  }
  callbackUrl?: string
}

export function oauthPlugin(_config: OAuthPluginConfig = {}) {
  return {
    name: 'oauth',
    version: '1.0.0',
    install: (_provider: any) => {
      // TODO: Implement OAuth plugin
      console.warn('OAuth plugin is not yet implemented')
    },
    getSchemas: () => ({
      // TODO: Add OAuth schemas
    }),
  }
}
