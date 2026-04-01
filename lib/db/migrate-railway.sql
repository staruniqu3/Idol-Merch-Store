-- Railway Production Migration Script
-- Run this directly in Railway's PostgreSQL query console (or via psql)
-- Safe to re-run: uses IF NOT EXISTS and handles existing columns

-- ============================================================
-- 1. products: cast variants from text -> jsonb
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'variants'
      AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE products
      ALTER COLUMN variants TYPE jsonb USING variants::jsonb;
    RAISE NOTICE 'products.variants cast to jsonb';
  ELSE
    RAISE NOTICE 'products.variants already jsonb or does not exist, skipping';
  END IF;
END $$;

-- Add variants if it doesn't exist at all yet
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags text[];

-- ============================================================
-- 2. preorder_schedule: add missing columns
-- ============================================================
ALTER TABLE preorder_schedule ADD COLUMN IF NOT EXISTS pickup_date     text;
ALTER TABLE preorder_schedule ADD COLUMN IF NOT EXISTS pickup_deadline text;
ALTER TABLE preorder_schedule ADD COLUMN IF NOT EXISTS image_url       text;
ALTER TABLE preorder_schedule ADD COLUMN IF NOT EXISTS artist          text;
ALTER TABLE preorder_schedule ADD COLUMN IF NOT EXISTS is_active       boolean NOT NULL DEFAULT true;

-- ============================================================
-- 3. orders: add missing columns
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS member_id       integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address         text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee    numeric(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned   integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes           text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type      text NOT NULL DEFAULT 'preorder';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- Done
-- ============================================================
SELECT 'Migration complete' AS status;
