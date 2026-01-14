const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testLogin() {
  console.log('🔐 Testing Login API\n');
  console.log('='.repeat(50));

  // Test 1: Admin login
  console.log('\n1️⃣  Testing Admin Login...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tpportal.com',
      password: 'admin123'
    });

    console.log('✅ Admin login successful!');
    console.log('User:', response.data.data.user.email);
    console.log('Role:', response.data.data.user.role);
    console.log('Token received:', response.data.data.token ? 'Yes' : 'No');

    const token = response.data.data.token;

    // Test protected route
    console.log('\n2️⃣  Testing Protected Route (/auth/me)...');
    try {
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Protected route accessible!');
      console.log('Current user:', meResponse.data.data.email);
    } catch (error) {
      console.log('❌ Protected route failed:', error.response?.data?.error?.message || error.message);
    }

  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.error?.message || error.message);
    if (error.response?.status === 401) {
      console.log('💡 This could mean wrong password or user not found');
    }
  }

  // Test 2: Invalid login
  console.log('\n3️⃣  Testing Invalid Credentials...');
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tpportal.com',
      password: 'wrongpassword'
    });
    console.log('❌ Should have failed but succeeded!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected invalid credentials');
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.error?.message || error.message);
    }
  }

  // Test 3: Register new user and login
  console.log('\n4️⃣  Testing User Registration...');
  try {
    const timestamp = Date.now();
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: `testuser${timestamp}@example.com`,
      password: 'Test@1234',
      company: 'Test Company'
    });

    console.log('✅ User registration successful!');
    console.log('User:', registerResponse.data.data.user.email);

    // Now try to login with the new user
    console.log('\n5️⃣  Testing New User Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: `testuser${timestamp}@example.com`,
      password: 'Test@1234'
    });

    console.log('✅ New user login successful!');
    console.log('User:', loginResponse.data.data.user.email);
    console.log('Role:', loginResponse.data.data.user.role);

  } catch (error) {
    console.log('❌ Registration/Login failed:', error.response?.data?.error?.message || error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Login API tests completed!\n');
}

testLogin().catch(console.error);
