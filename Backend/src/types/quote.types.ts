/**
 * Quote related types
 */

// Enum string types (kept for API compatibility)
export type QuoteType = 'DIGITIZING' | 'VECTOR' | 'PATCHES';
export type QuoteStatus = 'PENDING' | 'PRICED' | 'CONVERTED';
export type Unit = 'inch' | 'cm';

/**
 * Quote database model (with FK columns)
 * This represents the actual database structure after enum-to-lookup migration.
 * Queries should JOIN with lookups table to populate the string values.
 */
export interface Quote {
  id: number;
  user_id: number;
  quote_no: string;
  // New FK columns (populated from lookups table)
  service_type_id: number;
  service_type: QuoteType; // Joined from lookups table (same as order_type)
  status_id: number;
  status: QuoteStatus; // Joined from lookups table
  design_name: string;
  height?: number;
  width?: number;
  unit_id?: number;
  unit?: Unit; // Joined from lookups table
  number_of_colors?: number;
  fabric?: string;
  color_type?: string;
  placement?: string[];
  required_format?: string[];
  instruction?: string;
  is_urgent: number;
  price?: number;
  currency?: string;
  remarks?: string;
  converted_order_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface QuoteCreateInput {
  quote_type: QuoteType;
  design_name: string;
  height?: number;
  width?: number;
  unit?: Unit;
  number_of_colors?: number;
  fabric?: string;
  color_type?: string;
  placement?: string[];
  required_format?: string[];
  instruction?: string;
  is_urgent?: number;
}

export interface QuoteUpdateInput {
  design_name?: string;
  height?: number;
  width?: number;
  unit?: Unit;
  number_of_colors?: number;
  fabric?: string;
  color_type?: string;
  placement?: string[];
  required_format?: string[];
  instruction?: string;
  is_urgent?: number;
}

export interface QuotePricingInput {
  price: number;
  currency?: string;
  remarks?: string;
}
