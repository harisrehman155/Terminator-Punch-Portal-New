export type PaymentProvider = 'paypal';

export type PaymentStatus =
  | 'CREATED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'MISMATCH';

export interface Payment {
  id: number;
  invoice_id: number;
  user_id: number;
  provider: PaymentProvider;
  provider_order_id: string;
  provider_capture_id?: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  raw_response?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentCreateInput {
  invoice_id: number;
  user_id: number;
  provider: PaymentProvider;
  provider_order_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw_response?: string | null;
}
