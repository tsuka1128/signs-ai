-- KPI実績(kpi_records)の RLS ポリシーを更新し、Super Admin による操作を許可する
-- これにより、代理ログイン中の保存エラーを解消します。

DROP POLICY IF EXISTS "records_all" ON public.kpi_records;

CREATE POLICY "records_all" ON public.kpi_records
  FOR ALL 
  USING (
    -- 1. Super Admin ロールを持つユーザーなら全許可
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    OR
    -- 2. 通常ユーザーなら自社のKPI定義に紐づくデータのみ許可
    kpi_definition_id IN (
      SELECT id FROM public.kpi_definitions 
      WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    -- 1. Super Admin ロールを持つユーザーなら全許可
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    OR
    -- 2. 通常ユーザーなら自社のKPI定義に紐づくデータのみ許可
    kpi_definition_id IN (
      SELECT id FROM public.kpi_definitions 
      WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
  );
