-- 062_add_fingerprint_to_survey_responses.sql
-- アンケートの重複回答（連投）を防止するため、匿名性の高いフィンガープリントカラムを追加

ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS fingerprint TEXT;
COMMENT ON COLUMN survey_responses.fingerprint IS 'ブラウザや端末を識別するためのハッシュ（匿名性を維持しつつ重複を防止）';

-- 同一企業、同一月、同一フィンガープリントでの重複をDBレベルで制限
-- ※ 念のため、過去のデータに重複があるとエラーになるため、インデックスのみ作成するか、既存データをクリーンアップしてから制約をかける
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_survey_submission 
ON survey_responses (company_id, recorded_month, fingerprint) 
WHERE fingerprint IS NOT NULL;
