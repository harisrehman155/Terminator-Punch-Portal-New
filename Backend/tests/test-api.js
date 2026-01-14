const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Backend API...\n');

  try {
    console.log('Testing login API...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tpportal.com',
      password: 'admin123'
    });

    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('User:', response.data.data?.user);
    console.log('Token present:', !!response.data.data?.token);
    console.log('User role:', response.data.data?.user?.role);

  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
