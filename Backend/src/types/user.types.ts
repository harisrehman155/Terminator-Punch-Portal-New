/**
 * User related types
 */

// Role enum type (kept for API compatibility)
export type UserRole = 'USER' | 'ADMIN';

/**
 * User database model (with FK columns)
 * This represents the actual database structure after enum-to-lookup migration.
 * Queries should JOIN with lookups table to populate the role string value.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  // New FK column (populated from lookups table)
  role_id: number;
  role: UserRole; // Joined from lookups table
  is_active: number;
  reset_token?: string | null;
  reset_token_expires?: Date | null;
  otp_code?: string | null;
  otp_expires?: Date | null;
  email_verified_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface UserUpdateInput {
  name?: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

/**
 * API response type (maintains backward compatibility with string enum value)
 */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  role: UserRole; // String value for API compatibility
  is_active: number;
  created_at: Date;
}
