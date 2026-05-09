-- 079: 企業メタデータの追加（ベンチマーク・会計年度対応）

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS size_category TEXT
      CHECK (size_category IN ('micro', 'small', 'medium', 'large')),
  ADD COLUMN IF NOT EXISTS fiscal_year_start_month INTEGER DEFAULT 1
      CHECK (fiscal_year_start_month BETWEEN 1 AND 12);

COMMENT ON COLUMN companies.industry IS '業種カテゴリ（ベンチマーク用）';
COMMENT ON COLUMN companies.size_category IS '従業員規模区分: micro=〜20名, small=21〜100名, medium=101〜300名, large=301名〜';
COMMENT ON COLUMN companies.fiscal_year_start_month IS '会計年度開始月（1〜12）。日本企業は4が多い。';
