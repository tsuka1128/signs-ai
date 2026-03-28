-- 046: 未ログインユーザーによるアンケート情報取得の許可
-- アンケート回答（ボイスチェック）をログイン不要にするための RLS 緩和策

-- 1. companies テーブル：未ログインでも企業名や第2軸の呼称を取得できるようにする
-- ※ 企業ID (UUID) または short_id を知っていることを前提とした「限定公開」
DROP POLICY IF EXISTS "public_read_companies_for_survey" ON public.companies;
CREATE POLICY "public_read_companies_for_survey" ON public.companies
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. departments テーブル：未ログインでも部署リストを取得できるようにする
DROP POLICY IF EXISTS "public_read_departments_for_survey" ON public.departments;
CREATE POLICY "public_read_departments_for_survey" ON public.departments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. kpi_axes テーブル：未ログインでも第2軸（拠点等）のリストを取得できるようにする
DROP POLICY IF EXISTS "public_read_kpi_axes_for_survey" ON public.kpi_axes;
CREATE POLICY "public_read_kpi_axes_for_survey" ON public.kpi_axes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: SELECT 権限のみ。INSERT/UPDATE/DELETE は引き続き認証が必要（回答投稿を除く）
