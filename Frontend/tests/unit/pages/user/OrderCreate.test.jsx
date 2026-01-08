import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { toast } from 'react-toastify';
import OrderCreate from '../../../../src/pages/user/OrderCreate';
import apiService from '../../../../src/api/ApiService';

const mockNavigate = jest.fn();
const mockStore = configureStore([thunk]);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../../src/api/ApiService', () => ({
  __esModule: true,
  default: jest.fn(),
  HttpMethod: { POST: 'post' },
}));

describe('OrderCreate Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation error when required fields are missing', () => {
    const store = mockStore({ auth: { token: 'mock-token' } });
    render(
      <Provider store={store}>
        <OrderCreate />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /create order/i }));

    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submits the form and navigates on success', async () => {
    const store = mockStore({ auth: { token: 'mock-token' } });
    apiService.mockResolvedValue({
      status: 'success',
      data: { id: 101 },
      message: 'Order created successfully',
    });
    render(
      <Provider store={store}>
        <OrderCreate />
      </Provider>
    );

    fireEvent.mouseDown(screen.getByRole('button', { name: /order type/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'DIGITIZING' }));

    fireEvent.change(screen.getByLabelText('Design Name'), {
      target: { value: 'Test Design' },
    });
    fireEvent.change(screen.getByLabelText('Width'), {
      target: { value: '3.5' },
    });
    fireEvent.change(screen.getByLabelText('Height'), {
      target: { value: '4.0' },
    });

    fireEvent.change(await screen.findByLabelText('Number of Colors'), {
      target: { value: '4' },
    });
    fireEvent.mouseDown(screen.getByRole('button', { name: /fabric/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'Cotton' }));

    fireEvent.click(screen.getByRole('button', { name: /create order/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Order created successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });
});
