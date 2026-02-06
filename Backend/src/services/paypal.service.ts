import axios from 'axios';
import { BadRequestError } from '../utils/errors';

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new BadRequestError('PayPal credentials are not configured');
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.accessToken;
  }

  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const accessToken = response.data.access_token as string;
  const expiresIn = response.data.expires_in as number;

  cachedToken = {
    accessToken,
    expiresAt: now + expiresIn * 1000 - 60_000,
  };

  return accessToken;
};

const paypalRequest = async <T = any>(
  method: 'get' | 'post',
  path: string,
  data?: any
): Promise<T> => {
  const token = await getAccessToken();

  const response = await axios({
    method,
    url: `${PAYPAL_BASE_URL}${path}`,
    data,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data as T;
};

export const createOrder = async ({
  amount,
  currency,
  invoiceNo,
}: {
  amount: string;
  currency: string;
  invoiceNo: string;
}) => {
  return paypalRequest('post', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: invoiceNo,
        description: `Invoice ${invoiceNo}`,
        amount: {
          currency_code: currency,
          value: amount,
        },
      },
    ],
    application_context: {
      brand_name: 'TP Portal',
      user_action: 'PAY_NOW',
      landing_page: 'LOGIN',
    },
  });
};

export const captureOrder = async (orderId: string) => {
  if (!orderId) {
    throw new BadRequestError('PayPal order ID is required');
  }

  return paypalRequest('post', `/v2/checkout/orders/${orderId}/capture`);
};
