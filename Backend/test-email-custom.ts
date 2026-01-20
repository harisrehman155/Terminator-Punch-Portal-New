import dotenv from 'dotenv';
import { sendRegistrationOTP } from './src/services/email.service';

// Load environment variables
dotenv.config();

async function testCustomEmail() {
  console.log('\n📧 Sending test registration OTP email...\n');

  const testEmail = 'ammadraza521@gmail.com';
  const testName = 'Test User';
  const testOTP = '123456';

  try {
    await sendRegistrationOTP(testEmail, testName, testOTP, 10);
    console.log('\n✅ SUCCESS! Registration email sent successfully!');
    console.log(`\n📬 Check inbox: ${testEmail}`);
    console.log('   (Check spam folder if you don\'t see it)');
    console.log('\n📝 Test OTP Code: 123456');
  } catch (error: any) {
    console.error('\n❌ Failed to send email:', error.message);
  }
}

// Run test
testCustomEmail();
