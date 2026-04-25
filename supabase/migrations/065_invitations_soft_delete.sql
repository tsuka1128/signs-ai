-- 065: invitations テーブルへの soft delete 導入およびステータス表記の修正

-- 1. deleted_at カラムの追加
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. company_id の FK を CASCADE → RESTRICT に変更
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_company_id_fkey;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

-- 3. inviter_id の FK を CASCADE → SET NULL に変更
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_inviter_id_fkey;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_inviter_id_fkey
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE invitations ALTER COLUMN inviter_id DROP NOT NULL;

-- 4. status のタイポ修正 (canceled -> cancelled)
--    既存の CHECK 制約を削除し、コード側 (cancelled) に合わせた制約に更新
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_status_check;

-- 既存データの表記揺れを修正
UPDATE invitations SET status = 'cancelled' WHERE status = 'canceled';

-- 正しいスペル (cancelled) で制約を再定義
ALTER TABLE invitations
    ADD CONSTRAINT invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));
