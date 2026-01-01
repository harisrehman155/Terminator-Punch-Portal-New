import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import app from '../../src/app';
import { executeQuery } from '../../src/database/connection';

describe('Auth Routes Integration Tests', () => {
  let testUserId: number;
  let authToken: string;
  let resetToken: string;
  const testEmail = `test_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Setup: Ensure database connection
    // Clean up any existing test data
    await executeQuery('DELETE FROM users WHERE email LIKE ?', ['test_%@example.com']);
  });

  afterAll(async () => {
    // Cleanup: Remove test user
    if (testUserId) {
      await executeQuery('DELETE FROM users WHERE id = ?', [testUserId]);
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: testEmail,
          password: 'Test@1234'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', testEmail);
      expect(response.body.data.user).toHaveProperty('role_name', 'USER');
      expect(response.body.data.user).not.toHaveProperty('password_hash');

      testUserId = response.body.data.user.id;
      authToken = response.body.data.token;
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: testEmail,
          password: 'Test@1234'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('email');
    });

    it('should return 422 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Test@1234'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'new@example.com',
          password: 'weak'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Test@1234'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', testEmail);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword@123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@1234'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 422 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', testEmail);
      expect(response.body.data).toHaveProperty('role_name');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send OTP for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('OTP');
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 422 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    let testOtp: string;

    beforeEach(async () => {
      // Get OTP from database for testing
      const result = await executeQuery(
        'SELECT otp_code FROM users WHERE id = ?',
        [testUserId]
      );
      testOtp = result[0]?.otp_code;
    });

    it('should verify valid OTP', async () => {
      if (!testOtp) {
        // First send forgot password to generate OTP
        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: testEmail });

        // Get the OTP
        const result = await executeQuery(
          'SELECT otp_code FROM users WHERE id = ?',
          [testUserId]
        );
        testOtp = result[0]?.otp_code;
      }

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: testEmail,
          otp: testOtp
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('resetToken');

      resetToken = response.body.data.resetToken;
    });

    it('should return 401 for invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: testEmail,
          otp: '000000'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 422 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: testEmail })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: resetToken,
          newPassword: 'NewPassword@123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'NewPassword@123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
    });

    it('should return 401 for invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: 'invalid_token',
          newPassword: 'NewPassword@123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 422 for weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: resetToken,
          newPassword: 'weak'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          company: 'Test Company',
          phone: '+1234567890'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Updated Name');
      expect(response.body.data).toHaveProperty('company', 'Test Company');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should not allow email update', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'newemail@example.com' })
        .expect(200);

      // Email should not be changed
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(meResponse.body.data.email).toBe(testEmail);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const promises = [];

      // Send 101 requests (rate limit is 100 per 15 minutes)
      for (let i = 0; i < 101; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'Test@1234'
            })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
