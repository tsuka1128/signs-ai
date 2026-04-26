-- 071_add_check_constraint_to_system_settings_category.sql
-- system_settings テーブルの category カラムに制約を追加し、データの整合性を担保します。

ALTER TABLE public.system_settings
ADD CONSTRAINT system_settings_category_check
CHECK (category IN ('system', 'ai', 'alert', 'survey', 'ai_prompt'));
