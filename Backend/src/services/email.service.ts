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

/**
 * Admin Quote Notification Email Template
 */
const getAdminQuoteNotificationTemplate = (): HandlebarsTemplateDelegate => {
  const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Quote Request - TP Portal</title>
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
        .highlight-container {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .highlight-label {
          font-size: 14px;
          color: #666666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .highlight-value {
          font-size: 36px;
          font-weight: 700;
          color: #667eea;
          margin: 10px 0;
          font-family: 'Courier New', monospace;
        }
        .detail-section {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #333333;
          flex: 0 0 40%;
        }
        .detail-value {
          color: #666666;
          flex: 1;
          text-align: right;
        }
        .urgent-badge {
          display: inline-block;
          background-color: #ff4444;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin: 10px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
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
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 20px;
          }
          .email-header {
            padding: 30px 20px;
          }
          .email-body {
            padding: 30px 20px;
          }
          .highlight-value {
            font-size: 28px;
          }
          .detail-row {
            flex-direction: column;
          }
          .detail-value {
            text-align: left;
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>TP Portal</h1>
          <p>Admin Notification</p>
        </div>

        <div class="email-body">
          <div class="greeting">
            New Quote Request Received
          </div>

          <div class="message">
            A new quote request has been submitted by a customer and requires your attention.
          </div>

          {{#if isUrgent}}
          <div style="text-align: center;">
            <span class="urgent-badge">URGENT</span>
          </div>
          {{/if}}

          <div class="highlight-container">
            <div class="highlight-label">Quote Number</div>
            <div class="highlight-value">{{quoteNo}}</div>
          </div>

          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Customer:</span>
              <span class="detail-value">{{customerName}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{customerEmail}}</span>
            </div>
            {{#if company}}
            <div class="detail-row">
              <span class="detail-label">Company:</span>
              <span class="detail-value">{{company}}</span>
            </div>
            {{/if}}
            <div class="detail-row">
              <span class="detail-label">Service Type:</span>
              <span class="detail-value">{{serviceType}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Design Name:</span>
              <span class="detail-value">{{designName}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{{createdAt}}</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="{{portalUrl}}/admin/quotes" class="cta-button">Review Quote in Admin Portal</a>
          </div>
        </div>

        <div class="footer">
          <p><strong>TP Portal</strong></p>
          <p>Order Management System</p>
          <p style="margin-top: 15px; font-size: 12px; color: #999999;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return Handlebars.compile(template);
};

/**
 * Send admin notification for new quote
 */
export const sendAdminQuoteNotification = async (
  quote: any,
  user: { name: string; email: string; company?: string | null }
): Promise<void> => {
  try {
    const template = getAdminQuoteNotificationTemplate();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tpportal.com';
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    const html = template({
      quoteNo: quote.quote_no,
      customerName: user.name,
      customerEmail: user.email,
      company: user.company,
      serviceType: quote.service_type,
      designName: quote.design_name,
      isUrgent: quote.is_urgent === 1,
      createdAt: new Date(quote.created_at).toLocaleString(),
      portalUrl,
    });

    const textContent = `
New Quote Request Received

Quote Number: ${quote.quote_no}
${quote.is_urgent === 1 ? 'URGENT\n' : ''}
Customer: ${user.name}
Email: ${user.email}
${user.company ? `Company: ${user.company}\n` : ''}Service Type: ${quote.service_type}
Design Name: ${quote.design_name}
Date: ${new Date(quote.created_at).toLocaleString()}

Review this quote in the admin portal: ${portalUrl}/admin/quotes

Best regards,
TP Portal System
    `.trim();

    await sendEmail({
      to: adminEmail,
      subject: `New Quote Request - ${quote.quote_no}`,
      html,
      text: textContent,
    });

    console.log(`✓ Admin quote notification sent for ${quote.quote_no}`);
  } catch (error: any) {
    console.error('✗ Failed to send admin quote notification:', error.message);
    throw error;
  }
};

/**
 * Customer Quote Priced Email Template
 */
const getQuotePricedTemplate = (): HandlebarsTemplateDelegate => {
  const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Quote is Ready - TP Portal</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f4f4f4;
        }
        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .email-header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .email-header p { color: #e0e7ff; font-size: 16px; }
        .email-body { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333333; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666666; margin-bottom: 30px; line-height: 1.8; }
        .price-container { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; border-left: 4px solid #4caf50; }
        .price-label { font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .price-value { font-size: 42px; font-weight: 700; color: #2e7d32; margin: 10px 0; }
        .detail-section { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #333333; flex: 0 0 40%; }
        .detail-value { color: #666666; flex: 1; text-align: right; }
        .info-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .info-box p { font-size: 14px; color: #856404; margin: 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { font-size: 13px; color: #6c757d; margin: 5px 0; }
        @media only screen and (max-width: 600px) {
          .email-container { margin: 20px; }
          .email-header { padding: 30px 20px; }
          .email-body { padding: 30px 20px; }
          .price-value { font-size: 32px; }
          .detail-row { flex-direction: column; }
          .detail-value { text-align: left; margin-top: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>TP Portal</h1>
          <p>Your Quote is Ready</p>
        </div>

        <div class="email-body">
          <div class="greeting">Hello {{name}},</div>

          <div class="message">
            Great news! We've reviewed your quote request and have prepared pricing for you.
          </div>

          <div class="price-container">
            <div class="price-label">Total Price</div>
            <div class="price-value">{{currency}} {{price}}</div>
          </div>

          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Quote Number:</span>
              <span class="detail-value">{{quoteNo}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Design Name:</span>
              <span class="detail-value">{{designName}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service Type:</span>
              <span class="detail-value">{{serviceType}}</span>
            </div>
          </div>

          {{#if remarks}}
          <div class="info-box">
            <p><strong>Admin Note:</strong> {{remarks}}</p>
          </div>
          {{/if}}

          <div class="message">
            To proceed with your order, please log in to your portal account and convert this quote to an order.
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="{{portalUrl}}/quotes" class="cta-button">View Quote Details</a>
          </div>
        </div>

        <div class="footer">
          <p><strong>TP Portal</strong></p>
          <p>Your trusted partner for digitizing, vector & patches</p>
          <p style="margin-top: 15px;">Need help? Contact us anytime</p>
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
 * Send customer notification when quote is priced
 */
export const sendQuotePricedNotification = async (
  quote: any,
  user: { name: string; email: string }
): Promise<void> => {
  try {
    const template = getQuotePricedTemplate();
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    const html = template({
      name: user.name,
      quoteNo: quote.quote_no,
      designName: quote.design_name,
      serviceType: quote.service_type,
      price: parseFloat(quote.price).toFixed(2),
      currency: quote.currency || 'USD',
      remarks: quote.remarks,
      portalUrl,
    });

    const textContent = `
Hello ${user.name},

Great news! We've reviewed your quote request and have prepared pricing for you.

Quote Number: ${quote.quote_no}
Design Name: ${quote.design_name}
Service Type: ${quote.service_type}

Total Price: ${quote.currency || 'USD'} ${parseFloat(quote.price).toFixed(2)}

${quote.remarks ? `Admin Note: ${quote.remarks}\n` : ''}
To proceed with your order, please log in to your portal account and convert this quote to an order.

View your quote: ${portalUrl}/quotes

Best regards,
TP Portal Team
    `.trim();

    await sendEmail({
      to: user.email,
      subject: `Your Quote is Ready - ${quote.quote_no}`,
      html,
      text: textContent,
    });

    console.log(`✓ Quote priced notification sent to ${user.email}`);
  } catch (error: any) {
    console.error('✗ Failed to send quote priced notification:', error.message);
    throw error;
  }
};

/**
 * Admin Order Notification Email Template
 */
const getAdminOrderNotificationTemplate = (): HandlebarsTemplateDelegate => {
  const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Received - TP Portal</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; }
        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .email-header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .email-header p { color: #e0e7ff; font-size: 16px; }
        .email-body { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333333; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666666; margin-bottom: 30px; line-height: 1.8; }
        .highlight-container { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
        .highlight-label { font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .highlight-value { font-size: 36px; font-weight: 700; color: #667eea; margin: 10px 0; font-family: 'Courier New', monospace; }
        .detail-section { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #333333; flex: 0 0 40%; }
        .detail-value { color: #666666; flex: 1; text-align: right; }
        .urgent-badge { display: inline-block; background-color: #ff4444; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 10px 0; }
        .quote-badge { display: inline-block; background-color: #2196f3; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 10px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { font-size: 13px; color: #6c757d; margin: 5px 0; }
        @media only screen and (max-width: 600px) {
          .email-container { margin: 20px; }
          .email-header { padding: 30px 20px; }
          .email-body { padding: 30px 20px; }
          .highlight-value { font-size: 28px; }
          .detail-row { flex-direction: column; }
          .detail-value { text-align: left; margin-top: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>TP Portal</h1>
          <p>Admin Notification</p>
        </div>

        <div class="email-body">
          <div class="greeting">New Order Received</div>

          <div class="message">
            A new order has been {{#if quoteReference}}created from quote conversion{{else}}submitted by a customer{{/if}} and is ready for processing.
          </div>

          <div style="text-align: center;">
            {{#if isUrgent}}
            <span class="urgent-badge">URGENT</span>
            {{/if}}
            {{#if quoteReference}}
            <span class="quote-badge">From Quote: {{quoteReference}}</span>
            {{/if}}
          </div>

          <div class="highlight-container">
            <div class="highlight-label">Order Number</div>
            <div class="highlight-value">{{orderNo}}</div>
          </div>

          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Customer:</span>
              <span class="detail-value">{{customerName}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{customerEmail}}</span>
            </div>
            {{#if company}}
            <div class="detail-row">
              <span class="detail-label">Company:</span>
              <span class="detail-value">{{company}}</span>
            </div>
            {{/if}}
            <div class="detail-row">
              <span class="detail-label">Service Type:</span>
              <span class="detail-value">{{serviceType}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Design Name:</span>
              <span class="detail-value">{{designName}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{{createdAt}}</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="{{portalUrl}}/admin/orders" class="cta-button">View Order in Admin Portal</a>
          </div>
        </div>

        <div class="footer">
          <p><strong>TP Portal</strong></p>
          <p>Order Management System</p>
          <p style="margin-top: 15px; font-size: 12px; color: #999999;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return Handlebars.compile(template);
};

/**
 * Send admin notification for new order
 */
export const sendAdminOrderNotification = async (
  order: any,
  user: { name: string; email: string; company?: string | null },
  quoteReference?: string | null
): Promise<void> => {
  try {
    const template = getAdminOrderNotificationTemplate();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tpportal.com';
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    const html = template({
      orderNo: order.order_no,
      customerName: user.name,
      customerEmail: user.email,
      company: user.company,
      serviceType: order.service_type,
      designName: order.design_name,
      isUrgent: order.is_urgent === 1,
      quoteReference,
      createdAt: new Date(order.created_at).toLocaleString(),
      portalUrl,
    });

    const textContent = `
New Order Received

Order Number: ${order.order_no}
${order.is_urgent === 1 ? 'URGENT\n' : ''}${quoteReference ? `From Quote: ${quoteReference}\n` : ''}
Customer: ${user.name}
Email: ${user.email}
${user.company ? `Company: ${user.company}\n` : ''}Service Type: ${order.service_type}
Design Name: ${order.design_name}
Date: ${new Date(order.created_at).toLocaleString()}

View this order in the admin portal: ${portalUrl}/admin/orders

Best regards,
TP Portal System
    `.trim();

    await sendEmail({
      to: adminEmail,
      subject: `New Order Received - ${order.order_no}`,
      html,
      text: textContent,
    });

    console.log(`✓ Admin order notification sent for ${order.order_no}`);
  } catch (error: any) {
    console.error('✗ Failed to send admin order notification:', error.message);
    throw error;
  }
};

/**
 * Customer Order Completed Email Template
 */
const getOrderCompletedTemplate = (): HandlebarsTemplateDelegate => {
  const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order is Complete - TP Portal</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; }
        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .email-header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center; }
        .email-header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .email-header p { color: #e8f5e9; font-size: 16px; }
        .email-body { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333333; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666666; margin-bottom: 30px; line-height: 1.8; }
        .success-box { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4caf50; border-radius: 6px; padding: 25px; margin: 25px 0; text-align: center; }
        .success-box h2 { color: #2e7d32; font-size: 24px; margin-bottom: 10px; }
        .success-box p { color: #666666; font-size: 15px; }
        .highlight-container { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
        .highlight-label { font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .highlight-value { font-size: 36px; font-weight: 700; color: #667eea; margin: 10px 0; font-family: 'Courier New', monospace; }
        .detail-section { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #333333; flex: 0 0 40%; }
        .detail-value { color: #666666; flex: 1; text-align: right; }
        .info-box { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .info-box p { font-size: 14px; color: #0d47a1; margin: 5px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { font-size: 13px; color: #6c757d; margin: 5px 0; }
        @media only screen and (max-width: 600px) {
          .email-container { margin: 20px; }
          .email-header { padding: 30px 20px; }
          .email-body { padding: 30px 20px; }
          .highlight-value { font-size: 28px; }
          .detail-row { flex-direction: column; }
          .detail-value { text-align: left; margin-top: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>TP Portal</h1>
          <p>Order Complete!</p>
        </div>

        <div class="email-body">
          <div class="greeting">Hello {{name}},</div>

          <div class="success-box">
            <h2>🎉 Your Order is Complete!</h2>
            <p>We're excited to let you know that your order has been successfully completed and is ready for download.</p>
          </div>

          <div class="highlight-container">
            <div class="highlight-label">Order Number</div>
            <div class="highlight-value">{{orderNo}}</div>
          </div>

          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Design Name:</span>
              <span class="detail-value">{{designName}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service Type:</span>
              <span class="detail-value">{{serviceType}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Completed:</span>
              <span class="detail-value">{{completedAt}}</span>
            </div>
          </div>

          <div class="info-box">
            <p><strong>📥 Download Your Files:</strong></p>
            <p>Log in to your portal account to download all completed design files.</p>
            <p>Your files will be available for download for 30 days.</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="{{portalUrl}}/orders" class="cta-button">Download Files Now</a>
          </div>

          <div class="message" style="margin-top: 30px;">
            Thank you for choosing TP Portal! If you have any questions or need support, please don't hesitate to contact us.
          </div>
        </div>

        <div class="footer">
          <p><strong>TP Portal</strong></p>
          <p>Your trusted partner for digitizing, vector & patches</p>
          <p style="margin-top: 15px;">Need help? Contact us anytime</p>
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
 * Send customer notification when order is completed
 */
export const sendOrderCompletedNotification = async (
  order: any,
  user: { name: string; email: string }
): Promise<void> => {
  try {
    const template = getOrderCompletedTemplate();
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    const html = template({
      name: user.name,
      orderNo: order.order_no,
      designName: order.design_name,
      serviceType: order.service_type,
      completedAt: new Date().toLocaleString(),
      portalUrl,
    });

    const textContent = `
Hello ${user.name},

Great News! Your Order is Complete!

We're excited to let you know that your order has been successfully completed and is ready for download.

Order Number: ${order.order_no}
Design Name: ${order.design_name}
Service Type: ${order.service_type}
Completed: ${new Date().toLocaleString()}

Download Your Files:
Log in to your portal account to download all completed design files.
Your files will be available for download for 30 days.

Access your files: ${portalUrl}/orders

Thank you for choosing TP Portal! If you have any questions or need support, please don't hesitate to contact us.

Best regards,
TP Portal Team
    `.trim();

    await sendEmail({
      to: user.email,
      subject: `Your Order is Complete - ${order.order_no}`,
      html,
      text: textContent,
    });

    console.log(`✓ Order completed notification sent to ${user.email}`);
  } catch (error: any) {
    console.error('✗ Failed to send order completed notification:', error.message);
    throw error;
  }
};
