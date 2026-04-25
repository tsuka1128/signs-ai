-- 065: invitations テーブルへの soft delete 導入

-- 1. deleted_at カラムの追加
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. company_id の FK を CASCADE → RESTRICT に変更
--    企業削除時に招待が消えないよう、先に招待を処理してから企業削除を強制する
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_company_id_fkey;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

-- 3. inviter_id の FK も CASCADE → SET NULL に変更
--    招待者が退職・削除されても招待履歴は残す
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_inviter_id_fkey;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_inviter_id_fkey
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE SET NULL;

-- inviter_id を NULL 許容に変更（SET NULL のため必要）
ALTER TABLE invitations ALTER COLUMN inviter_id DROP NOT NULL;
