import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import apiService, { HttpMethod } from '../../api/ApiService';

const PayPalInvoiceButton = ({ invoiceId, currency, onPaid }) => {
  const token = useSelector((state) => state.auth.token);
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState(null);
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError('PayPal client ID is not configured.');
      return;
    }

    const existingScript = document.querySelector('script[data-paypal-sdk]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
    script.async = true;
    script.defer = true;
    script.dataset.paypalSdk = 'true';
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Failed to load PayPal SDK.');
    document.head.appendChild(script);
  }, [clientId, currency]);

  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !window.paypal) {
      return;
    }

    buttonRef.current.innerHTML = '';

    window.paypal.Buttons({
      createOrder: async () => {
        setError(null);
        try {
          const response = await apiService({
            method: HttpMethod.POST,
            endPoint: '/payments/paypal/create-order',
            data: { invoiceId },
            token,
          });

          if (response.status === 'success') {
            return response.data.orderId;
          }

          throw new Error(response.message || 'Failed to create PayPal order');
        } catch (err) {
          const message = err.apiMessage || err.message || 'Failed to create PayPal order';
          setError(message);
          throw err;
        }
      },
      onApprove: async (data) => {
        setLoading(true);
        setError(null);
        try {
          const response = await apiService({
            method: HttpMethod.POST,
            endPoint: '/payments/paypal/capture-order',
            data: { orderId: data.orderID, invoiceId },
            token,
          });

          if (response.status === 'success') {
            toast.success('Payment completed successfully');
            if (onPaid) {
              onPaid(response.data.invoice);
            }
          } else {
            throw new Error(response.message || 'Payment failed');
          }
        } catch (err) {
          const message = err.apiMessage || err.message || 'Payment failed';
          setError(message);
          toast.error(message);
        } finally {
          setLoading(false);
        }
      },
      onError: () => {
        setError('PayPal encountered an error. Please try again.');
      },
    }).render(buttonRef.current);
  }, [invoiceId, onPaid, scriptLoaded, token]);

  return (
    <Box sx={{ width: '100%' }}>
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Processing payment...</Typography>
        </Box>
      )}
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      <Box ref={buttonRef} sx={{ width: '100%' }} />
    </Box>
  );
};

export default PayPalInvoiceButton;
