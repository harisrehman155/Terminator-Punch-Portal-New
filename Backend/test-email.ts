import dotenv from 'dotenv';
import { sendRegistrationOTP } from './src/services/email.service';
import { verifyEmailConfig } from './src/config/email';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('\n🔍 Testing Email Configuration...\n');

  // Step 1: Verify SMTP configuration
  console.log('📧 SMTP Settings:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   From: ${process.env.SMTP_FROM}`);
  console.log('');

  // Step 2: Test connection
  console.log('🔌 Testing SMTP connection...');
  const isConfigValid = await verifyEmailConfig();

  if (!isConfigValid) {
    console.error('\n❌ Email configuration failed!');
    console.error('\nPlease check:');
    console.error('1. Your Gmail address is correct in SMTP_USER');
    console.error('2. Your App Password is correct (16 characters, no spaces)');
    console.error('3. You have enabled 2-Step Verification in Google Account');
    console.error('4. You generated an App Password (not your regular password)');
    process.exit(1);
  }

  // Step 3: Send test email
  console.log('\n📨 Sending test OTP email...');

  const testEmail = process.env.SMTP_USER || 'test@example.com';
  const testOTP = '123456';

  try {
    await sendRegistrationOTP(testEmail, 'Test User', testOTP, 10);
    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log(`\n📬 Check your inbox: ${testEmail}`);
    console.log('   (Check spam folder if you don\'t see it)');
    console.log('\n🎉 Your email configuration is working perfectly!');
  } catch (error: any) {
    console.error('\n❌ Failed to send email:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if "Less secure app access" is disabled (should be)');
    console.error('2. Make sure you\'re using App Password, not regular password');
    console.error('3. Try generating a new App Password');
    process.exit(1);
  }
}

// Run test
testEmail();
