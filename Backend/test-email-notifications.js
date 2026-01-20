/**
 * Standalone Email Notification Test Script
 * Tests all 4 email notification types without requiring database
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Mock data for testing
const mockQuote = {
  id: 1,
  quote_no: 'Q-2026-001',
  service_type: 'DIGITIZING',
  design_name: 'Company Logo Embroidery',
  height: 4,
  width: 4,
  unit: 'INCH',
  number_of_colors: 5,
  fabric: 'Cotton',
  placement: 'Left Chest',
  required_format: 'DST',
  is_urgent: true,
  instruction: 'Please ensure high quality output',
  status: 'PRICED',
  price: 25.00,
  currency: 'USD',
  admin_remarks: 'Standard digitizing service. Will be completed in 2 business days.',
  created_at: new Date(),
};

const mockOrder = {
  id: 1,
  order_no: 'O-2026-001',
  order_type: 'VECTOR',
  design_name: 'Logo Vectorization',
  height: 5,
  width: 5,
  unit: 'INCH',
  color_type: 'Full Color',
  required_format: 'AI, EPS',
  is_urgent: false,
  instruction: 'Vector conversion needed',
  status: 'COMPLETED',
  created_at: new Date(),
};

const mockUser = {
  name: 'John Doe',
  email: 'harisrehman155@gmail.com', // Test email
  company: 'ABC Corporation',
};

const adminEmail = process.env.ADMIN_EMAIL || 'harisrehman155@gmail.com';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Email templates
const createAdminQuoteEmail = (quote, user) => {
  const urgentBadge = quote.is_urgent
    ? '<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">URGENT</span>'
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 24px;">New Quote Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Hello Admin,</p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">A new quote request has been submitted.</p>

              <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Quote Number: ${quote.quote_no} ${urgentBadge}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Service Type:</strong> ${quote.service_type}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Design Name:</strong> ${quote.design_name}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Dimensions:</strong> ${quote.height} x ${quote.width} ${quote.unit}</p>
                ${quote.number_of_colors ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Colors:</strong> ${quote.number_of_colors}</p>` : ''}
                ${quote.fabric ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Fabric:</strong> ${quote.fabric}</p>` : ''}
                ${quote.color_type ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Color Type:</strong> ${quote.color_type}</p>` : ''}
              </div>

              <div style="background: #eff6ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Customer Information</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${user.name}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Company:</strong> ${user.company}</p>
              </div>

              ${quote.instruction ? `
              <div style="margin: 20px 0;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Instructions:</p>
                <p style="margin: 0; color: #4b5563; font-style: italic;">${quote.instruction}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/admin/quotes/${quote.id}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Quote Details</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">TP Portal - Embroidery Digitizing Services</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const createCustomerQuotePricedEmail = (quote, user) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 24px;">Your Quote is Ready!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Hello ${user.name},</p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Great news! Your quote has been priced and is ready for review.</p>

              <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 18px; font-weight: bold; color: #166534;">Quote Amount</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #22c55e;">${quote.currency} $${quote.price.toFixed(2)}</p>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Quote Details</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Quote Number:</strong> ${quote.quote_no}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Service Type:</strong> ${quote.service_type}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Design Name:</strong> ${quote.design_name}</p>
              </div>

              ${quote.admin_remarks ? `
              <div style="background: #eff6ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Admin Remarks:</p>
                <p style="margin: 0; color: #4b5563;">${quote.admin_remarks}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/quotes/${quote.id}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Quote & Convert to Order</a>
              </div>

              <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">Ready to proceed? You can convert this quote to an order directly from your dashboard.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">TP Portal - Embroidery Digitizing Services</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const createAdminOrderEmail = (order, user, quoteReference) => {
  const urgentBadge = order.is_urgent
    ? '<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">URGENT</span>'
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 24px;">New Order Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Hello Admin,</p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">A new order has been ${quoteReference ? 'created from quote ' + quoteReference : 'placed'}.</p>

              <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Order Number: ${order.order_no} ${urgentBadge}</p>
                ${quoteReference ? `<p style="margin: 5px 0; color: #4b5563;"><strong>From Quote:</strong> ${quoteReference}</p>` : ''}
                <p style="margin: 5px 0; color: #4b5563;"><strong>Service Type:</strong> ${order.order_type}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Design Name:</strong> ${order.design_name}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Dimensions:</strong> ${order.height} x ${order.width} ${order.unit}</p>
                ${order.color_type ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Color Type:</strong> ${order.color_type}</p>` : ''}
              </div>

              <div style="background: #eff6ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Customer Information</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${user.name}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Company:</strong> ${user.company}</p>
              </div>

              ${order.instruction ? `
              <div style="margin: 20px 0;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Instructions:</p>
                <p style="margin: 0; color: #4b5563; font-style: italic;">${order.instruction}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/admin/orders/${order.id}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Details</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">TP Portal - Embroidery Digitizing Services</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const createCustomerOrderCompletedEmail = (order, user) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Complete</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 24px;">Your Order is Complete!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Hello ${user.name},</p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Excellent news! Your order has been completed and is ready for download.</p>

              <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #166534;">✓ Order Completed Successfully</p>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">Order Details</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Order Number:</strong> ${order.order_no}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Service Type:</strong> ${order.order_type}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Design Name:</strong> ${order.design_name}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/orders/${order.id}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Files</a>
              </div>

              <div style="background: #eff6ff; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">Your completed files are available in your dashboard. Click the button above to access and download them.</p>
              </div>

              <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280;">Thank you for choosing TP Portal for your embroidery digitizing needs!</p>
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">TP Portal - Embroidery Digitizing Services</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Test functions
async function testAdminQuoteNotification() {
  console.log('\n📧 Testing Admin Quote Notification...');

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: adminEmail,
      subject: `New Quote Request - ${mockQuote.quote_no}`,
      html: createAdminQuoteEmail(mockQuote, mockUser),
      text: `New quote request from ${mockUser.name} (${mockUser.company})\nQuote: ${mockQuote.quote_no}\nService: ${mockQuote.service_type}\nDesign: ${mockQuote.design_name}`,
    });
    console.log('✓ Admin quote notification sent successfully');
  } catch (error) {
    console.error('✗ Failed to send admin quote notification:', error.message);
  }
}

async function testCustomerQuotePricedNotification() {
  console.log('\n📧 Testing Customer Quote Priced Notification...');

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: mockUser.email,
      subject: `Your Quote is Ready - ${mockQuote.quote_no}`,
      html: createCustomerQuotePricedEmail(mockQuote, mockUser),
      text: `Hello ${mockUser.name},\n\nYour quote ${mockQuote.quote_no} has been priced at ${mockQuote.currency} $${mockQuote.price}.\n\nView your quote at: ${frontendUrl}/quotes/${mockQuote.id}`,
    });
    console.log('✓ Customer quote priced notification sent successfully');
  } catch (error) {
    console.error('✗ Failed to send customer quote priced notification:', error.message);
  }
}

async function testAdminOrderNotification() {
  console.log('\n📧 Testing Admin Order Notification (with quote reference)...');

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: adminEmail,
      subject: `New Order Received - ${mockOrder.order_no}`,
      html: createAdminOrderEmail(mockOrder, mockUser, mockQuote.quote_no),
      text: `New order from ${mockUser.name} (${mockUser.company})\nOrder: ${mockOrder.order_no}\nConverted from Quote: ${mockQuote.quote_no}\nService: ${mockOrder.order_type}\nDesign: ${mockOrder.design_name}`,
    });
    console.log('✓ Admin order notification sent successfully');
  } catch (error) {
    console.error('✗ Failed to send admin order notification:', error.message);
  }
}

async function testCustomerOrderCompletedNotification() {
  console.log('\n📧 Testing Customer Order Completed Notification...');

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: mockUser.email,
      subject: `Your Order is Complete - ${mockOrder.order_no}`,
      html: createCustomerOrderCompletedEmail(mockOrder, mockUser),
      text: `Hello ${mockUser.name},\n\nYour order ${mockOrder.order_no} has been completed!\n\nDownload your files at: ${frontendUrl}/orders/${mockOrder.id}`,
    });
    console.log('✓ Customer order completed notification sent successfully');
  } catch (error) {
    console.error('✗ Failed to send customer order completed notification:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Email Notification Tests...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await testAdminQuoteNotification();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between emails

  await testCustomerQuotePricedNotification();
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testAdminOrderNotification();
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testCustomerOrderCompletedNotification();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All email notification tests completed!');
  console.log(`📬 Check inbox: ${mockUser.email}`);
  console.log(`📬 Check admin inbox: ${adminEmail}`);
}

runAllTests().catch(console.error);
