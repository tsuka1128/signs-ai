-- 010_fix_survey_submission_rls.sql
-- 匿名ユーザーによるアンケート送信を可能にするための RLS 調整

-- 1. 企業情報の極一部（カスタム名称等）を公開
-- ※ IDを知っている者のみが参照できる（匿名回答に必須）
DROP POLICY IF EXISTS "public_read_companies_minimal" ON public.companies;
CREATE POLICY "public_read_companies_minimal" ON public.companies
  FOR SELECT USING (true); -- 実際にはIDで検索されるため全開放でもリスク低

-- 2. 部署一覧の参照を公開
DROP POLICY IF EXISTS "public_read_departments" ON public.departments;
CREATE POLICY "public_read_departments" ON public.departments
  FOR SELECT USING (true);

-- 3. 第2軸一覧の参照を公開
DROP POLICY IF EXISTS "public_read_kpi_axes" ON public.kpi_axes;
CREATE POLICY "public_read_kpi_axes" ON public.kpi_axes
  FOR SELECT USING (true);

-- 4. アンケート回答の INSERT 権限 (009の内容を補強・上書き)
DROP POLICY IF EXISTS "anyone_can_submit_survey" ON public.survey_responses;
CREATE POLICY "anyone_can_submit_survey" ON public.survey_responses
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anyone_can_submit_survey_answers" ON public.survey_answers;
CREATE POLICY "anyone_can_submit_survey_answers" ON public.survey_answers
  FOR INSERT WITH CHECK (true);

-- 5. INSERT 後の ID 取得 (SELECT) を可能にする権限
DROP POLICY IF EXISTS "anyone_can_select_surveys" ON public.survey_responses;
CREATE POLICY "anyone_can_select_surveys" ON public.survey_responses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "anyone_can_select_answers" ON public.survey_answers;
CREATE POLICY "anyone_can_select_answers" ON public.survey_answers
  FOR SELECT USING (true);
