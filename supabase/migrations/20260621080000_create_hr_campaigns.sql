-- Migration: Create hr_campaigns table and RLS policies
CREATE TABLE IF NOT EXISTS public.hr_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text,                         -- 'hiring'|'placement'|'system'|'development'|'culture'|'other'
    department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL, -- NULL かつ axis_id NULL = 全社
    axis_id uuid REFERENCES public.kpi_axes(id) ON DELETE SET NULL,
    launched_at date NOT NULL,             -- 施策開始月 YYYY-MM-01
    invested_cost numeric,                 -- 任意：投資額(円)。ROI%・回収期間の算出に使用
    roi_assumptions jsonb NOT NULL DEFAULT '{}'::jsonb, -- {lagMonths, windowMonths, salesAttribution}
    memo text,
    status text NOT NULL DEFAULT 'active', -- 'active'|'archived'
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_campaigns ENABLE ROW LEVEL SECURITY;

-- SELECT: 同一会社メンバー全員
CREATE POLICY "hr_campaigns_select" ON public.hr_campaigns
  FOR SELECT USING (company_id = get_my_company_id());

-- INSERT / UPDATE / DELETE は経営層のみ（※Postgresは1ポリシー1アクション。まとめ書き不可）
CREATE POLICY "hr_campaigns_insert" ON public.hr_campaigns
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  );
CREATE POLICY "hr_campaigns_update" ON public.hr_campaigns
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  ) WITH CHECK (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  );
CREATE POLICY "hr_campaigns_delete" ON public.hr_campaigns
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  );

CREATE INDEX IF NOT EXISTS idx_hr_campaigns_company ON public.hr_campaigns(company_id);
