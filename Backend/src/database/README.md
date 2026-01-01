# Database Layer Documentation

This project uses **raw SQL queries** with **mysql2** for database communication.

## 📁 Structure

```
database/
├── connection.ts       # Database connection pool and helpers
├── migrations/         # SQL migration files (optional)
└── seeds/             # Seed data files (optional)
```

## 🔌 Connection Setup

### Import the connection
```typescript
import { db, executeQuery, executeQueryOne } from './database/connection';
```

### Initialize on server start
```typescript
// In server.ts or app.ts
import { initializeDatabase } from './database/connection';

async function startServer() {
  await initializeDatabase(); // Connects to DB and initializes lookup cache

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

## 📝 Query Patterns

### 1. SELECT Queries

#### Get all rows
```typescript
import { executeQuery } from '../database/connection';

const users = await executeQuery<User>(
  'SELECT * FROM users WHERE is_active = ?',
  [1]
);
// Returns: User[]
```

#### Get single row
```typescript
import { executeQueryOne } from '../database/connection';

const user = await executeQueryOne<User>(
  'SELECT * FROM users WHERE email = ?',
  ['user@example.com']
);
// Returns: User | null
```

#### JOIN with lookups (Enum replacement pattern)
```typescript
const orders = await executeQuery<Order>(
  `SELECT
    o.id,
    o.order_no,
    o.service_type_id,
    st.lookup_value as service_type,
    o.status_id,
    s.lookup_value as status,
    o.unit_id,
    u.lookup_value as unit,
    o.design_name,
    o.height,
    o.width,
    o.created_at
  FROM orders o
  INNER JOIN lookups st ON o.service_type_id = st.id
  INNER JOIN lookups s ON o.status_id = s.id
  LEFT JOIN lookups u ON o.unit_id = u.id
  WHERE o.user_id = ?
  ORDER BY o.created_at DESC`,
  [userId]
);
```

### 2. INSERT Queries

#### With lookup ID conversion
```typescript
import { executeQuery } from '../database/connection';
import { getLookupId } from '../utils/lookup.helper';

