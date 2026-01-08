import request from 'supertest';
import type { Response } from 'supertest';
import app from '../../src/app';
import { testConnection, query } from '../../src/config/database';
import { generateToken } from '../../src/config/jwt';

describe('Order Routes Integration Tests', () => {
  let testUser: { id: number; email: string };
  let testAdmin: { id: number; email: string };
  let userToken: string;
  let adminToken: string;
  const createdOrderIds: number[] = [];

  const expectSuccess = (response: Response) => {
    if (Object.prototype.hasOwnProperty.call(response.body, 'success')) {
      expect(response.body.success).toBe(true);
    } else {
      expect(response.body.status).toBe('success');
    }
  };

  const createOrderPayload = {
    order_type: 'DIGITIZING',
    design_name: 'Test Order',
    height: 3.5,
    width: 4.0,
    unit: 'inch',
    number_of_colors: 4,
    fabric: 'Cotton',
    placement: ['Front'],
    required_format: ['DST'],
    instruction: 'Test instructions',
    is_urgent: 1,
  };

  beforeAll(async () => {
    await testConnection();

    const userEmail = `order_user_${Date.now()}@example.com`;
    const adminEmail = `order_admin_${Date.now()}@example.com`;

    const userResult: any = await query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'USER'), 1, NOW(), NOW())`,
      ['Order Test User', userEmail, '$2b$10$hash']
    );
    testUser = { id: userResult.insertId, email: userEmail };

    const adminResult: any = await query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'ADMIN'), 1, NOW(), NOW())`,
      ['Order Test Admin', adminEmail, '$2b$10$hash']
    );
    testAdmin = { id: adminResult.insertId, email: adminEmail };

    userToken = generateToken({
      userId: testUser.id,
      email: testUser.email,
      role: 'USER',
    });

    adminToken = generateToken({
      userId: testAdmin.id,
      email: testAdmin.email,
      role: 'ADMIN',
    });
  });

  afterAll(async () => {
    for (const orderId of createdOrderIds) {
      await query('DELETE FROM orders WHERE id = ?', [orderId]);
    }

    if (testUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testAdmin?.id) {
      await query('DELETE FROM users WHERE id = ?', [testAdmin.id]);
    }
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderPayload);

      expect(response.status).toBe(201);
      expectSuccess(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('order_type', 'DIGITIZING');
      expect(response.body.data).toHaveProperty('design_name', 'Test Order');
      expect(response.body.data).toHaveProperty('status');

      createdOrderIds.push(response.body.data.id);
    });

    it('should validate required order type fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_type: 'VECTOR',
          design_name: 'Missing Color Type',
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/orders', () => {
    it('should list orders for the current user', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should retrieve a single order by id', async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...createOrderPayload,
          design_name: 'Order For Get',
        });

      const orderId = createResponse.body.data.id;
      createdOrderIds.push(orderId);

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data).toHaveProperty('id', orderId);
      expect(response.body.data).toHaveProperty('design_name', 'Order For Get');
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update an order', async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...createOrderPayload,
          design_name: 'Order For Update',
        });

      const orderId = createResponse.body.data.id;
      createdOrderIds.push(orderId);

      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          design_name: 'Updated Order Name',
        });

      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data).toHaveProperty('design_name', 'Updated Order Name');
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    it('should cancel an order', async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...createOrderPayload,
          design_name: 'Order For Cancel',
        });

      const orderId = createResponse.body.data.id;
      createdOrderIds.push(orderId);

      const response = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data).toHaveProperty('status', 'CANCELLED');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should allow admin to update order status', async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...createOrderPayload,
          design_name: 'Order For Status Update',
        });

      const orderId = createResponse.body.data.id;
      createdOrderIds.push(orderId);

      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
      expectSuccess(response);
      expect(response.body.data).toHaveProperty('status', 'COMPLETED');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should allow admin to delete an order', async () => {
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...createOrderPayload,
          design_name: 'Order For Delete',
        });

      const orderId = createResponse.body.data.id;
      createdOrderIds.push(orderId);

      const response = await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expectSuccess(response);
    });
  });
});
