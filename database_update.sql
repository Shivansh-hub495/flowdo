-- Run this SQL script in your Supabase SQL Editor to add the new fields
-- Go to your Supabase Dashboard > SQL Editor > New Query
-- Copy and paste this script, then click "Run"

-- Add new columns to the tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS estimated_time TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Set default priority for existing tasks (optional)
UPDATE public.tasks SET priority = 'medium' WHERE priority IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public'
ORDER BY ordinal_position;
