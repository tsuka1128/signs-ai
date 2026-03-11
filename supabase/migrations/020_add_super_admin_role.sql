-- 020_add_super_admin_role.sql
-- サービス運営者用の特権権限（super_admin）を導入し、全テーブルへのアクセスを許可する。

-- 1. 特権管理者（super_admin）がすべてのデータを操作できるように RLS を拡張するヘルパー関数
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 各テーブルへのポリシー追加
-- 既存の 001_initial_schema.sql に基づくテーブル群

-- companies
DROP POLICY IF EXISTS "super_admins_all_companies" ON public.companies;
CREATE POLICY "super_admins_all_companies" ON public.companies
  FOR ALL TO authenticated USING (is_super_admin());

-- users
DROP POLICY IF EXISTS "super_admins_all_users" ON public.users;
CREATE POLICY "super_admins_all_users" ON public.users
  FOR ALL TO authenticated USING (is_super_admin());

-- departments
DROP POLICY IF EXISTS "super_admins_all_departments" ON public.departments;
CREATE POLICY "super_admins_all_departments" ON public.departments
  FOR ALL TO authenticated USING (is_super_admin());

-- kpi_definitions
DROP POLICY IF EXISTS "super_admins_all_kpi_definitions" ON public.kpi_definitions;
CREATE POLICY "super_admins_all_kpi_definitions" ON public.kpi_definitions
  FOR ALL TO authenticated USING (is_super_admin());

-- kpi_records
DROP POLICY IF EXISTS "super_admins_all_kpi_records" ON public.kpi_records;
CREATE POLICY "super_admins_all_kpi_records" ON public.kpi_records
  FOR ALL TO authenticated USING (is_super_admin());

-- resource_records
DROP POLICY IF EXISTS "super_admins_all_resource_records" ON public.resource_records;
CREATE POLICY "super_admins_all_resource_records" ON public.resource_records
  FOR ALL TO authenticated USING (is_super_admin());

-- survey_questions (マスタデータだが一応)
DROP POLICY IF EXISTS "super_admins_all_survey_questions" ON public.survey_questions;
CREATE POLICY "super_admins_all_survey_questions" ON public.survey_questions
  FOR ALL TO authenticated USING (is_super_admin());

-- survey_responses
DROP POLICY IF EXISTS "super_admins_all_survey_responses" ON public.survey_responses;
CREATE POLICY "super_admins_all_survey_responses" ON public.survey_responses
  FOR ALL TO authenticated USING (is_super_admin());

-- survey_answers
DROP POLICY IF EXISTS "super_admins_all_survey_answers" ON public.survey_answers;
CREATE POLICY "super_admins_all_survey_answers" ON public.survey_answers
  FOR ALL TO authenticated USING (is_super_admin());

-- semantic_layers (組織方針)
DROP POLICY IF EXISTS "super_admins_all_semantic_layers" ON public.semantic_layers;
CREATE POLICY "super_admins_all_semantic_layers" ON public.semantic_layers
  FOR ALL TO authenticated USING (is_super_admin());

-- ai_insights
DROP POLICY IF EXISTS "super_admins_all_ai_insights" ON public.ai_insights;
CREATE POLICY "super_admins_all_ai_insights" ON public.ai_insights
  FOR ALL TO authenticated USING (is_super_admin());

-- action_items
DROP POLICY IF EXISTS "super_admins_all_action_items" ON public.action_items;
CREATE POLICY "super_admins_all_action_items" ON public.action_items
  FOR ALL TO authenticated USING (is_super_admin());

-- 4. 特定のユーザーを super_admin に手動で格上げする
UPDATE public.users SET role = 'super_admin' WHERE email IN ('tsukagoshi.yuta1128@gmail.com', 'yuta1128@mac.com');
