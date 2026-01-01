# Database Quick Start Guide

## 🚀 Getting Started

### 1. Configure Database Connection

Edit `Backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tp_portal
DB_USER=root
DB_PASSWORD=your_password
```

### 2. Import Database Schema

Already done! You imported `database_schema_final.sql` via phpMyAdmin.

### 3. Start the Server

```bash
cd Backend
npm install
npm run dev
```

You should see:
```
✅ Database connected successfully
📊 Database: tp_portal
✅ Lookup cache initialized with 39 lookup values
✅ Database initialization complete
🚀 Server running on port: 5000
```

---

## 💡 Quick Examples

### Example 1: Get All Orders (with lookups)

```typescript
// Backend/src/models/order.model.ts
import { executeQuery } from '../database/connection';
import { Order } from '../types/order.types';

export const getAllOrders = async (userId: number) => {
  return await executeQuery<Order>(
    `SELECT
      o.id,
      o.order_no,
      o.service_type_id,
      st.lookup_value as service_type,
      o.status_id,
      s.lookup_value as status,
      o.design_name,
      o.created_at
    FROM orders o
    INNER JOIN lookups st ON o.service_type_id = st.id
    INNER JOIN lookups s ON o.status_id = s.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC`,
    [userId]
  );
};
```

### Example 2: Create Order (with lookup conversion)

```typescript
import { executeQuery } from '../database/connection';
import { getLookupId } from '../utils/lookup.helper';

export const createOrder = async (data: OrderCreateInput, userId: number) => {
  // Convert string values to lookup IDs
  const serviceTypeId = await getLookupId('service_type', data.order_type);
  const statusId = await getLookupId('order_status', 'IN_PROGRESS');
  const unitId = data.unit ? await getLookupId('measurement_unit', data.unit) : null;

  const result: any = await executeQuery(
    `INSERT INTO orders (
      user_id, order_no, service_type_id, status_id, unit_id,
      design_name, height, width, is_urgent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      generateOrderNo(),
      serviceTypeId,
      statusId,
      unitId,
      data.design_name,
      data.height,
      data.width,
      data.is_urgent || 0
    ]
  );

  return result.insertId;
};
```

### Example 3: Update Order Status

```typescript
import { executeQuery } from '../database/connection';
import { getLookupId } from '../utils/lookup.helper';

export const updateStatus = async (orderId: number, newStatus: string) => {
  const statusId = await getLookupId('order_status', newStatus);

  await executeQuery(
    'UPDATE orders SET status_id = ?, updated_at = NOW() WHERE id = ?',
    [statusId, orderId]
  );
};
```

### Example 4: Get User with Role

```typescript
import { executeQueryOne } from '../database/connection';
import { User } from '../types/user.types';

export const findById = async (id: number) => {
  return await executeQueryOne<User>(
    `SELECT
      u.*,
      r.lookup_value as role
    FROM users u
    INNER JOIN lookups r ON u.role_id = r.id
    WHERE u.id = ?`,
    [id]
  );
};
```

---

## 🔍 Lookup Helper Functions

### Get Dropdown Options

```typescript
import { getLookupValues } from '../utils/lookup.helper';

// In your controller
export const getServiceTypes = async (req, res) => {
  const serviceTypes = await getLookupValues('service_type');
  // Returns: [
  //   { id: 1, value: 'DIGITIZING', display_order: 1 },
  //   { id: 2, value: 'VECTOR', display_order: 2 },
  //   { id: 3, value: 'PATCHES', display_order: 3 }
  // ]
  res.json(serviceTypes);
};
```

### Validate User Input

```typescript
import { isValidLookup } from '../utils/lookup.helper';

export const createOrder = async (req, res) => {
  const { order_type } = req.body;

  // Validate
  if (!await isValidLookup('service_type', order_type)) {
    return res.status(400).json({ error: 'Invalid service type' });
  }

  // Continue...
};
```

---

## 🎯 Common Patterns

### Pattern 1: CRUD Operations

```typescript
// GET (with JOINs)
const records = await executeQuery(`
  SELECT t.*, l.lookup_value as some_field
  FROM table_name t
  INNER JOIN lookups l ON t.field_id = l.id
  WHERE t.user_id = ?
`, [userId]);

// GET ONE
const record = await executeQueryOne(`SELECT * FROM table_name WHERE id = ?`, [id]);

// CREATE
const result = await executeQuery(
  `INSERT INTO table_name (field1, field2) VALUES (?, ?)`,
  [value1, value2]
);
const newId = result.insertId;

// UPDATE
await executeQuery(
  `UPDATE table_name SET field1 = ?, updated_at = NOW() WHERE id = ?`,
  [newValue, id]
);

// DELETE
await executeQuery(`DELETE FROM table_name WHERE id = ?`, [id]);
```

### Pattern 2: Search & Filters

```typescript
export const searchOrders = async (filters: any) => {
  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters.status) {
    conditions.push('s.lookup_value = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push('(o.order_no LIKE ? OR o.design_name LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  return await executeQuery(
    `SELECT o.*, s.lookup_value as status
    FROM orders o
    INNER JOIN lookups s ON o.status_id = s.id
    WHERE ${conditions.join(' AND ')}`,
    params
  );
};
```

### Pattern 3: Pagination

```typescript
export const getOrdersPaginated = async (userId: number, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const orders = await executeQuery(
    `SELECT * FROM orders WHERE user_id = ? LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const total = await executeQueryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
    [userId]
  );

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total: total?.count || 0,
      totalPages: Math.ceil((total?.count || 0) / limit)
    }
  };
};
```

---

## 📊 Available Lookup Types

| Type | Values | Used In |
|------|--------|---------|
| `service_type` | DIGITIZING, VECTOR, PATCHES | orders, quotes |
| `measurement_unit` | inch, cm | orders, quotes |
| `order_status` | PENDING, IN_PROGRESS, COMPLETED, CANCELLED | orders |
| `quote_status` | PENDING, PRICED, CONVERTED | quotes |
| `user_role` | USER, ADMIN | users |
| `entity_type` | ORDER, QUOTE | files |
| `file_role` | CUSTOMER_UPLOAD, ADMIN_RESPONSE | files |
| `placement` | Front, Back, Left Chest, etc. | Dropdown |
| `required_format` | DST, EMB, AI, PDF, SVG, EPS | Dropdown |
| `fabric` | Cotton, Polyester, Linen, etc. | Dropdown |
| `color_type` | Full Color, Gradient, Monochrome, Duotone | Dropdown |

---

## ⚡ Performance Tips

1. **Always use parameterized queries** (prevents SQL injection)
2. **Use JOINs** instead of multiple queries
3. **Lookup helper is cached** (60min TTL) - very fast!
4. **Add indexes** if queries are slow (already done in schema)
5. **Use LIMIT** for large result sets

---

## 🐛 Troubleshooting

### Database connection failed
```bash
# Check MySQL is running (XAMPP)
# Check .env credentials match your MySQL settings
# Check database 'tp_portal' exists
```

### Lookup cache not initializing
```bash
# Make sure you imported database_schema_final.sql
# Check lookup_header and lookups tables have data
```

### Type errors in queries
```typescript
// Always specify the return type
const users = await executeQuery<User>('SELECT * FROM users');
//                                ^^^^^
```

---

## 📚 Full Documentation

See `Backend/src/database/README.md` for comprehensive examples and patterns.

---

**You're all set!** 🎉

Start building your features using these patterns. The lookup system is already cached and ready to use.
