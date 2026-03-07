-- =====================================================
-- Signs AI — 部署テーブルへの sort_order 追加
-- =====================================================

ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- 既存データの初期化（created_at 順に連番を振る例）
WITH ordered_depts AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at) - 1 as new_order
  FROM departments
)
UPDATE departments
SET sort_order = ordered_depts.new_order
FROM ordered_depts
WHERE departments.id = ordered_depts.id;
