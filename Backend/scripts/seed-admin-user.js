const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const email = (process.env.ADMIN_SEED_EMAIL || 'harisrehman155@gmail.com').toLowerCase();
const password = process.env.ADMIN_SEED_PASSWORD;
const name = process.env.ADMIN_SEED_NAME || 'Admin User';

if (!password) {
  console.error('Missing ADMIN_SEED_PASSWORD. Set it before running this script.');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tp_portal',
};

async function seedAdminUser() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [roleRows] = await connection.execute(
      `SELECT l.id
       FROM lookups l
       INNER JOIN lookup_header lh ON l.lookup_header_id = lh.id
       WHERE lh.lookup_type = 'user_role' AND l.lookup_value = 'ADMIN'
       LIMIT 1`
    );

    if (!roleRows.length) {
      throw new Error("ADMIN role not found. Run seed_lookups.sql first.");
    }

    const roleId = roleRows[0].id;
    const hashedPassword = await bcrypt.hash(password, 12);

    const [userRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (userRows.length) {
      const userId = userRows[0].id;
      await connection.execute(
        `UPDATE users
         SET name = ?, password_hash = ?, role_id = ?, is_active = 1,
             email_verified_at = COALESCE(email_verified_at, NOW()),
             updated_at = NOW()
         WHERE id = ?`,
        [name, hashedPassword, roleId, userId]
      );
      console.log(`✅ Updated admin user: ${email}`);
    } else {
      await connection.execute(
        `INSERT INTO users (name, email, password_hash, role_id, is_active, email_verified_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW(), NOW())`,
        [name, email, hashedPassword, roleId]
      );
      console.log(`✅ Created admin user: ${email}`);
    }
  } finally {
    await connection.end();
  }
}

seedAdminUser().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
