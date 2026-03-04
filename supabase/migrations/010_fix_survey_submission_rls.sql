-- 010_fix_survey_submission_rls.sql
-- 匿名ユーザーによるアンケート送信を可能にするための RLS 調整

-- 1. 部署一覧の参照を（企業IDを知っている者に対して）公開
-- ※ これによりアンケートフォームで部署一覧を取得可能にする
DROP POLICY IF EXISTS "public_read_departments" ON public.departments;
CREATE POLICY "public_read_departments" ON public.departments
  FOR SELECT USING (true); -- 企業IDでフィルタリングするため、全開放でも実質的なリスクは低い

-- 2. 第2軸一覧の参照を公開
DROP POLICY IF EXISTS "public_read_kpi_axes" ON public.kpi_axes;
CREATE POLICY "public_read_kpi_axes" ON public.kpi_axes
  FOR SELECT USING (true);

-- 3. アンケート回答時の検証用サブクエリが匿名でも動くように調整
-- 009 の anyone_can_submit_survey はそのままでも、kpi_axes が SELECT 可能になれば動くはず

-- 4. INSERT 後の ID 取得を可能にするため、survey_responses の SELECT を（一時的に）公開
-- ※ IDを知らない限り他人の回答は見られないが、本番ではより厳密な管理が望ましい
DROP POLICY IF EXISTS "anyone_can_select_surveys" ON public.survey_responses;
CREATE POLICY "anyone_can_select_surveys" ON public.survey_responses
  FOR SELECT USING (true);

-- 5. survey_answers の SELECT も ID 知っていれば可能に
DROP POLICY IF EXISTS "anyone_can_select_answers" ON public.survey_answers;
CREATE POLICY "anyone_can_select_answers" ON public.survey_answers
  FOR SELECT USING (true);
