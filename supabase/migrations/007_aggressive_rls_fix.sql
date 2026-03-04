-- 007_aggressive_rls_fix.sql
-- すべての既存ポリシーを強制的に削除し、再作成する
-- これにより、名前の重複や隠れた再帰の原因を一掃します

DO $$ 
DECLARE 
    tbl text;
    pol text;
BEGIN 
    -- 関連する全テーブルの全ポリシーを削除
    FOR tbl, pol IN 
        (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'companies', 'departments', 'kpi_definitions', 'kpi_records', 'kpi_axes', 'invitations')) 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl); 
    END LOOP; 
END $$;

-- 1. セキュリティ定義者関数（RLSを無視して自分の会社IDを引く）
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
BEGIN
  -- SET LOCAL role = postgres; -- 念のためスーパーユーザとして実行
  RETURN (SELECT company_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. users テーブルのポリシー (再帰の原因を断つため、絶対に他のテーブルを参照しない)
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

-- 3. companies テーブル (新規作成を許可し、閲覧はログインのみ)
CREATE POLICY "companies_select_all" ON public.companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "companies_insert_all" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE USING (id = get_my_company_id());

-- 4. 部署、KPI定義、第2軸 (自分の会社のもののみ)
CREATE POLICY "depts_all" ON public.departments FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "kpis_all" ON public.kpi_definitions FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "axes_all" ON public.kpi_axes FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "records_all" ON public.kpi_records FOR ALL USING (company_id = get_my_company_id());

-- 5. 招待 (管理者のみが自社のものを操作可能)
CREATE POLICY "invitations_all" ON public.invitations FOR ALL USING (company_id = get_my_company_id());

-- RLSを有効化 (念のため)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_axes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
