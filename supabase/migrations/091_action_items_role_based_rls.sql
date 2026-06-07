-- 091_action_items_role_based_rls.sql
-- action_items のRLSをロール別に整理する
-- manager は自部署のaction_itemsのみ参照・更新可能

-- ヘルパー関数: 現在ユーザーのロールを取得
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ヘルパー関数: 現在ユーザーの部署IDを取得
CREATE OR REPLACE FUNCTION get_my_department_id()
RETURNS UUID AS $$
  SELECT department_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 既存の広すぎるポリシーを削除
DROP POLICY IF EXISTS "Admin can view its own company action items" ON action_items;
DROP POLICY IF EXISTS "Admin can manage its own company action items" ON action_items;

-- SELECT: admin/executive/super_admin/partner は全件、manager は自部署のみ
CREATE POLICY "action_items_select_by_role" ON action_items
  FOR SELECT USING (
    company_id = get_my_company_id() AND (
      get_my_role() IN ('super_admin', 'admin', 'executive', 'partner')
      OR (
        get_my_role() = 'manager'
        AND (department_id = get_my_department_id() OR department_id IS NULL)
      )
    )
  );

-- INSERT: admin/executive/super_admin/partner/manager が作成可能
CREATE POLICY "action_items_insert_by_role" ON action_items
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('super_admin', 'admin', 'executive', 'partner', 'manager')
  );

-- UPDATE: admin/executive は全件、manager は自部署のみ
CREATE POLICY "action_items_update_by_role" ON action_items
  FOR UPDATE USING (
    company_id = get_my_company_id() AND (
      get_my_role() IN ('super_admin', 'admin', 'executive', 'partner')
      OR (
        get_my_role() = 'manager'
        AND department_id = get_my_department_id()
      )
    )
  );

-- DELETE: admin/executive/super_admin のみ
CREATE POLICY "action_items_delete_by_role" ON action_items
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('super_admin', 'admin', 'executive')
  );
