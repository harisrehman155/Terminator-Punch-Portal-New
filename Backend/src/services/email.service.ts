import { createEmailTransporter, getFromAddress } from '../config/email';
import Handlebars from 'handlebars';
import { DatabaseError } from '../utils/errors';

/**
 * Email Service - Handle all email operations
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email
 */
const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createEmailTransporter();
    const from = getFromAddress();

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✓ Email sent successfully to ${options.to}`);
  } catch (error: any) {
    console.error('✗ Failed to send email:', error.message);
    throw new DatabaseError('Failed to send email');
  }
};

/**
 * OTP Email Template
 */
const getOTPEmailTemplate = (): HandlebarsTemplateDelegate => {
  const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - TP Portal</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .email-header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .email-header p {
          color: #e0e7ff;
          font-size: 16px;
        }
        .email-body {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #333333;
          margin-bottom: 20px;
        }
        .message {
          font-size: 15px;
          color: #666666;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .otp-container {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-label {
          font-size: 14px;
          color: #666666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .otp-code {
          font-size: 42px;
          font-weight: 700;
          color: #667eea;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          margin: 10px 0;
        }
        .otp-expiry {
          font-size: 13px;
          color: #999999;
          margin-top: 12px;
        }
        .info-box {
          background-color: #fff8e1;
          border-left: 4px solid #ffc107;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .info-box p {
          font-size: 14px;
          color: #856404;
          margin: 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e9ecef;
        }
        .footer p {
          font-size: 13px;
          color: #6c757d;
          margin: 5px 0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .social-links {
          margin-top: 20px;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #667eea;
          text-decoration: none;
          font-size: 12px;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 20px;
          }
          .email-header {
            padding: 30px 20px;
          }
          .email-header h1 {
            font-size: 24px;
          }
          .email-body {
            padding: 30px 20px;
          }
          .otp-code {
            font-size: 36px;
            letter-spacing: 6px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="email-header">
          <h1>TP Portal</h1>
          <p>Order Management System</p>
        </div>

        <!-- Body -->
        <div class="email-body">
          <div class="greeting">
            Hello {{name}},
          </div>

          <div class="message">
            Welcome to <strong>TP Portal</strong>! We're excited to have you on board. To complete your registration and verify your email address, please use the One-Time Password (OTP) below.
          </div>

          <!-- OTP Box -->
          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">{{otp}}</div>
            <div class="otp-expiry">This code will expire in {{expiryMinutes}} minutes</div>
          </div>

          <div class="message">
            Enter this code on the verification page to activate your account and start managing your orders for digitizing, vector, and patches services.
          </div>

          <!-- Info Box -->
          <div class="info-box">
            <p><strong>Security Note:</strong> If you didn't request this code, please ignore this email. Never share your OTP with anyone.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>TP Portal</strong></p>
          <p>Your trusted partner for digitizing, vector & patches</p>
          <p style="margin-top: 15px;">
            Need help? <a href="mailto:support@tpportal.com">Contact Support</a>
          </p>
          <p style="margin-top: 10px; font-size: 12px; color: #999999;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return Handlebars.compile(template);
};

/**
 * Send OTP email for registration
 */
export const sendRegistrationOTP = async (
  email: string,
  name: string,
  otp: string,
  expiryMinutes: number = 10
): Promise<void> => {
  const template = getOTPEmailTemplate();
  const html = template({ name, otp, expiryMinutes });

  const textContent = `
Hello ${name},

Welcome to TP Portal! To complete your registration, please use the following verification code:

${otp}

This code will expire in ${expiryMinutes} minutes.

If you didn't request this code, please ignore this email.

Best regards,
TP Portal Team
  `.trim();

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - TP Portal Registration',
    html,
    text: textContent,
  });
};

/**
 * Send OTP email for password reset
 */
export const sendPasswordResetOTP = async (
  email: string,
  name: string,
  otp: string,
  expiryMinutes: number = 10
): Promise<void> => {
  const template = getOTPEmailTemplate();
  const html = template({ name, otp, expiryMinutes });

  const textContent = `
Hello ${name},

We received a request to reset your password. Please use the following verification code:

${otp}

This code will expire in ${expiryMinutes} minutes.

If you didn't request this, please ignore this email and your password will remain unchanged.

Best regards,
TP Portal Team
  `.trim();

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - TP Portal',
    html,
    text: textContent,
  });
};
