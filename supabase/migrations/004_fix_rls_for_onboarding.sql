-- =====================================================
-- Signs AI — RLS修正マイグレーション（オンボーディング用）
-- Supabase SQL Editor で実行してください
-- =====================================================

-- 1. users テーブルの INSERT を許可
-- (auth.users には記録があるが public.users にまだ記録がないユーザーが、自分自身を登録できるようにする)
CREATE POLICY "users_can_insert_own_profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. companies テーブルの INSERT を許可
-- (まだ会社に所属していないユーザーが、新しい会社を作成できるようにする)
-- USING (true) ではなく WITH CHECK (true) を明示
DROP POLICY IF EXISTS "users_own_company" ON companies;

CREATE POLICY "users_own_company_select" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_own_company_insert" ON companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_own_company_update" ON companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_own_company_delete" ON companies
  FOR DELETE USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- 3. 他のテーブルも INSERT を許可（基本的には会社を作った後の操作になるが念のため）
ALTER POLICY "users_own_company_departments" ON departments
  RENAME TO "users_own_company_departments_all"; -- 既存名の衝突回避（もしあれば）

CREATE POLICY "users_can_insert_departments" ON departments
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_can_insert_kpi_definitions" ON kpi_definitions
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );
