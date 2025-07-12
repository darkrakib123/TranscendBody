-- Add is_admin to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_global to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT FALSE;

-- If you have a plan enum, update it to only allow 'basic' and 'pro'.
-- If plan is just a varchar, no enum migration is needed.
-- (No action for plan enum unless you use a custom type.) 