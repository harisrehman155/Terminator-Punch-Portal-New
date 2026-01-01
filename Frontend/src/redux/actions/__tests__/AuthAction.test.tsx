import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  loginUser,
  signupUser,
  forgotPasswordUser,
  verifyOtpUser,
  resetPasswordUser,
  logoutUser
} from '../AuthAction';
import apiService, { HttpMethod } from '../../../api/ApiService';
import { LOGIN, LOGOUT, SET_AUTH_LOADING, SET_AUTH_ERROR } from '../../ActionTypes';

// Mock apiService
jest.mock('../../../api/ApiService');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Auth Actions Tests', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false
      }
    });
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should dispatch LOGIN action on successful login', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            role_name: 'USER'
          },
          token: 'jwt_token_123'
        }
      };

      (apiService as jest.Mock).mockResolvedValue(mockResponse);

      const expectedActions = [
        { type: SET_AUTH_LOADING, payload: true },
        { type: SET_AUTH_ERROR, payload: null },
        {
          type: LOGIN,
          payload: {
            userData: mockResponse.data.user,
            token: mockResponse.data.token
          }
        },
        { type: SET_AUTH_LOADING, payload: false }
      ];

      // Act
      const result = await store.dispatch(loginUser('test@example.com', 'Test@1234'));

      // Assert
      expect(result).toEqual({ success: true, data: mockResponse.data });
      expect(store.getActions()).toEqual(expectedActions);
      expect(apiService).toHaveBeenCalledWith({
        method: HttpMethod.POST,
        endPoint: '/auth/login',
        data: { email: 'test@example.com', password: 'Test@1234' }
      });
    });

    it('should dispatch SET_AUTH_ERROR on login failure', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Invalid credentials'
            }
          }
        }
      };

      (apiService as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await store.dispatch(loginUser('test@example.com', 'wrong_password'));

      // Assert
      expect(result).toEqual({ success: false, message: 'Invalid credentials' });

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: SET_AUTH_ERROR,
        payload: 'Invalid credentials'
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      (apiService as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await store.dispatch(loginUser('test@example.com', 'Test@1234'));

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Login failed');
    });
  });

  describe('signupUser', () => {
    it('should register user successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role_name: 'USER'
          },
          token: 'jwt_token_123'
        }
      };

      (apiService as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await store.dispatch(
        signupUser('Test User', 'test@example.com', 'Test@1234', 'Test@1234')
      );

      // Assert
      expect(result).toEqual({ success: true, data: mockResponse.data });
      expect(apiService).toHaveBeenCalledWith({
        method: HttpMethod.POST,
        endPoint: '/auth/register',
        data: { name: 'Test User', email: 'test@example.com', password: 'Test@1234' }
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { path: 'email', message: 'Email already exists' },
                { path: 'password', message: 'Password too weak' }
              ]
            }
          }
        }
      };

      (apiService as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await store.dispatch(
        signupUser('Test User', 'existing@example.com', 'weak', 'weak')
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual({
        email: 'Email already exists',
        password: 'Password too weak'
      });
    });

    it('should handle duplicate email error', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            message: 'Email already exists'
          }
        }
      };

      (apiService as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await store.dispatch(
        signupUser('Test User', 'existing@example.com', 'Test@1234', 'Test@1234')
      );

      // Assert
      expect(result).toEqual({ success: false, message: 'Email already exists' });
    });
  });

  describe('forgotPasswordUser', () => {
    it('should send OTP successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'OTP sent to your email'
      };

      (apiService as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await store.dispatch(forgotPasswordUser('test@example.com'));

      // Assert
      expect(result).toEqual({ success: true, message: 'OTP sent to your email' });
      expect(apiService).toHaveBeenCalledWith({
        method: HttpMethod.POST,
        endPoint: '/auth/forgot-password',
        data: { email: 'test@example.com' }
      });
    });

    it('should handle email not found error', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            message: 'Email not found'
          }
        }
      };

      (apiService as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await store.dispatch(forgotPasswordUser('nonexistent@example.com'));

      // Assert
      expect(result).toEqual({ success: false, message: 'Email not found' });
    });
  });

  describe('verifyOtpUser', () => {
    it('should verify OTP successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          resetToken: 'reset_token_123'
        },
        message: 'OTP verified successfully'
      };

      (apiService as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await store.dispatch(verifyOtpUser('test@example.com', '123456'));

      // Assert
      expect(result).toEqual({
        success: true,
        data: { resetToken: 'reset_token_123' },
        message: 'OTP verified successfully'
      });
      expect(apiService).toHaveBeenCalledWith({
        method: HttpMethod.POST,
        endPoint: '/auth/verify-otp',
        data: { email: 'test@example.com', otp: '123456' }
      });
    });

    it('should handle invalid OTP error', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            message: 'Invalid or expired OTP'
          }
        }
      };

      (apiService as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await store.dispatch(verifyOtpUser('test@example.com', '000000'));

      // Assert
      expect(result).toEqual({ success: false, message: 'Invalid or expired OTP' });
    });
  });

  describe('resetPasswordUser', () => {
    it('should reset password successfully', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Password reset successfully'
      };

      (apiService as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await store.dispatch(
        resetPasswordUser('reset_token_123', 'NewPassword@123')
      );

      // Assert
      expect(result).toEqual({ success: true, message: 'Password reset successfully' });
      expect(apiService).toHaveBeenCalledWith({
        method: HttpMethod.POST,
        endPoint: '/auth/reset-password',
        data: { resetToken: 'reset_token_123', newPassword: 'NewPassword@123' }
      });
    });

    it('should handle invalid reset token error', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            message: 'Invalid or expired reset token'
          }
        }
      };

      (apiService as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await store.dispatch(
        resetPasswordUser('invalid_token', 'NewPassword@123')
      );

      // Assert
      expect(result).toEqual({ success: false, message: 'Invalid or expired reset token' });
    });
  });

  describe('logoutUser', () => {
    it('should dispatch LOGOUT action', async () => {
      // Act
      await store.dispatch(logoutUser());

      // Assert
      const actions = store.getActions();
      expect(actions).toContainEqual({ type: LOGOUT });
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      // Arrange
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 90000ms exceeded'
      };

      (apiService as jest.Mock).mockRejectedValue(timeoutError);

      // Act
      const result = await store.dispatch(loginUser('test@example.com', 'Test@1234'));

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network Error');

      (apiService as jest.Mock).mockRejectedValue(networkError);

      // Act
      const result = await store.dispatch(loginUser('test@example.com', 'Test@1234'));

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
