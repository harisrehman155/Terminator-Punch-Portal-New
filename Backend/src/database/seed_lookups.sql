-- Seed lookup headers and values for TP Portal
-- This script is idempotent: it inserts missing headers/values without duplicating existing rows.

START TRANSACTION;

-- Lookup headers
INSERT INTO lookup_header (lookup_type, description, is_active, created_at, updated_at)
VALUES
  ('user_role', 'User roles', 1, NOW(), NOW()),
  ('service_type', 'Service types', 1, NOW(), NOW()),
  ('order_status', 'Order statuses', 1, NOW(), NOW()),
  ('quote_status', 'Quote statuses', 1, NOW(), NOW()),
  ('invoice_status', 'Invoice statuses', 1, NOW(), NOW()),
  ('measurement_unit', 'Measurement units', 1, NOW(), NOW()),
  ('placement', 'Design placement options', 1, NOW(), NOW()),
  ('required_format', 'Required output formats', 1, NOW(), NOW()),
  ('entity_type', 'File entity types', 1, NOW(), NOW()),
  ('file_role', 'File roles', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  is_active = VALUES(is_active),
  updated_at = NOW();

-- Cache header IDs
SET @user_role_id = (SELECT id FROM lookup_header WHERE lookup_type = 'user_role');
SET @service_type_id = (SELECT id FROM lookup_header WHERE lookup_type = 'service_type');
SET @order_status_id = (SELECT id FROM lookup_header WHERE lookup_type = 'order_status');
SET @quote_status_id = (SELECT id FROM lookup_header WHERE lookup_type = 'quote_status');
SET @invoice_status_id = (SELECT id FROM lookup_header WHERE lookup_type = 'invoice_status');
SET @measurement_unit_id = (SELECT id FROM lookup_header WHERE lookup_type = 'measurement_unit');
SET @placement_id = (SELECT id FROM lookup_header WHERE lookup_type = 'placement');
SET @required_format_id = (SELECT id FROM lookup_header WHERE lookup_type = 'required_format');
SET @entity_type_id = (SELECT id FROM lookup_header WHERE lookup_type = 'entity_type');
SET @file_role_id = (SELECT id FROM lookup_header WHERE lookup_type = 'file_role');

-- user_role
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @user_role_id, 'ADMIN', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @user_role_id AND lookup_value = 'ADMIN'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @user_role_id, 'USER', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @user_role_id AND lookup_value = 'USER'
);

-- service_type
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @service_type_id, 'DIGITIZING', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @service_type_id AND lookup_value = 'DIGITIZING'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @service_type_id, 'VECTOR', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @service_type_id AND lookup_value = 'VECTOR'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @service_type_id, 'PATCHES', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @service_type_id AND lookup_value = 'PATCHES'
);

-- order_status
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @order_status_id, 'PENDING', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @order_status_id AND lookup_value = 'PENDING'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @order_status_id, 'IN_PROGRESS', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @order_status_id AND lookup_value = 'IN_PROGRESS'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @order_status_id, 'COMPLETED', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @order_status_id AND lookup_value = 'COMPLETED'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @order_status_id, 'CANCELLED', 4, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @order_status_id AND lookup_value = 'CANCELLED'
);

-- quote_status
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @quote_status_id, 'PENDING', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @quote_status_id AND lookup_value = 'PENDING'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @quote_status_id, 'PRICED', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @quote_status_id AND lookup_value = 'PRICED'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @quote_status_id, 'REVISION_REQUESTED', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @quote_status_id AND lookup_value = 'REVISION_REQUESTED'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @quote_status_id, 'CONVERTED', 4, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @quote_status_id AND lookup_value = 'CONVERTED'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @quote_status_id, 'REJECTED', 5, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @quote_status_id AND lookup_value = 'REJECTED'
);

-- invoice_status
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @invoice_status_id, 'UNPAID', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @invoice_status_id AND lookup_value = 'UNPAID'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @invoice_status_id, 'PAID', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @invoice_status_id AND lookup_value = 'PAID'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @invoice_status_id, 'CANCELLED', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @invoice_status_id AND lookup_value = 'CANCELLED'
);

-- measurement_unit
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @measurement_unit_id, 'inch', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @measurement_unit_id AND lookup_value = 'inch'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @measurement_unit_id, 'cm', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @measurement_unit_id AND lookup_value = 'cm'
);

-- placement
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @placement_id, 'Front', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @placement_id AND lookup_value = 'Front'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @placement_id, 'Back', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @placement_id AND lookup_value = 'Back'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @placement_id, 'Left Chest', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @placement_id AND lookup_value = 'Left Chest'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @placement_id, 'Right Chest', 4, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @placement_id AND lookup_value = 'Right Chest'
);

-- required_format
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @required_format_id, 'DST', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @required_format_id AND lookup_value = 'DST'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @required_format_id, 'EMB', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @required_format_id AND lookup_value = 'EMB'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @required_format_id, 'AI', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @required_format_id AND lookup_value = 'AI'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @required_format_id, 'PDF', 4, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @required_format_id AND lookup_value = 'PDF'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @required_format_id, 'SVG', 5, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @required_format_id AND lookup_value = 'SVG'
);

-- entity_type
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @entity_type_id, 'ORDER', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @entity_type_id AND lookup_value = 'ORDER'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @entity_type_id, 'QUOTE', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @entity_type_id AND lookup_value = 'QUOTE'
);

-- file_role
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @file_role_id, 'CUSTOMER_UPLOAD', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @file_role_id AND lookup_value = 'CUSTOMER_UPLOAD'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @file_role_id, 'ADMIN_RESPONSE', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @file_role_id AND lookup_value = 'ADMIN_RESPONSE'
);
INSERT INTO lookups (lookup_header_id, lookup_value, display_order, is_active, created_at, updated_at)
SELECT @file_role_id, 'ATTACHMENT', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookups WHERE lookup_header_id = @file_role_id AND lookup_value = 'ATTACHMENT'
);

COMMIT;
