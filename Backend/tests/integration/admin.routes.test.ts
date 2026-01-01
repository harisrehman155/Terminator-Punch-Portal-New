import request from 'supertest';
import app from '../../src/app';
import { testConnection } from '../../src/config/database';
import { query } from '../../src/config/database';

describe('Admin Routes Integration Tests', () => {
  let testUser: any;
  let testAdmin: any;
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
    if (testUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testAdmin?.id) {
      await query('DELETE FROM users WHERE id = ?', [testAdmin.id]);
    }
  });

  describe('GET /api/admin/users', () => {
    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // At least test user and admin
    });

    it('should reject access for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/admin/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/admin/users/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/users/:id/toggle-status', () => {
    it('should toggle user active status for admin', async () => {
      // First get current status
      const initialResponse = await request(app)
        .get(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const initialStatus = initialResponse.body.data.is_active;

      // Toggle status
      const toggleResponse = await request(app)
        .patch(`/api/admin/users/${testUser.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(toggleResponse.status).toBe(200);
      expect(toggleResponse.body.success).toBe(true);
      expect(toggleResponse.body.data.is_active).toBe(!initialStatus);

      // Toggle back to original status for cleanup
      await request(app)
        .patch(`/api/admin/users/${testUser.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should reject status toggle for non-admin', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${testUser.id}/toggle-status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get system statistics for admin', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('quotes');

      expect(response.body.data.users).toHaveProperty('total');
      expect(response.body.data.users).toHaveProperty('active');
      expect(response.body.data.orders).toHaveProperty('total');
      expect(response.body.data.orders).toHaveProperty('pending');
      expect(response.body.data.orders).toHaveProperty('completed');
      expect(response.body.data.quotes).toHaveProperty('total');
      expect(response.body.data.quotes).toHaveProperty('pending');
      expect(response.body.data.quotes).toHaveProperty('priced');
    });

    it('should reject stats access for non-admin', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
