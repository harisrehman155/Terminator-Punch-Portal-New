import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';
import * as InvoiceModel from '../models/invoice.model';
import { DatabaseError } from '../utils/errors';

/**
 * PDF Service - Generate professional invoice PDFs using Puppeteer
 */

const PDF_STORAGE_DIR = path.join(__dirname, '../../invoices');

/**
 * Ensure storage directory exists
 */
const ensureStorageDir = async (): Promise<void> => {
  try {
    await fs.access(PDF_STORAGE_DIR);
  } catch {
    await fs.mkdir(PDF_STORAGE_DIR, { recursive: true });
  }
};

/**
 * Professional Invoice PDF Template
 * Matches the email template style with purple gradient header
 */
const getInvoiceTemplate = (): HandlebarsTemplateDelegate => {
  const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice {{invoiceNo}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background-color: #f9fafb;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .header p {
      font-size: 16px;
      color: #e0e7ff;
      margin: 0;
    }

    .invoice-info-section {
      padding: 40px;
    }

    .invoice-header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #e5e7eb;
    }

    .invoice-number-block {
      flex: 1;
    }

    .invoice-number {
      font-size: 28px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 12px;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-unpaid {
      background: #fef3c7;
      color: #92400e;
      border: 2px solid #fbbf24;
    }

    .status-paid {
      background: #d1fae5;
      color: #065f46;
      border: 2px solid #10b981;
    }

    .lock-icon {
      margin-left: 8px;
    }

    .billing-period-block {
      text-align: right;
    }

    .billing-period {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .date-info {
      font-size: 14px;
      color: #6b7280;
      margin: 4px 0;
    }

    .parties-row {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-bottom: 30px;
    }

    .party-block {
      flex: 1;
    }

    .party-block h3 {
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .party-block p {
      font-size: 14px;
      color: #4b5563;
      margin: 4px 0;
    }

    .party-block .company-name {
      font-weight: 700;
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .notes-section {
      background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
      padding: 20px;
      border-left: 4px solid #667eea;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .notes-section p {
      font-size: 14px;
      color: #4338ca;
      margin: 0;
      line-height: 1.6;
    }

    .notes-section strong {
      font-weight: 700;
      color: #3730a3;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }

    thead {
      background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
    }

    th {
      padding: 16px;
      text-align: left;
      font-weight: 700;
      font-size: 13px;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 3px solid #667eea;
    }

    th:last-child {
      text-align: right;
    }

    tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }

    tbody tr:hover {
      background-color: #f9fafb;
    }

    td {
      padding: 16px;
      font-size: 14px;
      color: #374151;
    }

    td:last-child {
      text-align: right;
      font-weight: 600;
    }

    .order-number {
      color: #667eea;
      font-weight: 600;
    }

    .service-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .totals-section {
      margin-top: 40px;
      display: flex;
      justify-content: flex-end;
    }

    .totals-block {
      width: 350px;
      background: #f9fafb;
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 15px;
    }

    .totals-row.subtotal {
      color: #6b7280;
      border-bottom: 1px solid #d1d5db;
    }

    .totals-row.tax {
      color: #6b7280;
      border-bottom: 1px solid #d1d5db;
    }

    .totals-row.total {
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
      margin-top: 12px;
      padding-top: 16px;
      border-top: 3px solid #667eea;
    }

    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
    }

    .footer-brand {
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 8px;
    }

    .footer-tagline {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .footer-contact {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 16px;
    }

    .footer-disclaimer {
      font-size: 12px;
      color: #9ca3af;
      font-style: italic;
    }

    @media print {
      body {
        background-color: white;
        padding: 0;
      }

      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <h1>TP Portal</h1>
      <p>Professional Digitizing, Vector & Patches Services</p>
    </div>

    <!-- Invoice Information -->
    <div class="invoice-info-section">
      <!-- Invoice Number & Billing Period -->
      <div class="invoice-header-row">
        <div class="invoice-number-block">
          <div class="invoice-number">{{invoiceNo}}</div>
          <span class="status-badge status-{{statusClass}}">
            {{status}}{{#if isLocked}} <span class="lock-icon">🔒</span>{{/if}}
          </span>
        </div>
        <div class="billing-period-block">
          <div class="billing-period">{{billingPeriod}}</div>
          <div class="date-info"><strong>Invoice Date:</strong> {{invoiceDate}}</div>
          {{#if paidAt}}
          <div class="date-info"><strong>Paid On:</strong> {{paidAt}}</div>
          {{/if}}
        </div>
      </div>

      <!-- Bill To / From -->
      <div class="parties-row">
        <div class="party-block">
          <h3>Bill To</h3>
          <p class="company-name">{{customerName}}</p>
          {{#if customerCompany}}<p>{{customerCompany}}</p>{{/if}}
          <p>{{customerEmail}}</p>
        </div>
        <div class="party-block">
          <h3>From</h3>
          <p class="company-name">TP Portal</p>
          <p>Professional Design Services</p>
          <p>support@tpportal.com</p>
        </div>
      </div>

      <!-- Admin Notes -->
      {{#if notes}}
      <div class="notes-section">
        <p><strong>Notes:</strong> {{notes}}</p>
      </div>
      {{/if}}

      <!-- Invoice Items Table -->
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Description</th>
            <th>Service</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td><span class="order-number">{{orderNo}}</span></td>
            <td>{{description}}</td>
            <td><span class="service-badge">{{serviceType}}</span></td>
            <td style="text-align: center;">{{quantity}}</td>
            <td style="text-align: right;">{{currency}} {{unitPrice}}</td>
            <td style="text-align: right;">{{currency}} {{lineTotal}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-block">
          <div class="totals-row subtotal">
            <span>Subtotal:</span>
            <span>{{currency}} {{subtotal}}</span>
          </div>
          {{#if taxAmount}}
          <div class="totals-row tax">
            <span>Tax ({{taxRate}}%):</span>
            <span>{{currency}} {{taxAmount}}</span>
          </div>
          {{/if}}
          <div class="totals-row total">
            <span>TOTAL:</span>
            <span>{{currency}} {{totalAmount}}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">TP Portal</div>
        <div class="footer-tagline">Your trusted partner for digitizing, vector & patches services</div>
        <div class="footer-contact">Need help? Contact us at support@tpportal.com</div>
        <div class="footer-disclaimer">This is a system-generated invoice.</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return Handlebars.compile(template);
};

/**
 * Generate PDF for invoice
 * @param invoiceId - Invoice ID to generate PDF for
 * @returns Path to the generated PDF file
 */
export const generateInvoicePDF = async (invoiceId: number): Promise<string> => {
  try {
    await ensureStorageDir();

    // Get invoice data with all details
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new DatabaseError('Invoice not found');
    }

    // Prepare template data
    const template = getInvoiceTemplate();
    const html = template({
      invoiceNo: invoice.invoice_no,
      status: invoice.status,
      statusClass: invoice.status === 'PAID' ? 'paid' : 'unpaid',
      isLocked: invoice.is_locked === 1,
      billingPeriod: invoice.billing_period,
      invoiceDate: new Date(invoice.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      paidAt: invoice.paid_at
        ? new Date(invoice.paid_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : null,
      customerName: invoice.user_name,
      customerCompany: invoice.user_company,
      customerEmail: invoice.user_email,
      notes: invoice.notes,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal || 0).toFixed(2),
      taxRate: Number(invoice.tax_rate || 0).toFixed(2),
      taxAmount: Number(invoice.tax_amount || 0).toFixed(2),
      totalAmount: Number(invoice.total_amount || 0).toFixed(2),
      items: invoice.items.map((item) => ({
        orderNo: item.order_no,
        description: item.description,
        serviceType: item.service_type,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price || 0).toFixed(2),
        lineTotal: Number(item.line_total || 0).toFixed(2),
        currency: invoice.currency,
      })),
    });

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfFileName = `${invoice.invoice_no}.pdf`;
      const pdfPath = path.join(PDF_STORAGE_DIR, pdfFileName);

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      console.log(`✓ PDF generated successfully: ${pdfFileName}`);
      return pdfPath;
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    throw new DatabaseError(`Failed to generate invoice PDF: ${error.message}`);
  }
};

/**
 * Generate PDF buffer for email attachment
 * @param invoiceId - Invoice ID
 * @returns PDF as Buffer
 */
export const generateInvoicePDFBuffer = async (invoiceId: number): Promise<Buffer> => {
  try {
    // Get invoice data
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new DatabaseError('Invoice not found');
    }

    // Prepare template data
    const template = getInvoiceTemplate();
    const html = template({
      invoiceNo: invoice.invoice_no,
      status: invoice.status,
      statusClass: invoice.status === 'PAID' ? 'paid' : 'unpaid',
      isLocked: invoice.is_locked === 1,
      billingPeriod: invoice.billing_period,
      invoiceDate: new Date(invoice.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      paidAt: invoice.paid_at
        ? new Date(invoice.paid_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : null,
      customerName: invoice.user_name,
      customerCompany: invoice.user_company,
      customerEmail: invoice.user_email,
      notes: invoice.notes,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal || 0).toFixed(2),
      taxRate: Number(invoice.tax_rate || 0).toFixed(2),
      taxAmount: Number(invoice.tax_amount || 0).toFixed(2),
      totalAmount: Number(invoice.total_amount || 0).toFixed(2),
      items: invoice.items.map((item) => ({
        orderNo: item.order_no,
        description: item.description,
        serviceType: item.service_type,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price || 0).toFixed(2),
        lineTotal: Number(item.line_total || 0).toFixed(2),
        currency: invoice.currency,
      })),
    });

    // Generate PDF buffer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    console.error('Error generating invoice PDF buffer:', error);
    throw new DatabaseError(`Failed to generate invoice PDF buffer: ${error.message}`);
  }
};

/**
 * Delete invoice PDF file
 * @param pdfPath - Path to PDF file
 */
export const deleteInvoicePDF = async (pdfPath: string): Promise<void> => {
  try {
    await fs.unlink(pdfPath);
    console.log(`✓ PDF deleted: ${pdfPath}`);
  } catch (error: any) {
    console.error('Error deleting PDF:', error);
    // Don't throw error if file doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};
