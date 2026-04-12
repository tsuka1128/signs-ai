-- 057_fix_super_admin_axis_rls.sql
-- Super Admin 向けの権限を確実に適用するための再構築

-- 1. 既存の競合しうるポリシーを確実に削除
DROP POLICY IF EXISTS "axes_all" ON public.kpi_axes;
DROP POLICY IF EXISTS "axes_select_strict" ON public.kpi_axes;
DROP POLICY IF EXISTS "users_own_company_kpi_axes" ON public.kpi_axes;
DROP POLICY IF EXISTS "super_admins_all_kpi_axes" ON public.kpi_axes;

-- 2. 新しい統合ポリシーを作成
-- Super Admin なら全て、一般ユーザーなら自社のみ
CREATE POLICY "kpi_axes_super_admin_and_own_company" ON public.kpi_axes
FOR ALL TO authenticated 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin' OR 
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin' OR 
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- invitations も同様に強化
DROP POLICY IF EXISTS "invitations_all" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
DROP POLICY IF EXISTS "invitations_modify" ON public.invitations;
DROP POLICY IF EXISTS "super_admins_all_invitations" ON public.invitations;

CREATE POLICY "invitations_super_admin_and_own_company" ON public.invitations
FOR ALL TO authenticated 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin' OR 
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin' OR 
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
);
