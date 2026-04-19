-- 060_add_manual_ai_runs_reset_logic.sql
-- AI分析の実行回数を月次で自動的にリセットするための追跡用カラムを追加

ALTER TABLE companies ADD COLUMN IF NOT EXISTS manual_ai_runs_active_month TEXT;
COMMENT ON COLUMN companies.manual_ai_runs_active_month IS '現在カウントされているAI実行回数の対象月（YYYY-MM形式）。この値が現時刻の月と異なる場合、カウントをリセットする。';

-- 初期値として現在の月を設定（既存データ用）
UPDATE companies SET manual_ai_runs_active_month = to_char(CURRENT_DATE, 'YYYY-MM') WHERE manual_ai_runs_active_month IS NULL;
