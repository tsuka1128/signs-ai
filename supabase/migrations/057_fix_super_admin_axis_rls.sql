-- 057_fix_super_admin_axis_rls.sql
-- Super Admin が全社の第2軸設定や招待情報を操作できるように RLS ポリシーを拡張する。

-- 1. kpi_axes テーブル: Super Admin は全社のデータを操作可能
DROP POLICY IF EXISTS "super_admins_all_kpi_axes" ON public.kpi_axes;
CREATE POLICY "super_admins_all_kpi_axes" ON public.kpi_axes
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 2. invitations テーブル: Super Admin は全社のデータを操作可能
DROP POLICY IF EXISTS "super_admins_all_invitations" ON public.invitations;
CREATE POLICY "super_admins_all_invitations" ON public.invitations
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 既存の get_my_company_id() を使ったポリシーとの共存を確認するため、
-- 冗長な名称「super_admins_all_...」を使用して既存ポリシーを上書きせず「追加」します。
