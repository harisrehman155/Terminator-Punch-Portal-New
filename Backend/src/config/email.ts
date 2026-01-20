import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email Configuration
 */

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Create email transporter
 */
export const createEmailTransporter = (): Transporter => {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  };

  return nodemailer.createTransport(config);
};

/**
 * Get default "from" address
 */
export const getFromAddress = (): string => {
  return process.env.SMTP_FROM || 'TP Portal <noreply@tpportal.com>';
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    console.log('✓ Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('✗ Email configuration error:', error);
    return false;
  }
};
