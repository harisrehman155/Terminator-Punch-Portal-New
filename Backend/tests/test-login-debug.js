// Simple test to debug login redirection
const API_BASE_URL = 'http://localhost:5000/api';

// Test login API
async function testLoginAPI() {
  console.log('🔍 Testing Login API Response...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tpportal.com',
        password: 'admin123'
      })
    });

    const data = await response.json();

    console.log('API Response Status:', response.status);
    console.log('API Response Success:', data.success);
    console.log('User Role:', data.data?.user?.role);
    console.log('Token Length:', data.data?.token?.length || 0);

    if (data.success) {
      console.log('✅ Login API working correctly');
      console.log('Expected redirect path:', data.data.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } else {
      console.log('❌ Login API failed:', data.message);
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test localStorage simulation
function testLocalStorage() {
  console.log('\n💾 Testing localStorage Simulation...\n');

  const mockUser = { id: 1, email: 'admin@tpportal.com', role: 'ADMIN', name: 'Admin User' };
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.jwt.token';

  localStorage.setItem('tp_portal_token', mockToken);
  localStorage.setItem('tp_portal_user', JSON.stringify(mockUser));

  console.log('Stored token:', !!localStorage.getItem('tp_portal_token'));
  console.log('Stored user:', !!localStorage.getItem('tp_portal_user'));

  const storedUser = JSON.parse(localStorage.getItem('tp_portal_user'));
  console.log('Parsed user role:', storedUser?.role);

  // Clean up
  localStorage.removeItem('tp_portal_token');
  localStorage.removeItem('tp_portal_user');
}

testLoginAPI().then(() => {
  testLocalStorage();
  console.log('\n🎯 Test completed. Check browser console for RequireAuth logs.');
});
