const mysql = require('mysql2/promise');

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tp_portal',
  };

  try {
    console.log('📊 Connecting to database:', dbConfig.database);
    const connection = await mysql.createConnection(dbConfig);

    console.log('✅ Database connected successfully!');

    // Test if tables exist
    const [tables] = await connection.execute("SHOW TABLES");
    console.log('📋 Tables found:', tables.length);

    if (tables.length > 0) {
      console.log('Tables:', tables.map(t => Object.values(t)[0]).join(', '));

      // Check if users table exists and has data
      const [users] = await connection.execute("SELECT COUNT(*) as count FROM users");
      console.log('👥 Users in database:', users[0].count);

      // Check users table structure
      const [columns] = await connection.execute("DESCRIBE users");
      console.log('Users table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}`);
      });

      if (users[0].count > 0) {
        const [userList] = await connection.execute(`
          SELECT u.id, u.email, l.lookup_value as role
          FROM users u
          LEFT JOIN lookups l ON u.role_id = l.id
          LIMIT 5
        `);
        console.log('Sample users:');
        userList.forEach(user => {
          console.log(`  - ${user.email} (${user.role})`);
        });
      }
    } else {
      console.log('❌ No tables found. Database schema not imported.');
    }

    await connection.end();
    console.log('✅ Database connection test completed!\n');

  } catch (error) {
    console.log('❌ Database connection failed:', error.message);

    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Suggestion: Create the database first:');
      console.log('   CREATE DATABASE tp_portal;');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Make sure MySQL is running');
    }
  }
}

testDatabase();
