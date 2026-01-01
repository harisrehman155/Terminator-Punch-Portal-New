✅ FRONTEND INSTRUCTIONS (UI ONLY – DUMMY DATA, BACKEND-READY)
Goal

Build attractive UI

Use dummy data

Field names MUST MATCH backend & DB

Later → switch dummy data → API with zero refactor

1️⃣ User Object (AUTH + PROFILE)
dummyUser.js
export const dummyUser = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  company: "ABC Digitizing",
  phone: "+1 234 567 890",
  address: "123 Main Street",
  city: "New York",
  country: "USA",
  role: "USER", // USER | ADMIN
  is_active: 1,
  created_at: "2025-01-10T10:00:00Z"
};


Used in:

Topbar profile

Profile page

Role-based routing

2️⃣ ORDER DUMMY DATA (MATCHES orders TABLE)
dummyOrders.js
export const dummyOrders = [
  {
    id: 101,
    user_id: 1,
    order_no: "TP-20250110-0001",

    order_type: "DIGITIZING", // DIGITIZING | VECTOR | PATCHES
    status: "PENDING",        // PENDING | IN_PROGRESS | COMPLETED | CANCELLED

    design_name: "Eagle Logo",
    height: 4.5,
    width: 3.2,
    unit: "inch",

    number_of_colors: 6,
    fabric: "Cotton",
    color_type: null,

    placement: ["Front", "Left Chest"],
    required_format: ["DST", "EMB"],

    instruction: "Please make stitches clean and sharp.",
    is_urgent: 1,

    created_at: "2025-01-10T12:30:00Z",
    updated_at: "2025-01-10T12:30:00Z"
  }
];


Used in:

User Orders List (DataGrid)

Order Details

Admin Orders

3️⃣ ORDER FILES (MATCHES files TABLE)
dummyOrderFiles.js
export const dummyOrderFiles = [
  {
    id: 1,
    entity_type: "ORDER",
    entity_id: 101,
    file_role: "CUSTOMER_UPLOAD", // CUSTOMER_UPLOAD | ADMIN_RESPONSE
    original_name: "logo.png",
    mime_type: "image/png",
    size_bytes: 245678,
    created_at: "2025-01-10T12:35:00Z"
  }
];


Used in:

Order details → Files tab

Admin response upload UI

4️⃣ ORDER STATUS HISTORY (TIMELINE)
dummyOrderHistory.js
export const dummyOrderHistory = [
  {
    id: 1,
    order_id: 101,
    from_status: "PENDING",
    to_status: "IN_PROGRESS",
    note: "Started digitizing",
    created_at: "2025-01-10T14:00:00Z"
  }
];


Used in:

Order details → Timeline view

5️⃣ QUOTE DUMMY DATA (MATCHES quotes TABLE)
dummyQuotes.js
export const dummyQuotes = [
  {
    id: 201,
    user_id: 1,
    quote_no: "QT-20250110-0001",

    quote_type: "VECTOR", // DIGITIZING | VECTOR | PATCHES
    status: "PRICED",     // PENDING | PRICED | CONVERTED

    design_name: "Lion Badge",
    height: 5,
    width: 5,
    unit: "inch",

    number_of_colors: null,
    fabric: null,
    color_type: "Full Color",

    placement: ["Back"],
    required_format: ["AI", "SVG"],

    instruction: "Vector clean paths only.",
    is_urgent: 0,

    price_total: 25.00,
    currency: "USD",
    pricing_notes: "Includes revisions",

    converted_order_id: null,

    created_at: "2025-01-10T15:00:00Z",
    updated_at: "2025-01-10T15:30:00Z"
  }
];


Used in:

Quotes list

Quote details

Admin pricing screen

6️⃣ ADMIN USERS LIST (MATCHES users TABLE)
dummyUsers.js
export const dummyUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "USER",
    is_active: 1,
    created_at: "2025-01-01T10:00:00Z"
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    is_active: 1,
    created_at: "2025-01-01T10:00:00Z"
  }
];


Used in:

Admin → Users DataGrid

7️⃣ LOOKUPS (MATCHES lookups TABLE)
dummyLookups.js
export const lookups = {
  order_types: ["DIGITIZING", "VECTOR", "PATCHES"],
  order_status: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  quote_status: ["PENDING", "PRICED", "CONVERTED"],
  placement: ["Front", "Back", "Left Chest", "Right Chest"],
  required_format: ["DST", "EMB", "AI", "PDF", "SVG"],
  units: ["inch", "cm"]
};


Used in:

Dropdowns

Multi-select chips

Filters

8️⃣ DataGrid column mapping (IMPORTANT)
Orders DataGrid
columns = [
  { field: "order_no", headerName: "Order #" },
  { field: "order_type", headerName: "Type" },
  { field: "design_name", headerName: "Design" },
  { field: "status", headerName: "Status" },
  { field: "is_urgent", headerName: "Urgent" },
  { field: "created_at", headerName: "Created" }
];


These field names WILL NOT change when backend comes.