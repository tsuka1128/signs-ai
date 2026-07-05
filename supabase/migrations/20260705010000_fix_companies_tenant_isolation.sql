-- T-RLS-4: 認証済みユーザーが他社の企業情報を全件閲覧できる脆弱性を修正する。
--
-- 008_final_sync_and_rls.sql で作られた companies_select_own は
--   USING (id = get_my_company_id() OR auth.uid() IS NOT NULL)
-- となっており、"OR auth.uid() IS NOT NULL" により「ログインさえしていれば他社の
-- companies 行（社名・プラン・契約情報等）を全件列挙できる」状態だった（マルチテナントの前提崩壊）。
--
-- 認証済みユーザーの「自社のみ SELECT」は 018 の companies_select_strict
--   USING (id = get_my_company_id() OR auth.role() = 'anon')
-- が既にカバーしているため、脆弱な companies_select_own を撤去するだけでよい。
-- super_admin の全社アクセスは super_admins_all_companies、匿名フォームの参照は
-- anon_read_specific_company / companies_select_strict(anon句) が引き続きカバーする。
--
-- なお、オンボーディング時の「企業作成直後の読み戻し／short_id 更新」は
-- 従来この脆弱な句に依存していたため、API 側（/api/onboarding）で当該処理を
-- サービスロールクライアントに切り替え済み（同一PR内のコード変更）。
DROP POLICY IF EXISTS "companies_select_own" ON public.companies;

-- 念のため、005/007 由来の同種の緩い SELECT ポリシーが環境に残っていた場合も掃除する
-- （008 の一括 DROP で消えているはずだが、乖離環境での二重防御）。
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_select_all" ON public.companies;
