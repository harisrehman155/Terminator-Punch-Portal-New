import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as PaymentController from '../controllers/payment.controller';

const router = Router();

/**
 * Payment Routes (PayPal)
 */

router.post(
  '/paypal/create-order',
  authenticate,
  PaymentController.createPayPalOrder
);

router.post(
  '/paypal/capture-order',
  authenticate,
  PaymentController.capturePayPalOrder
);

export default router;
