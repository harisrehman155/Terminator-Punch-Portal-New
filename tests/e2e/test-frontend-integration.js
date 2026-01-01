const puppeteer = require('playwright');

async function testAuthIntegration() {
  console.log('🧪 Testing Frontend Authentication Integration...\n');

  const browser = await puppeteer.chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1️⃣  Testing Login Page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]');

    // Test admin login
    console.log('   - Testing admin login...');
    await page.fill('input[type="email"]', 'admin@tpportal.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation or success message
    try {
      await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
      console.log('   ✅ Admin login successful - redirected to admin dashboard');
    } catch (error) {
      const currentURL = page.url();
      console.log(`   Current URL: ${currentURL}`);
      if (currentURL.includes('/login')) {
        console.log('   ❌ Admin login failed - still on login page');
        // Take screenshot for debugging
        await page.screenshot({ path: 'login-failed.png' });
      } else {
        console.log('   ✅ Admin login successful - redirected');
      }
    }

    // Test logout
    console.log('   - Testing logout...');
    await page.goto('http://localhost:5173/admin/dashboard');
    // Try to find logout button or just navigate back to login
    await page.goto('http://localhost:5173/login');

    console.log('2️⃣  Testing Registration...');
    await page.goto('http://localhost:5173/register');
    await page.waitForSelector('input[name="name"]');

    const testEmail = `test${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Test@1234');
    await page.fill('input[name="confirmPassword"]', 'Test@1234');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/login', { timeout: 10000 });
      console.log('   ✅ Registration successful - redirected to login');
    } catch (error) {
      console.log('   ❌ Registration may have failed');
    }

    console.log('3️⃣  Testing New User Login...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'Test@1234');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('   ✅ New user login successful - redirected to dashboard');
    } catch (error) {
      console.log('   ❌ New user login failed');
    }

    console.log('4️⃣  Testing Forgot Password...');
    await page.goto('http://localhost:5173/forgot-password');
    await page.fill('input[type="email"]', 'admin@tpportal.com');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/verify-otp', { timeout: 10000 });
      console.log('   ✅ Forgot password successful - redirected to OTP verification');
    } catch (error) {
      console.log('   ❌ Forgot password failed');
    }

    console.log('\n🎉 Frontend integration testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAuthIntegration();
