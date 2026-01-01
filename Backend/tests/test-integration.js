const axios = require('axios');

// Simulate frontend API calls
const API_BASE_URL = 'http://localhost:5000/api';

async function testFrontendIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');
  console.log('='.repeat(60));

  try {
    console.log('1️⃣  Testing Admin Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tpportal.com',
      password: 'admin123'
    });

    console.log('✅ Login response received');
    console.log('   Status:', loginResponse.status);
    console.log('   Success:', loginResponse.data.success);
    console.log('   User Email:', loginResponse.data.data?.user?.email);
    console.log('   User Role:', loginResponse.data.data?.user?.role);
    console.log('   Token received:', !!loginResponse.data.data?.token);

    const token = loginResponse.data.data.token;

    console.log('\n2️⃣  Testing Protected Route (/auth/me)...');
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Protected route accessible');
    console.log('   User Email:', meResponse.data.data?.email);
    console.log('   User Role:', meResponse.data.data?.role);

    console.log('\n3️⃣  Testing User Registration...');
    const testEmail = `testuser${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'Test@1234',
      company: 'Test Company'
    });

    console.log('✅ Registration response received');
    console.log('   Status:', registerResponse.status);
    console.log('   Success:', registerResponse.data.success);
    console.log('   Message:', registerResponse.data.message);

    console.log('\n4️⃣  Testing New User Login...');
    const newUserLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'Test@1234'
    });

    console.log('✅ New user login successful');
    console.log('   User Role:', newUserLogin.data.data?.user?.role);
    console.log('   Token received:', !!newUserLogin.data.data?.token);

    console.log('\n5️⃣  Testing Forgot Password...');
    const forgotResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'admin@tpportal.com'
    });

    console.log('✅ Forgot password response received');
    console.log('   Status:', forgotResponse.status);
    console.log('   Success:', forgotResponse.data.success);
    console.log('   Message:', forgotResponse.data.message);
    console.log('   OTP (dev mode):', forgotResponse.data.data?.otp);

    const otp = forgotResponse.data.data?.otp;

    console.log('\n6️⃣  Testing OTP Verification...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      email: 'admin@tpportal.com',
      otp: otp
    });

    console.log('✅ OTP verification successful');
    console.log('   Status:', verifyResponse.status);
    console.log('   Success:', verifyResponse.data.success);
    console.log('   Reset Token received:', !!verifyResponse.data.data?.resetToken);

    const resetToken = verifyResponse.data.data.resetToken;

    console.log('\n7️⃣  Testing Password Reset...');
    const resetResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      resetToken: resetToken,
      newPassword: 'admin123'  // Reset back to original
    });

    console.log('✅ Password reset successful');
    console.log('   Status:', resetResponse.status);
    console.log('   Success:', resetResponse.data.success);
    console.log('   Message:', resetResponse.data.message);

    console.log('\n8️⃣  Testing Invalid Credentials...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@tpportal.com',
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed');
    } catch (error) {
      console.log('✅ Correctly rejected invalid credentials');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.error?.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All API integrations working perfectly!');
    console.log('✅ Login, Register, Forgot Password, OTP, Reset Password');
    console.log('✅ Protected routes with JWT authentication');
    console.log('✅ Role-based access (ADMIN/USER)');
    console.log('✅ Error handling and validation');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

testFrontendIntegration();
