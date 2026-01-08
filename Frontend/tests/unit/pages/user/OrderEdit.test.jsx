import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import OrderEdit from '../../../../src/pages/user/OrderEdit';

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

describe('OrderEdit Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '101' });
  });

  it('hydrates the form with the order data', async () => {
    render(<OrderEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText('Design Name').value).toBe('Eagle Logo');
      expect(screen.getByLabelText('Width').value).toBe('3.2');
      expect(screen.getByLabelText('Height').value).toBe('4.5');
    });
  });

  it('submits updates and navigates to the order details page', async () => {
    render(<OrderEdit />);

    fireEvent.click(screen.getByRole('button', { name: /update order/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Order updated successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/orders/101');
    });
  });
});
