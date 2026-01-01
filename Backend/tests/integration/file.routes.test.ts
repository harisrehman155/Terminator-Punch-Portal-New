import request from 'supertest';
import app from '../../src/app';
import { testConnection } from '../../src/config/database';
import { query } from '../../src/config/database';
import fs from 'fs';
import path from 'path';

describe('File Routes Integration Tests', () => {
  let testUser: any;
  let testAdmin: any;
  let testOrder: any;
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

    // Create test order
    const orderResult: any = await query(
      `INSERT INTO orders (user_id, order_no, order_type, status, design_name, created_at, updated_at)
       VALUES (?, ?, 'DIGITIZING', 'IN_PROGRESS', 'Test Design', NOW(), NOW())`,
      [testUser.id, 'TP-20241201-0001']
    );
    testOrder = { id: orderResult.insertId };

    // Create test quote
    const quoteResult: any = await query(
      `INSERT INTO quotes (user_id, quote_no, service_type_id, status_id, design_name, created_at, updated_at)
       VALUES (?, ?, (SELECT id FROM lookups WHERE lookup_value = 'DIGITIZING'), (SELECT id FROM lookups WHERE lookup_value = 'PENDING'), 'Test Quote Design', NOW(), NOW())`,
      [testUser.id, 'QT-20241201-0001']
    );
    testQuote = { id: quoteResult.insertId };

    // Mock JWT tokens (simplified for testing)
    userToken = 'mock-user-token';
    adminToken = 'mock-admin-token';
  });

  afterAll(async () => {
    // Clean up uploaded files
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }

    // Clean up temp files
    const tempDir = path.join(process.cwd(), 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Clean up test data
    if (testQuote?.id) {
      await query('DELETE FROM quotes WHERE id = ?', [testQuote.id]);
    }
    if (testOrder?.id) {
      await query('DELETE FROM orders WHERE id = ?', [testOrder.id]);
    }
    if (testUser?.id) {
      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testAdmin?.id) {
      await query('DELETE FROM users WHERE id = ?', [testAdmin.id]);
    }
  });

  describe('POST /api/files/orders/:orderId/upload', () => {
    it('should upload file for user\'s own order', async () => {
      const testFilePath = path.join(__dirname, '../fixtures/test-image.jpg');

      // Create a simple test file if it doesn't exist
      if (!fs.existsSync(testFilePath)) {
        const testDir = path.dirname(testFilePath);
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        // Create a minimal JPEG file (just headers)
        const jpegHeader = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
        ]);
        fs.writeFileSync(testFilePath, jpegHeader);
      }

      const response = await request(app)
        .post(`/api/files/orders/${testOrder.id}/upload`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', testFilePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data.entity_type).toBe('order');
      expect(response.body.data.entity_id).toBe(testOrder.id);

      // Store file ID for cleanup
      const uploadedFile = response.body.data;
      testOrder.fileId = uploadedFile.id;
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post(`/api/files/orders/${testOrder.id}/upload`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject upload for non-existent order', async () => {
      const response = await request(app)
        .post('/api/files/orders/99999/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('test'), 'test.txt');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/files/quotes/:quoteId/upload', () => {
    it('should upload file for user\'s own quote', async () => {
      const response = await request(app)
        .post(`/api/files/quotes/${testQuote.id}/upload`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data.entity_type).toBe('quote');
      expect(response.body.data.entity_id).toBe(testQuote.id);

      // Store file ID for cleanup
      testQuote.fileId = response.body.data.id;
    });
  });

  describe('GET /api/files/orders/:orderId', () => {
    it('should get files for user\'s own order', async () => {
      const response = await request(app)
        .get(`/api/files/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/files/quotes/:quoteId', () => {
    it('should get files for user\'s own quote', async () => {
      const response = await request(app)
        .get(`/api/files/quotes/${testQuote.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/files/my-files', () => {
    it('should get user\'s uploaded files', async () => {
      const response = await request(app)
        .get('/api/files/my-files')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/files/:fileId', () => {
    it('should delete user\'s own uploaded file', async () => {
      const response = await request(app)
        .delete(`/api/files/${testOrder.fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should delete quote file for user', async () => {
      const response = await request(app)
        .delete(`/api/files/${testQuote.fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
