-- 090_create_ai_workers.sql
-- 各社ごとのAIアシスタント名簿台帳テーブル

CREATE TABLE IF NOT EXISTS public.ai_workers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_name     TEXT NOT NULL,      -- "CPO Elon", "CHRO Drucker" 等
    role           TEXT NOT NULL,      -- "CPO", "CHRO" 等
    department_id  UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_model TEXT NOT NULL DEFAULT 'claude-3-7-sonnet-20250219',
    kpi_scope      TEXT NOT NULL DEFAULT 'department', -- 'company' | 'department'
    status         TEXT NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- 制約条件
    CONSTRAINT ai_workers_kpi_scope_check CHECK (kpi_scope IN ('company', 'department')),
    CONSTRAINT ai_workers_status_check CHECK (status IN ('active', 'inactive'))
);

COMMENT ON TABLE public.ai_workers IS '契約企業ごとのAIアシスタント（労働力）名簿マスタ';

-- 行レベルセキュリティ（RLS）の有効化
ALTER TABLE public.ai_workers ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーのクリア
DROP POLICY IF EXISTS "ai_workers_select" ON public.ai_workers;
DROP POLICY IF EXISTS "ai_workers_modify" ON public.ai_workers;

-- 閲覧ポリシー: admin / super_admin / executive ロールのみ自社のAI Workersを閲覧可
CREATE POLICY "ai_workers_select" ON public.ai_workers
    FOR SELECT TO authenticated
    USING (
        company_id = get_my_company_id()
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin', 'executive')
    );

-- 編集ポリシー: admin / super_admin ロールのみ自社のAI Workersを操作・編集可
CREATE POLICY "ai_workers_modify" ON public.ai_workers
    FOR ALL TO authenticated
    USING (
        company_id = get_my_company_id()
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    )
    WITH CHECK (
        company_id = get_my_company_id()
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );
