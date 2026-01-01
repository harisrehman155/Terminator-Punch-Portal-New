# TP Portal - Order Management System

A full-stack order management system for digitizing, vector, and patch services.

## 🚀 Features

- **User Authentication** - JWT-based authentication with role management (User/Admin)
- **Order Management** - Create and track orders for digitizing, vector, and patches services
- **Quote System** - Request quotes, get pricing, and convert to orders
- **File Management** - Upload and manage customer files and admin responses
- **Lookup-Based Architecture** - Flexible enum replacement with lookup tables for easy extensibility
- **Admin Dashboard** - Manage orders, quotes, users, and system lookups

## 📁 Project Structure

```
tp-portal-final/
├── Backend/           # Node.js + Express + TypeScript backend
├── Frontend/          # React + Vite + TypeScript frontend
└── plan/              # Database schema and documentation
    ├── database_schema_final.sql
    └── DATABASE_MIGRATION_GUIDE.md
```

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL 8.0
- **ORM**: Raw SQL with mysql2
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- XAMPP (or similar) for local MySQL server

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tp-portal-final
```

### 2. Setup Database
```bash
# Import the database schema
mysql -u root -p < plan/database_schema_final.sql

# Or use phpMyAdmin to import:
# plan/database_schema_final.sql
```

**Default Admin User:**
- Email: `admin@tpportal.com`
- Password: `admin123` (⚠️ Change immediately!)

### 3. Setup Backend
```bash
cd Backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev
```

### 4. Setup Frontend
```bash
cd Frontend
npm install

# Start development server
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📖 Database Schema

The system uses a **lookup-based architecture** instead of MySQL ENUMs for maximum flexibility.

### Main Tables
1. **lookup_header** - Lookup categories (11 types)
2. **lookups** - Lookup values (39 values)
3. **users** - User authentication and profiles
4. **orders** - Order management
5. **quotes** - Quote requests
6. **files** - File uploads for orders/quotes

### Benefits of Lookup Architecture
- ✅ No schema changes needed to add new values
- ✅ Eliminates repetition (service_type & unit shared)
- ✅ Soft delete support with is_active flag
- ✅ Display order control for UI dropdowns
- ✅ Future-ready for translations and metadata

See `plan/DATABASE_MIGRATION_GUIDE.md` for detailed documentation.

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/forgot-password` - Password reset request

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Quotes
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/:id` - Get quote details
- `PUT /api/quotes/:id/price` - Set quote price (admin)
- `POST /api/quotes/:id/convert` - Convert quote to order

### Lookups
- `GET /api/lookups` - Get all lookup types
- `GET /api/lookups/:type` - Get values for a lookup type

## 🧪 Testing

### Backend Tests
```bash
cd Backend
npm test
```

### Frontend Tests
```bash
cd Frontend
npm test
```

## 📝 Development

### Adding New Lookup Values
```sql
-- Example: Add a new service type
SET @service_type_id = (SELECT id FROM lookup_header WHERE lookup_type = 'service_type');
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active)
VALUES (@service_type_id, 'EMBROIDERY', 4, 1);
```

### Environment Variables
See `Backend/.env.example` for required environment variables.

## 🚀 Deployment

### Backend
```bash
cd Backend
npm run build
npm start
```

### Frontend
```bash
cd Frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

## 📄 License

This project is proprietary and confidential.

## 👥 Contributors

- Development Team - TP Portal

## 📞 Support

For issues or questions, please contact the development team.

---

**Last Updated**: January 2026
