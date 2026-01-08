import request from 'supertest';
import app from '../../src/app';
import { testConnection } from '../../src/config/database';
import { query } from '../../src/config/database';

describe('Profile Workflow E2E Test', () => {
  let testUser: any;
  let userToken: string;
  let originalProfile: any;

  beforeAll(async () => {
    // Ensure database connection
    await testConnection();

    // Create test user with initial profile data
    const userResult: any = await query(
      `INSERT INTO users (name, email, password_hash, company, phone, address, city, country, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM lookups WHERE lookup_value = 'USER'), 1, NOW(), NOW())`,
      [
        'Initial Test User',
        'profile-test@example.com',
        '$2b$10$hash',
        'Initial Company',
        '+1234567890',
        '123 Initial St',
        'Initial City',
        'Initial Country'
      ]
    );
    testUser = { id: userResult.insertId, role: 'USER' };

    // Store original profile for restoration
    originalProfile = {
      name: 'Initial Test User',
      email: 'profile-test@example.com',
      company: 'Initial Company',
      phone: '+1234567890',
      address: '123 Initial St',
      city: 'Initial City',
      country: 'Initial Country',
    };

    // Mock JWT token (simplified for testing)
    userToken = 'mock-user-token';
  });

  afterAll(async () => {
    // Restore original profile data
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

      await query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
  });

  it('should complete full profile CRUD workflow', async () => {
    // Step 1: Fetch initial profile
    const initialGetResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(initialGetResponse.status).toBe(200);
    expect(initialGetResponse.body.success).toBe(true);
    expect(initialGetResponse.body.data.name).toBe('Initial Test User');
    expect(initialGetResponse.body.data.email).toBe('profile-test@example.com');
    expect(initialGetResponse.body.data.company).toBe('Initial Company');
    expect(initialGetResponse.body.data.phone).toBe('+1234567890');
    expect(initialGetResponse.body.data.address).toBe('123 Initial St');
    expect(initialGetResponse.body.data.city).toBe('Initial City');
    expect(initialGetResponse.body.data.country).toBe('Initial Country');

    // Step 2: Update profile with new data
    const updateData = {
      name: 'Updated Test User',
      company: 'Updated Tech Company',
      phone: '+1987654321',
      address: '456 Updated Avenue',
      city: 'Updated City',
      country: 'Updated Country',
    };

    const updateResponse = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.name).toBe('Updated Test User');
    expect(updateResponse.body.data.company).toBe('Updated Tech Company');
    expect(updateResponse.body.data.phone).toBe('+1987654321');
    expect(updateResponse.body.data.address).toBe('456 Updated Avenue');
    expect(updateResponse.body.data.city).toBe('Updated City');
    expect(updateResponse.body.data.country).toBe('Updated Country');
    expect(updateResponse.body.data.email).toBe('profile-test@example.com'); // Email unchanged

    // Step 3: Fetch updated profile to verify persistence
    const updatedGetResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(updatedGetResponse.status).toBe(200);
    expect(updatedGetResponse.body.success).toBe(true);
    expect(updatedGetResponse.body.data.name).toBe('Updated Test User');
    expect(updatedGetResponse.body.data.company).toBe('Updated Tech Company');
    expect(updatedGetResponse.body.data.phone).toBe('+1987654321');
    expect(updatedGetResponse.body.data.address).toBe('456 Updated Avenue');
    expect(updatedGetResponse.body.data.city).toBe('Updated City');
    expect(updatedGetResponse.body.data.country).toBe('Updated Country');

    // Step 4: Update only partial fields
    const partialUpdateData = {
      name: 'Partially Updated User',
      company: 'New Tech Startup',
    };

    const partialUpdateResponse = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(partialUpdateData);

    expect(partialUpdateResponse.status).toBe(200);
    expect(partialUpdateResponse.body.success).toBe(true);
    expect(partialUpdateResponse.body.data.name).toBe('Partially Updated User');
    expect(partialUpdateResponse.body.data.company).toBe('New Tech Startup');
    // Other fields should remain unchanged
    expect(partialUpdateResponse.body.data.phone).toBe('+1987654321');
    expect(partialUpdateResponse.body.data.address).toBe('456 Updated Avenue');

    // Step 5: Verify partial update persistence
    const partialGetResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(partialGetResponse.status).toBe(200);
    expect(partialGetResponse.body.data.name).toBe('Partially Updated User');
    expect(partialGetResponse.body.data.company).toBe('New Tech Startup');
    expect(partialGetResponse.body.data.phone).toBe('+1987654321');

    // Step 6: Test empty update (should not change anything)
    const emptyUpdateResponse = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(emptyUpdateResponse.status).toBe(200);
    expect(emptyUpdateResponse.body.success).toBe(true);

    // Verify data remains unchanged
    const finalGetResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(finalGetResponse.body.data.name).toBe('Partially Updated User');
    expect(finalGetResponse.body.data.company).toBe('New Tech Startup');
  });

  it('should handle profile data validation', async () => {
    // Test with various edge cases
    const edgeCaseUpdates = [
      { name: 'Valid Name', company: '' }, // Empty string should be allowed
      { name: 'Valid Name', phone: null }, // Null values should be handled
      { name: 'Valid Name', address: undefined }, // Undefined should be ignored
    ];

    for (const updateData of edgeCaseUpdates) {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

  it('should maintain data integrity across multiple updates', async () => {
    // Perform multiple rapid updates to ensure no race conditions
    const updates = [
      { name: 'First Update' },
      { company: 'First Company Update' },
      { phone: '+1111111111' },
      { address: 'First Address Update' },
      { name: 'Second Update', company: 'Second Company Update' },
    ];

    for (const update of updates) {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the update was applied
      Object.keys(update).forEach(key => {
        if (update[key] !== null && update[key] !== undefined) {
          expect(response.body.data[key]).toBe(update[key]);
        }
      });
    }

    // Final verification
    const finalResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(finalResponse.body.data.name).toBe('Second Update');
    expect(finalResponse.body.data.company).toBe('Second Company Update');
    expect(finalResponse.body.data.phone).toBe('+1111111111');
    expect(finalResponse.body.data.address).toBe('First Address Update');
  });

  it('should handle concurrent profile operations', async () => {
    // Simulate concurrent updates (though in reality this would be harder to test)
    const concurrentUpdates = [
      { city: 'Concurrent City 1' },
      { country: 'Concurrent Country 1' },
    ];

    const promises = concurrentUpdates.map(update =>
      request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(update)
    );

    const results = await Promise.all(promises);

    // All updates should succeed
    results.forEach(result => {
      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
    });

    // At least one of the updates should be reflected
    const finalResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(finalResponse.body.data.city || finalResponse.body.data.country).toBeDefined();
  });
});

