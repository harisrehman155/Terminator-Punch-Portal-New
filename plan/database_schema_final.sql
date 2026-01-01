-- ============================================
-- TP PORTAL - Order Management System
-- Final Database Schema for MySQL
-- ============================================
-- IMPROVED: Replaced all ENUMs with lookup table references
-- Benefits: No schema changes needed to add new values, eliminates repetition
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS tp_portal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE tp_portal;

-- ============================================
-- 1. LOOKUP_HEADER TABLE (Create first - referenced by others)
-- Parent table for lookup categories
-- ============================================
CREATE TABLE lookup_header (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lookup_type VARCHAR(50) NOT NULL UNIQUE,  -- 'service_type', 'order_status', etc.
    description VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_lookup_type (lookup_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. LOOKUPS TABLE (Create second - referenced by others)
-- Child table for lookup values
-- ============================================
CREATE TABLE lookups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lookup_header_id INT UNSIGNED NOT NULL,
    lookup_value VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (lookup_header_id) REFERENCES lookup_header(id) ON DELETE CASCADE,

    INDEX idx_lookup_header_id (lookup_header_id),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile Information
    company VARCHAR(150),
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),

    -- Role (uses lookup instead of ENUM)
    role_id INT UNSIGNED NOT NULL COMMENT 'FK to lookups (user_role)',
    is_active TINYINT(1) NOT NULL DEFAULT 1,

    -- Password Reset
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,

    -- OTP for verification
    otp_code VARCHAR(6),
    otp_expires DATETIME,
    email_verified_at DATETIME,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. ORDERS TABLE
-- All ENUMs replaced with lookup references
-- ============================================
CREATE TABLE orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    order_no VARCHAR(50) NOT NULL UNIQUE,

    -- Order Type & Status (use lookups instead of ENUMs)
    service_type_id INT UNSIGNED NOT NULL COMMENT 'FK to lookups (service_type)',
    status_id INT UNSIGNED NOT NULL COMMENT 'FK to lookups (order_status)',

    -- Design Details
    design_name VARCHAR(150) NOT NULL,
    height DECIMAL(8,2),
    width DECIMAL(8,2),
    unit_id INT UNSIGNED NULL COMMENT 'FK to lookups (measurement_unit)',

    -- Type-specific fields
    number_of_colors INT UNSIGNED,           -- For DIGITIZING & PATCHES
    fabric VARCHAR(100),                     -- For DIGITIZING & PATCHES
    color_type VARCHAR(100),                 -- For VECTOR (Full Color, Gradient, etc.)

    -- Arrays stored as JSON
    placement JSON,                          -- ["Front", "Back", "Left Chest", etc.]
    required_format JSON,                    -- ["DST", "EMB", "AI", "SVG", etc.]

    -- Additional Info
    instruction TEXT,
    is_urgent TINYINT(1) NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_service_type_id (service_type_id),
    INDEX idx_status_id (status_id),
    INDEX idx_unit_id (unit_id),
    INDEX idx_is_urgent (is_urgent),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. QUOTES TABLE
-- All ENUMs replaced with lookup references
-- ============================================
CREATE TABLE quotes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    quote_no VARCHAR(50) NOT NULL UNIQUE,

    -- Quote Type & Status (use lookups instead of ENUMs)
    service_type_id INT UNSIGNED NOT NULL COMMENT 'FK to lookups (service_type)',
    status_id INT UNSIGNED NOT NULL COMMENT 'FK to lookups (quote_status)',

    -- Design Details (same as orders)
    design_name VARCHAR(150) NOT NULL,
    height DECIMAL(8,2),
    width DECIMAL(8,2),
    unit_id INT UNSIGNED NULL COMMENT 'FK to lookups (measurement_unit)',

    -- Type-specific fields
    number_of_colors INT UNSIGNED,
    fabric VARCHAR(100),
    color_type VARCHAR(100),

    -- Arrays stored as JSON
    placement JSON,
    required_format JSON,

    -- Additional Info
    instruction TEXT,
    is_urgent TINYINT(1) NOT NULL DEFAULT 0,

    -- Pricing (single price and remarks)
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    remarks TEXT,                           -- Admin pricing notes/remarks

    -- Conversion tracking
    converted_order_id INT UNSIGNED,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (converted_order_id) REFERENCES orders(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_quote_no (quote_no),
    INDEX idx_service_type_id (service_type_id),
    INDEX idx_status_id (status_id),
    INDEX idx_unit_id (unit_id),
    INDEX idx_is_urgent (is_urgent),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. FILES TABLE
-- Universal file storage for orders & quotes
-- ENUMs replaced with lookup references
-- ============================================
CREATE TABLE files (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    entity_type_id INT UNSIGNED NOT NULL COMMENT 'FK to lookups (entity_type)',
    entity_id INT UNSIGNED NOT NULL,        -- Foreign key to orders.id or quotes.id

    file_role_id INT UNSIGNED NOT NULL COMMENT 'FK to lookups (file_role)',

    -- File Information
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,      -- UUID filename on disk
    file_path VARCHAR(500) NOT NULL,        -- Full path: /uploads/orders/2025/01/uuid.ext
    mime_type VARCHAR(100),
    size_bytes BIGINT UNSIGNED,

    uploaded_by INT UNSIGNED NOT NULL,      -- User ID who uploaded

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_type_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (file_role_id) REFERENCES lookups(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_entity (entity_type_id, entity_id),
    INDEX idx_file_role_id (file_role_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA - LOOKUP HEADERS
-- ============================================
INSERT INTO lookup_header (lookup_type, description, is_active) VALUES
-- New lookup types (replacing ENUMs)
('service_type', 'Types of services offered (Digitizing, Vector, Patches)', 1),
('measurement_unit', 'Units of measurement for dimensions', 1),
('order_status', 'Order lifecycle statuses', 1),
('quote_status', 'Quote lifecycle statuses', 1),
('entity_type', 'Entity types for polymorphic relationships', 1),
('user_role', 'User role levels', 1),
('file_role', 'File upload role categories', 1),

-- Existing lookup types (for dropdowns)
('placement', 'Placement options for designs', 1),
('required_format', 'File format options', 1),
('fabric', 'Fabric types for digitizing and patches', 1),
('color_type', 'Color types for vector designs', 1);

-- ============================================
-- SEED DATA - LOOKUPS
-- ============================================

-- Get lookup_header IDs for reference
SET @service_type_id = (SELECT id FROM lookup_header WHERE lookup_type = 'service_type');
SET @measurement_unit_id = (SELECT id FROM lookup_header WHERE lookup_type = 'measurement_unit');
SET @order_status_id = (SELECT id FROM lookup_header WHERE lookup_type = 'order_status');
SET @quote_status_id = (SELECT id FROM lookup_header WHERE lookup_type = 'quote_status');
SET @entity_type_id = (SELECT id FROM lookup_header WHERE lookup_type = 'entity_type');
SET @user_role_id = (SELECT id FROM lookup_header WHERE lookup_type = 'user_role');
SET @file_role_id = (SELECT id FROM lookup_header WHERE lookup_type = 'file_role');
SET @placement_id = (SELECT id FROM lookup_header WHERE lookup_type = 'placement');
SET @format_id = (SELECT id FROM lookup_header WHERE lookup_type = 'required_format');
SET @fabric_id = (SELECT id FROM lookup_header WHERE lookup_type = 'fabric');
SET @color_type_id = (SELECT id FROM lookup_header WHERE lookup_type = 'color_type');

-- Service Types (shared by orders and quotes - eliminates repetition!)
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@service_type_id, 'DIGITIZING', 1, 1),
(@service_type_id, 'VECTOR', 2, 1),
(@service_type_id, 'PATCHES', 3, 1);

-- Measurement Units (shared by orders and quotes - eliminates repetition!)
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@measurement_unit_id, 'inch', 1, 1),
(@measurement_unit_id, 'cm', 2, 1);

-- Order Statuses
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@order_status_id, 'PENDING', 1, 1),
(@order_status_id, 'IN_PROGRESS', 2, 1),
(@order_status_id, 'COMPLETED', 3, 1),
(@order_status_id, 'CANCELLED', 4, 1);

-- Quote Statuses
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@quote_status_id, 'PENDING', 1, 1),
(@quote_status_id, 'PRICED', 2, 1),
(@quote_status_id, 'CONVERTED', 3, 1);

-- Entity Types (for files table polymorphic relationship)
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@entity_type_id, 'ORDER', 1, 1),
(@entity_type_id, 'QUOTE', 2, 1);

