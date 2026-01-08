# TP Portal Frontend

Order Management System frontend for Digitizing, Vector Art, and Embroidery Patches.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** JavaScript (ESM)
- **UI:** MUI (Material UI)
- **State:** Redux Toolkit + Redux Persist
- **Routing:** React Router
- **HTTP:** Axios
- **Styling:** Tailwind CSS + PostCSS
- **Animation:** Framer Motion
- **Notifications:** React Toastify
- **Testing:** Jest (tests colocated under `src/**/__tests__`)

## Features

- User authentication flows (login, register, reset password)
- Role-based routing (USER, ADMIN)
- User dashboard for orders and quotes
- Admin dashboard for managing orders and quotes
- Profile management
- Responsive layouts with MUI components
- Client-side filtering and search
- API integration with error handling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `Frontend/.env` with the API base URL:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Development Server

```bash
npm run dev
```

App will start at: `http://localhost:5173`

## Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build production assets
npm run preview  # Preview production build
npm run lint     # Check code quality
```

## Project Structure

```
Frontend/
|-- public/
|-- src/
|   |-- api/            # API service and helpers
|   |-- assets/         # Static assets
|   |-- components/     # Shared UI components
|   |-- data/           # Mock data
|   |-- pages/          # Route pages
|   |-- redux/          # Store, actions, reducers
|   |-- routes/         # Route definitions
|   |-- theme/          # Theme configuration
|   |-- utils/          # Utilities and constants
|   |-- App.jsx         # App root
|   `-- main.jsx        # App entry point
|-- index.html
|-- vite.config.js
`-- package.json
```

## Routes

### Authentication
- `/login` - Login
- `/register` - Register
- `/forgot-password` - Request password reset
- `/verify-otp` - Verify OTP
- `/reset-password` - Reset password

### User
- `/dashboard` - User dashboard
- `/orders` - Orders list
- `/orders/new` - Create order
- `/orders/:id` - Order details
- `/orders/:id/edit` - Edit order
- `/quotes` - Quotes list
- `/quotes/new` - Create quote
- `/quotes/:id` - Quote details
- `/quotes/:id/edit` - Edit quote
- `/profile` - Profile

### Admin
- `/admin/dashboard` - Admin dashboard
- `/admin/orders` - All orders
- `/admin/orders/:id` - Order details
- `/admin/quotes` - All quotes
- `/admin/quotes/:id` - Quote details
- `/admin/quotes/:id/edit` - Edit quote
- `/admin/users` - User management

## State Store

2 slices:
- `auth` - Authentication and current user
- `home` - Dashboard, orders, quotes, lookups

## Testing

Tests are colocated under `src/**/__tests__`. Add or configure your preferred test runner (Jest/Vitest) to execute them.

## Environment Variables

Required variables:
- `VITE_API_BASE_URL`

## Development Workflow

1. Update routes in `src/routes/routes.jsx`
2. Keep shared UI in `src/components`
3. Use `src/redux` for state and side effects
4. Run `npm run lint` before commits

## Security

- JWT stored in localStorage (via Redux Persist)
- Protected routes and role gating
- Centralized API error handling

## Deployment

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your static host
3. Configure environment variables in your hosting platform

## License

MIT
