import request from 'supertest';
import app from '../../src/app';
import { testConnection } from '../../src/config/database';
import { query } from '../../src/config/database';

describe('Admin User Management E2E Test', () => {
  let testUser: any;
  let testAdmin: any;
  let anotherUser: any;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Ensure database connection
    await testConnection();

    // Create test admin
    const adminResult: any = await query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'ADMIN'), 1, NOW(), NOW())`,
      ['Test Admin', 'admin@example.com', '$2b$10$hash']
    );
    testAdmin = { id: adminResult.insertId, role: 'ADMIN' };

    // Create test user
    const userResult: any = await query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'USER'), 1, NOW(), NOW())`,
      ['Test User', 'user@example.com', '$2b$10$hash']
    );
    testUser = { id: userResult.insertId, role: 'USER' };

    // Create another user for testing
    const anotherUserResult: any = await query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'USER'), 1, NOW(), NOW())`,
      ['Another User', 'another@example.com', '$2b$10$hash']
    );
    anotherUser = { id: anotherUserResult.insertId, role: 'USER' };

    // Mock JWT tokens (simplified for testing)
    userToken = 'mock-user-token';
    adminToken = 'mock-admin-token';
  });

  afterAll(async () => {
    // Clean up test data
    if (anotherUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [anotherUser.id]);
    }
    if (testUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testAdmin?.id) {
      await query('DELETE FROM users WHERE id = ?', [testAdmin.id]);
    }
  });

  it('should complete admin user management workflow', async () => {
    // Step 1: Admin can view all users
    const getUsersResponse = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getUsersResponse.status).toBe(200);
    expect(getUsersResponse.body.success).toBe(true);
    expect(Array.isArray(getUsersResponse.body.data)).toBe(true);
    expect(getUsersResponse.body.data.length).toBeGreaterThanOrEqual(3); // Admin + 2 test users

    // Find our test users in the response
    const adminUser = getUsersResponse.body.data.find((u: any) => u.id === testAdmin.id);
    const regularUser = getUsersResponse.body.data.find((u: any) => u.id === testUser.id);
    const anotherRegularUser = getUsersResponse.body.data.find((u: any) => u.id === anotherUser.id);

    expect(adminUser).toBeDefined();
    expect(regularUser).toBeDefined();
    expect(anotherRegularUser).toBeDefined();
    expect(adminUser.role).toBe('ADMIN');
    expect(regularUser.role).toBe('USER');
    expect(anotherRegularUser.role).toBe('USER');
    expect(regularUser.is_active).toBe(true);
    expect(anotherRegularUser.is_active).toBe(true);

    // Step 2: Admin can view individual user details
    const getUserResponse = await request(app)
      .get(`/api/admin/users/${testUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getUserResponse.status).toBe(200);
    expect(getUserResponse.body.success).toBe(true);
    expect(getUserResponse.body.data.id).toBe(testUser.id);
    expect(getUserResponse.body.data.name).toBe('Test User');
    expect(getUserResponse.body.data.email).toBe('user@example.com');
    expect(getUserResponse.body.data.role).toBe('USER');
    expect(getUserResponse.body.data.is_active).toBe(true);

    // Step 3: Admin can deactivate a user
    const deactivateResponse = await request(app)
      .patch(`/api/admin/users/${testUser.id}/toggle-status`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deactivateResponse.status).toBe(200);
    expect(deactivateResponse.body.success).toBe(true);
    expect(deactivateResponse.body.data.is_active).toBe(false);
    expect(deactivateResponse.body.message).toContain('deactivated');

    // Step 4: Verify user is deactivated
    const getDeactivatedUserResponse = await request(app)
      .get(`/api/admin/users/${testUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getDeactivatedUserResponse.status).toBe(200);
    expect(getDeactivatedUserResponse.body.data.is_active).toBe(false);

    // Step 5: Admin can reactivate the user
    const reactivateResponse = await request(app)
      .patch(`/api/admin/users/${testUser.id}/toggle-status`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reactivateResponse.status).toBe(200);
    expect(reactivateResponse.body.success).toBe(true);
    expect(reactivateResponse.body.data.is_active).toBe(true);
    expect(reactivateResponse.body.message).toContain('activated');

    // Step 6: Verify user is reactivated
    const getReactivatedUserResponse = await request(app)
      .get(`/api/admin/users/${testUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getReactivatedUserResponse.status).toBe(200);
    expect(getReactivatedUserResponse.body.data.is_active).toBe(true);

    // Step 7: Regular users cannot access admin endpoints
    const userAccessAdminResponse = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(userAccessAdminResponse.status).toBe(403);

    // Step 8: Regular users cannot toggle other users' status
    const userToggleResponse = await request(app)
      .patch(`/api/admin/users/${anotherUser.id}/toggle-status`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(userToggleResponse.status).toBe(403);

    // Step 9: Admin can view system statistics
    const statsResponse = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.data).toHaveProperty('users');
    expect(statsResponse.body.data).toHaveProperty('orders');
    expect(statsResponse.body.data).toHaveProperty('quotes');
    expect(statsResponse.body.data.users).toHaveProperty('total');
    expect(statsResponse.body.data.users).toHaveProperty('active');
    expect(statsResponse.body.data.users.total).toBeGreaterThanOrEqual(3);
    expect(statsResponse.body.data.users.active).toBeGreaterThanOrEqual(3);
  });

  it('should handle edge cases in user management', async () => {
    // Test accessing non-existent user
    const nonExistentUserResponse = await request(app)
      .get('/api/admin/users/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(nonExistentUserResponse.status).toBe(400);
    expect(nonExistentUserResponse.body.success).toBe(false);

    // Test toggling non-existent user
    const toggleNonExistentResponse = await request(app)
      .patch('/api/admin/users/99999/toggle-status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(toggleNonExistentResponse.status).toBe(500); // Database error due to foreign key constraint

    // Test invalid user ID format
    const invalidIdResponse = await request(app)
      .get('/api/admin/users/invalid-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.success).toBe(false);

    // Test unauthenticated access
    const unauthenticatedResponse = await request(app)
      .get('/api/admin/users');

    expect(unauthenticatedResponse.status).toBe(401);
  });
});
