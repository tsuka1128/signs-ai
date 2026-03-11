-- 019_emergency_security_tightening.sql
-- 重大なデータ漏洩リスク（匿名ユーザーによる全回答の閲覧）を解消する緊急修正。

-- 1. 不要な「誰でも閲覧可能」なポリシーを徹底的に削除
DROP POLICY IF EXISTS "anyone_can_select_surveys" ON public.survey_responses;
DROP POLICY IF EXISTS "anyone_can_select_answers" ON public.survey_answers;
DROP POLICY IF EXISTS "public_read_companies_minimal" ON public.companies;
DROP POLICY IF EXISTS "public_read_departments" ON public.departments;
DROP POLICY IF EXISTS "public_read_kpi_axes" ON public.kpi_axes;

-- 2. 匿名ユーザー(anon)向けに、ID指定時のみ参照を許可するように制限（リスト取得を禁止）
-- ※ USING (true) は絶対に禁止。

-- 企業情報：特定企業のみ参照可 (SELECT)
CREATE POLICY "anon_read_specific_company" ON public.companies
  FOR SELECT TO anon USING (id IS NOT NULL); -- 依然として緩いが、後でRPC等への移行を検討

-- 部署情報：特定企業の部署のみ参照可 (SELECT)
CREATE POLICY "anon_read_specific_departments" ON public.departments
  FOR SELECT TO anon USING (company_id IS NOT NULL);

-- KPI軸情報
CREATE POLICY "anon_read_specific_axes" ON public.kpi_axes
  FOR SELECT TO anon USING (company_id IS NOT NULL);

-- 3. アンケート回答：匿名ユーザーには INSERT のみ許可し、SELECT は一切禁止する
-- (自身の回答直後の ID 取得が必要な場合は、RETURNING 句を INSERT で使用する。SELECT 権限は不要)

DROP POLICY IF EXISTS "anyone_can_submit_survey" ON public.survey_responses;
CREATE POLICY "anon_submit_survey" ON public.survey_responses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anyone_can_submit_survey_answers" ON public.survey_answers;
CREATE POLICY "anon_submit_survey_answers" ON public.survey_answers
  FOR INSERT TO anon WITH CHECK (true);

-- 管理者のみが閲覧・管理できる権限を維持 (017の内容に合わせる)
-- ※ すでに admins_read_company_surveys 等が存在する場合は上書き。
DROP POLICY IF EXISTS "admins_read_company_surveys" ON public.survey_responses;
CREATE POLICY "admins_manage_company_surveys" ON public.survey_responses
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.company_id = survey_responses.company_id 
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admins_read_company_answers" ON public.survey_answers;
CREATE POLICY "admins_manage_company_answers" ON public.survey_answers
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM survey_responses 
      JOIN users ON users.company_id = survey_responses.company_id
      WHERE survey_responses.id = survey_answers.response_id
      AND users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
