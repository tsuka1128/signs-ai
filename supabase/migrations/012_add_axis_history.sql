-- 1. resource_records テーブルに axis_id を追加
-- これにより、部署だけでなく第2軸（エリア・プロダクト等）単位での人数履歴も保持可能になります。
ALTER TABLE resource_records ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES kpi_axes(id) ON DELETE CASCADE;

-- 2. ユニーク制約の更新（department_id または axis_id ごとに月別の履歴を1件に制限）
ALTER TABLE resource_records DROP CONSTRAINT IF EXISTS resource_records_department_id_recorded_month_key;
ALTER TABLE resource_records ADD CONSTRAINT resource_records_composite_key UNIQUE NULLS NOT DISTINCT (company_id, department_id, axis_id, recorded_month);

-- 3. RLS ポリシーの更新（axis_id 経由でもアクセス可能にする）
-- 既存の "users_own_company_resource_records" が company_id を見ているため、axis_id を追加してもそのまま機能します。
