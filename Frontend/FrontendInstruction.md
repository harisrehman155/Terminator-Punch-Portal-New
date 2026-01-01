Frontend Instructions (UI only — dummy data, attractive screens)
Goal

Build all screens + layouts with dummy data first. No backend yet. Later we will replace dummy data with API + Redux.

1) Install UI libraries
npm i react-router-dom @mui/material @emotion/react @emotion/styled
npm i @mui/icons-material @mui/x-data-grid
npm i axios
npm i framer-motion
npm i react-toastify

2) Folder structure (clean)
src/
  assets/
  components/
    common/
      Loader.jsx
      AppAlert.jsx
      StatCard.jsx
      PageHeader.jsx
    layout/
      Sidebar.jsx
      Topbar.jsx
      AppLayout.jsx
  data/
    dummyUsers.js
    dummyOrders.js
    dummyQuotes.js
    dummyLookups.js
  pages/
    auth/
      Login.jsx
      Register.jsx
      ForgotPassword.jsx
      VerifyOtp.jsx
      ResetPassword.jsx
    user/
      Dashboard.jsx
      OrdersList.jsx
      OrderCreate.jsx
      OrderDetails.jsx
      QuotesList.jsx
      QuoteCreate.jsx
      QuoteDetails.jsx
      Profile.jsx
    admin/
      AdminDashboard.jsx
      AdminOrders.jsx
      AdminOrderDetails.jsx
      AdminQuotes.jsx
      AdminQuoteDetails.jsx
      AdminUsers.jsx
  routes/
    routes.js
  theme/
    theme.js
  App.jsx

3) UI theme (must)

Make theme/theme.js:

Use MUI theme with modern typography

Rounded corners, consistent spacing

Wrap app with <ThemeProvider>.

4) Layout (must look premium)

Create AppLayout:

Left Sidebar (icons + labels)

Top Topbar (search, notifications icon, profile menu)

Main content container (padding + card look)

Sidebar menus:

User: Dashboard, Orders, Quotes, Profile

Admin: Admin Dashboard, Orders, Quotes, Users

5) Routing (routes.js) — UI only

Create routes for all screens:

Public

/login

/register

/forgot-password

/verify-otp

/reset-password

User

/dashboard

/orders

/orders/new

/orders/:id

/quotes

/quotes/new

/quotes/:id

/profile

Admin

/admin/dashboard

/admin/orders

/admin/orders/:id

/admin/quotes

/admin/quotes/:id

/admin/users

For now:

Fake auth by storing a dummy role in localStorage:

localStorage.setItem("role","USER") or "ADMIN"

Build RequireAuth and RequireRole components but they only check localStorage (UI demo).

6) Dummy data system (important)

Create src/data/* files:

dummyOrders.js: list of 30–50 orders

dummyQuotes.js: list of 30–50 quotes

Include realistic fields:

id, type, status, designName, createdAt, isUrgent, width, height, unit, colors, formats, placement

Include “Admin pricing fields” in quotes: priceTotal, currency, pricingNotes

Use dummy data in all screens.

7) Screens to build (UI requirements)
A) Auth Screens (beautiful cards)

Login

Email, password

“Login as User / Login as Admin” demo toggle (sets role in localStorage)

Register (USER only)

Name, email, password, confirm password

Forgot Password

Email → “Send OTP”

Verify OTP

6-digit OTP input

Reset Password

New password + confirm

UX:

Use MUI Card + subtle gradient background

Add form validation UI (basic required checks only for now)

Use Toast for success/error messages

B) User Screens

User Dashboard

4 stat cards: Total Orders, Pending, In Progress, Completed

Recent orders table (last 5)

Recent quotes table (last 5)

Nice charts optional (later)

Orders List

MUI DataGrid

Filters: Status, Type, Search

Pagination (client-side with dummy data)

Row click → Order Details

Order Create

Stepper UI (beautiful):

Basic info (type, design name)

Size + options (width/height/unit, colors, fabric)

Placement + format (multi-select chips)

Instructions + Upload file UI (dummy upload)

Submit → adds into dummy list (in memory)

Order Details

Header: Order number + status chip + urgent tag

Tabs:

Overview

Files (dummy list)

History timeline (dummy)

Show “Download” buttons (dummy)

Quotes List

DataGrid with Status + Type filters

Badge showing priced / pending

Quote Create

Similar to order create but quote fields

Quote Details

If status “PRICED”: show price card + “Convert to Order” button (dummy)

Profile

Update profile form (dummy save toast)

C) Admin Screens

Admin Dashboard

Stat cards: Total Orders, Pending, In Progress, Total Quotes Pending, Users

Recent activity feed (dummy)

Admin Orders

DataGrid with advanced filters

Bulk actions UI (optional)

Admin Order Details

Change status dropdown (dummy)

Upload response files section (dummy)

Admin Quotes

DataGrid: pending quotes requiring pricing

Admin Quote Details

Pricing form: total price, currency, notes

“Send Quote” button (dummy)

Admin Users

DataGrid: users list

Toggle active/inactive (dummy)

8) Common components (reusable)

Loader.jsx (center spinner)

AppAlert.jsx (snackbar wrapper)

StatCard.jsx (icon + number + subtitle)

PageHeader.jsx (title + breadcrumbs + right actions)

StatusChip.jsx (Pending/In Progress/Completed/Cancelled)

EmptyState.jsx (when no data)

9) Make it “attractive” (simple rules)

Use consistent spacing (p: 2, gap: 2)

Use card-based UI everywhere

Use icons in sidebar + headers

Use framer-motion for:

page fade in

stat cards hover

table container entrance

Use chips for type/status/urgent

Use a clean font (MUI default is okay)

10) What NOT to do yet

No API integration

No Redux logic for server data

No real uploads

No real auth/JWT

Just UI + dummy data + complete screens.