-- 089_create_ai_usage_logs.sql
-- AIモデルのトークン使用実績と利用コストのロギングテーブル

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID REFERENCES public.companies(id) ON DELETE SET NULL, -- 会社削除後もログの分析可能性を考慮
    agent_name    TEXT,          -- "CPO Elon", "CHRO Drucker", "system" 等
    purpose       TEXT,          -- "ai_analysis", "hr_strategy", "dept_summary" 等
    model         TEXT NOT NULL,
    input_tokens  INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost_usd      NUMERIC(10,6) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_usage_logs IS 'AIモデルのトークン使用実績および利用コストのロギング用テーブル';

-- 行レベルセキュリティ（RLS）の有効化
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーのクリア
DROP POLICY IF EXISTS "ai_usage_logs_select" ON public.ai_usage_logs;

-- admin / super_admin ロールのみ自社のログを閲覧可
CREATE POLICY "ai_usage_logs_select" ON public.ai_usage_logs
    FOR SELECT TO authenticated
    USING (
        company_id = get_my_company_id()
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );
