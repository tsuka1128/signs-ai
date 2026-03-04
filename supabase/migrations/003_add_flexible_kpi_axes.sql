-- =====================================================
-- Signs AI — 第2軸（ブランド・エリア等）対応
-- =====================================================

-- 1. 企業テーブルに「第2軸を何と呼ぶか」のカスタム名称カラムを追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS kpi_secondary_axis_name TEXT NOT NULL DEFAULT '第2軸';

-- 2. 第2軸の項目を管理するテーブル (kpi_axes)
CREATE TABLE IF NOT EXISTS kpi_axes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. KPI実績値テーブルへの軸ID追加とユニーク制約の更新
-- ※ axis_id が NULL の場合は「全社・部署（基本）」のデータとする
ALTER TABLE kpi_records ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES kpi_axes(id) ON DELETE CASCADE;

-- 既存のユニーク制約を削除して、axis_id を含めた新しい制約を作成
ALTER TABLE kpi_records DROP CONSTRAINT IF EXISTS kpi_records_kpi_definition_id_recorded_month_key;
ALTER TABLE kpi_records DROP CONSTRAINT IF EXISTS kpi_records_composite_key;
ALTER TABLE kpi_records ADD CONSTRAINT kpi_records_composite_key UNIQUE NULLS NOT DISTINCT (kpi_definition_id, recorded_month, axis_id);

-- 4. RLS (Row Level Security) 設定
ALTER TABLE kpi_axes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_company_kpi_axes" ON kpi_axes
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- 5. トリガー：updated_at 自動更新
CREATE TRIGGER kpi_axes_updated_at BEFORE UPDATE ON kpi_axes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
