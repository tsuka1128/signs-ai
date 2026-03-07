-- =====================================================
-- データベーススキーマ修正スクリプト (Prerequisite)
-- ダミーデータ投入前に必ず実行してください。
-- =====================================================

-- 1. resource_records テーブルに axis_id を追加 (第2軸の履歴用)
ALTER TABLE resource_records ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES kpi_axes(id) ON DELETE CASCADE;

-- 2. resource_records の制約を更新（重複防止）
DO $$
BEGIN
    -- 旧制約の削除
    ALTER TABLE resource_records DROP CONSTRAINT IF EXISTS resource_records_department_id_recorded_month_key;
    ALTER TABLE resource_records DROP CONSTRAINT IF EXISTS resource_records_composite_key;
    
    -- 新制約の追加
    ALTER TABLE resource_records ADD CONSTRAINT resource_records_composite_key UNIQUE NULLS NOT DISTINCT (company_id, department_id, axis_id, recorded_month);
EXCEPTION
    WHEN duplicate_table THEN
        NULL; -- すでに存在する場合は何もしない
END $$;

-- 3. companies テーブルに short_id を追加 (ID表示用)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS short_id TEXT;

-- 4. short_id にユニーク制約を追加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_short_id_unique') THEN
        ALTER TABLE companies ADD CONSTRAINT companies_short_id_unique UNIQUE (short_id);
    END IF;
END $$;

-- 5. 既存の short_id を埋める
UPDATE companies c
SET short_id = 
  (SELECT UPPER(SUBSTRING(p.name FROM 1 FOR 1)) FROM plans p WHERE p.id = c.plan_id) || '-' ||
  TO_CHAR(c.created_at, 'YYMMDD') || '-' ||
  UPPER(LEFT(c.id::text, 4))
WHERE short_id IS NULL;
