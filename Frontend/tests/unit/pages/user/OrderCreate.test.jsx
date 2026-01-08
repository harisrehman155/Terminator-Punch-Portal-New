import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import OrderCreate from '../../../../src/pages/user/OrderCreate';

const mockNavigate = jest.fn();

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

describe('OrderCreate Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation error when required fields are missing', () => {
    render(<OrderCreate />);

    fireEvent.click(screen.getByRole('button', { name: /create order/i }));

    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submits the form and navigates on success', async () => {
    render(<OrderCreate />);

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
    fireEvent.change(screen.getByLabelText('Fabric'), {
      target: { value: 'Cotton' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create order/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Order created successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });
});
