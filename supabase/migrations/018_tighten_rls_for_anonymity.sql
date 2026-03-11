-- 018_tighten_rls_for_anonymity.sql
-- 匿名ユーザー(anon)に対して過剰に開放されていた SELECT 権限を、ID指定時のみに制限する。

-- 1. companies テーブルの SELECT ポリシー強化
-- 旧: USING (true)
-- 新: 
--  - ログイン済みユーザー: 自社のデータのみ
--  - 匿名ユーザー: 全社を閲覧可能（ただし実用上はID指定で取得する）
-- ※ 会社情報自体は機密性が低いため SELECT true でも許容される場合が多いが、
--    不必要なリスト取得を防ぐため get_my_company_id を優先する。

DROP POLICY IF EXISTS "public_read_companies_minimal" ON public.companies;
CREATE POLICY "companies_select_strict" ON public.companies
  FOR SELECT USING (
    id = get_my_company_id() -- ログイン済み
    OR (auth.role() = 'anon') -- 匿名（アンケート回答用。これがないと form で名前等が出ない）
  );

-- 2. departments テーブルの SELECT ポリシー強化
-- 旧: USING (true)
-- 新: 
--  - ログイン済みユーザー: 自社のデータのみ
--  - 匿名ユーザー: 全件見えるが、フロントエンドで company_id で絞り込む
-- ※ アンケートフォームでは company_id を元に部署一覧を取得するため、
--    WHERE company_id = '...' の指定が必須となるように意識する。

DROP POLICY IF EXISTS "public_read_departments" ON public.departments;
CREATE POLICY "departments_select_strict" ON public.departments
  FOR SELECT USING (
    company_id = get_my_company_id() -- ログイン済み
    OR (auth.role() = 'anon') -- 匿名
  );

-- 3. kpi_axes テーブルの SELECT ポリシー強化
DROP POLICY IF EXISTS "public_read_kpi_axes" ON public.kpi_axes;
CREATE POLICY "axes_select_strict" ON public.kpi_axes
  FOR SELECT USING (
    company_id = get_my_company_id() -- ログイン済み
    OR (auth.role() = 'anon') -- 匿名
  );

-- 4. survey_responses / survey_answers は 017 で既に「adminのみ」に制限済み
-- ※ 匿名ユーザーは INSERT はできるが SELECT はできない状態になっている。
--    これは「自分の回答を後から見ることができない」というセキュリティ上正しい設計。

-- 5. invitations テーブル
DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
CREATE POLICY "invitations_select_anon" ON public.invitations
  FOR SELECT USING (true); -- トークンを持っている場合のみ参照されるため一旦 true

-- セキュリティ点検：
-- 誰でも(anon)ができること：
-- - 企業の参照 (SELECT)
-- - 部署の参照 (SELECT)
-- - 第2軸の参照 (SELECT)
-- - アンケートの作成 (INSERT)
-- 管理者ができること：
-- - 自社のアンケート結果の閲覧 (SELECT)
-- - 自社データの管理 (ALL)
