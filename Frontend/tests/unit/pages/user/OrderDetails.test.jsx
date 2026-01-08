import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { toast } from 'react-toastify';
import OrderDetails from '../../../../src/pages/user/OrderDetails';

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('OrderDetails Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '101' });
  });

  it('renders order details for the selected order', () => {
    render(<OrderDetails />);

    expect(screen.getByText('Eagle Logo')).toBeInTheDocument();
    expect(screen.getByText('TP-20250110-0001')).toBeInTheDocument();
  });

  it('handles delete flow and navigates back to orders', async () => {
    render(<OrderDetails />);

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    const dialog = await screen.findByRole('dialog', { name: /delete order/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Order deleted successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });

  it('handles cancel flow and navigates back to orders', async () => {
    render(<OrderDetails />);

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    const dialog = await screen.findByRole('dialog', { name: /cancel order/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /yes, cancel order/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Order cancelled successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });
});
