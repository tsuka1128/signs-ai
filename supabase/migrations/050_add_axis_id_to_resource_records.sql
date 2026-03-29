-- 050: resource_records テーブルに担当領域 (axis_id) カラムを追加
ALTER TABLE resource_records ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES kpi_axes(id) ON DELETE CASCADE;

-- 既存の一意制約を削除して、部署または担当領域ごとに月間1件のみとなるよう更新
-- 既存の制約名を確認 (001_initial_schema.sql では UNIQUE(department_id, recorded_month) となっていた)
ALTER TABLE resource_records DROP CONSTRAINT IF EXISTS resource_records_department_id_recorded_month_key;

-- 新しい複合ユニーク制約を追加
-- department_id と axis_id のどちらかが入る想定 (両方 NULL または両方入力も許容されるが、基本はどちらか一方)
ALTER TABLE resource_records 
ADD CONSTRAINT resource_records_company_dept_axis_month_key 
UNIQUE (company_id, department_id, axis_id, recorded_month);

-- コメント追加
COMMENT ON COLUMN resource_records.axis_id IS '担当領域（第2軸）のID。部署履歴と区別して保存するために使用。';
