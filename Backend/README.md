# TP Portal Backend

Order Management System backend for Digitizing, Vector Art, and Embroidery Patches.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MySQL 8.0
- **Authentication:** JWT
- **Testing:** Jest + Supertest
- **File Upload:** Multer
- **Email:** Nodemailer
- **Validation:** Joi + Express Validator

## Features

- ✅ User Authentication (JWT + OTP)
- ✅ Role-based Access Control (USER, ADMIN)
- ✅ Order Management (CRUD)
- ✅ Quote Management with Pricing
- ✅ File Upload/Download
- ✅ Email Notifications
- ✅ Admin Dashboard
- ✅ RESTful API
- ✅ Test-Driven Development (80%+ coverage)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Import Database

Import `plan/database_schema_revised.sql` into MySQL using phpMyAdmin.

### 4. Run Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:5000`

## Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run all tests with coverage
npm run test:watch   # Run tests in watch mode
npm run test:unit    # Run unit tests only
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
```

## Project Structure

```
Backend/
├── src/
│   ├── config/          # Configuration files (database, jwt, etc.)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── database/        # Migrations and seeds
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── uploads/             # File upload directory
└── plan/                # Implementation plan and documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Orders (User)
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Quotes (User)
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/:id` - Get quote details
- `PUT /api/quotes/:id` - Update quote
- `POST /api/quotes/:id/convert` - Convert to order

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/orders` - All orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/quotes` - All quotes
- `PUT /api/admin/quotes/:id/price` - Set quote price
- `GET /api/admin/users` - All users
- `PUT /api/admin/users/:id/toggle` - Toggle user status

### Lookups
- `GET /api/lookups` - Get all lookups
- `GET /api/lookups/:type` - Get lookups by type

## Database Schema

6 tables:
- `users` - User accounts
- `orders` - Customer orders
- `quotes` - Quote requests
- `files` - File uploads
- `lookup_header` - Lookup categories
- `lookups` - Lookup values

See `plan/DATABASE_SCHEMA_PLAN_REVISED.md` for details.

## Testing

Run tests:
```bash
npm test
```

Test coverage report: `coverage/index.html`

## Environment Variables

See `.env.example` for all available options.

Required variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `SMTP_*` (for emails)

## Development Workflow

This project follows **Test-Driven Development (TDD)**:

1. Write tests first
2. Implement code to pass tests
3. Refactor while keeping tests green

See `plan/BACKEND_IMPLEMENTATION_PLAN.md` for detailed checklist.

## Security

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- Helmet security headers
- CORS configuration
- Input validation
- SQL injection prevention

## Deployment

1. Build the project: `npm run build`
2. Set `NODE_ENV=production`
3. Configure production environment variables
4. Start server: `npm start`

## Documentation

- Implementation Plan: `plan/BACKEND_IMPLEMENTATION_PLAN.md`
- Database Schema: `plan/DATABASE_SCHEMA_PLAN_REVISED.md`
- MCP Setup: `plan/MCP_MYSQL_SETUP_GUIDE.md`
- Import Guide: `plan/DATABASE_IMPORT_INSTRUCTIONS.md`

## Support

For issues or questions, check the `plan/` directory for detailed guides.

## License

MIT
