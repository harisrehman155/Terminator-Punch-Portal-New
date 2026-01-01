import request from 'supertest';
import app from '../../src/app';
import { testConnection } from '../../src/config/database';
import { query } from '../../src/config/database';

describe('Quote Routes Integration Tests', () => {
  let testUser: any;
  let testAdmin: any;
  let testQuote: any;
  let userToken: string;
  let adminToken: string;

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
    if (testQuote?.id) {
      await query('DELETE FROM quotes WHERE id = ?', [testQuote.id]);
    }
    if (testUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testAdmin?.id) {
      await query('DELETE FROM users WHERE id = ?', [testAdmin.id]);
    }
  });

  describe('POST /api/quotes', () => {
    it('should create a new quote for authenticated user', async () => {
      const quoteData = {
        quote_type: 'DIGITIZING',
        design_name: 'Test Design',
        height: 10,
        width: 5,
        unit: 'inch',
        number_of_colors: 3,
        fabric: 'Cotton',
        is_urgent: 0,
      };

      const response = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${userToken}`)
        .send(quoteData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('quote_no');
      expect(response.body.data.service_type).toBe('DIGITIZING');
      expect(response.body.data.design_name).toBe('Test Design');

      testQuote = response.body.data;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({ quote_type: 'DIGITIZING', design_name: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/quotes', () => {
    it('should get all quotes for admin', async () => {
      const response = await request(app)
        .get('/api/quotes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.quotes)).toBe(true);
    });

    it('should get user quotes for regular user', async () => {
      const response = await request(app)
        .get('/api/quotes')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.quotes)).toBe(true);
    });
  });

  describe('GET /api/quotes/:id', () => {
    it('should get quote by ID for owner', async () => {
      const response = await request(app)
        .get(`/api/quotes/${testQuote.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testQuote.id);
    });

    it('should get quote by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/quotes/${testQuote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testQuote.id);
    });

    it('should return 404 for non-existent quote', async () => {
      const response = await request(app)
        .get('/api/quotes/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/quotes/:id', () => {
    it('should update quote for owner', async () => {
      const updateData = {
        design_name: 'Updated Design Name',
        height: 12,
      };

      const response = await request(app)
        .put(`/api/quotes/${testQuote.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.design_name).toBe('Updated Design Name');
      expect(response.body.data.height).toBe(12);
    });

    it('should update quote for admin', async () => {
      const updateData = {
        fabric: 'Polyester',
      };

      const response = await request(app)
        .put(`/api/quotes/${testQuote.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fabric).toBe('Polyester');
    });
  });

  describe('PATCH /api/quotes/:id/pricing', () => {
    it('should update quote pricing for admin', async () => {
      const pricingData = {
        price: 150.50,
        currency: 'USD',
        remarks: 'Standard pricing',
      };

      const response = await request(app)
        .patch(`/api/quotes/${testQuote.id}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pricingData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(150.5);
      expect(response.body.data.status).toBe('PRICED');
    });

    it('should reject pricing update for non-admin', async () => {
      const pricingData = {
        price: 100,
      };

      const response = await request(app)
        .patch(`/api/quotes/${testQuote.id}/pricing`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(pricingData);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/quotes/:id/convert', () => {
    it('should convert priced quote to order for owner', async () => {
      const response = await request(app)
        .post(`/api/quotes/${testQuote.id}/convert`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quote.status).toBe('CONVERTED');
      expect(response.body.data.order).toHaveProperty('order_no');
    });

    it('should reject conversion of non-priced quote', async () => {
      // First create another quote
      const quoteData = {
        quote_type: 'VECTOR',
        design_name: 'Another Design',
        color_type: 'CMYK',
      };

      const createResponse = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${userToken}`)
        .send(quoteData);

      const newQuote = createResponse.body.data;

      // Try to convert without pricing
      const response = await request(app)
        .post(`/api/quotes/${newQuote.id}/convert`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);

      // Clean up
      await query('DELETE FROM quotes WHERE id = ?', [newQuote.id]);
    });
  });

  describe('DELETE /api/quotes/:id', () => {
    it('should delete quote for admin', async () => {
      const response = await request(app)
        .delete(`/api/quotes/${testQuote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject quote deletion for non-admin', async () => {
      const response = await request(app)
        .delete(`/api/quotes/${testQuote.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
