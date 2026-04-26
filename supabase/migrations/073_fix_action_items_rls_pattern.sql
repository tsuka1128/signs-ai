-- 073_fix_action_items_rls_pattern.sql
-- action_items テーブルの RLS ポリシーを、再帰エラーのリスクがあるサブクエリから
-- 推奨される get_my_company_id() 関数を使用した形式に統一します。

-- 既存ポリシーの削除
DROP POLICY IF EXISTS "Admin can view its own company action items" ON action_items;
DROP POLICY IF EXISTS "Admin can manage its own company action items" ON action_items;

-- 新規ポリシーの作成
CREATE POLICY "Admin can view its own company action items" ON action_items
  FOR SELECT USING (
    company_id = get_my_company_id()
  );

CREATE POLICY "Admin can manage its own company action items" ON action_items
  FOR ALL USING (
    company_id = get_my_company_id()
  );
