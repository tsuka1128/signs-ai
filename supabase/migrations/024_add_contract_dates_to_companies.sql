-- =====================================================
-- 契約期間・解約通知に関するカラムを追加
-- =====================================================

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS contract_start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contract_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancellation_notice_date DATE DEFAULT NULL;

-- コメントの追加
COMMENT ON COLUMN companies.contract_start_date IS '契約開始日';
COMMENT ON COLUMN companies.contract_end_date IS '契約終了日';
COMMENT ON COLUMN companies.cancellation_notice_date IS '解約通知日';
