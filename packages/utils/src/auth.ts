import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface AuthPayload {
  userId: string;
  handle: string;
  email?: string;
  type: 'user' | 'guest';
  iat?: number;
  exp?: number;
}

// Ghost user concept for anonymous users
export const GHOST_USER_ID = 'ghost';
export const GHOST_USERNAME = 'Anonymous';

export type UserContext = {
  isAuth: boolean;
  userId?: string;
  username?: string;
  type?: 'guest' | 'user';
};

export interface MagicLinkPayload {
  email: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private jwtSecret: string;
  private magicLinkSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';
    this.magicLinkSecret = process.env.MAGICLINK_SECRET || 'dev-magic-secret';
    
    if (process.env.NODE_ENV === 'production') {
      if (this.jwtSecret === 'dev-jwt-secret' || this.magicLinkSecret === 'dev-magic-secret') {
        throw new Error('Production secrets not configured');
      }
    }
  }

  // Generate JWT token for authenticated user
  generateAuthToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '30d', // 30 days
    });
  }

  // Verify and decode JWT token
  verifyAuthToken(token: string): AuthPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Ensure we have an object and not a string
      if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
        console.error('JWT verification failed: Invalid token format');
        return null;
      }
      
      // Type guard to ensure we have the required properties
      const payload = decoded as any;
      if (!payload.userId || !payload.type) {
        console.error('JWT verification failed: Missing required properties');
        return null;
      }
      
      return payload as AuthPayload;
    } catch {
      // Avoid any error object access that could trigger instanceof checks
      console.error('JWT verification failed: Invalid or expired token');
      return null;
    }
  }

  // Generate magic link token for email authentication
  generateMagicLinkToken(email: string): string {
    const payload: MagicLinkPayload = { email };
    return jwt.sign(payload, this.magicLinkSecret, {
      expiresIn: '15m', // 15 minutes
    });
  }

  // Verify magic link token
  verifyMagicLinkToken(token: string): MagicLinkPayload | null {
    try {
      const decoded = jwt.verify(token, this.magicLinkSecret);
      
      // Ensure we have an object and not a string
      if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
        console.error('Magic link verification failed: Invalid token format');
        return null;
      }
      
      // Type guard to ensure we have the required properties
      const payload = decoded as any;
      if (!payload.email) {
        console.error('Magic link verification failed: Missing email property');
        return null;
      }
      
      return payload as MagicLinkPayload;
    } catch {
      // Avoid any error object access that could trigger instanceof checks
      console.error('Magic link verification failed: Invalid or expired token');
      return null;
    }
  }

  // Generate guest token (no email required)
  generateGuestToken(): string {
    const guestId = this.generateGuestId();
    const payload: Omit<AuthPayload, 'iat' | 'exp'> = {
      userId: guestId,
      handle: `Guest${guestId.replace(/-/g, '').slice(-6)}`,
      type: 'guest',
    };
    
    return this.generateAuthToken(payload);
  }

  // Generate unique guest ID
  private generateGuestId(): string {
    return crypto.randomUUID();
  }

  // Generate secure session ID
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash password
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  // Verify password
  verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // Generate email verification token
  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate email verification code (6 digits)
  generateEmailVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Generate magic link URL
  generateMagicLinkUrl(email: string, baseUrl: string): string {
    const token = this.generateMagicLinkToken(email);
    return `${baseUrl}/auth/verify?token=${token}`;
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7); // Remove 'Bearer ' prefix
  }

  // Check if user is authenticated (not guest)
  isAuthenticated(payload: AuthPayload): boolean {
    return payload.type === 'user';
  }

  // Check if user is guest
  isGuest(payload: AuthPayload): boolean {
    return payload.type === 'guest';
  }

  // Generate API key (for future API access)
  generateApiKey(): string {
    return `bch_${crypto.randomBytes(32).toString('hex')}`;
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

// Client-side safe JWT verification for guest tokens
export function verifyGuestTokenClientSide(token: string): { userId: string; type: string; handle?: string; email?: string } | null {
  try {
    console.log('[DEBUG] verifyGuestTokenClientSide called with token:', token?.substring(0, 50) + '...');
    
    // Simple JWT decode without verification for client-side use
    // This is safe for guest tokens as they don't contain sensitive data
    const parts = token.split('.');
    console.log('[DEBUG] JWT parts count:', parts.length);
    
    if (parts.length !== 3) {
      console.log('[DEBUG] Invalid JWT format - expected 3 parts, got:', parts.length);
      return null;
    }
    
    console.log('[DEBUG] Decoding payload part:', parts[1]);
    const payload = JSON.parse(atob(parts[1]));
    console.log('[DEBUG] Decoded payload:', payload);
    
    // Basic validation - accept both 'user' and 'guest' types
    if (!payload.userId || !payload.type || (payload.type !== 'guest' && payload.type !== 'user')) {
      console.log('[DEBUG] Payload validation failed:', {
        hasUserId: !!payload.userId,
        hasType: !!payload.type,
        typeValue: payload.type,
        expectedTypes: ['guest', 'user']
      });
      return null;
    }
    
    console.log('[DEBUG] Token validation successful');
    return {
      userId: payload.userId,
      type: payload.type,
      handle: payload.handle,
      email: payload.email
    };
  } catch (error) {
    console.log('[DEBUG] Error in verifyGuestTokenClientSide:', error);
    return null;
  }
}

export function verifyTokenClientSide(token: string): { userId: string; type: string; handle?: string; email?: string } | null {
  try {
    // Simple JWT decode without verification for client-side use
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Basic validation - accept both 'user' and 'guest' types
    if (!payload.userId || !payload.type || (payload.type !== 'guest' && payload.type !== 'user')) {
      return null;
    }
    return {
      userId: payload.userId,
      type: payload.type,
      handle: payload.handle,
      email: payload.email
    };
  } catch (error) {
    console.log('[DEBUG] Error in verifyTokenClientSide:', error);
    return null;
  }
}

// Function to clear auth token cookie
export function clearAuthToken(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    console.log('[DEBUG] Auth token cookie cleared');
  }
}

// Simple function to get user context from cookies
export function getUserContextFromCookies(): UserContext {
  if (typeof document === 'undefined') {
    // Server-side or no document available
    return { isAuth: false };
  }

  try {
    const authToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];


    if (!authToken) {
      return { isAuth: false };
    }

    const payload = verifyTokenClientSide(authToken);
    
    if (!payload) {
      return { isAuth: false };
    }

    return {
      isAuth: payload.type === 'user',
      userId: payload.userId,
      username: payload.handle || (payload.type === 'guest' ? GHOST_USERNAME : undefined),
      type: payload.type
    };
  } catch (error) {
    console.error('Error getting user context from cookies:', error);
    return { isAuth: false };
  }
}