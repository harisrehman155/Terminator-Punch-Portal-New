const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function checkPassword() {
  console.log('🔐 Checking Admin Password...\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tp_portal',
  };

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Get admin user
    const [users] = await connection.execute(`
      SELECT u.email, u.password_hash, l.lookup_value as role
      FROM users u
      LEFT JOIN lookups l ON u.role_id = l.id
      WHERE u.email = 'admin@tpportal.com'
    `);

    if (users.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const adminUser = users[0];
    console.log('Admin user found:', adminUser.email);
    console.log('Role:', adminUser.role);

    // Test different passwords
    const passwordsToTest = ['admin123', 'admin', 'password', 'Admin123'];

    for (const password of passwordsToTest) {
      const isMatch = await bcrypt.compare(password, adminUser.password_hash);
      console.log(`Password "${password}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }

    await connection.end();

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkPassword();
