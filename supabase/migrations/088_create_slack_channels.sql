-- 088_create_slack_channels.sql
-- Slack参謀チャンネル機能のためのテーブル作成および移行マイグレーション

-- =====================================================
-- 1. slack_channels テーブルの新規作成
-- =====================================================
CREATE TABLE IF NOT EXISTS public.slack_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    channel_type TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    -- 通知設定フラグ（初期値は全て false で、プリセット注入で制御）
    notify_voice_check_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    notify_voice_check_feedback BOOLEAN NOT NULL DEFAULT FALSE,
    notify_ai_summary BOOLEAN NOT NULL DEFAULT FALSE,
    notify_anomaly_alert BOOLEAN NOT NULL DEFAULT FALSE,
    notify_kpi_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 制約条件
    CONSTRAINT slack_channels_channel_type_check CHECK (channel_type IN ('department', 'company', 'executive', 'custom')),
    CONSTRAINT slack_channels_dept_id_required CHECK ((channel_type = 'department') = (department_id IS NOT NULL))
);

COMMENT ON TABLE public.slack_channels IS 'Slack通知用チャンネルおよび通知設定マスタ';

-- =====================================================
-- 2. 一意性制約（ユニークインデックス）の構築
-- =====================================================
-- 1部署につき1チャンネルのみ保証
CREATE UNIQUE INDEX IF NOT EXISTS uniq_dept_channel
    ON public.slack_channels(department_id) 
    WHERE channel_type = 'department';

-- 1社につき全社チャンネルは1つのみ保証
CREATE UNIQUE INDEX IF NOT EXISTS uniq_company_channel
    ON public.slack_channels(company_id) 
    WHERE channel_type = 'company';

-- =====================================================
-- 3. インデックス作成
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_slack_channels_company_id ON public.slack_channels(company_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_department_id ON public.slack_channels(department_id);

-- =====================================================
-- 4. 既存データの自動移行
-- =====================================================
-- companies.slack_webhook_url から slack_channels へ「全社チャンネル」として自動移行
-- デフォルトプリセット: ai_summary=true, anomaly_alert=true, 他はfalse
INSERT INTO public.slack_channels (
    company_id, 
    name, 
    channel_type, 
    webhook_url, 
    notify_ai_summary, 
    notify_anomaly_alert
)
SELECT 
    id, 
    '全社チャンネル', 
    'company', 
    slack_webhook_url, 
    TRUE, 
    TRUE
FROM public.companies
WHERE slack_webhook_url IS NOT NULL
ON CONFLICT (company_id) WHERE channel_type = 'company' DO NOTHING;

-- =====================================================
-- 5. 行レベルセキュリティ（RLS）の設定
-- =====================================================
ALTER TABLE public.slack_channels ENABLE ROW LEVEL SECURITY;

-- 自身の所属する company_id かつ、ロールが admin, super_admin, executive のメンバーに全操作を許可
DROP POLICY IF EXISTS "admin_manage_slack_channels" ON public.slack_channels;
CREATE POLICY "admin_manage_slack_channels" ON public.slack_channels
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() 
              AND users.company_id = slack_channels.company_id
              AND users.role IN ('admin', 'super_admin', 'executive')
        )
    );

-- =====================================================
-- 6. updated_at の自動更新トリガー
-- =====================================================
DROP TRIGGER IF EXISTS slack_channels_updated_at ON public.slack_channels;
CREATE TRIGGER slack_channels_updated_at BEFORE UPDATE ON public.slack_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
