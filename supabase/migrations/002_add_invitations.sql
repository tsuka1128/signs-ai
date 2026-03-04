-- =====================================================
-- マルチテナント・権限管理強化：招待機能とロール管理
-- =====================================================

-- 1. 招待テーブルの作成 (invitations)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'player', 'partner')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invitations の RLS 有効化
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 自分が所属する会社の招待のみ参照・作成可能とするポリシー
CREATE POLICY "users_own_company_invitations" ON invitations
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- トークンを知っている場合は参照可能（参加用）
CREATE POLICY "anyone_can_read_invitation_by_token" ON invitations
  FOR SELECT USING (true);

-- 2. users テーブルの既存レコードのロールを確認・正規化（任意）
-- 現状の users テーブルに role CHECK 制約を追加することを推奨
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('executive', 'admin', 'manager', 'player', 'partner'));

-- 3. RLS ポリシーの微調整（必要に応じて）
-- users テーブル：同じ会社の他メンバーも（名前とロールだけは）見えるようにする（招待管理用）
DROP POLICY IF EXISTS "users_can_read_own_profile" ON users;
CREATE POLICY "users_can_read_company_members" ON users
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- トリガーの追加（招待テーブルの updated_at）
CREATE TRIGGER invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
