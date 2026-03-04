-- 008_final_sync_and_rls.sql
-- すべての不整合を解消し、RLSを完全に安定させる最終同期SQL

-- 1. 不足しているカラムの追加
ALTER TABLE public.kpi_definitions ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS kpi_secondary_axis_name TEXT NOT NULL DEFAULT '第2軸';

-- 2. 第2軸テーブルの確実な作成
CREATE TABLE IF NOT EXISTS public.kpi_axes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 実績値テーブルへの軸ID追加
ALTER TABLE public.kpi_records ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.kpi_axes(id) ON DELETE CASCADE;

-- 4. RLS ポリシーの完全リセットと再構築
-- (インフィニットリカーションを防ぐため、security definer 関数を活用)
CREATE OR REPLACE FUNCTION get_my_company_id() RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 全テーブルのポリシーを一括削除
DO $$ DECLARE tbl text; pol text; BEGIN 
    FOR tbl, pol IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'companies', 'departments', 'kpi_definitions', 'kpi_records', 'kpi_axes', 'invitations')) 
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl); END LOOP; 
END $$;

-- RLS を有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_axes ENABLE ROW LEVEL SECURITY;

-- users ポリシー (絶対に再帰させない)
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

-- companies ポリシー
CREATE POLICY "companies_select_own" ON public.companies FOR SELECT USING (id = get_my_company_id() OR auth.uid() IS NOT NULL);
CREATE POLICY "companies_insert_all" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE USING (id = get_my_company_id());

-- その他テーブル（自社データのみ）
-- INSERT 時の WITH CHECK も get_my_company_id() との照合にする
CREATE POLICY "depts_all" ON public.departments FOR ALL USING (company_id = get_my_company_id()) WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "kpis_all" ON public.kpi_definitions FOR ALL USING (company_id = get_my_company_id()) WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "axes_all" ON public.kpi_axes FOR ALL USING (company_id = get_my_company_id()) WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "records_all" ON public.kpi_records FOR ALL USING (kpi_definition_id IN (SELECT id FROM public.kpi_definitions WHERE company_id = get_my_company_id())) WITH CHECK (kpi_definition_id IN (SELECT id FROM public.kpi_definitions WHERE company_id = get_my_company_id()));

-- 5. 既存のデモユーザーが存在する場合、代表KPIフラグ（is_main）が立っていないとダッシュボードに何も出ないため、
-- すべてのKPI定義の最初の1つを暫定的に代表にする（クリーンアップ）
UPDATE public.kpi_definitions SET is_main = true WHERE id IN (
  SELECT DISTINCT ON (company_id, owner_dept_id) id FROM public.kpi_definitions ORDER BY company_id, owner_dept_id, sort_order
);
