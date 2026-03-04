-- =====================================================
-- Signs AI — RLS再帰エラーの根本解消
-- Supabase SQL Editor で実行してください
-- =====================================================

-- 1. 再帰を防ぐための会社のID取得関数
-- SECURITY DEFINER を指定することで、ポリシーのチェックをバイパスして
-- 現在のユーザーの company_id を安全かつ高速に取得できます。
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. 既存の競合しそうなポリシーを一掃し、関数ベースで再定義
-- ※ これにより「usersテーブルの参照ループ」を回避します。

-- companies
DROP POLICY IF EXISTS "users_own_company_select" ON companies;
DROP POLICY IF EXISTS "users_own_company_insert" ON companies;
DROP POLICY IF EXISTS "users_own_company_update" ON companies;
DROP POLICY IF EXISTS "users_own_company_delete" ON companies;

CREATE POLICY "companies_select_policy" ON companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "companies_insert_policy" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "companies_update_policy" ON companies FOR UPDATE USING (id = get_my_company_id());

-- departments
DROP POLICY IF EXISTS "users_own_company_departments" ON departments;
DROP POLICY IF EXISTS "users_own_company_departments_all" ON departments;
DROP POLICY IF EXISTS "users_can_insert_departments" ON departments;

CREATE POLICY "depts_select_policy" ON departments FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "depts_insert_policy" ON departments FOR INSERT WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "depts_update_policy" ON departments FOR UPDATE USING (company_id = get_my_company_id());

-- kpi_definitions
DROP POLICY IF EXISTS "users_own_company_kpi_definitions" ON kpi_definitions;
DROP POLICY IF EXISTS "users_can_insert_kpi_definitions" ON kpi_definitions;

CREATE POLICY "kpis_select_policy" ON kpi_definitions FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "kpis_insert_policy" ON kpi_definitions FOR INSERT WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "kpis_update_policy" ON kpi_definitions FOR UPDATE USING (company_id = get_my_company_id());

-- users (ここが再帰の根源)
DROP POLICY IF EXISTS "users_can_read_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON users;

CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid());
