// Social Authentication Library
// Handles OAuth authentication for various social platforms

export interface SocialAuthConfig {
  redirectUri: string;
  scope?: string;
  state?: string;
}

export interface SocialAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  userId: string;
  username?: string;
  email?: string;
  avatar?: string;
}

export interface SocialAuthProvider {
  id: string;
  name: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  scopes: string[];
}

export const socialAuth = {
  // Get authorization URL for OAuth flow
  async getAuthUrl(provider: string, config: SocialAuthConfig): Promise<string> {
    const providers: Record<string, SocialAuthProvider> = {
      facebook: {
        id: 'facebook',
        name: 'Facebook',
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        userInfoUrl: 'https://graph.facebook.com/v18.0/me',
        clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID || '',
        scopes: ['public_profile', 'email']
      },
      instagram: {
        id: 'instagram',
        name: 'Instagram',
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        userInfoUrl: 'https://graph.instagram.com/v18.0/me',
        clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID || '',
        scopes: ['user_profile', 'user_media']
      },
      twitter: {
        id: 'twitter',
        name: 'Twitter',
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        userInfoUrl: 'https://api.twitter.com/2/users/me',
        clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
        scopes: ['tweet.read', 'users.read']
      },
      spotify: {
        id: 'spotify',
        name: 'Spotify',
        authUrl: 'https://accounts.spotify.com/authorize',
        tokenUrl: 'https://accounts.spotify.com/api/token',
        userInfoUrl: 'https://api.spotify.com/v1/me',
        clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
        scopes: ['user-read-private', 'user-read-email']
      },
      github: {
        id: 'github',
        name: 'GitHub',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
        scopes: ['user:email', 'read:user']
      },
      google: {
        id: 'google',
        name: 'Google',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        scopes: ['openid', 'profile', 'email']
      },
      apple: {
        id: 'apple',
        name: 'Apple',
        authUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        userInfoUrl: 'https://appleid.apple.com/auth/user',
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
        scopes: ['name', 'email']
      },
      twitch: {
        id: 'twitch',
        name: 'Twitch',
        authUrl: 'https://id.twitch.tv/oauth2/authorize',
        tokenUrl: 'https://id.twitch.tv/oauth2/token',
        userInfoUrl: 'https://api.twitch.tv/helix/users',
        clientId: import.meta.env.VITE_TWITCH_CLIENT_ID || '',
        scopes: ['user:read:email', 'user:read:follows']
      }
    };

    const providerConfig = providers[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope || providerConfig.scopes.join(' '),
      state: config.state || Math.random().toString(36).substring(7)
    });

    return `${providerConfig.authUrl}?${params.toString()}`;
  },

  // Exchange authorization code for access token
  async exchangeCode(provider: string, code: string): Promise<SocialAuthTokens> {
    // This would typically make a server-side request
    // For demo purposes, we'll return mock data
    return {
      accessToken: 'mock_access_token_' + Math.random().toString(36),
      refreshToken: 'mock_refresh_token_' + Math.random().toString(36),
      expiresIn: 3600,
      userId: 'user_' + Math.random().toString(36),
      username: 'demo_user',
      email: 'demo@example.com',
      avatar: 'https://ui-avatars.com/api/?name=demo_user&background=random'
    };
  },

  // Get user info from provider
  async getUserInfo(provider: string, accessToken: string): Promise<any> {
    // This would typically make a server-side request to the provider's API
    // For demo purposes, we'll return mock data
    return {
      id: 'user_' + Math.random().toString(36),
      username: 'demo_user',
      email: 'demo@example.com',
      avatar: 'https://ui-avatars.com/api/?name=demo_user&background=random'
    };
  }
};
