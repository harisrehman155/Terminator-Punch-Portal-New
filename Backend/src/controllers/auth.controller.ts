import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';
import { successResponse, createdResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationError } from '../utils/errors';
import { isValidEmail } from '../utils/helpers';
import { validatePasswordStrength } from '../utils/password';

/**
 * Auth Controller - Handle HTTP requests
 */

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, company, phone, address, city, country } = req.body;

  // Validation
  const errors: any = {};

  if (!name || name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (!email || !isValidEmail(email)) {
    errors.email = 'Valid email is required';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Register user
  const result = await AuthService.register({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    company,
    phone,
    address,
    city,
    country,
  });

  return createdResponse(res, 'User registered successfully', result);
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  const errors: any = {};

  if (!email || !isValidEmail(email)) {
    errors.email = 'Valid email is required';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Login
  const result = await AuthService.login(
    email.toLowerCase().trim(),
    password
  );

  return successResponse(res, 'Login successful', result);
});

/**
 * Forgot password - Send OTP
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    // Validation
    if (!email || !isValidEmail(email)) {
      throw new ValidationError('Validation failed', {
        email: 'Valid email is required',
      });
    }

    const result = await AuthService.forgotPassword(
      email.toLowerCase().trim()
    );

    return successResponse(res, result.message, result);
  }
);

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // Validation
  const errors: any = {};

  if (!email || !isValidEmail(email)) {
    errors.email = 'Valid email is required';
  }

  if (!otp || otp.length !== 6) {
    errors.otp = 'Valid 6-digit OTP is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const result = await AuthService.verifyOTP(
    email.toLowerCase().trim(),
    otp.trim()
  );

  return successResponse(res, result.message, result);
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { resetToken, newPassword } = req.body;

    // Validation
    const errors: any = {};

    if (!resetToken) {
      errors.resetToken = 'Reset token is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.errors;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    const result = await AuthService.resetPassword(resetToken, newPassword);

    return successResponse(res, result.message);
  }
);

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('User not authenticated');
  }

  const user = await AuthService.getProfile(req.user.userId);

  return successResponse(res, 'User profile retrieved', user);
});

/**
 * Update profile
 * PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { name, company, phone, address, city, country } = req.body;

    const user = await AuthService.updateProfile(req.user.userId, {
      name,
      company,
      phone,
      address,
      city,
      country,
    });

    return successResponse(res, 'Profile updated successfully', user);
  }
);
