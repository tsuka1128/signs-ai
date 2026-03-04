-- 006_fix_users_recursion_final.sql
-- users テーブルの再帰を完全に断ち切るための最終修正

-- 1. users テーブルの既存ポリシーをすべて削除
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_can_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;

-- 2. 極めて単純な（他のテーブルを参照しない）ポリシーを再作成
-- これにより users テーブルへのアクセス時に再帰が発生する余地をなくします
CREATE POLICY "users_select_own_final" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_insert_own_final" ON public.users
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own_final" ON public.users
FOR UPDATE USING (id = auth.uid());

-- 3. 他のテーブル（companies等）が users を参照する際は、
-- すでに作成済みの get_my_company_id() (SECURITY DEFINER) を使用するように徹底
-- ※ 005 で実施済みだが、念のため再帰の起点となりそうな箇所をクリーンアップ
