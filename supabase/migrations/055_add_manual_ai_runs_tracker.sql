-- 055_add_manual_ai_runs_tracker.sql
-- 企業ごとの当月のAI手動実行回数や次回実行日を管理するためのカラムを追加

ALTER TABLE companies ADD COLUMN IF NOT EXISTS manual_ai_runs_used_this_month INT NOT NULL DEFAULT 0;
COMMENT ON COLUMN companies.manual_ai_runs_used_this_month IS '当月に手動でAI分析を実行した回数（月次でリセット想定）';
