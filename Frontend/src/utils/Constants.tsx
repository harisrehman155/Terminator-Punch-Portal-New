// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Token Configuration
export const TOKEN_KEY = 'tp_portal_token';
export const USER_KEY = 'tp_portal_user';
export const ROLE_KEY = 'tp_portal_role';

// OTP Configuration
export const OTP_LENGTH = 6;
export const OTP_RESEND_DELAY = 60; // seconds
