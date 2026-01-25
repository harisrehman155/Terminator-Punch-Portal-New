import * as UserModel from '../models/user.model';
import { UserCreateInput } from '../types/user.types';
import { comparePassword } from '../utils/password';
import { generateToken } from '../config/jwt';
import { generateOTP, getOTPExpiry } from '../utils/helpers';
import { sendRegistrationOTP, sendPasswordResetOTP } from './email.service';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { OAuth2Client } from 'google-auth-library';

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

  // Create user (inactive until email verified)
  const user = await UserModel.create(userData, false);

  // Generate OTP
  const otpCode = generateOTP(6);
  const otpExpiry = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10));

  // Save OTP to database
  await UserModel.setOTP(user.id, otpCode, otpExpiry);

  // Send OTP via email
  try {
    await sendRegistrationOTP(
      user.email,
      user.name,
      otpCode,
      parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)
    );
  } catch (error) {
    // Log error but don't fail registration
    console.error('Failed to send registration OTP email:', error);
    // In development, still return success
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development OTP for ${user.email}: ${otpCode}`);
    }
  }

  // Return success message (no token until verified)
  return {
    message: 'Registration successful. Please check your email for verification code.',
    email: user.email,
    // In development, include OTP in response
    ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
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
 * Login or register user with Google
 */
export const loginWithGoogle = async (credential: string) => {
  if (!credential) {
    throw new BadRequestError('Google credential is required');
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new BadRequestError('Google client ID is not configured');
  }

  const googleClient = new OAuth2Client(googleClientId);
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
  } catch (error) {
    throw new UnauthorizedError('Invalid Google token');
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new UnauthorizedError('Invalid Google token');
  }

  const email = payload.email?.toLowerCase().trim();
  const googleSub = payload.sub;

  if (!email) {
    throw new UnauthorizedError('Google account email is required');
  }

  if (!googleSub) {
    throw new UnauthorizedError('Google account subject is required');
  }

  if (!payload.email_verified) {
    throw new UnauthorizedError('Google email is not verified');
  }

  let user = await UserModel.findByGoogleSub(googleSub);

  if (!user) {
    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
      if (!existingUser.is_active) {
        throw new UnauthorizedError('Account is deactivated. Please contact support.');
      }

      if (existingUser.google_sub && existingUser.google_sub !== googleSub) {
        throw new UnauthorizedError('Account already linked to another Google profile');
      }

      await UserModel.linkGoogleAccount(
        existingUser.id,
        googleSub,
        payload.picture || null
      );
      user = await UserModel.findById(existingUser.id);
    } else {
      const displayName = payload.name || email.split('@')[0];
      user = await UserModel.createOAuthUser({
        name: displayName,
        email,
        google_sub: googleSub,
        avatar_url: payload.picture || null,
      });
    }
  }

  if (!user) {
    throw new UnauthorizedError('Unable to sign in with Google');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Account is deactivated. Please contact support.');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

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
  const otpExpiry = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10));

  // Save OTP to database
  await UserModel.setOTP(user.id, otpCode, otpExpiry);

  // Send OTP via email
  try {
    await sendPasswordResetOTP(
      user.email,
      user.name,
      otpCode,
      parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)
    );
  } catch (error) {
    console.error('Failed to send password reset OTP email:', error);
    // In development, still return success
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development OTP for ${email}: ${otpCode}`);
    }
  }

  return {
    message: 'OTP sent to your email',
    // In development, include OTP in response
    ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
  };
};

/**
 * Verify registration OTP
 */
export const verifyRegistrationOTP = async (email: string, otpCode: string) => {
  // Verify OTP
  const user = await UserModel.verifyOTP(email, otpCode);
  if (!user) {
    throw new BadRequestError('Invalid or expired OTP');
  }

  // Activate user and clear OTP
  await UserModel.verifyAndActivateUser(user.id);

  return {
    message: 'Email verified successfully. Please login to continue.',
  };
};

/**
 * Verify OTP (for password reset)
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
