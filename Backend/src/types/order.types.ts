/**
 * Order related types
 */

// Enum string types (kept for API compatibility)
export type OrderType = 'DIGITIZING' | 'VECTOR' | 'PATCHES';
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Unit = 'inch' | 'cm';

/**
 * Order database model (with FK columns)
 * This represents the actual database structure after enum-to-lookup migration.
 * Queries should JOIN with lookups table to populate the string values.
 */
export interface Order {
  id: number;
  user_id: number;
  order_no: string;
  // New FK columns (populated from lookups table)
  service_type_id: number;
  service_type: OrderType; // Joined from lookups table
  order_type?: OrderType; // Backward-compatible alias
  status_id: number;
  status: OrderStatus; // Joined from lookups table
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
  created_at: Date;
  updated_at: Date;
}

export interface OrderCreateInput {
  order_type: OrderType;
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

export interface OrderUpdateInput {
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
  status?: OrderStatus;
}

export interface OrderListFilters {
  user_id?: number;
  order_type?: OrderType;
  status?: OrderStatus;
  exclude_statuses?: OrderStatus[];
  is_urgent?: number;
  search?: string; // Search by order_no or design_name
  from_date?: string; // ISO date string
  to_date?: string; // ISO date string
  limit?: number;
  offset?: number;
}

export interface OrderWithUser extends Order {
  user_name: string;
  user_email: string;
  user_company?: string;
}

/**
 * API response type (maintains backward compatibility with string enum values)
 * The API layer will map from database Order type to this response type
 */
export interface OrderResponse {
  id: number;
  order_no: string;
  order_type: OrderType; // String value for API compatibility
  status: OrderStatus; // String value for API compatibility
  design_name: string;
  height?: number;
  width?: number;
  unit?: Unit; // String value for API compatibility
  number_of_colors?: number;
  fabric?: string;
  color_type?: string;
  placement?: string[];
  required_format?: string[];
  instruction?: string;
  is_urgent: number;
  created_at: Date;
  updated_at: Date;
  user?: {
    id: number;
    name: string;
    email: string;
    company?: string;
  };
}
