-- KPI定義に売上判定フラグを追加
ALTER TABLE kpi_definitions
  ADD COLUMN IF NOT EXISTS is_revenue BOOLEAN NOT NULL DEFAULT false;
