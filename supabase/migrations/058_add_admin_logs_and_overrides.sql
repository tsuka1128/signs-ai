-- 058_add_admin_logs_and_overrides.sql
-- 1. 管理操作ログテーブルの作成
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id),
    target_company_id UUID REFERENCES public.companies(id),
    action_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLSの設定
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin のみ全アクセスを許可
CREATE POLICY "super_admins_all_logs" ON public.admin_activity_logs
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- 2. companies テーブルへの上書き設定カラムの追加
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_overrides JSONB NOT NULL DEFAULT '{}';
COMMENT ON COLUMN public.companies.plan_overrides IS '企業個別のプラン制限上書き設定（JSON）';

-- 3. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_company_id ON public.admin_activity_logs(target_company_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_activity_logs(created_at DESC);
