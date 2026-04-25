-- 066_normalize_roles_and_notify_settings.sql
-- 権限ロールの正規化（executive追加）および通知設定テーブルの導入

-- =====================================================
-- 1. users テーブルのロール制約追加
-- =====================================================
-- 既存のデータを守るため、まず不正なロールがないか確認する意図で追加
-- もし既存データに不備があれば、ここでエラーになります
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('super_admin', 'admin', 'executive', 'manager', 'player', 'partner'));

COMMENT ON COLUMN public.users.role IS 'ユーザー権限: super_admin, admin, executive, manager, player, partner';

-- =====================================================
-- 2. invitations テーブルのロール制約更新
-- =====================================================
-- インライン制約だった名前を特定して削除（通常は テーブル名_カラム名_check）
ALTER TABLE public.invitations 
DROP CONSTRAINT IF EXISTS invitations_role_check;

ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_role_check 
CHECK (role IN ('admin', 'executive', 'manager', 'player', 'partner'));

-- =====================================================
-- 3. 通知設定テーブル (notification_settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, 
    -- 種別例: 'ai_summary', 'anomaly_alert', 'voice_check_reminder', 'voice_check_progress', 'kpi_reminder', 'action_reminder'
    slack_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- 自分の設定のみ参照・更新可能
CREATE POLICY "users_manage_own_notification_settings" ON public.notification_settings
    FOR ALL USING (user_id = auth.uid());

-- super_admin は全参照可能
CREATE POLICY "super_admins_all_notification_settings" ON public.notification_settings
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- updated_at トリガー
CREATE TRIGGER notification_settings_updated_at BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. プロフィール自動生成トリガーの修正 (064 の上書き)
-- =====================================================
-- デフォルトロールを 'player' に統一し、不整合を防ぐ
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    'player' -- 'member' から 'player' に修正
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =====================================================
-- 5. 既存ロールのクレンジング（任意だが推奨）
-- =====================================================
-- 'member' となっているものを 'player' に置換（もし存在すれば）
UPDATE public.users SET role = 'player' WHERE role = 'member';

COMMENT ON TABLE public.notification_settings IS 'ユーザーごとの通知ON/OFF設定';
