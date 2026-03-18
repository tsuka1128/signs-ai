-- 026_create_system_settings.sql
-- 管理者用のシステム設定（AI、システム制御、アラート閾値等）を管理するテーブル

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'system', 'ai', 'alert'
    key TEXT UNIQUE NOT NULL, -- 例: 'maintenance_mode', 'base_prompt', etc.
    value JSONB NOT NULL, -- 設定値
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLSの設定
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- super_admin のみが全操作可能
CREATE POLICY "Super admins can do everything on system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

-- 一般ユーザーは読み取り不可（運営専用設定のため）

-- 初期データの投入
INSERT INTO public.system_settings (category, key, value, description)
VALUES 
    ('system', 'maintenance_mode', 'false'::jsonb, 'メンテナンスモードのON/OFF（trueで一般ユーザー画面をロック）'),
    ('system', 'registration_enabled', 'true'::jsonb, '新規企業登録の受付ON/OFF'),
    ('system', 'default_trial_days', '30'::jsonb, '新規登録時のデフォルトトライアル期間（日）'),
    ('ai', 'base_system_prompt', '"あなたは組織分析の専門家AIです。客観的かつ建設的なアドバイスを提供してください。"'::jsonb, 'AI分析の基本システムプロンプト'),
    ('ai', 'default_model', '"claude-3-7-sonnet-20250219"'::jsonb, '使用するAIモデルの識別子'),
    ('ai', 'temperature', '0.7'::jsonb, 'AI生成のランダム性（0.0〜1.0）'),
    ('alert', 'churn_threshold_days', '30'::jsonb, '解約リスク判定：最終ログインからの経過日数'),
    ('alert', 'kpi_missing_threshold_months', '2'::jsonb, '解約リスク判定：KPI未入力の継続月数'),
    ('alert', 'notification_slack_webhook', '""'::jsonb, '管理用通知を送るSlack Webhook URL'),
    ('alert', 'notification_email', '"admin@example.com"'::jsonb, '管理用通知を送るメールアドレス')
ON CONFLICT (key) DO NOTHING;
