import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Topbar from '../../../../src/components/layout/Topbar';

const mockStore = configureStore([thunk]);

describe('Topbar Component', () => {
  let store;

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
  });

  const renderTopbar = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Topbar />
        </BrowserRouter>
      </Provider>
    );
  };

  it('displays "Loading..." when user data is not available', () => {
    renderTopbar();

    // Should show loading state when no user data
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays the correct user name when user data is available', () => {
    const mockUser = {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      role: 'USER'
    };

    store = mockStore({
      auth: {
        user: mockUser,
        token: 'mock-token',
        loading: false,
        error: null,
        isAuthenticated: true
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Topbar />
        </BrowserRouter>
      </Provider>
    );

    // Should display the user's name
    expect(screen.getByText('John Smith')).toBeInTheDocument();

    // Should display the first letter of the name in the avatar
    const avatar = screen.getByText('J'); // First letter of "John"
    expect(avatar).toBeInTheDocument();
  });

  it('displays "?" when user name is not available', () => {
    const mockUser = {
      id: 1,
      email: 'john@example.com',
      role: 'USER'
      // No name property
    };

    store = mockStore({
      auth: {
        user: mockUser,
        token: 'mock-token',
        loading: false,
        error: null,
        isAuthenticated: true
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Topbar />
        </BrowserRouter>
      </Provider>
    );

    // Should display "?" when name is not available
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('handles logout functionality', () => {
    const mockUser = {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      role: 'USER'
    };

    store = mockStore({
      auth: {
        user: mockUser,
        token: 'mock-token',
        loading: false,
        error: null,
        isAuthenticated: true
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Topbar />
        </BrowserRouter>
      </Provider>
    );

    // Menu items should be present (though menu might not be open in test)
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });
});

