import { query, queryOne } from '../config/database';
import { User, UserCreateInput, UserUpdateInput, UserResponse } from '../types/user.types';
import { hashPassword } from '../utils/password';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { getLookupId } from '../utils/lookup.helper';

/**
 * User Model - Database operations
 */

/**
 * Find user by email
 */
export const findByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await queryOne<User>(
      `SELECT
        u.*,
        l.lookup_value as role
      FROM users u
      LEFT JOIN lookups l ON u.role_id = l.id
      WHERE u.email = ?`,
      [email]
    );
    return user;
  } catch (error) {
    throw new DatabaseError('Failed to find user by email');
  }
};

/**
 * Find user by ID
 */
export const findById = async (id: number): Promise<User | null> => {
  try {
    const user = await queryOne<User>(
      `SELECT
        u.*,
        l.lookup_value as role
      FROM users u
      LEFT JOIN lookups l ON u.role_id = l.id
      WHERE u.id = ?`,
      [id]
    );
    return user;
  } catch (error) {
    throw new DatabaseError('Failed to find user by ID');
  }
};

/**
 * Create new user
 */
export const create = async (userData: UserCreateInput): Promise<User> => {
  try {
    const hashedPassword = await hashPassword(userData.password);

    // Get role_id for USER role
    const roleId = await getLookupId('user_role', 'USER');
    if (!roleId) {
      throw new DatabaseError('USER role not found in lookup table');
    }

    const result: any = await query(
      `INSERT INTO users (name, email, password_hash, company, phone, address, city, country, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userData.name,
        userData.email,
        hashedPassword,
        userData.company || null,
        userData.phone || null,
        userData.address || null,
        userData.city || null,
        userData.country || null,
        roleId,
      ]
    );

    const userId = result.insertId;
    const user = await findById(userId);

    if (!user) {
      throw new DatabaseError('Failed to retrieve created user');
    }

    return user;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DatabaseError('Email already exists');
    }
    throw new DatabaseError('Failed to create user');
  }
};

/**
 * Update user profile
 */
export const update = async (
  userId: number,
  userData: UserUpdateInput
): Promise<User> => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.name !== undefined) {
      updates.push('name = ?');
      values.push(userData.name);
    }
    if (userData.company !== undefined) {
      updates.push('company = ?');
      values.push(userData.company);
    }
    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      values.push(userData.phone);
    }
    if (userData.address !== undefined) {
      updates.push('address = ?');
      values.push(userData.address);
    }
    if (userData.city !== undefined) {
      updates.push('city = ?');
      values.push(userData.city);
    }
    if (userData.country !== undefined) {
      updates.push('country = ?');
      values.push(userData.country);
    }

    if (updates.length === 0) {
      const user = await findById(userId);
      if (!user) throw new NotFoundError('User not found');
      return user;
    }

    values.push(userId);

    await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const user = await findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  } catch (error) {
    throw new DatabaseError('Failed to update user');
  }
};

/**
 * Update user password
 */
export const updatePassword = async (
  userId: number,
  newPassword: string
): Promise<void> => {
  try {
    const hashedPassword = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );
  } catch (error) {
    throw new DatabaseError('Failed to update password');
  }
};

/**
 * Set OTP for password reset
 */
export const setOTP = async (
  userId: number,
  otpCode: string,
  otpExpiry: Date
): Promise<void> => {
  try {
    await query(
      'UPDATE users SET otp_code = ?, otp_expires = ?, updated_at = NOW() WHERE id = ?',
      [otpCode, otpExpiry, userId]
    );
  } catch (error) {
    throw new DatabaseError('Failed to set OTP');
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (email: string, otpCode: string): Promise<User | null> => {
  try {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires > NOW()',
      [email, otpCode]
    );
    return user;
  } catch (error) {
    throw new DatabaseError('Failed to verify OTP');
  }
};

/**
 * Clear OTP after verification
 */
export const clearOTP = async (userId: number): Promise<void> => {
  try {
    await query(
      'UPDATE users SET otp_code = NULL, otp_expires = NULL, updated_at = NOW() WHERE id = ?',
      [userId]
    );
  } catch (error) {
    throw new DatabaseError('Failed to clear OTP');
  }
};

/**
 * Set password reset token
 */
export const setResetToken = async (
  userId: number,
  resetToken: string,
  resetTokenExpires: Date
): Promise<void> => {
  try {
    await query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = NOW() WHERE id = ?',
      [resetToken, resetTokenExpires, userId]
    );
  } catch (error) {
    throw new DatabaseError('Failed to set reset token');
  }
};

/**
 * Find user by reset token
 */
export const findByResetToken = async (resetToken: string): Promise<User | null> => {
  try {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [resetToken]
    );
    return user;
  } catch (error) {
    throw new DatabaseError('Failed to find user by reset token');
  }
};

/**
 * Clear reset token
 */
export const clearResetToken = async (userId: number): Promise<void> => {
  try {
    await query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = ?',
      [userId]
    );
  } catch (error) {
    throw new DatabaseError('Failed to clear reset token');
  }
};

/**
 * Get all users (admin only)
 */
export const findAll = async (): Promise<User[]> => {
  try {
    const users = await query<User[]>(
      `SELECT
        u.*,
        l.lookup_value as role
      FROM users u
      LEFT JOIN lookups l ON u.role_id = l.id
      ORDER BY u.created_at DESC`
    );
    return users;
  } catch (error) {
    throw new DatabaseError('Failed to retrieve users');
  }
};

/**
 * Toggle user active status (admin only)
 */
export const toggleActiveStatus = async (userId: number): Promise<User> => {
  try {
    await query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?',
      [userId]
    );

    const user = await findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  } catch (error) {
    throw new DatabaseError('Failed to toggle user status');
  }
};

/**
 * Convert User to UserResponse (remove sensitive data)
 */
export const toUserResponse = (user: User): UserResponse => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
    phone: user.phone,
    address: user.address,
    city: user.city,
    country: user.country,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  };
};
