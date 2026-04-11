-- KPI実績テーブルに部署IDを追加し、部署ごとの管理を可能にする
ALTER TABLE kpi_records ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE CASCADE;

-- 既存のユニーク制約を削除（制約名がデフォルトの場合を想定）
-- もしエラーが出る場合は、実際の制約名を確認して調整してください
ALTER TABLE kpi_records DROP CONSTRAINT IF EXISTS kpi_records_kpi_definition_id_recorded_month_key;

-- 新しい複合ユニーク制約を追加（KPI定義、月、部署の組み合わせで一意にする）
ALTER TABLE kpi_records ADD CONSTRAINT kpi_records_kpi_month_dept_unique UNIQUE(kpi_definition_id, recorded_month, department_id);

-- 既存の axis_id カラムがある場合の調整（既に存在することを想定）
-- インポートロジックで axis_id も参照しているため、必要に応じてインデックスを貼る
CREATE INDEX IF NOT EXISTS idx_kpi_records_dept_id ON kpi_records(department_id);
