import request from 'supertest';
import app from '../../src/app';
import { testConnection } from '../../src/config/database';
import { query } from '../../src/config/database';

describe('Quote Workflow E2E Test', () => {
  let testUser: any;
  let testAdmin: any;
  let userToken: string;
  let adminToken: string;
  let quoteId: number;
  let orderId: number;

  beforeAll(async () => {
    // Ensure database connection
    await testConnection();

    // Create test user
    const userResult: any = await query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'USER'), 1, NOW(), NOW())`,
      ['Test User', 'test@example.com', '$2b$10$hash']
    );
    testUser = { id: userResult.insertId, role: 'USER' };

    // Create test admin
    const adminResult: any = await query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'ADMIN'), 1, NOW(), NOW())`,
      ['Test Admin', 'admin@example.com', '$2b$10$hash']
    );
    testAdmin = { id: adminResult.insertId, role: 'ADMIN' };

    // Mock JWT tokens (simplified for testing)
    userToken = 'mock-user-token';
    adminToken = 'mock-admin-token';
  });

  afterAll(async () => {
    // Clean up test data
    if (orderId) {
      await query('DELETE FROM orders WHERE id = ?', [orderId]);
    }
    if (quoteId) {
      await query('DELETE FROM quotes WHERE id = ?', [quoteId]);
    }
    if (testUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testAdmin?.id) {
      await query('DELETE FROM users WHERE id = ?', [testAdmin.id]);
    }
  });

  it('should complete full quote to order workflow', async () => {
    // Step 1: User creates a quote
    const quoteData = {
      quote_type: 'DIGITIZING',
      design_name: 'Custom Logo Digitizing',
      height: 10,
      width: 5,
      unit: 'inch',
      number_of_colors: 3,
      fabric: 'Cotton',
      color_type: 'RGB',
      placement: ['Left Chest', 'Right Sleeve'],
      required_format: ['DST', 'EMB'],
      instruction: 'High quality digitizing needed for championship team',
      is_urgent: 1,
    };

    const createQuoteResponse = await request(app)
      .post('/api/quotes')
      .set('Authorization', `Bearer ${userToken}`)
      .send(quoteData);

    expect(createQuoteResponse.status).toBe(201);
    expect(createQuoteResponse.body.data.quote_no).toMatch(/^QT-/);
    expect(createQuoteResponse.body.data.status).toBe('PENDING');

    quoteId = createQuoteResponse.body.data.id;

    // Step 2: User can view their quote
    const getQuoteResponse = await request(app)
      .get(`/api/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(getQuoteResponse.status).toBe(200);
    expect(getQuoteResponse.body.data.design_name).toBe('Custom Logo Digitizing');
    expect(getQuoteResponse.body.data.service_type).toBe('DIGITIZING');

    // Step 3: User can update their quote (while still pending)
    const updateData = {
      design_name: 'Updated Custom Logo Digitizing',
      height: 12,
    };

    const updateQuoteResponse = await request(app)
      .put(`/api/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(updateQuoteResponse.status).toBe(200);
    expect(updateQuoteResponse.body.data.design_name).toBe('Updated Custom Logo Digitizing');
    expect(updateQuoteResponse.body.data.height).toBe(12);

    // Step 4: Admin can view all quotes
    const getAllQuotesResponse = await request(app)
      .get('/api/quotes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getAllQuotesResponse.status).toBe(200);
    expect(getAllQuotesResponse.body.data.quotes.length).toBeGreaterThan(0);

    // Step 5: Admin provides pricing for the quote
    const pricingData = {
      price: 150.75,
      currency: 'USD',
      remarks: 'Standard pricing for 3-color digitizing with rush service',
    };

    const pricingResponse = await request(app)
      .patch(`/api/quotes/${quoteId}/pricing`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(pricingData);

    expect(pricingResponse.status).toBe(200);
    expect(pricingResponse.body.data.price).toBe(150.75);
    expect(pricingResponse.body.data.status).toBe('PRICED');
    expect(pricingResponse.body.data.remarks).toBe('Standard pricing for 3-color digitizing with rush service');

    // Step 6: User can view the priced quote
    const getPricedQuoteResponse = await request(app)
      .get(`/api/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(getPricedQuoteResponse.status).toBe(200);
    expect(getPricedQuoteResponse.body.data.price).toBe(150.75);
    expect(getPricedQuoteResponse.body.data.status).toBe('PRICED');

    // Step 7: User converts the priced quote to an order
    const convertResponse = await request(app)
      .post(`/api/quotes/${quoteId}/convert`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(convertResponse.status).toBe(200);
    expect(convertResponse.body.data.quote.status).toBe('CONVERTED');
    expect(convertResponse.body.data.order).toHaveProperty('order_no');
    expect(convertResponse.body.data.order.order_type).toBe('DIGITIZING');
    expect(convertResponse.body.data.order.design_name).toBe('Updated Custom Logo Digitizing');

    orderId = convertResponse.body.data.order.id;

    // Step 8: Verify the quote is now converted and linked to order
    const getConvertedQuoteResponse = await request(app)
      .get(`/api/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(getConvertedQuoteResponse.status).toBe(200);
    expect(getConvertedQuoteResponse.body.data.status).toBe('CONVERTED');
    expect(getConvertedQuoteResponse.body.data.converted_order_id).toBe(orderId);

    // Step 9: User can view their new order
    const getOrderResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(getOrderResponse.status).toBe(200);
    expect(getOrderResponse.body.data.order_no).toMatch(/^TP-/);
    expect(getOrderResponse.body.data.status).toBe('IN_PROGRESS');

    // Step 10: Admin can see both quotes and orders in stats
    const statsResponse = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.data.quotes.total).toBeGreaterThan(0);
    expect(statsResponse.body.data.orders.total).toBeGreaterThan(0);

    // Step 11: Admin cannot delete converted quotes
    const deleteQuoteResponse = await request(app)
      .delete(`/api/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteQuoteResponse.status).toBe(400); // Should fail because quote is converted

    // Step 12: User cannot update converted quotes
    const updateConvertedQuoteResponse = await request(app)
      .put(`/api/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ design_name: 'Should not update' });

    expect(updateConvertedQuoteResponse.status).toBe(403); // Should fail because status is not PENDING
  });

  it('should handle quote rejection workflow', async () => {
    // Create another quote for rejection testing
    const rejectQuoteData = {
      quote_type: 'VECTOR',
      design_name: 'Simple Vector Conversion',
      color_type: 'CMYK',
      instruction: 'Convert logo to vector format',
    };

    const createRejectQuoteResponse = await request(app)
      .post('/api/quotes')
      .set('Authorization', `Bearer ${userToken}`)
      .send(rejectQuoteData);

    const rejectQuoteId = createRejectQuoteResponse.body.data.id;

    // Admin can delete pending quotes (soft rejection)
    const deletePendingQuoteResponse = await request(app)
      .delete(`/api/quotes/${rejectQuoteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deletePendingQuoteResponse.status).toBe(200);

    // Verify quote is deleted
    const getDeletedQuoteResponse = await request(app)
      .get(`/api/quotes/${rejectQuoteId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(getDeletedQuoteResponse.status).toBe(404);
  });
});
