const { chromium } = require('playwright');

async function testBrowserLogin() {
  console.log('🧪 Testing Login in Browser...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to login page
    console.log('1️⃣  Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]');
    console.log('✅ Login page loaded');

    // Fill login form
    console.log('2️⃣  Filling login form...');
    await page.fill('input[type="email"]', 'admin@tpportal.com');
    await page.fill('input[type="password"]', 'admin123');
    console.log('✅ Form filled');

    // Submit form
    console.log('3️⃣  Submitting login form...');
    await page.click('button[type="submit"]');

    // Wait for navigation or check current URL
    console.log('4️⃣  Waiting for navigation...');
    await page.waitForTimeout(3000); // Wait 3 seconds

    const currentURL = page.url();
    console.log('Current URL after login:', currentURL);

    if (currentURL.includes('/admin/dashboard')) {
      console.log('✅ SUCCESS: Redirected to admin dashboard!');
    } else if (currentURL.includes('/dashboard')) {
      console.log('✅ SUCCESS: Redirected to user dashboard!');
    } else if (currentURL.includes('/login')) {
      console.log('❌ FAILED: Still on login page');

      // Check for any error messages
      const errorText = await page.textContent('.MuiAlert-message');
      if (errorText) {
        console.log('Error message:', errorText);
      }

      // Check console logs
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push(msg.text());
      });

      console.log('Console messages:');
      consoleMessages.forEach(msg => console.log('  ', msg));

    } else {
      console.log('❓ UNKNOWN: Redirected to', currentURL);
    }

    // Check localStorage
    console.log('5️⃣  Checking localStorage...');
    const localStorageData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('tp_portal_token'),
        user: localStorage.getItem('tp_portal_user')
      };
    });

    console.log('Token in localStorage:', localStorageData.token ? 'present' : 'missing');
    console.log('User in localStorage:', localStorageData.user ? 'present' : 'missing');

    if (localStorageData.user) {
      const user = JSON.parse(localStorageData.user);
      console.log('User role:', user.role);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testBrowserLogin();
