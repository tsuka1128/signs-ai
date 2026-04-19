-- 061_add_trial_expires_at_to_companies.sql
-- トライアル期限を明示的に管理するためのカラムを追加

ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN companies.trial_expires_at IS 'トライアル期間の終了日時';

-- 既存のトライアル企業に対して、作成日から70日後を期限として設定（デフォルト値に合わせて調整）
UPDATE companies 
SET trial_expires_at = created_at + interval '70 days'
WHERE status = 'trial' AND trial_expires_at IS NULL;
