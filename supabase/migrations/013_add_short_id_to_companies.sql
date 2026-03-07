-- 1. companies テーブルに short_id カラムを追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS short_id TEXT;

-- 2. 既存データの一括更新（プラン頭文字 + 日付 + UUID先頭）
UPDATE companies c
SET short_id = 
  (SELECT UPPER(SUBSTRING(p.name FROM 1 FOR 1)) FROM plans p WHERE p.id = c.plan_id) || '-' ||
  TO_CHAR(c.created_at, 'YYMMDD') || '-' ||
  UPPER(LEFT(c.id::text, 4))
WHERE short_id IS NULL;

-- 3. 今後のために UNIQUE 制約と NOT NULL 制約を追加（必要に応じて）
-- ALTER TABLE companies ALTER COLUMN short_id SET NOT NULL;
-- ALTER TABLE companies ADD CONSTRAINT companies_short_id_unique UNIQUE (short_id);
