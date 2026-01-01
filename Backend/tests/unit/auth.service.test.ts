import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import * as authService from '../../src/services/auth.service';
import * as userModel from '../../src/models/user.model';
import * as passwordUtil from '../../src/utils/password';
import * as jwtConfig from '../../src/config/jwt';

// Mock dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/password');
jest.mock('../../src/config/jwt');

describe('Auth Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
      };

      const hashedPassword = 'hashed_password_123';
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_id: 5,
        role_name: 'USER',
        is_active: 1
      };
      const mockToken = 'jwt_token_123';

      (userModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (userModel.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtConfig.generateToken as jest.Mock).mockReturnValue(mockToken);

      // Act
      const result = await authService.registerUser(userData);

      // Assert
      expect(userModel.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('Test@1234');
      expect(userModel.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      });
      expect(result).toEqual({
        user: mockUser,
        token: mockToken
      });
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'Test@1234'
      };

      (userModel.findByEmail as jest.Mock).mockResolvedValue({ id: 1 });

      // Act & Assert
      await expect(authService.registerUser(userData)).rejects.toThrow('Email already exists');
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak'
      };

      (userModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (passwordUtil.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: false,
        message: 'Password must be at least 8 characters'
      });

      // Act & Assert
      await expect(authService.registerUser(userData)).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'user@example.com',
        password: 'Test@1234'
      };

      const mockUser = {
        id: 1,
        email: 'user@example.com',
        password_hash: 'hashed_password',
        is_active: 1,
        role_name: 'USER'
      };
      const mockToken = 'jwt_token_123';

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtConfig.generateToken as jest.Mock).mockReturnValue(mockToken);

      // Act
      const result = await authService.loginUser(credentials.email, credentials.password);

      // Assert
      expect(userModel.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(passwordUtil.comparePassword).toHaveBeenCalledWith('Test@1234', 'hashed_password');
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: 'user@example.com'
        }),
        token: mockToken
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      (userModel.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.loginUser('nonexistent@example.com', 'Test@1234'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for incorrect password', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        password_hash: 'hashed_password',
        is_active: 1
      };

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.loginUser('user@example.com', 'WrongPassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        password_hash: 'hashed_password',
        is_active: 0
      };

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.loginUser('user@example.com', 'Test@1234'))
        .rejects.toThrow('Account is inactive');
    });
  });

  describe('forgotPassword', () => {
    it('should generate and send OTP successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const mockUser = { id: 1, email };
      const mockOtp = '123456';

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userModel.setOTP as jest.Mock).mockResolvedValue(undefined);
      jest.spyOn(global.Math, 'random').mockReturnValue(0.123456);

      // Act
      const result = await authService.forgotPassword(email);

      // Assert
      expect(userModel.findByEmail).toHaveBeenCalledWith(email);
      expect(userModel.setOTP).toHaveBeenCalledWith(1, expect.any(String));
      expect(result).toHaveProperty('message');
    });

    it('should throw error for non-existent email', async () => {
      // Arrange
      (userModel.findByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.forgotPassword('nonexistent@example.com'))
        .rejects.toThrow('Email not found');
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const otp = '123456';
      const mockUser = { id: 1, email };
      const mockResetToken = 'reset_token_123';

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userModel.verifyOTP as jest.Mock).mockResolvedValue(true);
      (userModel.setResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      // Act
      const result = await authService.verifyOTP(email, otp);

      // Assert
      expect(userModel.verifyOTP).toHaveBeenCalledWith(1, otp);
      expect(result).toEqual({ resetToken: mockResetToken });
    });

    it('should throw error for invalid OTP', async () => {
      // Arrange
      const mockUser = { id: 1, email: 'user@example.com' };

      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userModel.verifyOTP as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.verifyOTP('user@example.com', 'wrong_otp'))
        .rejects.toThrow('Invalid or expired OTP');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      // Arrange
      const resetToken = 'valid_reset_token';
      const newPassword = 'NewPassword@123';
      const hashedPassword = 'hashed_new_password';
      const mockUser = { id: 1, email: 'user@example.com' };

      (userModel.findByResetToken as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (userModel.updatePassword as jest.Mock).mockResolvedValue(undefined);
      (userModel.clearResetToken as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await authService.resetPassword(resetToken, newPassword);

      // Assert
      expect(userModel.findByResetToken).toHaveBeenCalledWith(resetToken);
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(userModel.updatePassword).toHaveBeenCalledWith(1, hashedPassword);
      expect(userModel.clearResetToken).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('message');
    });

    it('should throw error for invalid reset token', async () => {
      // Arrange
      (userModel.findByResetToken as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.resetPassword('invalid_token', 'NewPassword@123'))
        .rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      // Arrange
      const userId = 1;
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role_name: 'USER'
      };

      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await authService.getCurrentUser(userId);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getCurrentUser(999))
        .rejects.toThrow('User not found');
    });
  });
});
