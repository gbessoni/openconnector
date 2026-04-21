-- Add country field to vendors table.
-- Applied manually (no migration runner is configured in this project).

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS country text;
