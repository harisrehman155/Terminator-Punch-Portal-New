import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as AuthAction from '../../../../src/redux/actions/AuthAction';
import { GET_PROFILE, UPDATE_PROFILE, SET_AUTH_LOADING, SET_AUTH_ERROR } from '../../../../src/redux/ActionTypes';

// Mock the apiService
jest.mock('../../../../src/api/ApiService', () => ({
  __esModule: true,
  default: jest.fn(),
  HttpMethod: {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete'
  }
}));

import apiService from '../../../../src/api/ApiService';

const mockStore = configureStore([thunk]);
const mockedApiService = apiService;

describe('Profile Actions', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        token: 'mock-token',
        user: null,
        loading: false,
        error: null
      }
    });
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should dispatch GET_PROFILE on successful profile fetch', async () => {
      const mockProfileData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Test Company'
      };

      const mockApiResponse = {
        success: true,
        data: mockProfileData
      };

      mockedApiService.mockResolvedValue(mockApiResponse);

      await store.dispatch(AuthAction.getUserProfile());

      const actions = store.getActions();
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: true });
      expect(actions).toContainEqual({ type: GET_PROFILE, payload: mockProfileData });
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: false });
    });

    it('should dispatch SET_AUTH_ERROR on profile fetch failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Profile not found'
          }
        }
      };

      mockedApiService.mockRejectedValue(mockError);

      await store.dispatch(AuthAction.getUserProfile());

      const actions = store.getActions();
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: true });
      expect(actions).toContainEqual({ type: SET_AUTH_ERROR, payload: 'Profile not found' });
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: false });
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');

      mockedApiService.mockRejectedValue(mockError);

      await store.dispatch(AuthAction.getUserProfile());

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: SET_AUTH_ERROR,
        payload: 'Failed to get profile. Please try again.'
      });
    });
  });

  describe('updateUserProfile', () => {
    const profileUpdateData = {
      name: 'Updated Name',
      company: 'Updated Company',
      phone: '123-456-7890'
    };

    it('should dispatch UPDATE_PROFILE on successful profile update', async () => {
      const mockUpdatedProfile = {
        id: 1,
        name: 'Updated Name',
        email: 'john@example.com',
        company: 'Updated Company',
        phone: '123-456-7890'
      };

      const mockApiResponse = {
        success: true,
        data: mockUpdatedProfile,
        message: 'Profile updated successfully'
      };

      mockedApiService.mockResolvedValue(mockApiResponse);

      const result = await store.dispatch(AuthAction.updateUserProfile(profileUpdateData));

      const actions = store.getActions();
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: true });
      expect(actions).toContainEqual({ type: UPDATE_PROFILE, payload: mockUpdatedProfile });
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: false });

      expect(result).toEqual({
        success: true,
        data: mockUpdatedProfile,
        message: 'Profile updated successfully'
      });
    });

    it('should dispatch SET_AUTH_ERROR on profile update failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Validation failed'
          }
        }
      };

      mockedApiService.mockRejectedValue(mockError);

      const result = await store.dispatch(AuthAction.updateUserProfile(profileUpdateData));

      const actions = store.getActions();
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: true });
      expect(actions).toContainEqual({ type: SET_AUTH_ERROR, payload: 'Validation failed' });
      expect(actions).toContainEqual({ type: SET_AUTH_LOADING, payload: false });

      expect(result).toEqual({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should handle network errors during profile update', async () => {
      const mockError = new Error('Network error');

      mockedApiService.mockRejectedValue(mockError);

      const result = await store.dispatch(AuthAction.updateUserProfile(profileUpdateData));

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: SET_AUTH_ERROR,
        payload: 'Failed to update profile. Please try again.'
      });

      expect(result).toEqual({
        success: false,
        message: 'Failed to update profile. Please try again.'
      });
    });
  });

  describe('Synchronous Actions', () => {
    it('should create GET_PROFILE action', () => {
      const profileData = { id: 1, name: 'Test User' };
      const action = AuthAction.getProfile(profileData);

      expect(action).toEqual({
        type: GET_PROFILE,
        payload: profileData
      });
    });

    it('should create UPDATE_PROFILE action', () => {
      const profileData = { id: 1, name: 'Updated User' };
      const action = AuthAction.updateProfile(profileData);

      expect(action).toEqual({
        type: UPDATE_PROFILE,
        payload: profileData
      });
    });
  });
});