-- User Roles
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@user_role_id, 'USER', 1, 1),
(@user_role_id, 'ADMIN', 2, 1);

-- File Roles
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@file_role_id, 'CUSTOMER_UPLOAD', 1, 1),
(@file_role_id, 'ADMIN_RESPONSE', 2, 1);

-- Placement options (existing)
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@placement_id, 'Front', 1, 1),
(@placement_id, 'Back', 2, 1),
(@placement_id, 'Left Chest', 3, 1),
(@placement_id, 'Right Chest', 4, 1),
(@placement_id, 'Left Sleeve', 5, 1),
(@placement_id, 'Right Sleeve', 6, 1);

-- Required formats (existing)
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@format_id, 'DST', 1, 1),
(@format_id, 'EMB', 2, 1),
(@format_id, 'AI', 3, 1),
(@format_id, 'PDF', 4, 1),
(@format_id, 'SVG', 5, 1),
(@format_id, 'EPS', 6, 1);

-- Fabric types (existing)
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@fabric_id, 'Cotton', 1, 1),
(@fabric_id, 'Polyester', 2, 1),
(@fabric_id, 'Linen', 3, 1),
(@fabric_id, 'Denim', 4, 1),
(@fabric_id, 'Silk', 5, 1);

-- Color types for VECTOR orders (existing)
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active) VALUES
(@color_type_id, 'Full Color', 1, 1),
(@color_type_id, 'Gradient', 2, 1),
(@color_type_id, 'Monochrome', 3, 1),
(@color_type_id, 'Duotone', 4, 1);

