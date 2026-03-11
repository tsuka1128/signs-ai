-- semantic_layers テーブルへの明示的な DELETE ポリシー追加
-- 既存の FOR ALL ポリシーでカバーされているはずだが、
-- 念のためDELETE専用ポリシーを追加して確実に削除を許可する

-- 既存ポリシーを一旦DROP（存在する場合のみ）
DROP POLICY IF EXISTS "users_delete_own_company_semantic_layers" ON semantic_layers;

-- DELETE 専用ポリシーを作成
CREATE POLICY "users_delete_own_company_semantic_layers" ON semantic_layers
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );
