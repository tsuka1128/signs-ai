-- 042: Rename 'プロダクト' to '担当領域' in companies table
UPDATE companies 
SET secondary_axis_name = '担当領域' 
WHERE secondary_axis_name = 'プロダクト' OR secondary_axis_name = '担当プロダクト' OR secondary_axis_name IS NULL;

COMMENT ON COLUMN companies.secondary_axis_name IS '第2軸の呼称（例：担当領域、プロダクト等）';
