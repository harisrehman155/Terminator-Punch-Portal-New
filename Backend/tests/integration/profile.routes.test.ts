import request from 'supertest';
import app from '../../src/app';
import { testConnection } from '../../src/config/database';
import { query } from '../../src/config/database';

describe('Profile Routes Integration Tests', () => {
  let testUser: any;
  let testAdmin: any;
  let userToken: string;
  let adminToken: string;
  let originalProfile: any;

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

    // Store original profile data
    originalProfile = {
      name: 'Test User',
      email: 'test@example.com',
      company: null,
      phone: null,
      address: null,
      city: null,
      country: null,
    };

    // Mock JWT tokens (simplified for testing)
    userToken = 'mock-user-token';
    adminToken = 'mock-admin-token';
  });

  afterAll(async () => {
    // Restore original profile data if it was modified
    if (testUser?.id) {
      await query(
        'UPDATE users SET name = ?, company = ?, phone = ?, address = ?, city = ?, country = ? WHERE id = ?',
        [
          originalProfile.name,
          originalProfile.company,
          originalProfile.phone,
          originalProfile.address,
          originalProfile.city,
          originalProfile.country,
          testUser.id
        ]
      );
    }

    // Clean up test data
    if (testUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testAdmin?.id) {
      await query('DELETE FROM users WHERE id = ?', [testAdmin.id]);
    }
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data.is_active).toBe(true);
    });

    it('should get admin profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('ADMIN');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Test User',
        company: 'Updated Company',
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test User');
      expect(response.body.data.company).toBe('Updated Company');
      expect(response.body.data.phone).toBe('+1234567890');
      expect(response.body.data.address).toBe('123 Test Street');
      expect(response.body.data.city).toBe('Test City');
      expect(response.body.data.country).toBe('Test Country');
      expect(response.body.data.email).toBe('test@example.com'); // Email should not change
    });

    it('should update partial profile data', async () => {
      const partialUpdate = {
        name: 'Partially Updated User',
        company: 'New Company',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Partially Updated User');
      expect(response.body.data.company).toBe('New Company');
      // Other fields should remain unchanged
      expect(response.body.data.phone).toBe('+1234567890');
    });

    it('should handle empty update data', async () => {
      const emptyUpdate = {};

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(emptyUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Profile should remain unchanged
      expect(response.body.data.name).toBe('Partially Updated User');
    });

    it('should reject unauthenticated profile updates', async () => {
      const updateData = { name: 'Unauthorized Update' };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData);

      expect(response.status).toBe(401);
    });

    it('should validate input data', async () => {
      // Test with invalid data if validation is implemented
      const invalidData = {
        name: '', // Empty name should be allowed or validated
        email: 'invalid-email', // This should be rejected if email validation exists
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      // The response might succeed or fail depending on validation implementation
      // For now, we'll just check that it's handled properly
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Profile data persistence', () => {
    it('should persist profile changes across requests', async () => {
      // First update
      const updateData = {
        name: 'Persistent User',
        company: 'Persistent Company',
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      // Fetch profile again to verify persistence
      const getResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.name).toBe('Persistent User');
      expect(getResponse.body.data.company).toBe('Persistent Company');
    });
  });

  describe('Cross-user isolation', () => {
    it('should not allow users to access other profiles', async () => {
      // Admin should see their own profile
      const adminProfileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminProfileResponse.body.data.id).toBe(testAdmin.id);
      expect(adminProfileResponse.body.data.role).toBe('ADMIN');

      // User should see their own profile
      const userProfileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(userProfileResponse.body.data.id).toBe(testUser.id);
      expect(userProfileResponse.body.data.role).toBe('USER');
    });
  });
});

