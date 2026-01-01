import * as UserModel from '../models/user.model';
import { UserCreateInput } from '../types/user.types';
import { comparePassword } from '../utils/password';
import { generateToken } from '../config/jwt';
import { generateOTP, getOTPExpiry } from '../utils/helpers';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';

/**
 * Auth Service - Business logic for authentication
 */

/**
 * Register new user
 */
export const register = async (userData: UserCreateInput) => {
  // Check if email already exists
  const existingUser = await UserModel.findByEmail(userData.email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Create user
  const user = await UserModel.create(userData);

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Return user data and token (exclude password)
  return {
    user: UserModel.toUserResponse(user),
    token,
  };
};

/**
 * Login user
 */
export const login = async (email: string, password: string) => {
  // Find user by email
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new UnauthorizedError('Account is deactivated. Please contact support.');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Return user data and token
  return {
    user: UserModel.toUserResponse(user),
    token,
  };
};

/**
 * Forgot password - Send OTP
 */
export const forgotPassword = async (email: string) => {
  // Find user by email
  const user = await UserModel.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not (security)
    return {
      message: 'If the email exists, an OTP has been sent',
    };
  }

  // Generate OTP
  const otpCode = generateOTP(6);
  const otpExpiry = getOTPExpiry(10); // 10 minutes

  // Save OTP to database
  await UserModel.setOTP(user.id, otpCode, otpExpiry);

  // TODO: Send OTP via email
  // await sendOTPEmail(user.email, otpCode);

  // For development, log OTP (remove in production!)
  if (process.env.NODE_ENV === 'development') {
    console.log(`OTP for ${email}: ${otpCode}`);
  }

  return {
    message: 'OTP sent to your email',
    // In development, include OTP in response
    ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
  };
};

/**
 * Verify OTP
 */
export const verifyOTP = async (email: string, otpCode: string) => {
  // Verify OTP
  const user = await UserModel.verifyOTP(email, otpCode);
  if (!user) {
    throw new BadRequestError('Invalid or expired OTP');
  }

  // Clear OTP after successful verification
  await UserModel.clearOTP(user.id);

  // Generate temporary token for password reset
  const resetToken = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    message: 'OTP verified successfully',
    resetToken,
  };
};

/**
 * Reset password
 */
export const resetPassword = async (
  resetToken: string,
  newPassword: string
) => {
  // Verify reset token
  let decoded;
  try {
    const { verifyToken } = await import('../config/jwt');
    decoded = verifyToken(resetToken);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }

  // Find user
  const user = await UserModel.findById(decoded.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update password
  await UserModel.updatePassword(user.id, newPassword);

  return {
    message: 'Password reset successfully',
  };
};

/**
 * Get current user profile
 */
export const getProfile = async (userId: number) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return UserModel.toUserResponse(user);
};

/**
 * Update user profile
 */
export const updateProfile = async (userId: number, updateData: any) => {
  const user = await UserModel.update(userId, updateData);
  return UserModel.toUserResponse(user);
};
