/**
 * Authentication configuration skeleton
 * 
 * Sprint 0: Structure only
 * Implementation: Auth.js v5 (NextAuth)
 * 
 * Roles (from IA_MAP v1.2):
 * - guest: Token-based, single reservation access
 * - owner: Authenticated, own apartment(s)
 * - manager: Authenticated, full system access
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type UserRole = 'owner' | 'manager';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  ownerId?: string; // Present if role is 'owner'
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: AuthUser;
  }
  interface User extends AuthUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends AuthUser {}
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ============================================
// AUTH CONFIGURATION
// ============================================

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        // TODO: Implement actual user lookup and password verification
        // This is a skeleton - actual implementation in Sprint 1+
        
        // Placeholder: Return null (no auth yet)
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT token on sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.ownerId = user.ownerId;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose role to client via session
      session.user = {
        id: token.id as string,
        email: token.email as string,
        role: token.role as UserRole,
        ownerId: token.ownerId as string | undefined,
      };
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null | undefined, requiredRole: UserRole): boolean {
  if (!user) return false;
  
  // Manager has access to everything
  if (user.role === 'manager') return true;
  
  // Owner only has access to owner-level routes
  return user.role === requiredRole;
}

/**
 * Check if user is manager
 */
export function isManager(user: AuthUser | null | undefined): boolean {
  return user?.role === 'manager';
}

/**
 * Check if user is owner
 */
export function isOwner(user: AuthUser | null | undefined): boolean {
  return user?.role === 'owner' || user?.role === 'manager';
}
