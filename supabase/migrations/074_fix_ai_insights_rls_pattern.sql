-- 074_fix_ai_insights_rls_pattern.sql
-- ai_insights テーブルの RLS ポリシーを最新の設計パターン (get_my_company_id) に統一し、
-- Super Admin による代理操作・履歴閲覧を可能にします。

-- 既存の古いポリシーを削除
DROP POLICY IF EXISTS "users_own_company_ai_insights" ON ai_insights;
DROP POLICY IF EXISTS "Admin can view its own company insights" ON ai_insights;
DROP POLICY IF EXISTS "super_admins_all_ai_insights" ON ai_insights; -- 020 で作成された可能性があるものも削除

-- 統合された新しいポリシーを作成 (FOR ALL で参照・書き込みの両方をカバー)
CREATE POLICY "Admin and Super Admin can manage AI insights" ON ai_insights
  FOR ALL USING (
    company_id = get_my_company_id() OR is_super_admin()
  )
  WITH CHECK (
    company_id = get_my_company_id() OR is_super_admin()
  );
