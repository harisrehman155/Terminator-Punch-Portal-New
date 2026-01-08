import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Profile from '../Profile';
import { toast } from 'react-toastify';
import { getUserProfile, updateProfile, updateUserProfile } from '../../../redux/actions/AuthAction';

jest.mock('../../../redux/actions/AuthAction', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockStore = configureStore([thunk]);

const renderWithStore = (store) =>
  render(
    <Provider store={store}>
      <Profile />
    </Provider>
  );

describe('Profile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches getUserProfile when user is missing', async () => {
    const store = mockStore({
      auth: { user: null, loading: false, error: null },
    });

    getUserProfile.mockReturnValue({ type: 'GET_USER_PROFILE' });

    renderWithStore(store);

    await waitFor(() => {
      expect(store.getActions()).toContainEqual({ type: 'GET_USER_PROFILE' });
    });
  });

  it('renders user profile fields from store', () => {
    const store = mockStore({
      auth: {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme',
          phone: '12345',
          address: 'Street 1',
          city: 'Metropolis',
          country: 'Wonderland',
        },
        loading: false,
        error: null,
      },
    });

    renderWithStore(store);

    expect(screen.getByLabelText('Full Name').value).toBe('Jane Doe');
    expect(screen.getByLabelText('Email').value).toBe('jane@example.com');
    expect(screen.getByLabelText('Company').value).toBe('Acme');
    expect(screen.getByLabelText('Phone').value).toBe('12345');
    expect(screen.getByLabelText('Address').value).toBe('Street 1');
    expect(screen.getByLabelText('City').value).toBe('Metropolis');
    expect(screen.getByLabelText('Country').value).toBe('Wonderland');
  });

  it('treats success message as success and syncs profile', async () => {
    const store = mockStore({
      auth: {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme',
          phone: '12345',
          address: 'Street 1',
          city: 'Metropolis',
          country: 'Wonderland',
        },
        loading: false,
        error: null,
      },
    });

    updateProfile.mockImplementation((payload) => ({
      type: 'UPDATE_PROFILE',
      payload,
    }));
    updateUserProfile.mockImplementation(() => async () => ({
      message: 'Profile updated successfully',
      data: { company: 'New Co' },
    }));

    renderWithStore(store);

    fireEvent.change(screen.getByLabelText('Company'), {
      target: { value: 'New Co' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ company: 'New Co' })
    );
    expect(screen.getByLabelText('Company').value).toBe('New Co');
  });

  it('shows error toast when update fails', async () => {
    const store = mockStore({
      auth: {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme',
          phone: '12345',
          address: 'Street 1',
          city: 'Metropolis',
          country: 'Wonderland',
        },
        loading: false,
        error: null,
      },
    });

    updateUserProfile.mockImplementation(() => async () => ({
      success: false,
      message: 'Failed to update profile',
    }));

    renderWithStore(store);

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update profile');
    });
  });
});
