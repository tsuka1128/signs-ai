-- Add deep_dive column to dept_ai_summaries table
ALTER TABLE dept_ai_summaries ADD COLUMN IF NOT EXISTS deep_dive text;