async function createOrder(data: OrderCreateInput, userId: number) {
  // Convert enum strings to lookup IDs
  const serviceTypeId = await getLookupId('service_type', data.order_type);
  const statusId = await getLookupId('order_status', 'IN_PROGRESS');
  const unitId = data.unit ? await getLookupId('measurement_unit', data.unit) : null;

  const result: any = await executeQuery(
    `INSERT INTO orders (
      user_id, order_no, service_type_id, status_id, unit_id,
      design_name, height, width, instruction, is_urgent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      generateOrderNo(),
      serviceTypeId,
      statusId,
      unitId,
      data.design_name,
      data.height,
      data.width,
      data.instruction,
      data.is_urgent || 0
    ]
  );

  return result.insertId; // Returns the new order ID
}
```

### 3. UPDATE Queries

#### Simple update
```typescript
await executeQuery(
  'UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?',
  ['New Name', userId]
);
```

#### Dynamic update (only set provided fields)
```typescript
function buildUpdateQuery(tableName: string, data: any, whereClause: string) {
  const updates: string[] = [];
  const values: any[] = [];

  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  });

  return {
    sql: `UPDATE ${tableName} SET ${updates.join(', ')}, updated_at = NOW() WHERE ${whereClause}`,
    values
  };
}

// Usage
const { sql, values } = buildUpdateQuery('users', { name: 'John', city: 'NYC' }, 'id = ?');
values.push(userId);
await executeQuery(sql, values);
```

#### Update with lookup conversion
```typescript
async function updateOrderStatus(orderId: number, newStatus: string) {
  const statusId = await getLookupId('order_status', newStatus);

  await executeQuery(
    'UPDATE orders SET status_id = ?, updated_at = NOW() WHERE id = ?',
    [statusId, orderId]
  );
}
```

### 4. DELETE Queries

```typescript
await executeQuery(
  'DELETE FROM orders WHERE id = ? AND user_id = ?',
  [orderId, userId]
);
```

### 5. Transaction Pattern

```typescript
import { getConnection } from '../database/connection';

async function createOrderWithFiles(orderData, files) {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Insert order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (...) VALUES (...)',
      [...]
    );
    const orderId = orderResult.insertId;

    // Insert files
    for (const file of files) {
      await connection.execute(
        'INSERT INTO files (...) VALUES (...)',
        [orderId, ...]
      );
    }

    await connection.commit();
    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

## 🔄 Working with Lookup Tables

### Get lookup ID from string value
```typescript
import { getLookupId } from '../utils/lookup.helper';

const digitizingId = await getLookupId('service_type', 'DIGITIZING');
// Returns: number (e.g., 1)
```

### Get lookup string from ID
```typescript
import { getLookupValue } from '../utils/lookup.helper';

const value = await getLookupValue(1);
// Returns: 'DIGITIZING'
```

### Get all values for a lookup type
```typescript
import { getLookupValues } from '../utils/lookup.helper';

const serviceTypes = await getLookupValues('service_type');
// Returns: [
//   { id: 1, value: 'DIGITIZING', display_order: 1 },
//   { id: 2, value: 'VECTOR', display_order: 2 },
//   { id: 3, value: 'PATCHES', display_order: 3 }
// ]
```

### Validate lookup value
```typescript
import { isValidLookup } from '../utils/lookup.helper';

const isValid = await isValidLookup('service_type', 'DIGITIZING');
// Returns: true/false
```

## 🔍 Common Query Examples

### 1. Get orders with user info
```typescript
const orders = await executeQuery<OrderWithUser>(
  `SELECT
    o.*,
    st.lookup_value as service_type,
    s.lookup_value as status,
    u.name as user_name,
    u.email as user_email
  FROM orders o
  INNER JOIN lookups st ON o.service_type_id = st.id
  INNER JOIN lookups s ON o.status_id = s.id
  INNER JOIN users u ON o.user_id = u.id
  WHERE o.status_id = (SELECT id FROM lookups WHERE lookup_value = 'PENDING')
  ORDER BY o.created_at DESC`
);
```

### 2. Search with filters
```typescript
async function searchOrders(filters: {
  userId?: number;
  serviceType?: string;
  status?: string;
  searchTerm?: string;
}) {
  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (filters.userId) {
    conditions.push('o.user_id = ?');
    params.push(filters.userId);
  }

  if (filters.serviceType) {
    conditions.push('st.lookup_value = ?');
    params.push(filters.serviceType);
  }

  if (filters.status) {
    conditions.push('s.lookup_value = ?');
    params.push(filters.status);
  }

  if (filters.searchTerm) {
    conditions.push('(o.order_no LIKE ? OR o.design_name LIKE ?)');
    const searchPattern = `%${filters.searchTerm}%`;
    params.push(searchPattern, searchPattern);
  }

  return await executeQuery(
    `SELECT
      o.*,
      st.lookup_value as service_type,
      s.lookup_value as status
    FROM orders o
    INNER JOIN lookups st ON o.service_type_id = st.id
    INNER JOIN lookups s ON o.status_id = s.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY o.created_at DESC`,
    params
  );
}
```

### 3. Count queries
```typescript
const result = await executeQueryOne<{ total: number }>(
  'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
  [userId]
);
const totalOrders = result?.total || 0;
```

### 4. Pagination
```typescript
async function getOrdersPaginated(userId: number, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const orders = await executeQuery(
    `SELECT o.*, st.lookup_value as service_type, s.lookup_value as status
    FROM orders o
    INNER JOIN lookups st ON o.service_type_id = st.id
    INNER JOIN lookups s ON o.status_id = s.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const totalResult = await executeQueryOne<{ total: number }>(
    'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
    [userId]
  );
  const total = totalResult?.total || 0;

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

## ⚠️ Best Practices

### 1. Always use parameterized queries
```typescript
// ✅ GOOD - Prevents SQL injection
await executeQuery('SELECT * FROM users WHERE email = ?', [email]);

// ❌ BAD - Vulnerable to SQL injection
await executeQuery(`SELECT * FROM users WHERE email = '${email}'`);
```

### 2. Handle errors properly
```typescript
try {
  const user = await executeQueryOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
} catch (error) {
  console.error('Database error:', error);
  throw new DatabaseError('Failed to fetch user');
}
```

### 3. Use JOINs for lookups
```typescript
// ✅ GOOD - Single query with JOIN
const orders = await executeQuery(`
  SELECT o.*, st.lookup_value as service_type
  FROM orders o
  INNER JOIN lookups st ON o.service_type_id = st.id
`);

// ❌ BAD - Multiple queries (N+1 problem)
const orders = await executeQuery('SELECT * FROM orders');
for (const order of orders) {
  order.service_type = await getLookupValue(order.service_type_id);
}
```

### 4. Use transactions for multi-step operations
```typescript
// Use transactions when multiple tables are affected
const connection = await getConnection();
try {
  await connection.beginTransaction();
  // Multiple queries here...
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## 🚀 Performance Tips

1. **Use LIMIT** for large datasets
2. **Add proper indexes** (already in schema)
3. **Cache lookup values** (already implemented)
4. **Use connection pooling** (already configured)
5. **Avoid SELECT *** when possible

## 📚 Additional Resources

- [mysql2 Documentation](https://github.com/sidorares/node-mysql2)
- [MySQL Performance Tips](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
