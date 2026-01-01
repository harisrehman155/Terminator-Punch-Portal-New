const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAuthentication() {
  console.log('🧪 Testing Authentication System\n');
  console.log('='.repeat(60));

  // Test 1: Register a new user
  console.log('\n1️⃣  Testing Registration...');
  try {
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'Test@1234'
    });
    console.log('✅ Registration successful!');
    console.log('User:', registerResponse.data.data.user.email);
    console.log('Role:', registerResponse.data.data.user.role_name);
    console.log('Token received:', registerResponse.data.data.token ? 'Yes' : 'No');
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data?.error?.message || error.message);
  }

  // Test 2: Login with admin credentials
  console.log('\n2️⃣  Testing Login (Admin)...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tpportal.com',
      password: 'admin123'
    });
    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.data.user.email);
    console.log('Role:', loginResponse.data.data.user.role_name);

    const token = loginResponse.data.data.token;

    // Test 3: Get current user with token
    console.log('\n3️⃣  Testing Protected Route (/auth/me)...');
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
    console.log('❌ Login failed:', error.response?.data?.error?.message || error.message);
  }

  // Test 4: Login with wrong password
  console.log('\n4️⃣  Testing Invalid Login...');
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tpportal.com',
      password: 'wrongpassword'
    });
    console.log('❌ Should have failed but succeeded!');
  } catch (error) {
    console.log('✅ Correctly rejected invalid credentials');
    console.log('Error:', error.response?.data?.error?.message);
  }

  // Test 5: Forgot Password
  console.log('\n5️⃣  Testing Forgot Password...');
  try {
    const forgotResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'admin@tpportal.com'
    });
    console.log('✅ Forgot password OTP sent!');
    console.log('Message:', forgotResponse.data.message);
  } catch (error) {
    console.log('❌ Forgot password failed:', error.response?.data?.error?.message || error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Authentication tests completed!\n');
}

testAuthentication().catch(console.error);
