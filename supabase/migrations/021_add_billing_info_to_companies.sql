-- =====================================================
-- 請求関連のカラムを追加
-- =====================================================

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS custom_mrr NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS setup_fee NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS billing_contact_name TEXT,
ADD COLUMN IF NOT EXISTS billing_memo TEXT;

-- コメントの追加
COMMENT ON COLUMN companies.custom_mrr IS '手入力された月次収益（設定されている場合はプラン標準単価より優先される）';
COMMENT ON COLUMN companies.setup_fee IS '初期費用';
COMMENT ON COLUMN companies.billing_email IS '請求先メールアドレス';
COMMENT ON COLUMN companies.billing_contact_name IS '請求先担当者名';
COMMENT ON COLUMN companies.billing_memo IS '請求に関するメモ';
