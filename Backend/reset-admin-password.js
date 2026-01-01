const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetAdminPassword() {
  console.log('🔐 Resetting Admin Password...\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tp_portal',
  };

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Hash the new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update admin password
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, 'admin@tpportal.com']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Admin password reset to: admin123');

      // Verify the password works
      const isMatch = await bcrypt.compare(newPassword, hashedPassword);
      console.log('Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
    } else {
      console.log('❌ Failed to update password');
    }

    await connection.end();

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

resetAdminPassword();
