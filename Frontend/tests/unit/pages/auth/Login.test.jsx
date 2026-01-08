import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import Login from '../../../../src/pages/auth/Login';
import { loginUser } from '../../../../src/redux/actions/AuthAction';

// Mock dependencies
jest.mock('../../../../src/redux/actions/AuthAction');
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component Tests', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: (state = { loading: false, error: null }, action) => {
          switch (action.type) {
            case 'SET_AUTH_LOADING':
              return { ...state, loading: action.payload };
            case 'SET_AUTH_ERROR':
              return { ...state, error: action.payload };
            default:
              return state;
          }
        }
      }
    });

    jest.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('should render login form', () => {
      renderLogin();

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLogin();

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLogin();

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/register/i)).toBeInTheDocument();
    });

    it('should not render role switcher', () => {
      renderLogin();

      expect(screen.queryByText(/login as admin/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      renderLogin();

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const { toast } = require('react-toastify');
        expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
      });
    });

    it('should show error for empty password', async () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const { toast } = require('react-toastify');
        expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
      });
    });
  });

  describe('Login Functionality', () => {
    it('should login successfully with USER role', async () => {
      const mockLoginUser = loginUser;
      mockLoginUser.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            role_name: 'USER'
          },
          token: 'jwt_token_123'
        }
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Test@1234' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const { toast } = require('react-toastify');
        expect(toast.success).toHaveBeenCalledWith('Login successful');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should login successfully with ADMIN role', async () => {
      const mockLoginUser = loginUser;
      mockLoginUser.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: 1,
            email: 'admin@example.com',
            role_name: 'ADMIN'
          },
          token: 'jwt_token_123'
        }
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Admin@1234' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should handle login failure', async () => {
      const mockLoginUser = loginUser;
      mockLoginUser.mockResolvedValue({
        success: false,
        message: 'Invalid credentials'
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const { toast } = require('react-toastify');
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should display field-level validation errors', async () => {
      const mockLoginUser = loginUser;
      mockLoginUser.mockResolvedValue({
        success: false,
        errors: {
          email: 'Invalid email format',
          password: 'Password is required'
        }
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during login', async () => {
      const mockLoginUser = loginUser;
      mockLoginUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      store = configureStore({
        reducer: {
          auth: (state = { loading: true, error: null }, action) => state
        }
      });

      renderLogin();

      const loginButton = screen.getByRole('button', { name: /logging in.../i });
      expect(loginButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to forgot password page', () => {
      renderLogin();

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      fireEvent.click(forgotPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });

    it('should navigate to register page', () => {
      renderLogin();

      const registerLink = screen.getByText(/register/i);
      fireEvent.click(registerLink);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });

  describe('Input Handling', () => {
    it('should update email field on change', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password field on change', () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'Test@1234' } });

      expect(passwordInput.value).toBe('Test@1234');
    });

    it('should mask password input', () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      renderLogin();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have required attributes', () => {
      renderLogin();

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
    });
  });
});