-- ============================================
-- SEED DATA - ADMIN USER
-- Default password: admin123
-- ⚠️ CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!
-- ============================================
-- Get the ADMIN role ID
SET @admin_role_id = (SELECT id FROM lookups WHERE lookup_value = 'ADMIN'
                      AND lookup_header_id = @user_role_id);

-- Password hash for "admin123" using bcrypt (10 rounds)
INSERT INTO users (name, email, password_hash, role_id, is_active, email_verified_at) VALUES
('Admin User', 'admin@tpportal.com', '$2a$10$rXKZ6Y3xH7j0OQh.vZ4kxexVp.z8mXQRJ8p8ZT5hqN8QxY4z5L1Ky', @admin_role_id, 1, NOW());

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count lookup headers and values
SELECT '=== LOOKUP SYSTEM SUMMARY ===' AS info;

SELECT
    lh.lookup_type,
    lh.description,
    COUNT(l.id) as value_count
FROM lookup_header lh
LEFT JOIN lookups l ON l.lookup_header_id = lh.id AND l.is_active = 1
WHERE lh.is_active = 1
GROUP BY lh.id, lh.lookup_type, lh.description
ORDER BY lh.lookup_type;

-- Verify admin user was created
SELECT '=== ADMIN USER CREATED ===' AS info;
SELECT
    u.id,
    u.name,
    u.email,
    l.lookup_value as role,
    u.is_active
FROM users u
JOIN lookups l ON u.role_id = l.id
WHERE u.email = 'admin@tpportal.com';

-- ============================================
-- DATABASE SCHEMA SUMMARY
-- ============================================
-- Total Tables: 6
-- 1. lookup_header   - Lookup categories (11 types)
-- 2. lookups         - Lookup values (39 total values)
-- 3. users           - User authentication & profiles
-- 4. orders          - Orders (uses lookups for service_type, status, unit)
-- 5. quotes          - Quotes (uses lookups for service_type, status, unit)
-- 6. files           - File uploads for orders/quotes
-- ============================================
-- IMPROVEMENTS FROM ENUM TO LOOKUP:
-- ✅ Eliminated repetition: service_type & unit shared by orders/quotes
-- ✅ No ALTER TABLE needed to add new service types or statuses
-- ✅ Centralized lookup management via lookup tables
-- ✅ Display order support for UI dropdowns
-- ✅ Soft delete support (is_active flag)
-- ✅ Future-ready for internationalization
-- ✅ Rich metadata support (descriptions)
-- ✅ All foreign key constraints with proper CASCADE rules
-- ============================================
-- LOOKUP TYPES CREATED:
-- 1. service_type      - 3 values  (DIGITIZING, VECTOR, PATCHES)
-- 2. measurement_unit  - 2 values  (inch, cm)
-- 3. order_status      - 4 values  (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
-- 4. quote_status      - 3 values  (PENDING, PRICED, CONVERTED)
-- 5. entity_type       - 2 values  (ORDER, QUOTE)
-- 6. user_role         - 2 values  (USER, ADMIN)
-- 7. file_role         - 2 values  (CUSTOMER_UPLOAD, ADMIN_RESPONSE)
-- 8. placement         - 6 values  (Front, Back, Left Chest, etc.)
-- 9. required_format   - 6 values  (DST, EMB, AI, PDF, SVG, EPS)
-- 10. fabric           - 5 values  (Cotton, Polyester, Linen, Denim, Silk)
-- 11. color_type       - 4 values  (Full Color, Gradient, Monochrome, Duotone)
-- ============================================
