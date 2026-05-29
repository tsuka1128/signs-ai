-- 091_create_ai_labor_records.sql
-- 月次のAI人件費（稼働コスト実績）データテーブル

CREATE TABLE IF NOT EXISTS public.ai_labor_records (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL, -- 部署削除後も全社合計に計上可能とするため SET NULL
    recorded_month TEXT NOT NULL,  -- 'YYYY-MM'
    agent_name    TEXT NOT NULL,
    labor_cost    NUMERIC(12,2) NOT NULL DEFAULT 0, -- USD→JPY換算済みの月次合計金額（円）
    total_tokens  INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- ユニークインデックス制約（1部署×1エージェント×1ヶ月につき1レコード）
    UNIQUE(department_id, agent_name, recorded_month)
);

COMMENT ON TABLE public.ai_labor_records IS '月次ごとのAI労働コスト（AI人件費）実績データ';

-- 行レベルセキュリティ（RLS）の有効化
ALTER TABLE public.ai_labor_records ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーのクリア
DROP POLICY IF EXISTS "ai_labor_records_select" ON public.ai_labor_records;
DROP POLICY IF EXISTS "ai_labor_records_modify" ON public.ai_labor_records;

-- 閲覧ポリシー: admin / super_admin / executive ロールのみ自社のAI人件費実績を閲覧可
CREATE POLICY "ai_labor_records_select" ON public.ai_labor_records
    FOR SELECT TO authenticated
    USING (
        company_id = get_my_company_id()
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin', 'executive')
    );

-- 編集ポリシー: admin / super_admin ロールのみ自社のAI人件費実績を編集・操作可
CREATE POLICY "ai_labor_records_modify" ON public.ai_labor_records
    FOR ALL TO authenticated
    USING (
        company_id = get_my_company_id()
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    )
    WITH CHECK (
        company_id = get_my_company_id()
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );
