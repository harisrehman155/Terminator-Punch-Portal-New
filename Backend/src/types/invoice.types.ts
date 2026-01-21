/**
 * Invoice Type Definitions
 */

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'CANCELLED';

/**
 * Main Invoice interface
 */
export interface Invoice {
  id: number;
  invoice_no: string;
  user_id: number;
  billing_period: string;
  billing_month: number;
  billing_year: number;
  status_id: number;
  status?: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  pdf_file_path?: string;
  is_locked: number;
  created_by: number;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Invoice Item interface
 */
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  order_id: number;
  description: string;
  service_type_id: number;
  service_type?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Invoice with full details (for detail views)
 */
export interface InvoiceWithDetails extends Invoice {
  user_name: string;
  user_email: string;
  user_company?: string;
  items: InvoiceItemWithOrder[];
  orders: InvoiceOrderSummary[];
}

/**
 * Invoice Item with related order information
 */
export interface InvoiceItemWithOrder extends InvoiceItem {
  order_no: string;
  design_name: string;
}

/**
 * Summary of orders in an invoice
 */
export interface InvoiceOrderSummary {
  order_id: number;
  order_no: string;
  design_name: string;
  service_type: string;
  status: string;
}

/**
 * Input for creating a new invoice
 */
export interface InvoiceCreateInput {
  user_id: number;
  order_ids: number[];
  billing_period: string;
  billing_month: number;
  billing_year: number;
  tax_rate?: number;
  currency?: string;
  notes?: string;
  items: InvoiceItemInput[];
}

/**
 * Input for invoice line item
 */
export interface InvoiceItemInput {
  order_id: number;
  description: string;
  quantity?: number;
  unit_price: number;
}

/**
 * Input for updating an invoice
 */
export interface InvoiceUpdateInput {
  billing_period?: string;
  billing_month?: number;
  billing_year?: number;
  tax_rate?: number;
  currency?: string;
  notes?: string;
  items?: InvoiceItemInput[];
}

/**
 * Filters for invoice list queries
 */
export interface InvoiceListFilters {
  user_id?: number;
  status?: InvoiceStatus;
  billing_month?: number;
  billing_year?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Invoice response (for API responses)
 */
export interface InvoiceResponse {
  id: number;
  invoice_no: string;
  user_id: number;
  billing_period: string;
  billing_month: number;
  billing_year: number;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  pdf_file_path?: string;
  is_locked: number;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Available order for invoice creation
 */
export interface AvailableOrder {
  id: number;
  order_no: string;
  design_name: string;
  service_type: string;
  status: string;
  price?: number;
  currency?: string;
  pricing_notes?: string;
  created_at: Date;
}
