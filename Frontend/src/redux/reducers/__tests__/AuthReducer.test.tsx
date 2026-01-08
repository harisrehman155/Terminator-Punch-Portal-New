import AuthReducer from '../AuthReducer';
import { LOGIN, LOGOUT, SET_AUTH_LOADING, SET_AUTH_ERROR, UPDATE_PROFILE, GET_PROFILE } from '../../ActionTypes';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('AuthReducer', () => {
  const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LOGIN action', () => {
    it('should handle login and store data in localStorage', () => {
      const userData = { id: 1, name: 'Test User', email: 'test@example.com' };
      const token = 'test-token';

      const action = {
        type: LOGIN,
        payload: { userData, token }
      };

      const result = AuthReducer(initialState, action);

      expect(result).toEqual({
        ...initialState,
        user: userData,
        token: token,
        isAuthenticated: true,
        error: null
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('tp_portal_token', token);
      expect(localStorage.setItem).toHaveBeenCalledWith('tp_portal_user', JSON.stringify(userData));
    });
  });

  describe('LOGOUT action', () => {
    it('should handle logout and clear localStorage', () => {
      const stateWithUser = {
        ...initialState,
        user: { id: 1, name: 'Test User' },
        token: 'test-token',
        isAuthenticated: true
      };

      const action = {
        type: LOGOUT
      };

      const result = AuthReducer(stateWithUser, action);

      expect(result).toEqual(initialState);
      expect(localStorage.removeItem).toHaveBeenCalledWith('tp_portal_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('tp_portal_user');
    });
  });

  describe('SET_AUTH_LOADING action', () => {
    it('should update loading state', () => {
      const action = {
        type: SET_AUTH_LOADING,
        payload: true
      };

      const result = AuthReducer(initialState, action);

      expect(result).toEqual({
        ...initialState,
        loading: true
      });
    });
  });

  describe('SET_AUTH_ERROR action', () => {
    it('should update error state', () => {
      const errorMessage = 'Login failed';
      const action = {
        type: SET_AUTH_ERROR,
        payload: errorMessage
      };

      const result = AuthReducer(initialState, action);

      expect(result).toEqual({
        ...initialState,
        error: errorMessage
      });
    });
  });

  describe('GET_PROFILE action', () => {
    it('should update user data and store in localStorage', () => {
      const profileData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Test Company'
      };

      const action = {
        type: GET_PROFILE,
        payload: profileData
      };

      const result = AuthReducer(initialState, action);

      expect(result).toEqual({
        ...initialState,
        user: profileData,
        error: null
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('tp_portal_user', JSON.stringify(profileData));
    });
  });

  describe('UPDATE_PROFILE action', () => {
    it('should update user data and store in localStorage', () => {
      const updatedProfileData = {
        id: 1,
        name: 'Updated Name',
        email: 'john@example.com',
        company: 'Updated Company'
      };

      const action = {
        type: UPDATE_PROFILE,
        payload: updatedProfileData
      };

      const result = AuthReducer(initialState, action);

      expect(result).toEqual({
        ...initialState,
        user: updatedProfileData,
        error: null
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('tp_portal_user', JSON.stringify(updatedProfileData));
    });
  });

  describe('Unknown action', () => {
    it('should return current state for unknown action', () => {
      const action = {
        type: 'UNKNOWN_ACTION',
        payload: {}
      };

      const result = AuthReducer(initialState, action);

      expect(result).toEqual(initialState);
    });
  });
});

