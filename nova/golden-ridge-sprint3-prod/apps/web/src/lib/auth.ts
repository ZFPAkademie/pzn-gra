/**
 * Authentication Types
 * 
 * Production v1: Simple cookie-based admin auth
 * See: admin-auth.ts for implementation
 * 
 * Future: NextAuth integration for owner/manager roles
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type UserRole = 'owner' | 'manager';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  ownerId?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null | undefined, requiredRole: UserRole): boolean {
  if (!user) return false;
  if (user.role === 'manager') return true;
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
