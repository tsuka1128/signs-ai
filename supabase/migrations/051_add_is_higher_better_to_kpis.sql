-- 051: kpi_definitions テーブルに評価の向き (is_higher_better) を追加
ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS is_higher_better BOOLEAN NOT NULL DEFAULT TRUE;

-- コメント追加
COMMENT ON COLUMN kpi_definitions.is_higher_better IS '評価の向き。TRUE: 数値が大きいほど良い(売上等), FALSE: 数値が小さいほど良い(離職率・解約率等)';
